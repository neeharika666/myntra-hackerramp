# ml_service_full.py

import os
import re
import json
from typing import Dict, Tuple, Optional
from functools import lru_cache
from flask import Flask, request, jsonify
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from flask_cors import CORS

# ==========================
# ColorMapper using Gemini ONLY
# ==========================
try:
    import google.generativeai as genai
    from google.generativeai.types import HarmCategory, HarmBlockThreshold
except ImportError:
    raise ImportError("google.generativeai is required. Install with `pip install google-generativeai`")

class ColorMapper:
    """Color mapper using Gemini API only."""
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("Gemini API key is required!")
        self.api_key = api_key
        self.model_name = "gemini-1.5-flash"
        self.model = None

        try:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel(
                model_name=self.model_name,
                generation_config={
                    "temperature": 0.1, "top_p": 0.9, "top_k": 40,
                    "response_mime_type": "text/plain"
                },
                safety_settings={
                    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                },
            )
        except Exception as e:
            raise RuntimeError(f"Gemini initialization failed: {e}")

    @lru_cache(maxsize=256)
    def map_color(self, color_name: str) -> Tuple[str, str]:
        if not color_name.strip():
            return ("Unknown", "#808080")
        try:
            prompt = f"""
            Standardize this color name into a JSON object:
            - family: color family
            - hex: approximate HEX code
            Color name: "{color_name}"
            Example: {{"family": "Blue", "hex": "#0000FF"}}
            """
            response = self.model.generate_content(prompt)
            text = self._clean_response(response.text)
            data = json.loads(text)
            return (data.get("family", "Other"), data.get("hex", "#808080"))
        except Exception as e:
            raise RuntimeError(f"Gemini error during map_color: {e}")

    @lru_cache(maxsize=256)
    def map_all_tags(self, description: str) -> Dict[str, str]:
        if not description.strip():
            return {"color": "Unknown", "style": "Casual", "season": "All-season"}
        try:
            prompt = f"""
            Extract tags from this clothing description. Respond JSON: color, style, season
            Example: {{"color": "Blue", "style": "Casual", "season": "Summer"}}
            Description: "{description}"
            """
            response = self.model.generate_content(prompt)
            text = self._clean_response(response.text)
            return json.loads(text)
        except Exception as e:
            raise RuntimeError(f"Gemini error during map_all_tags: {e}")

    def _clean_response(self, text: str) -> str:
        if not text:
            return "{}"
        text = text.strip()
        if text.startswith("```"):
            text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
            text = re.sub(r"\n?```$", "", text).strip()
        return text

# ==========================
# Singleton for mapper
# ==========================
_color_mapper: Optional[ColorMapper] = None
def initialize_color_mapper(api_key: str):
    global _color_mapper
    if _color_mapper is None:
        _color_mapper = ColorMapper(api_key=api_key)

def map_color(color_name: str) -> Tuple[str, str]:
    if _color_mapper is None:
        raise RuntimeError("ColorMapper not initialized")
    return _color_mapper.map_color(color_name)

def map_all_tags(description: str) -> Dict[str, str]:
    if _color_mapper is None:
        raise RuntimeError("ColorMapper not initialized")
    return _color_mapper.map_all_tags(description)

# ==========================
# Flask + MongoDB + Semantic Search
# ==========================
app = Flask(__name__)
CORS(app)

# Initialize Gemini
GEMINI_API_KEY = "AIzaSyAVrNVz8kvGDKTijqrGWio0HU9F6sQkaw8"  # <-- Replace this
initialize_color_mapper(api_key=GEMINI_API_KEY)

# MongoDB
MONGO_URI = "mongodb://localhost:27017"  # Directly without .env
client = MongoClient(MONGO_URI)
db = client["myntra_db"]
products_collection = db["products"]

# Sentence Transformer
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def embed_text(text: str) -> np.ndarray:
    return embedding_model.encode([text])[0]

# ==========================
# Endpoints
# ==========================
@app.route("/map_colors", methods=["POST"])
def map_colors_route():
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
    data = request.get_json()
    description = data.get("description", "")
    if not isinstance(description, str):
        return jsonify({"error": "Description must be a string"}), 400
    tags = map_all_tags(description)
    return jsonify(tags)

@app.route("/semantic_search", methods=["POST"])
def semantic_search():
    data = request.get_json()
    query = data.get("query", "")
    top_k = int(data.get("top_k", 5))
    if not query:
        return jsonify({"error": "Query is required"}), 400

    query_vec = embed_text(query)
    products = list(products_collection.find())
    results = []
    product_vecs = []

    for prod in products:
        desc = prod.get("description", "")
        vec = embed_text(desc)
        product_vecs.append(vec)
        results.append({
            "name": prod.get("name", ""),
            "description": desc,
            "color": map_all_tags(desc).get("color"),
            "style": map_all_tags(desc).get("style"),
            "season": map_all_tags(desc).get("season")
        })

    similarities = cosine_similarity([query_vec], product_vecs)[0]
    for i, score in enumerate(similarities):
        results[i]["score"] = float(score)

    results = sorted(results, key=lambda x: x["score"], reverse=True)[:top_k]
    return jsonify(results)

if __name__ == "__main__":
    app.run(port=6010, debug=True)
