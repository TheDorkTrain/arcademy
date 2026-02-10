"""
Paintball Map Editor
Visual editor for creating and modifying map obstacles in real-time
"""

import json
import os
import pygame
import sys

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 100, 255)
YELLOW = (255, 255, 0)
GRAY = (128, 128, 128)

# Predefined color themes
COLOR_THEMES = [
    {"name": "Dark Blue", "bg": "#1a2332", "obstacle": "#2f4c6b"},
    {"name": "Forest", "bg": "#1e2d1f", "obstacle": "#2d4a2e"},
    {"name": "Warehouse", "bg": "#1a1a1a", "obstacle": "#3d3021"},
    {"name": "Ice", "bg": "#e0f2f7", "obstacle": "#b3d9e8"},
    {"name": "Canyon", "bg": "#2b1f1a", "obstacle": "#5a3a2a"},
    {"name": "Purple", "bg": "#1a0f2e", "obstacle": "#3d2a5c"},
    {"name": "Red", "bg": "#2e1414", "obstacle": "#5c2a2a"},
]


class MapEditor:
    def __init__(self):
        pygame.init()
        self.screen_width = 1200
        self.screen_height = 750
        self.screen = pygame.display.set_mode((self.screen_width, self.screen_height), pygame.RESIZABLE)
        pygame.display.set_caption("Paintball Map Editor")
        self.clock = pygame.time.Clock()
        self.font = pygame.font.Font(None, 24)
        self.small_font = pygame.font.Font(None, 18)

        # Map data
        self.maps_dir = os.path.join(os.path.dirname(__file__), "Maps")
        self.current_map = None
        self.map_files = self.load_map_list()
        self.selected_map_index = 0

        # Editor state
        self.mode = "select"  # select, rect, circle, triangle, spawn, delete
        self.selected_obstacle = None
        self.selected_spawn = None
        self.dragging = False
        self.drag_start = None
        self.new_obstacle = None
        self.triangle_points = []  # For triangle creation

        # UI
        self.sidebar_width = 250
        self.map_offset_x = self.sidebar_width + 20
        self.map_offset_y = 80

        # Scale to fit
        self.scale = 1.0

        # New map dialog
        self.creating_new_map = False
        self.new_map_name = ""
        self.new_map_width = ""
        self.new_map_height = ""
        self.selected_theme_index = 0
        self.input_field = "name"  # name, width, height

        self.load_current_map()

    def load_map_list(self):
        """Load list of available maps"""
        maps = []
        for filename in sorted(os.listdir(self.maps_dir)):
            if filename.endswith(".json"):
                maps.append(filename)
        return maps

    def load_current_map(self):
        """Load the currently selected map"""
        if not self.map_files:
            return

        filename = self.map_files[self.selected_map_index]
        filepath = os.path.join(self.maps_dir, filename)

        with open(filepath, 'r', encoding='utf-8') as f:
            self.current_map = json.load(f)

        # Ensure obstacles array exists
        if 'obstacles' not in self.current_map:
            self.current_map['obstacles'] = []

        # Calculate scale to fit map on screen
        available_width = self.screen_width - self.sidebar_width - 40
        available_height = self.screen_height - 120
        scale_x = available_width / self.current_map['width']
        scale_y = available_height / self.current_map['height']
        self.scale = min(scale_x, scale_y, 1.0)

    def save_current_map(self):
        """Save the current map to file"""
        if not self.current_map:
            return

        filename = self.map_files[self.selected_map_index]
        filepath = os.path.join(self.maps_dir, filename)

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.current_map, f, indent=2)

        print(f"Saved {filename}")

    def screen_to_map_coords(self, screen_x, screen_y):
        """Convert screen coordinates to map coordinates"""
        map_x = (screen_x - self.map_offset_x) / self.scale
        map_y = (screen_y - self.map_offset_y) / self.scale
        return int(map_x), int(map_y)

    def map_to_screen_coords(self, map_x, map_y):
        """Convert map coordinates to screen coordinates"""
        screen_x = map_x * self.scale + self.map_offset_x
        screen_y = map_y * self.scale + self.map_offset_y
        return int(screen_x), int(screen_y)

    def get_obstacle_at_point(self, map_x, map_y):
        """Find obstacle at given map coordinates"""
        for i, obstacle in enumerate(self.current_map['obstacles']):
            if obstacle['type'] == 'rect':
                if (obstacle['x'] <= map_x <= obstacle['x'] + obstacle['width'] and
                        obstacle['y'] <= map_y <= obstacle['y'] + obstacle['height']):
                    return i
            elif obstacle['type'] == 'circle':
                dx = map_x - obstacle['x']
                dy = map_y - obstacle['y']
                if dx * dx + dy * dy <= obstacle['radius']**2:
                    return i
            elif obstacle['type'] == 'triangle':
                # Point in triangle test
                if self.point_in_triangle(map_x, map_y, obstacle['points']):
                    return i
        return None

    def point_in_triangle(self, px, py, points):
        """Check if point is inside triangle"""
        def sign(p1, p2, p3):
            return (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1])

        d1 = sign((px, py), points[0], points[1])
        d2 = sign((px, py), points[1], points[2])
        d3 = sign((px, py), points[2], points[0])

        has_neg = (d1 < 0) or (d2 < 0) or (d3 < 0)
        has_pos = (d1 > 0) or (d2 > 0) or (d3 > 0)

        return not (has_neg and has_pos)

    def get_spawn_at_point(self, map_x, map_y):
        """Find spawn point at given map coordinates"""
        for i, spawn in enumerate(self.current_map['spawn_points']):
            dx = map_x - spawn['x']
            dy = map_y - spawn['y']
            if dx * dx + dy * dy <= 100:  # 10 pixel radius
                return i
        return None

    def create_new_map(self):
        """Create a new map with user-specified parameters"""
        try:
            width = int(self.new_map_width)
            height = int(self.new_map_height)

            if width < 500 or height < 500:
                print("Map too small! Minimum 500x500")
                return

            if width > 2000 or height > 2000:
                print("Map too large! Maximum 2000x2000")
                return

            # Create map ID from name
            map_id = self.new_map_name.lower().replace(' ', '_')
            filename = f"{map_id}.json"

            # Check if file already exists
            if filename in self.map_files:
                print(f"Map {filename} already exists!")
                return

            # Get selected theme
            theme = COLOR_THEMES[self.selected_theme_index]

            # Create new map
            new_map = {
                "map_id": map_id,
                "name": self.new_map_name,
                "width": width,
                "height": height,
                "background_color": theme["bg"],
                "spawn_points": [
                    {"x": 100, "y": 100},
                    {"x": width - 100, "y": 100},
                    {"x": 100, "y": height - 100},
                    {"x": width - 100, "y": height - 100}
                ],
                "obstacles": []
            }

            # Save to file
            filepath = os.path.join(self.maps_dir, filename)
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(new_map, f, indent=2)

            # Add to map list and load it
            self.map_files.append(filename)
            self.map_files.sort()
            self.selected_map_index = self.map_files.index(filename)
            self.load_current_map()

            print(f"Created new map: {filename}")

        except ValueError:
            print("Invalid width or height!")

        # Reset dialog
        self.creating_new_map = False
        self.new_map_name = ""
        self.new_map_width = ""
        self.new_map_height = ""
        self.input_field = "name"
        self.selected_theme_index = 0

    def get_obstacle_color(self):
        """Get the obstacle color based on current map's background"""
        bg_color = self.current_map.get('background_color', '#12263a')

        # Find matching theme or default
        for theme in COLOR_THEMES:
            if theme["bg"] == bg_color:
                return theme["obstacle"]

        # Default if no match
        return '#2f4c6b'

    def handle_events(self):
        """Handle pygame events"""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return False

            elif event.type == pygame.VIDEORESIZE:
                self.screen_width = event.w
                self.screen_height = event.h
                self.load_current_map()  # Recalculate scale

            elif event.type == pygame.KEYDOWN:
                # Handle new map dialog input
                if self.creating_new_map:
                    if event.key == pygame.K_ESCAPE:
                        self.creating_new_map = False
                        self.new_map_name = ""
                        self.new_map_width = ""
                        self.new_map_height = ""
                        self.selected_theme_index = 0
                    elif event.key == pygame.K_RETURN:
                        if self.input_field == "name" and self.new_map_name:
                            self.input_field = "width"
                        elif self.input_field == "width" and self.new_map_width:
                            self.input_field = "height"
                        elif self.input_field == "height" and self.new_map_height:
                            self.create_new_map()
                    elif event.key == pygame.K_BACKSPACE:
                        if self.input_field == "name":
                            self.new_map_name = self.new_map_name[:-1]
                        elif self.input_field == "width":
                            self.new_map_width = self.new_map_width[:-1]
                        elif self.input_field == "height":
                            self.new_map_height = self.new_map_height[:-1]
                    elif event.key == pygame.K_TAB:
                        if self.input_field == "name":
                            self.input_field = "width"
                        elif self.input_field == "width":
                            self.input_field = "height"
                        elif self.input_field == "height":
                            self.input_field = "name"
                    elif event.key == pygame.K_UP:
                        self.selected_theme_index = (self.selected_theme_index - 1) % len(COLOR_THEMES)
                    elif event.key == pygame.K_DOWN:
                        self.selected_theme_index = (self.selected_theme_index + 1) % len(COLOR_THEMES)
                    else:
                        if self.input_field == "name" and event.unicode.isprintable():
                            self.new_map_name += event.unicode
                        elif self.input_field in ["width", "height"] and event.unicode.isdigit():
                            if self.input_field == "width":
                                self.new_map_width += event.unicode
                            else:
                                self.new_map_height += event.unicode
                    return True

                # Normal keyboard shortcuts
                if event.key == pygame.K_s and pygame.key.get_mods() & pygame.KMOD_CTRL:
                    self.save_current_map()
                elif event.key == pygame.K_n and pygame.key.get_mods() & pygame.KMOD_CTRL:
                    self.creating_new_map = True
                    self.new_map_name = ""
                    self.new_map_width = ""
                    self.new_map_height = ""
                    self.input_field = "name"
                    self.selected_theme_index = 0
                elif event.key == pygame.K_LEFT:
                    self.selected_map_index = (self.selected_map_index - 1) % len(self.map_files)
                    self.load_current_map()
                    self.selected_obstacle = None
                    self.selected_spawn = None
                    self.triangle_points = []
                elif event.key == pygame.K_RIGHT:
                    self.selected_map_index = (self.selected_map_index + 1) % len(self.map_files)
                    self.load_current_map()
                    self.selected_obstacle = None
                    self.selected_spawn = None
                    self.triangle_points = []
                elif event.key == pygame.K_DELETE:
                    if self.selected_obstacle is not None:
                        self.current_map['obstacles'].pop(self.selected_obstacle)
                        self.selected_obstacle = None
                    elif self.selected_spawn is not None:
                        if len(self.current_map['spawn_points']) > 1:
                            self.current_map['spawn_points'].pop(self.selected_spawn)
                            self.selected_spawn = None
                elif event.key == pygame.K_1:
                    self.mode = "select"
                    self.triangle_points = []
                elif event.key == pygame.K_2:
                    self.mode = "rect"
                    self.triangle_points = []
                elif event.key == pygame.K_3:
                    self.mode = "circle"
                    self.triangle_points = []
                elif event.key == pygame.K_4:
                    self.mode = "triangle"
                    self.triangle_points = []
                elif event.key == pygame.K_5:
                    self.mode = "spawn"
                    self.triangle_points = []
                elif event.key == pygame.K_6:
                    self.mode = "delete"
                    self.triangle_points = []
                elif event.key == pygame.K_ESCAPE:
                    self.triangle_points = []
                    self.new_obstacle = None

            elif event.type == pygame.MOUSEBUTTONDOWN:
                if event.button == 1:  # Left click
                    map_x, map_y = self.screen_to_map_coords(event.pos[0], event.pos[1])

                    if self.mode == "select":
                        self.selected_obstacle = self.get_obstacle_at_point(map_x, map_y)
                        self.selected_spawn = self.get_spawn_at_point(map_x, map_y)

                        if self.selected_obstacle is not None:
                            self.dragging = True
                            obstacle = self.current_map['obstacles'][self.selected_obstacle]
                            if obstacle['type'] == 'rect':
                                self.drag_start = (map_x - obstacle['x'], map_y - obstacle['y'])
                            elif obstacle['type'] == 'circle':
                                self.drag_start = (map_x - obstacle['x'], map_y - obstacle['y'])
                            elif obstacle['type'] == 'triangle':
                                self.drag_start = (map_x, map_y)
                        elif self.selected_spawn is not None:
                            self.dragging = True
                            spawn = self.current_map['spawn_points'][self.selected_spawn]
                            self.drag_start = (map_x - spawn['x'], map_y - spawn['y'])

                    elif self.mode == "rect":
                        self.drag_start = (map_x, map_y)
                        self.new_obstacle = {
                            'type': 'rect',
                            'x': map_x,
                            'y': map_y,
                            'width': 0,
                            'height': 0,
                            'color': self.get_obstacle_color()
                        }

                    elif self.mode == "circle":
                        self.drag_start = (map_x, map_y)
                        self.new_obstacle = {
                            'type': 'circle',
                            'x': map_x,
                            'y': map_y,
                            'radius': 0,
                            'color': self.get_obstacle_color()
                        }

                    elif self.mode == "triangle":
                        self.triangle_points.append((map_x, map_y))
                        if len(self.triangle_points) == 3:
                            # Create triangle obstacle
                            self.current_map['obstacles'].append({
                                'type': 'triangle',
                                'points': [[p[0], p[1]] for p in self.triangle_points],
                                'color': self.get_obstacle_color()
                            })
                            self.triangle_points = []

                    elif self.mode == "spawn":
                        # Add new spawn point
                        self.current_map['spawn_points'].append({'x': map_x, 'y': map_y})

                    elif self.mode == "delete":
                        obstacle_idx = self.get_obstacle_at_point(map_x, map_y)
                        spawn_idx = self.get_spawn_at_point(map_x, map_y)

                        if obstacle_idx is not None:
                            self.current_map['obstacles'].pop(obstacle_idx)
                            self.selected_obstacle = None
                        elif spawn_idx is not None and len(self.current_map['spawn_points']) > 1:
                            self.current_map['spawn_points'].pop(spawn_idx)
                            self.selected_spawn = None

            elif event.type == pygame.MOUSEBUTTONUP:
                if event.button == 1:  # Left click release
                    if self.mode == "select" and self.dragging:
                        self.dragging = False
                        self.drag_start = None

                    elif self.mode in ["rect", "circle"] and self.new_obstacle:
                        # Only add if size is reasonable
                        if self.mode == "rect":
                            if abs(self.new_obstacle['width']) > 20 and abs(self.new_obstacle['height']) > 20:
                                self.current_map['obstacles'].append(self.new_obstacle)
                        else:
                            if self.new_obstacle['radius'] > 10:
                                self.current_map['obstacles'].append(self.new_obstacle)

                        self.new_obstacle = None
                        self.drag_start = None

            elif event.type == pygame.MOUSEMOTION:
                if self.dragging and self.selected_obstacle is not None:
                    map_x, map_y = self.screen_to_map_coords(event.pos[0], event.pos[1])
                    obstacle = self.current_map['obstacles'][self.selected_obstacle]

                    if obstacle['type'] in ['rect', 'circle']:
                        obstacle['x'] = map_x - self.drag_start[0]
                        obstacle['y'] = map_y - self.drag_start[1]
                    elif obstacle['type'] == 'triangle':
                        # Move entire triangle
                        dx = map_x - self.drag_start[0]
                        dy = map_y - self.drag_start[1]
                        for point in obstacle['points']:
                            point[0] += dx
                            point[1] += dy
                        self.drag_start = (map_x, map_y)

                elif self.dragging and self.selected_spawn is not None:
                    map_x, map_y = self.screen_to_map_coords(event.pos[0], event.pos[1])
                    spawn = self.current_map['spawn_points'][self.selected_spawn]
                    spawn['x'] = map_x - self.drag_start[0]
                    spawn['y'] = map_y - self.drag_start[1]

                elif self.new_obstacle:
                    map_x, map_y = self.screen_to_map_coords(event.pos[0], event.pos[1])

                    if self.new_obstacle['type'] == 'rect':
                        self.new_obstacle['width'] = map_x - self.drag_start[0]
                        self.new_obstacle['height'] = map_y - self.drag_start[1]
                    else:
                        dx = map_x - self.drag_start[0]
                        dy = map_y - self.drag_start[1]
                        self.new_obstacle['radius'] = int((dx * dx + dy * dy)**0.5)

        return True

    def draw(self):
        """Draw everything"""
        self.screen.fill(BLACK)

        if not self.current_map:
            return

        # New map creation dialog
        if self.creating_new_map:
            self.draw_new_map_dialog()
            pygame.display.flip()
            return

        # Draw sidebar
        pygame.draw.rect(self.screen, (30, 30, 30), (0, 0, self.sidebar_width, self.screen_height))

        # Map selector
        title = self.font.render("Map Editor", True, WHITE)
        self.screen.blit(title, (10, 10))

        map_name = self.small_font.render(f"Map: {self.current_map['name']}", True, YELLOW)
        self.screen.blit(map_name, (10, 40))

        nav_text = self.small_font.render("← → Change Map", True, GRAY)
        self.screen.blit(nav_text, (10, 60))

        # Mode selector
        y = 90
        modes = [
            ("1: Select/Move", "select", GREEN),
            ("2: Add Rect", "rect", BLUE),
            ("3: Add Circle", "circle", BLUE),
            ("4: Add Triangle", "triangle", BLUE),
            ("5: Add Spawn", "spawn", YELLOW),
            ("6: Delete", "delete", RED)
        ]

        for text, mode_name, color in modes:
            mode_color = color if self.mode == mode_name else GRAY
            mode_text = self.small_font.render(text, True, mode_color)
            self.screen.blit(mode_text, (10, y))
            y += 22

        # Instructions
        y += 15
        instructions = [
            "Controls:",
            "Ctrl+S: Save",
            "Ctrl+N: New Map",
            "Delete: Remove",
            "ESC: Cancel",
            "",
            "Triangle: 3 clicks",
            f"Points: {len(self.triangle_points)}/3" if self.mode == "triangle" else "",
            "",
            f"Obstacles: {len(self.current_map['obstacles'])}",
            f"Spawns: {len(self.current_map['spawn_points'])}"
        ]

        for instruction in instructions:
            if instruction:
                inst_text = self.small_font.render(instruction, True, WHITE)
                self.screen.blit(inst_text, (10, y))
            y += 18

        # Draw map background
        bg_color = self.hex_to_rgb(self.current_map.get('background_color', '#12263a'))
        map_rect = pygame.Rect(
            self.map_offset_x,
            self.map_offset_y,
            int(self.current_map['width'] * self.scale),
            int(self.current_map['height'] * self.scale)
        )
        pygame.draw.rect(self.screen, bg_color, map_rect)
        pygame.draw.rect(self.screen, WHITE, map_rect, 2)

        # Draw spawn points
        for i, spawn in enumerate(self.current_map['spawn_points']):
            screen_x, screen_y = self.map_to_screen_coords(spawn['x'], spawn['y'])
            is_selected = (i == self.selected_spawn)
            color = YELLOW if is_selected else GREEN
            pygame.draw.circle(self.screen, color, (screen_x, screen_y), 8)
            pygame.draw.circle(self.screen, BLACK, (screen_x, screen_y), 8, 2)

        # Draw obstacles
        for i, obstacle in enumerate(self.current_map['obstacles']):
            color = self.hex_to_rgb(obstacle.get('color', '#2f4c6b'))
            is_selected = (i == self.selected_obstacle)

            if obstacle['type'] == 'rect':
                x, y = self.map_to_screen_coords(obstacle['x'], obstacle['y'])
                w = int(obstacle['width'] * self.scale)
                h = int(obstacle['height'] * self.scale)
                pygame.draw.rect(self.screen, color, (x, y, w, h))
                pygame.draw.rect(self.screen, YELLOW if is_selected else BLACK, (x, y, w, h), 2)

            elif obstacle['type'] == 'circle':
                x, y = self.map_to_screen_coords(obstacle['x'], obstacle['y'])
                r = int(obstacle['radius'] * self.scale)
                pygame.draw.circle(self.screen, color, (x, y), r)
                pygame.draw.circle(self.screen, YELLOW if is_selected else BLACK, (x, y), r, 2)

            elif obstacle['type'] == 'triangle':
                points = [self.map_to_screen_coords(p[0], p[1]) for p in obstacle['points']]
                pygame.draw.polygon(self.screen, color, points)
                pygame.draw.polygon(self.screen, YELLOW if is_selected else BLACK, points, 2)

        # Draw new obstacle being created
        if self.new_obstacle:
            color = self.hex_to_rgb(self.new_obstacle.get('color', '#2f4c6b'))

            if self.new_obstacle['type'] == 'rect':
                x, y = self.map_to_screen_coords(self.new_obstacle['x'], self.new_obstacle['y'])
                w = int(self.new_obstacle['width'] * self.scale)
                h = int(self.new_obstacle['height'] * self.scale)
                pygame.draw.rect(self.screen, color, (x, y, w, h))
                pygame.draw.rect(self.screen, YELLOW, (x, y, w, h), 2)

            elif self.new_obstacle['type'] == 'circle':
                x, y = self.map_to_screen_coords(self.new_obstacle['x'], self.new_obstacle['y'])
                r = int(self.new_obstacle['radius'] * self.scale)
                if r > 0:
                    pygame.draw.circle(self.screen, color, (x, y), r)
                    pygame.draw.circle(self.screen, YELLOW, (x, y), r, 2)

        # Draw triangle points being placed
        if self.mode == "triangle" and self.triangle_points:
            for point in self.triangle_points:
                screen_x, screen_y = self.map_to_screen_coords(point[0], point[1])
                pygame.draw.circle(self.screen, YELLOW, (screen_x, screen_y), 5)

            # Draw lines between placed points
            if len(self.triangle_points) >= 2:
                points = [self.map_to_screen_coords(p[0], p[1]) for p in self.triangle_points]
                pygame.draw.lines(self.screen, YELLOW, False, points, 2)

        pygame.display.flip()

    def draw_new_map_dialog(self):
        """Draw the new map creation dialog"""
        # Semi-transparent overlay
        overlay = pygame.Surface((self.screen_width, self.screen_height))
        overlay.set_alpha(200)
        overlay.fill(BLACK)
        self.screen.blit(overlay, (0, 0))

        # Dialog box
        dialog_width = 500
        dialog_height = 450
        dialog_x = (self.screen_width - dialog_width) // 2
        dialog_y = (self.screen_height - dialog_height) // 2

        pygame.draw.rect(self.screen, (40, 40, 40), (dialog_x, dialog_y, dialog_width, dialog_height))
        pygame.draw.rect(self.screen, WHITE, (dialog_x, dialog_y, dialog_width, dialog_height), 2)

        # Title
        title = self.font.render("Create New Map", True, WHITE)
        self.screen.blit(title, (dialog_x + 20, dialog_y + 20))

        # Input fields
        y = dialog_y + 60

        # Map Name
        name_label = self.small_font.render("Map Name:", True, WHITE)
        self.screen.blit(name_label, (dialog_x + 20, y))
        name_color = YELLOW if self.input_field == "name" else WHITE
        pygame.draw.rect(self.screen, name_color, (dialog_x + 20, y + 20, 460, 30), 2)
        name_text = self.small_font.render(self.new_map_name, True, WHITE)
        self.screen.blit(name_text, (dialog_x + 25, y + 25))

        y += 60

        # Width
        width_label = self.small_font.render("Width (500-2000):", True, WHITE)
        self.screen.blit(width_label, (dialog_x + 20, y))
        width_color = YELLOW if self.input_field == "width" else WHITE
        pygame.draw.rect(self.screen, width_color, (dialog_x + 20, y + 20, 460, 30), 2)
        width_text = self.small_font.render(self.new_map_width, True, WHITE)
        self.screen.blit(width_text, (dialog_x + 25, y + 25))

        y += 60

        # Height
        height_label = self.small_font.render("Height (500-2000):", True, WHITE)
        self.screen.blit(height_label, (dialog_x + 20, y))
        height_color = YELLOW if self.input_field == "height" else WHITE
        pygame.draw.rect(self.screen, height_color, (dialog_x + 20, y + 20, 460, 30), 2)
        height_text = self.small_font.render(self.new_map_height, True, WHITE)
        self.screen.blit(height_text, (dialog_x + 25, y + 25))

        y += 60

        # Color theme selector
        theme_label = self.small_font.render("Color Theme (↑↓ to change):", True, WHITE)
        self.screen.blit(theme_label, (dialog_x + 20, y))

        theme = COLOR_THEMES[self.selected_theme_index]
        theme_name_text = self.font.render(theme["name"], True, WHITE)
        self.screen.blit(theme_name_text, (dialog_x + 20, y + 22))

        # Draw color preview
        bg_color = self.hex_to_rgb(theme["bg"])
        obstacle_color = self.hex_to_rgb(theme["obstacle"])

        preview_x = dialog_x + 250
        preview_y = y + 20

        # Background preview
        pygame.draw.rect(self.screen, bg_color, (preview_x, preview_y, 80, 40))
        pygame.draw.rect(self.screen, WHITE, (preview_x, preview_y, 80, 40), 1)
        bg_label = self.small_font.render("BG", True, WHITE)
        self.screen.blit(bg_label, (preview_x + 28, preview_y + 45))

        # Obstacle preview
        pygame.draw.rect(self.screen, obstacle_color, (preview_x + 90, preview_y, 80, 40))
        pygame.draw.rect(self.screen, WHITE, (preview_x + 90, preview_y, 80, 40), 1)
        obs_label = self.small_font.render("Obstacle", True, WHITE)
        self.screen.blit(obs_label, (preview_x + 98, preview_y + 45))

        y += 80

        # Instructions
        instructions = [
            "Press TAB to switch fields",
            "Press ↑↓ to change theme",
            "Press ENTER to create map",
            "Press ESC to cancel"
        ]
        for i, instruction in enumerate(instructions):
            inst_text = self.small_font.render(instruction, True, GRAY)
            self.screen.blit(inst_text, (dialog_x + 20, y + i * 18))

    def hex_to_rgb(self, hex_color):
        """Convert hex color to RGB tuple"""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i + 2], 16) for i in (0, 2, 4))

    def run(self):
        """Main game loop"""
        running = True
        while running:
            running = self.handle_events()
            self.draw()
            self.clock.tick(60)

        pygame.quit()
        sys.exit()


if __name__ == "__main__":
    editor = MapEditor()
    editor.run()
