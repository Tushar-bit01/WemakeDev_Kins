import matplotlib.pyplot as plt
import matplotlib.patches as patches
from PIL import Image, ImageDraw

def draw_raw_detections(image_path, detections, output_path="raw_detections.png"):
    """Draws raw YOLOv8 bounding boxes with a legend-like label system."""
    img = Image.open(image_path).convert("RGB")
    draw = ImageDraw.Draw(img)
    
    colors = {"rooftop": "#00FF41", "obstacle": "#FF6B35"}
    
    for label, coords in detections:
        color = colors.get(label, "cyan")
        draw.rectangle(coords, outline=color, width=3)
        # Background for label text to make it readable
        draw.text((coords[0], coords[1]-12), f" {label.upper()} ", fill="black", background=color)
    
    img.save(output_path)
    print(f"Saved raw detections to {output_path}")

def draw_final_polygons(site_plan, output_path="final_site_plan.png"):
    """Draws processed geometry with a clear legend."""
    if not site_plan:
        print("No site plan to draw.")
        return

    fig, ax = plt.subplots(figsize=(10, 10))
    
    # --- 1. Main Roof ---
    roof = site_plan['roof_polygon']
    if roof:
        poly_roof = patches.Polygon([(p['x'], p['z']) for p in roof], 
                                   closed=True, color='#2C3E50', alpha=0.2, label='Total Roof Area')
        ax.add_patch(poly_roof)

    # --- 2. Obstacles ---
    obs_list = site_plan.get('obstacles', [])
    for i, obs in enumerate(obs_list):
        # We only want the legend to show 'Obstacle' once
        lbl = 'Obstacles (0.5m Buffer)' if i == 0 else ""
        poly_obs = patches.Polygon([(p['x'], p['z']) for p in obs['points']], 
                                   closed=True, color='#FF6B35', alpha=0.7, label=lbl)
        ax.add_patch(poly_obs)

    # --- 3. Free Space ---
    free = site_plan['free_space_polygon']
    if free:
        # Note: 'free' might be a list of points from the largest part of a MultiPolygon
        poly_free = patches.Polygon([(p['x'], p['z']) for p in free], 
                                   closed=True, edgecolor='#2ECC71', facecolor='none', 
                                   linewidth=2, linestyle='--', label='Usable Free Space')
        ax.add_patch(poly_free)

    # Styling the Plot
    ax.set_aspect('equal')
    ax.set_title(f"Kins Site Plan: {site_plan['stats']['free_space_area_m2']} m² Usable", 
                 fontsize=14, pad=20)
    ax.set_xlabel("Meters (X)"); ax.set_ylabel("Meters (Z)")
    
    # --- THE LEGEND ---
    # Loc 'upper left' or 'bbox_to_anchor' prevents it from covering the roof
    ax.legend(loc='upper left', bbox_to_anchor=(1, 1), frameon=True, shadow=True)
    
    # Auto-scale limits
    all_x = [p['x'] for p in roof]; all_z = [p['z'] for p in roof]
    ax.set_xlim(min(all_x)-2, max(all_x)+2)
    ax.set_ylim(min(all_z)-2, max(all_z)+2)
    
    plt.grid(True, linestyle=':', alpha=0.6)
    plt.tight_layout() # Ensures legend isn't cut off
    plt.savefig(output_path, dpi=150)
    plt.close()
    print(f"Saved final site plan with legend to {output_path}")