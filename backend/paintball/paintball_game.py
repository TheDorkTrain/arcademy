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


CHARACTERS = {
    "sprinter": {
        "name": "Sprinter",
        "ability": "Speed Boost",
        "speed": 4.6,
        "fire_rate": 0.55,
        "range": 420,
    },
    "guardian": {
        "name": "Guardian",
        "ability": "Shield Wall",
        "speed": 3.8,
        "fire_rate": 0.7,
        "range": 480,
    },
    "sharpshot": {
        "name": "Sharpshot",
        "ability": "Long Range",
        "speed": 4.0,
        "fire_rate": 0.85,
        "range": 560,
    },
    "blitzer": {
        "name": "Blitzer",
        "ability": "Rapid Fire",
        "speed": 4.1,
        "fire_rate": 0.4,
        "range": 380,
    },
}


def load_maps():
    maps_dir = os.path.join(os.path.dirname(__file__), "Maps")
    maps = []
    if os.path.isdir(maps_dir):
        for filename in sorted(os.listdir(maps_dir)):
            if not filename.endswith(".json"):
                continue
            file_path = os.path.join(maps_dir, filename)
            with open(file_path, "r", encoding="utf-8") as map_file:
                data = json.load(map_file)
            maps.append(
                MapConfig(
                    map_id=data["map_id"],
                    name=data["name"],
                    width=data["width"],
                    height=data["height"],
                    spawn_points=data["spawn_points"],
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
        self.round_duration = 90
        self.round_start_time: Optional[float] = None
        self.round_timer = None
        self.map_votes: Dict[str, str] = {}
        self.selected_map: Optional[MapConfig] = None
        self.match_results: List[Dict] = []

    def add_player(self, socket_id: str, name: str, position: int = 0):
        if socket_id in self.players:
            return False
        character_id = "sprinter"
        self.players[socket_id] = {
            "name": name,
            "position": position,
            "character": character_id,
            "eliminations": 0,
            "deaths": 0,
            "x": 0,
            "y": 0,
            "aim": 0.0,
            "last_shot": 0.0,
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
            self.players[socket_id]["x"] = spawn["x"]
            self.players[socket_id]["y"] = spawn["y"]
            self.players[socket_id]["aim"] = 0.0

    def _reset_scores(self):
        for player in self.players.values():
            player["eliminations"] = 0
            player["deaths"] = 0
            player["last_shot"] = 0.0

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
        self.match_results.append({
            "round": self.current_round,
            "winner": winner,
            "scores": scores_sorted,
        })
        self.round_start_time = None
        return winner, scores_sorted

    def advance_round(self):
        if self.current_round >= self.rounds_to_play:
            self.game_started = False
            return False
        self.current_round += 1
        self._spawn_players()
        self._reset_scores()
        self._start_round_timer()
        return True

    def update_player(self, socket_id: str, move_x: float, move_y: float):
        if socket_id not in self.players or not self.selected_map:
            return
        character_id = self.players[socket_id]["character"]
        speed = CHARACTERS[character_id]["speed"]
        x = self.players[socket_id]["x"] + move_x * speed
        y = self.players[socket_id]["y"] + move_y * speed
        x = max(30, min(self.selected_map.width - 30, x))
        y = max(30, min(self.selected_map.height - 30, y))
        self.players[socket_id]["x"] = x
        self.players[socket_id]["y"] = y

    def update_aim(self, socket_id: str, aim_angle: float):
        if socket_id in self.players:
            self.players[socket_id]["aim"] = aim_angle

    def handle_shot(self, socket_id: str, aim_angle: float):
        if socket_id not in self.players:
            return None
        now = time.time()
        player = self.players[socket_id]
        character_id = player["character"]
        fire_rate = CHARACTERS[character_id]["fire_rate"]
        if now - player["last_shot"] < fire_rate:
            return None
        player["last_shot"] = now
        player["aim"] = aim_angle
        shooter_x = player["x"]
        shooter_y = player["y"]
        shot_range = CHARACTERS[character_id]["range"]
        hit_target = None
        for pid, target in self.players.items():
            if pid == socket_id:
                continue
            dx = target["x"] - shooter_x
            dy = target["y"] - shooter_y
            distance = math.hypot(dx, dy)
            if distance > shot_range:
                continue
            angle_to_target = math.atan2(dy, dx)
            angle_diff = abs((aim_angle - angle_to_target + math.pi) % (2 * math.pi) - math.pi)
            if angle_diff <= math.radians(18):
                hit_target = pid
                break
        if hit_target:
            player["eliminations"] += 1
            self.players[hit_target]["deaths"] += 1
            self._respawn_player(hit_target)
        return hit_target

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
            }
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
                    "eliminations": player["eliminations"],
                    "deaths": player["deaths"],
                    "character": player["character"],
                }
                for pid, player in self.players.items()
            ],
            "round": self.current_round,
            "rounds_to_play": self.rounds_to_play,
            "map": map_data,
            "round_start": self.round_start_time,
            "round_duration": self.round_duration,
            "game_started": self.game_started,
        }
