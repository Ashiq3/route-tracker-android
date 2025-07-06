#!/usr/bin/env python3
"""
Simple icon generator for Route Tracker PWA
Creates 192x192 and 512x512 PNG icons
"""

try:
    from PIL import Image, ImageDraw
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

def create_simple_icon(size, filename):
    """Create a simple route tracker icon"""
    if not PIL_AVAILABLE:
        print("PIL not available. Please install: pip install Pillow")
        return False
    
    # Create image with blue gradient background
    img = Image.new('RGBA', (size, size), (0, 123, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Draw rounded rectangle background
    corner_radius = size // 8
    draw.rounded_rectangle([0, 0, size-1, size-1], corner_radius, fill=(0, 123, 255, 255))
    
    # Draw route icon (simplified)
    center = size // 2
    dot_size = size // 16
    
    # Draw route points
    point1 = (center - size//4, center - size//6)
    point2 = (center + size//4, center - size//6)
    point3 = (center, center + size//4)
    
    # Draw connecting lines
    draw.line([point1, point3], fill='white', width=size//32)
    draw.line([point2, point3], fill='white', width=size//32)
    draw.line([point1, point2], fill='white', width=size//48)
    
    # Draw points
    draw.ellipse([point1[0]-dot_size, point1[1]-dot_size, 
                  point1[0]+dot_size, point1[1]+dot_size], fill='white')
    draw.ellipse([point2[0]-dot_size, point2[1]-dot_size, 
                  point2[0]+dot_size, point2[1]+dot_size], fill='white')
    draw.ellipse([point3[0]-dot_size, point3[1]-dot_size, 
                  point3[0]+dot_size, point3[1]+dot_size], fill='white')
    
    # Save the image
    img.save(filename, 'PNG')
    print(f"Created {filename}")
    return True

def main():
    """Generate both icon sizes"""
    import os
    
    # Create icons directory if it doesn't exist
    icons_dir = 'static/icons'
    os.makedirs(icons_dir, exist_ok=True)
    
    # Generate icons
    success1 = create_simple_icon(192, 'static/icons/icon-192.png')
    success2 = create_simple_icon(512, 'static/icons/icon-512.png')
    
    if success1 and success2:
        print("✅ Icons created successfully!")
    else:
        print("❌ Failed to create icons. Install Pillow: pip install Pillow")

if __name__ == '__main__':
    main()
