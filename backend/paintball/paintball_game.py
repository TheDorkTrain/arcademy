"""
Paintball Game Logic
Multiplayer top-down paintball for up to 8 players
"""

import json
import math
import os
import random
import time
from dataclasses import dataclass
from typing import Dict, List, Optional


@dataclass
class MapConfig:
    map_id: str
    name: str
    width: int
    height: int
    spawn_points: List[Dict[str, float]]
    obstacles: List[Dict] = None
    background_color: str = "#12263a"


CHARACTERS = {
    "sprinter": {
        "name": "Sprinter",
        "ability": "Speed Boost",
        "ability_description": "2x speed for 10 seconds",
        "speed": 4.6,
        "fire_rate": 0.55,
        "range": 420,
        "damage": 25,
        "max_health": 100,
    },
    "guardian": {
        "name": "Guardian",
        "ability": "Shield Wall",
        "ability_description": "Deploy protective barrier",
        "speed": 3.8,
        "fire_rate": 0.7,
        "range": 480,
        "damage": 30,
        "max_health": 150,
    },
    "sharpshot": {
        "name": "Sharpshot",
        "ability": "Long Range",
        "ability_description": "Next 4 shots stronger & faster",
        "speed": 4.0,
        "fire_rate": 0.85,
        "range": 560,
        "damage": 45,
        "max_health": 90,
    },
    "blitzer": {
        "name": "Blitzer",
        "ability": "Rapid Fire",
        "ability_description": "Ultra-fast firing for 5 seconds",
        "speed": 4.1,
        "fire_rate": 0.4,
        "range": 380,
        "damage": 20,
        "max_health": 110,
    },
    "phase": {
        "name": "Phase",
        "ability": "Phase Shift",
        "ability_description": "Become intangible and move through obstacles for 5 seconds",
        "speed": 4.3,
        "fire_rate": 0.6,
        "range": 450,
        "damage": 35,
        "max_health": 100,
    }
}


def load_maps():
    maps_dir = os.path.join(os.path.dirname(__file__), "Maps")
    maps = []
    if os.path.isdir(maps_dir):
        for filename in sorted(os.listdir(maps_dir)):
            if not filename.endswith(".json"):
                continue
            file_path = os.path.join(maps_dir, filename)
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            maps.append(
                MapConfig(
                    map_id=data["map_id"],
                    name=data["name"],
                    width=data["width"],
                    height=data["height"],
                    spawn_points=data["spawn_points"],
                    obstacles=data.get("obstacles", []),
                    background_color=data.get("background_color", "#12263a")
                )
            )
    if not maps:
        raise ValueError("No paintball maps found in backend/paintball/Maps")
    return maps


MAPS = load_maps()


class PaintballGame:
    def __init__(self, room_id: str):
        self.room_id = room_id
        self.room_name = room_id
        self.players: Dict[str, Dict] = {}
        self.player_order: List[str] = []
        self.game_started = False
        self.current_round = 0
        self.rounds_to_play = 3
        self.round_duration = 120
        self.round_start_time: Optional[float] = None
        self.round_timer = None
        self.map_votes: Dict[str, str] = {}
        self.selected_map: Optional[MapConfig] = None
        self.match_results: List[Dict] = []
        self.projectiles: List[Dict] = []
        self.next_projectile_id = 0
        self.barriers: List[Dict] = []
        self.next_barrier_id = 0

    def add_player(self, socket_id: str, name: str, position: int = 0):
        if socket_id in self.players:
            return False
        character_id = "sprinter"
        # Generate random color for player
        colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#14b8a6"]
        player_color = colors[position % len(colors)]
        max_health = CHARACTERS[character_id]["max_health"]
        self.players[socket_id] = {
            "name": name,
            "position": position,
            "character": character_id,
            "color": player_color,
            "health": max_health,
            "max_health": max_health,
            "eliminations": 0,
            "deaths": 0,
            "rounds_won": 0,
            "x": 0,
            "y": 0,
            "aim": 0.0,
            "last_shot": 0.0,
            "alive": True,
            "ability_active": False,
            "ability_used": False,
            "ability_start_time": 0,
            "ability_shots_remaining": 0,
        }
        self.player_order.append(socket_id)
        return True

    def remove_player(self, socket_id: str):
        if socket_id in self.players:
            del self.players[socket_id]
        if socket_id in self.player_order:
            self.player_order.remove(socket_id)

    def update_rounds(self, rounds_to_play: int):
        self.rounds_to_play = max(1, min(rounds_to_play, 10))

    def set_character(self, socket_id: str, character_id: str):
        if socket_id in self.players and character_id in CHARACTERS:
            self.players[socket_id]["character"] = character_id
            max_health = CHARACTERS[character_id]["max_health"]
            self.players[socket_id]["max_health"] = max_health
            self.players[socket_id]["health"] = max_health

    def vote_map(self, socket_id: str, map_id: str):
        if map_id in [m.map_id for m in MAPS]:
            self.map_votes[socket_id] = map_id

    def _choose_map(self) -> MapConfig:
        if self.map_votes:
            tally = {}
            for vote in self.map_votes.values():
                tally[vote] = tally.get(vote, 0) + 1
            winning_map = sorted(tally.items(), key=lambda item: item[1], reverse=True)[0][0]
            return next(m for m in MAPS if m.map_id == winning_map)
        return random.choice(MAPS)

    def start_game(self):
        if self.game_started:
            return False
        self.game_started = True
        self.current_round = 1
        self.selected_map = self._choose_map()
        self.map_votes = {}
        self._spawn_players()
        self._reset_scores()
        self._start_round_timer()
        return True

    def _spawn_players(self):
        if not self.selected_map:
            return
        spawn_points = self.selected_map.spawn_points.copy()
        random.shuffle(spawn_points)
        for idx, socket_id in enumerate(self.player_order):
            spawn = spawn_points[idx % len(spawn_points)]
            character_id = self.players[socket_id]["character"]
            max_health = CHARACTERS[character_id]["max_health"]
            self.players[socket_id]["x"] = spawn["x"]
            self.players[socket_id]["y"] = spawn["y"]
            self.players[socket_id]["aim"] = 0.0
            self.players[socket_id]["health"] = max_health
            self.players[socket_id]["alive"] = True
            self.players[socket_id]["ability_used"] = False
            self.players[socket_id]["ability_active"] = False
            self.players[socket_id]["ability_shots_remaining"] = 0

    def _reset_scores(self):
        for player in self.players.values():
            character_id = player["character"]
            max_health = CHARACTERS[character_id]["max_health"]
            player["eliminations"] = 0
            player["deaths"] = 0
            player["last_shot"] = 0.0
            player["health"] = max_health
            player["alive"] = True
            player["ability_used"] = False
            player["ability_active"] = False
            player["ability_shots_remaining"] = 0

    def _start_round_timer(self):
        self.round_start_time = time.time()

    def is_round_time_over(self):
        if not self.round_start_time:
            return False
        return (time.time() - self.round_start_time) >= self.round_duration

    def end_round(self):
        if not self.game_started:
            return None
        scores = [
            {
                "id": pid,
                "name": player["name"],
                "eliminations": player["eliminations"],
                "deaths": player["deaths"],
            }
            for pid, player in self.players.items()
        ]
        scores_sorted = sorted(scores, key=lambda p: p["eliminations"], reverse=True)
        winner = scores_sorted[0] if scores_sorted else None

        # Increment rounds_won for the winner
        if winner and winner["id"] in self.players:
            self.players[winner["id"]]["rounds_won"] += 1

        self.match_results.append({
            "round": self.current_round,
            "winner": winner,
            "scores": scores_sorted,
        })
        self.round_start_time = None
        return winner, scores_sorted
        return winner, scores_sorted

    def advance_round(self):
        if self.current_round >= self.rounds_to_play:
            self.game_started = False
            return False
        self.current_round += 1
        self.projectiles = []  # Clear projectiles
        self.barriers = []  # Clear barriers
        self._spawn_players()
        self._reset_scores()
        self._start_round_timer()
        return True

    def update_player(self, socket_id: str, move_x: float, move_y: float):
        if socket_id not in self.players or not self.selected_map:
            return
        player = self.players[socket_id]
        character_id = player["character"]
        speed = CHARACTERS[character_id]["speed"]

        # Check for speed boost ability (Sprinter)
        if character_id == "sprinter" and player.get("ability_active"):
            if time.time() - player.get("ability_start_time", 0) < 10:
                speed *= 2
            else:
                player["ability_active"] = False

        new_x = player["x"] + move_x * speed
        new_y = player["y"] + move_y * speed

        # Keep within map bounds
        new_x = max(30, min(self.selected_map.width - 30, new_x))
        new_y = max(30, min(self.selected_map.height - 30, new_y))

        # Check obstacle collisions (unless Phase is using ability)
        if not (character_id == "phase" and player.get("ability_active")):
            obstacles = getattr(self.selected_map, 'obstacles', [])
            for obstacle in obstacles:
                if self._check_obstacle_collision(new_x, new_y, 20, obstacle):
                    # Collision detected, don't move
                    return

        player["x"] = new_x
        player["y"] = new_y

    def _check_obstacle_collision(self, x, y, radius, obstacle):
        """Check if a circle at (x, y) with given radius collides with an obstacle"""
        if obstacle["type"] == "rect":
            # Check rectangle collision
            closest_x = max(obstacle["x"], min(x, obstacle["x"] + obstacle["width"]))
            closest_y = max(obstacle["y"], min(y, obstacle["y"] + obstacle["height"]))
            distance = math.hypot(x - closest_x, y - closest_y)
            return distance < radius
        elif obstacle["type"] == "circle":
            # Check circle collision
            distance = math.hypot(x - obstacle["x"], y - obstacle["y"])
            return distance < (radius + obstacle["radius"])
        return False

    def update_aim(self, socket_id: str, aim_angle: float):
        if socket_id in self.players:
            self.players[socket_id]["aim"] = aim_angle

    def handle_shot(self, socket_id: str, aim_angle: float):
        if socket_id not in self.players:
            return None
        now = time.time()
        player = self.players[socket_id]

        if not player.get("alive", True):
            return None

        character_id = player["character"]
        fire_rate = CHARACTERS[character_id]["fire_rate"]

        # Blitzer ability: rapid fire
        if character_id == "blitzer" and player.get("ability_active"):
            if time.time() - player.get("ability_start_time", 0) < 5:
                fire_rate = 0.1  # Much faster fire rate
            else:
                player["ability_active"] = False

        if now - player["last_shot"] < fire_rate:
            return None
        player["last_shot"] = now
        player["aim"] = aim_angle

        # Create projectile
        shooter_x = player["x"]
        shooter_y = player["y"]
        shot_range = CHARACTERS[character_id]["range"]
        damage = CHARACTERS[character_id]["damage"]
        projectile_speed = 15

        # Sharpshot ability: enhanced shots
        if character_id == "sharpshot" and player.get("ability_shots_remaining", 0) > 0:
            damage *= 1.5
            projectile_speed = 25
            shot_range *= 1.3
            player["ability_shots_remaining"] -= 1
            if player["ability_shots_remaining"] <= 0:
                player["ability_active"] = False

        projectile_id = self.next_projectile_id
        self.next_projectile_id += 1

        projectile = {
            "id": projectile_id,
            "shooter_id": socket_id,
            "color": player["color"],
            "x": shooter_x + math.cos(aim_angle) * 30,
            "y": shooter_y + math.sin(aim_angle) * 30,
            "vx": math.cos(aim_angle) * projectile_speed,
            "vy": math.sin(aim_angle) * projectile_speed,
            "damage": damage,
            "max_distance": shot_range,
            "traveled": 0,
            "created_at": now
        }
        self.projectiles.append(projectile)

        return projectile

    def update_projectiles(self):
        """Update projectile positions and check for hits"""
        if not self.selected_map:
            return []

        hits = []
        projectiles_to_remove = []
        barriers_to_damage = []

        for proj in self.projectiles:
            # Move projectile
            proj["x"] += proj["vx"]
            proj["y"] += proj["vy"]
            proj["traveled"] += math.hypot(proj["vx"], proj["vy"])

            # Check if out of bounds or max distance
            if (proj["traveled"] >= proj["max_distance"] or
                proj["x"] < 0 or proj["x"] > self.selected_map.width or
                    proj["y"] < 0 or proj["y"] > self.selected_map.height):
                projectiles_to_remove.append(proj)
                continue

            # Check obstacle collisions
            obstacles = getattr(self.selected_map, 'obstacles', [])
            hit_obstacle = False
            for obstacle in obstacles:
                if self._check_obstacle_collision(proj["x"], proj["y"], 6, obstacle):
                    projectiles_to_remove.append(proj)
                    hit_obstacle = True
                    break

            if hit_obstacle:
                continue

            # Check barrier collisions
            hit_barrier = False
            for barrier in self.barriers:
                # Skip if this is the barrier owner's shot
                if barrier["owner_id"] == proj["shooter_id"]:
                    continue

                dx = barrier["x"] - proj["x"]
                dy = barrier["y"] - proj["y"]
                distance = math.hypot(dx, dy)

                if distance <= 40:  # Barrier hit radius
                    barrier["health"] -= proj["damage"]
                    projectiles_to_remove.append(proj)
                    hit_barrier = True
                    if barrier["health"] <= 0:
                        barriers_to_damage.append(barrier)
                    break

            if hit_barrier:
                continue

            # Check for player hits
            for pid, target in self.players.items():
                if pid == proj["shooter_id"] or not target.get("alive", True):
                    continue

                dx = target["x"] - proj["x"]
                dy = target["y"] - proj["y"]
                distance = math.hypot(dx, dy)

                if distance <= 20:  # Hit radius
                    target["health"] -= proj["damage"]

                    if target["health"] <= 0:
                        target["health"] = 0
                        target["alive"] = False
                        self.players[proj["shooter_id"]]["eliminations"] += 1
                        target["deaths"] += 1

                        hits.append({
                            "shooter_id": proj["shooter_id"],
                            "target_id": pid,
                            "eliminated": True
                        })
                    else:
                        hits.append({
                            "shooter_id": proj["shooter_id"],
                            "target_id": pid,
                            "eliminated": False,
                            "damage": proj["damage"]
                        })

                    projectiles_to_remove.append(proj)
                    break

        # Remove used projectiles
        for proj in projectiles_to_remove:
            if proj in self.projectiles:
                self.projectiles.remove(proj)

        # Remove destroyed barriers
        for barrier in barriers_to_damage:
            if barrier in self.barriers:
                self.barriers.remove(barrier)

        return hits

    def activate_ability(self, socket_id: str):
        """Activate player's character ability"""
        if socket_id not in self.players:
            return False

        player = self.players[socket_id]

        if player.get("ability_used") or not player.get("alive", True):
            return False

        character_id = player["character"]
        player["ability_used"] = True
        player["ability_active"] = True
        player["ability_start_time"] = time.time()

        if character_id == "sprinter":
            # Speed boost handled in update_player
            pass
        elif character_id == "sharpshot":
            player["ability_shots_remaining"] = 4
        elif character_id == "guardian":
            # Create barrier
            barrier_id = self.next_barrier_id
            self.next_barrier_id += 1

            # Place barrier 60 pixels in front of player
            barrier_x = player["x"] + math.cos(player["aim"]) * 60
            barrier_y = player["y"] + math.sin(player["aim"]) * 60

            barrier = {
                "id": barrier_id,
                "owner_id": socket_id,
                "x": barrier_x,
                "y": barrier_y,
                "health": 150,
                "max_health": 150,
                "created_at": time.time()
            }
            self.barriers.append(barrier)
        elif character_id == "blitzer":
            # Rapid fire handled in handle_shot
            pass
        elif character_id == "phase":
            # Phase shift - become intangible, pass through walls
            # Handled in update_player and projectile collision
            pass

        return True

    def check_round_over(self):
        """Check if only one player remains alive"""
        alive_players = [pid for pid, player in self.players.items() if player.get("alive", True)]
        return len(alive_players) <= 1

    def _respawn_player(self, socket_id: str):
        if not self.selected_map:
            return
        spawn = random.choice(self.selected_map.spawn_points)
        self.players[socket_id]["x"] = spawn["x"]
        self.players[socket_id]["y"] = spawn["y"]

    def get_state(self):
        map_data = None
        if self.selected_map:
            map_data = {
                "id": self.selected_map.map_id,
                "name": self.selected_map.name,
                "width": self.selected_map.width,
                "height": self.selected_map.height,
                "obstacles": self.selected_map.obstacles or [],
                "background_color": self.selected_map.background_color or "#12263a",
            }

        time_remaining = 0
        if self.round_start_time:
            elapsed = time.time() - self.round_start_time
            time_remaining = max(0, self.round_duration - elapsed)

        return {
            "room_code": self.room_id,
            "room_name": self.room_name,
            "players": [
                {
                    "id": pid,
                    "name": player["name"],
                    "x": player["x"],
                    "y": player["y"],
                    "aim": player["aim"],
                    "health": player["health"],
                    "max_health": player["max_health"],
                    "alive": player.get("alive", True),
                    "eliminations": player["eliminations"],
                    "deaths": player["deaths"],
                    "character": player["character"],
                    "color": player.get("color", "#ffffff"),
                    "ability_used": player.get("ability_used", False),
                    "ability_active": player.get("ability_active", False),
                }
                for pid, player in self.players.items()
            ],
            "projectiles": [
                {
                    "id": proj["id"],
                    "x": proj["x"],
                    "y": proj["y"],
                    "vx": proj["vx"],
                    "vy": proj["vy"],
                    "color": proj.get("color", "#fbbf24"),
                }
                for proj in self.projectiles
            ],
            "barriers": [
                {
                    "id": barrier["id"],
                    "x": barrier["x"],
                    "y": barrier["y"],
                    "health": barrier["health"],
                    "max_health": barrier["max_health"],
                }
                for barrier in self.barriers
            ],
            "round": self.current_round,
            "rounds_to_play": self.rounds_to_play,
            "time_remaining": int(time_remaining),
            "map": map_data,
            "round_start": self.round_start_time,
            "round_duration": self.round_duration,
            "game_started": self.game_started,
        }
