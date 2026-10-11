from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import asyncio
import torch
import os
from dotenv import load_dotenv
from PIL import Image
from io import BytesIO

import model_loader
from free_space_polygon import loc_to_json, process_kins_site

load_dotenv()

WEBHOOK_SECRET   = os.getenv("WEBHOOK_SECRET")
NODE_WEBHOOK_URL = os.getenv("NODE_WEBHOOK_URL")      # Node endpoint to save to DB


@asynccontextmanager
async def lifespan(app: FastAPI):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, model_loader.load)
    yield
    print("[Server] Shutting down")

app = FastAPI(lifespan=lifespan)


class KinsInput(BaseModel):
    success:     bool
    lat:         float
    lng:         float
    coordinates: dict
    imagePath:   str
    customer_id: int 
    entity_type: str


def _load_image(path: str) -> Image.Image:
    if path.startswith("http://") or path.startswith("https://"):
        resp = requests.get(path, timeout=15)
        resp.raise_for_status()
        return Image.open(BytesIO(resp.content)).convert("RGB")
    return Image.open(path).convert("RGB")


def _run_pipeline(payload: KinsInput) -> dict:
    print(payload)
    print("[SERVER] Image Entered pipeline")
    image      = _load_image(payload.imagePath)
    print("[SERVER] Loaded Image locally")
    detections = model_loader.infer(image)
    print("[MODEL] Passed image to YOLO")
    object_list = loc_to_json(detections)
    print(f"[SERVER] Predicted Object list:{object_list}")
    result      = process_kins_site(object_list, payload.model_dump())
    print(f"[SERVER] Final results: {result}")

    if result is None:
        return {
            "success":    False,
            "customer_id": payload.customer_id,
            "entity_type": payload.entity_type,
            "error":      "No rooftop detected at clicked coordinates",
            "lat":        payload.lat,
            "lng":        payload.lng,
            "roof_polygon":       [],
            "free_space_polygon": [],
            "obstacles":          [],
            "upper_roofs":        [],
        }

    return {
        "success":    True,
        "customer_id": payload.customer_id,
        "entity_type": payload.entity_type,
        "lat":        payload.lat,
        "lng":        payload.lng,
        "roof_polygon":       result.get("roof_polygon"),
        "free_space_polygon": result.get("free_space_polygon"),
        "obstacles":          result.get("obstacles"),
        "upper_roofs":        result.get("upper_roofs"),
    }


WEBHOOK_HEADERS = {
    "Content-Type":     "application/json",
    "x-webhook-secret": WEBHOOK_SECRET,
}


async def _process_and_respond(payload: KinsInput):
    loop   = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, _run_pipeline, payload)

    # Build payload in format Node expects
    webhook_body = {
        "customer_id":        payload.customer_id,
        "entity_type":        payload.entity_type,
        "lat":                payload.lat,
        "lng":                payload.lng,
        "entity_type":        payload.entity_type,
        "roof_polygon":       result.get("roof_polygon"),
        "free_space_polygon": result.get("free_space_polygon"),
        "obstacles":          result.get("obstacles"),
        "upper_roofs":        result.get("upper_roofs"),
    }

    try:
        requests.post(
            NODE_WEBHOOK_URL,
            json    = webhook_body,
            headers = {
                "Content-Type":     "application/json",
                "x-webhook-secret": WEBHOOK_SECRET,
            },
            timeout = 60,
        )
        # print(f"[Model] Predicted coordinates: {webhook_body["roof_polygon"]}")
        print(f"[Server] Pushed to Node ✓ customer_id={payload.customer_id}")
    except Exception as e:
        print(f"[Server] Failed to push to Node: {e}")


@app.post("/analyze-roof")
async def analyze_roof(payload: KinsInput, background_tasks: BackgroundTasks):
    if not payload.success:
        raise HTTPException(status_code=400, detail="Payload marked as failed")
    if not model_loader.is_ready():
        raise HTTPException(status_code=503, detail="Model not ready yet")

    background_tasks.add_task(_process_and_respond, payload)
    return {
        "success":    True,
        "message":    "Analysis started",
        "customer_id": payload.customer_id,
    }


@app.post("/analyze-roof-sync")
async def analyze_roof_sync(payload: KinsInput):
    """For testing — returns result directly without webhook."""
    if not model_loader.is_ready():
        raise HTTPException(status_code=503, detail="Model not ready yet")
    loop   = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, _run_pipeline, payload)
    return result


@app.get("/health")
def health():
    return {
        "status":       "ready" if model_loader.is_ready() else "loading",
        "device":       "cuda" if torch.cuda.is_available() else "cpu",
    }