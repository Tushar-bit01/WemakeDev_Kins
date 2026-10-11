from shapely.geometry import box, Point, MultiPolygon
from shapely.ops import unary_union
# Ensure these are defined in your config.py

HEIGHT, WIDTH = 1240, 1240  # Default fallback

# Constants for Kins Engine
GSD            = 0.0251   # Meters per pixel
BUFFER_M       = 0.5          # Safety buffer in meters
MIN_AREA_M2    = 0.2          # Minimum size for an obstacle to be considered
OVERLAP_THRESH = 0.5          # 50% threshold for clipping logic

def _px_to_m(px):
    """Converts pixel value to meters rounded to 2 decimal places."""
    return round(px * GSD, 2)

def _format_polygon(geom, offset_x=0, offset_y=0) -> list[dict]:
    """
    Converts a shapely geometry into a list of {x, z} dictionaries.
    Applies normalization offsets so the main roof starts at 0,0.
    """
    if geom is None or geom.is_empty:
        return []
    
    # Handle MultiPolygons by taking the largest part (common in free space)
    if geom.geom_type == 'MultiPolygon':
        main_part = max(geom.geoms, key=lambda a: a.area)
        coords = list(main_part.exterior.coords)[:-1]
    elif geom.geom_type == 'Polygon':
        coords = list(geom.exterior.coords)[:-1]
    else:
        return []

    # Map x to x, and y to z for your frontend format
    return [{'x': _px_to_m(p[0] - offset_x), 'z': _px_to_m(p[1] - offset_y)} for p in coords]

def loc_to_json(detections: list[tuple]) -> list[dict]:
    """
    Converts raw model output [('label', [x1, y1, x2, y2])] to processed dicts.
    """
    result = []
    for label, coords in detections:
        x1, y1, x2, y2 = coords
        
        # Clamp to image boundaries
        x1, x2 = max(0, min(x1, WIDTH)), max(0, min(x2, WIDTH))
        y1, y2 = max(0, min(y1, HEIGHT)), max(0, min(y2, HEIGHT))

        result.append({
            'label': label,
            'bbox': {'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2}
        })
    return result

def get_parent_roof(object_list, payload):
    coords   = payload.get('coordinates', {})
    target_x = coords.get('x', 0)
    target_y = coords.get('y', 0)
    target   = Point(target_x, target_y)

    rooftops = [
        (obj, box(obj['bbox']['x1'], obj['bbox']['y1'],
                  obj['bbox']['x2'], obj['bbox']['y2']))
        for obj in object_list if obj['label'] == 'rooftop'
    ]

    if not rooftops:
        return None

    # First try exact containment
    candidates = [rect for _, rect in rooftops if rect.contains(target) or rect.intersects(target)]
    if candidates:
        return max(candidates, key=lambda r: r.area)

    # Fall back to nearest rooftop within 100px tolerance
    closest      = None
    closest_dist = float('inf')

    for _, rect in rooftops:
        dist = rect.exterior.distance(target)
        if dist < closest_dist:
            closest_dist = dist
            closest      = rect

    # Only accept if within 100 pixels
    if closest_dist <= 100:
        print(f"[DEBUG] Using nearest rooftop at distance {closest_dist:.1f}px")
        return closest

    print(f"[DEBUG] Nearest rooftop is {closest_dist:.1f}px away — too far")
    return None

def process_kins_site(object_list: list[dict], payload: dict) -> dict | None:
    """
    Main Logic: Finds parent roof, clips obstacles, merges shapes, 
    and normalizes coordinates to 0,0.
    """
    main_roof = get_parent_roof(object_list, payload)
    if main_roof is None:
        return None

    # Calculate Normalization Offsets (Top-Left of main roof)
    min_x, min_y, _, _ = main_roof.bounds
    buffer_px = BUFFER_M / GSD
    
    valid_obs_geoms = []
    inner_roofs_data = []
    inner_roofs_geoms = []

    for obj in object_list:
        b = obj['bbox']
        obj_geom = box(b['x1'], b['y1'], b['x2'], b['y2'])

        if obj_geom.equals(main_roof):
            continue

        intersection = main_roof.intersection(obj_geom)
        if intersection.is_empty:
            continue

        # 50% Overlap Threshold Logic
        overlap_ratio = intersection.area / obj_geom.area
        if overlap_ratio < OVERLAP_THRESH:
            continue

        clipped = intersection

        if obj['label'] == 'rooftop':
            # This is an Upper Roof (Room on the terrace)
            inner_roofs_geoms.append(clipped)
            
            # Calculate free space on the upper room (inward buffer)
            upper_free = clipped.buffer(-buffer_px)
            
            inner_roofs_data.append({
                'footprint': _format_polygon(clipped, min_x, min_y),
                'free_space': _format_polygon(upper_free, min_x, min_y),
                'obstacles': [] # Placeholder for nested objects
            })
        else:
            # Standard Obstacles (Tanks, ACs, etc.)
            area_m2 = clipped.area * (GSD ** 2)
            if area_m2 < MIN_AREA_M2:
                continue
            
            # Apply safety buffer for the main terrace calculation
            buffered = clipped.buffer(buffer_px).intersection(main_roof)
            valid_obs_geoms.append(buffered)

    # Merge overlapping obstacles to simplify the final polygon
    merged_obs_geom = unary_union(valid_obs_geoms) if valid_obs_geoms else None

    # Calculate Free Space (Main Roof - Obstacles - Upper Rooms)
    to_subtract = unary_union(
        ([merged_obs_geom] if merged_obs_geom else []) + inner_roofs_geoms
    )
    free_space_geom = main_roof.difference(to_subtract) if to_subtract else main_roof

    # Build Final Obstacles List for Output
    final_obstacles = []
    if merged_obs_geom:
        parts = merged_obs_geom.geoms if isinstance(merged_obs_geom, MultiPolygon) else [merged_obs_geom]
        for p in parts:
            final_obstacles.append({
                "height": None, # Requested: null/none
                "points": _format_polygon(p, min_x, min_y)
            })

    # Return structure matching your MOCK_SITE_DATA
    return {
        'roof_polygon':       _format_polygon(main_roof, min_x, min_y),
        'free_space_polygon': _format_polygon(free_space_geom, min_x, min_y),
        'obstacles':          final_obstacles,
        'upper_roofs':        inner_roofs_data
    }