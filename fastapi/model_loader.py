# model_loader.py
from ultralytics import YOLO

# ── Config ──────────────────────────────────────────────────────────────────
_MODEL_PATH = 'best.onnx'  # Path to your YOLOv8 weights
_DEVICE     = 'cpu'

# ── Private model state ─────────────────────────────────────────────────────
_model = None
_ready = False

def load():
    """Loads YOLOv8 model into memory."""
    global _model, _ready
    print(f"[ModelLoader] Device: {_DEVICE}")
    print(f"[ModelLoader] Loading YOLOv8 from {_MODEL_PATH}...")
    
    # Load the model
    _model = YOLO(_MODEL_PATH, task="detect")
    # _model.to(_DEVICE)
    
    _ready = True
    print(f"[ModelLoader] Ready ✓")

def is_ready() -> bool:
    return _ready

def infer(image) -> list[tuple]:
    """
    Public inference function.
    Returns: list of (label_name, [x1, y1, x2, y2]) 
    Note: YOLOv8 usually returns [x1, y1, x2, y2], 
    Florence-2 used [y1, x1, y2, x2]. We will standardize to [x1, y1, x2, y2].
    """
    if not _ready:
        raise RuntimeError("Model not loaded.")

    # Run inference
    # imgsz=640 should match your training size
    results = _model.predict(image, conf=0.25, device=_DEVICE, verbose=False)
    print(f"Raw infernce results: {results}")
    parsed_results = []
    if len(results) > 0:
        result = results[0]
        boxes = result.boxes
        
        for box in boxes:
            # Get coordinates as list of floats
            coords = box.xyxy[0].tolist() # [x1, y1, x2, y2]
            # Get class name
            label = result.names[int(box.cls[0])]
            parsed_results.append((label, coords))
    print(f"Parsed inference results: {parsed_results}")
    return parsed_results

