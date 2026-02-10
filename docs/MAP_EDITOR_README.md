# Map Editor for Paintball

A visual editor for creating and modifying map obstacles in real-time.

## Setup

Install pygame (only needed for the editor):
```bash
pip install pygame
```

## Usage

Run the editor:
```bash
cd backend/paintball
python map_editor.py
```

## Controls

### Navigation
- **Arrow Keys (← →)**: Switch between maps
- **Ctrl+S**: Save current map
- **Delete**: Remove selected obstacle

### Modes (Press number keys)
- **1**: Select/Move mode - Click and drag to move obstacles
- **2**: Add Rectangle mode - Click and drag to create rectangles
- **3**: Add Circle mode - Click and drag to create circles (radius from center)
- **4**: Delete mode - Click obstacles to remove them

### Tips
- **Green dots** = spawn points (read-only)
- **Yellow outline** = selected obstacle
- Map background color is automatically applied
- Obstacles are saved to the JSON files immediately on Ctrl+S
- Minimum size requirements: rectangles must be at least 20x20, circles radius > 10

## Features
- Real-time visual editing
- All 5 maps supported (Arena, Forest, Warehouse, Ice, Canyon)
- Drag-and-drop obstacle movement
- Visual feedback with map-specific colors
- Auto-scaling to fit screen
- Live obstacle count display
