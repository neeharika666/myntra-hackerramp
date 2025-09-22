# ml_service.py
"""
Flask API service for color and clothing tag mapping using ColorMapper.
"""

import os
import re
import json
from typing import Dict, Tuple, Optional
from functools import lru_cache
from flask import Flask, request, jsonify

# ==========================
# ColorMapper implementation
# ==========================
try:
    import google.generativeai as genai
    from google.generativeai.types import HarmCategory, HarmBlockThreshold
except ImportError:
    genai = None


class ColorMapper:
    """Color mapper using Gemini API for intelligent color standardization."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.model_name = "gemini-1.5-flash"
        self.model = None

        if genai and self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel(
                    model_name=self.model_name,
                    generation_config={
                        "temperature": 0.1,
                        "top_p": 0.9,
                        "top_k": 40,
                        "response_mime_type": "text/plain",
                    },
                    safety_settings={
                        HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
                        HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                        HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                        HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                    },
                )
            except Exception as e:
                print(f"[WARN] Gemini init failed: {e}. Using fallback mapping.")
        else:
            print("[INFO] Gemini not available. Using fallback mapping.")

        # Fallback dictionary
        self.color_dict: Dict[str, Tuple[str, str]] = {
            "red": ("Red", "#FF0000"),
            "blue": ("Blue", "#0000FF"),
            "green": ("Green", "#008000"),
            "yellow": ("Yellow", "#FFFF00"),
            "orange": ("Orange", "#FFA500"),
            "purple": ("Purple", "#800080"),
            "pink": ("Pink", "#FFC0CB"),
            "brown": ("Brown", "#A52A2A"),
            "black": ("Black", "#000000"),
            "white": ("White", "#FFFFFF"),
            "grey": ("Grey", "#808080"),
            "gray": ("Grey", "#808080"),
        }

    @lru_cache(maxsize=256)
    def map_color(self, color_name: str) -> Tuple[str, str]:
        """Map a subjective color name to (family, hex)."""
        color_name = color_name.strip().lower()
        if not color_name:
            return ("Unknown", "#808080")

        for key, val in self.color_dict.items():
            if key in color_name:
                return val

        if not self.model:
            return ("Other", "#808080")

        try:
            prompt = f"""
            Standardize this color name into a JSON object:
            - family: one of {list(set(v[0] for v in self.color_dict.values()))}
            - hex: approximate HEX code
            Color name: "{color_name}"
            Example: {{"family": "Blue", "hex": "#0000FF"}}
            """
            response = self.model.generate_content(prompt)
            text = self._clean_response(response.text)
            data = json.loads(text)
            return (data.get("family", "Other"), data.get("hex", "#808080"))
        except Exception as e:
            print(f"[WARN] Gemini error: {e}")
            return ("Other", "#808080")

    @lru_cache(maxsize=256)
    def map_season(self, description: str) -> str:
        """Classify into season."""
        if not description.strip():
            return "Unknown"
        if not self.model:
            return "All-season"

        try:
            prompt = f"""
            Determine the season: Summer, Winter, Spring, Autumn.
            Respond with one word.
            Description: "{description}"
            """
            response = self.model.generate_content(prompt)
            text = self._clean_response(response.text)
            return text.strip().capitalize()
        except Exception as e:
            print(f"[WARN] Gemini error: {e}")
            return "All-season"

    @lru_cache(maxsize=256)
    def map_all_tags(self, description: str) -> Dict[str, str]:
        """Extract color, style, and season tags."""
        if not description.strip():
            return {"color": "Unknown", "style": "Casual", "season": "All-season"}
        if not self.model:
            return {"color": "Other", "style": "Casual", "season": "All-season"}

        try:
            prompt = f"""
            Extract tags from this clothing description.
            Respond JSON: color, style, season
            Example: {{"color": "Blue", "style": "Casual", "season": "Summer"}}
            Description: "{description}"
            """
            response = self.model.generate_content(prompt)
            text = self._clean_response(response.text)
            return json.loads(text)
        except Exception as e:
            print(f"[WARN] Gemini error: {e}")
            return {"color": "Other", "style": "Casual", "season": "All-season"}

    def _clean_response(self, text: str) -> str:
        """Remove markdown fences."""
        if not text:
            return "{}"
        text = text.strip()
        if text.startswith("```"):
            text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
            text = re.sub(r"\n?```$", "", text).strip()
        return text


# Singleton
_color_mapper: Optional[ColorMapper] = None


def initialize_color_mapper(api_key: Optional[str] = None):
    global _color_mapper
    if _color_mapper is None:
        _color_mapper = ColorMapper(api_key=api_key)


def map_color(color_name: str) -> Tuple[str, str]:
    if _color_mapper is None:
        initialize_color_mapper()
    return _color_mapper.map_color(color_name)


def map_season(description: str) -> str:
    if _color_mapper is None:
        initialize_color_mapper()
    return _color_mapper.map_season(description)


def map_all_tags(description: str) -> Dict[str, str]:
    if _color_mapper is None:
        initialize_color_mapper()
    return _color_mapper.map_all_tags(description)


# ==========================
# Flask API Service
# ==========================
app = Flask(__name__)
initialize_color_mapper()  # Initialize on startup

@app.route("/map_colors", methods=["POST"])
def map_colors_route():
    """Map a list of colors to standardized family and hex code."""
    data = request.get_json()
    colors = data.get("colors", [])
    if not isinstance(colors, list):
        return jsonify({"error": "Colors must be a list"}), 400

    results = {}
    for color in colors:
        family, hex_code = map_color(color)
        results[color] = {"family": family, "hex": hex_code}

    return jsonify(results)


@app.route("/map_tags", methods=["POST"])
def map_tags_route():
    """Map a clothing description to color, style, and season tags."""
    data = request.get_json()
    description = data.get("description", "")
    if not isinstance(description, str):
        return jsonify({"error": "Description must be a string"}), 400

    tags = map_all_tags(description)
    return jsonify(tags)


if __name__ == "__main__":
    app.run(port=6010, debug=True)
