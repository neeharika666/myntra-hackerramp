# main.py

import os
import re
import math
import pandas as pd
import numpy as np
import torch
from sentence_transformers import SentenceTransformer, util
from pymongo import MongoClient
import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# ======================
# Environment and Gemini
# ======================
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# ======================
# MongoDB setup
# ======================
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = "myntra-clone"
COLLECTION_NAME = "products"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

# ======================
# Load products from MongoDB
# ======================
def load_products():
    products = list(collection.find({}))
    df = pd.DataFrame(products)

    if "_id" in df.columns:
        df["_id"] = df["_id"].astype(str)

    df = df.drop_duplicates(subset=["title", "url"])
    df = df.dropna(subset=['title', 'initial_price', 'final_price', 'product_description', 'url'])

    df['price'] = pd.to_numeric(
        df['final_price'].astype(str).str.replace(r'[^0-9.]', '', regex=True),
        errors='coerce'
    )
    df['mrp'] = pd.to_numeric(
        df['initial_price'].astype(str).str.replace(r'[^0-9.]', '', regex=True),
        errors='coerce'
    )
    df['discount'] = pd.to_numeric(
        df.get('discount', pd.Series([0]*len(df))).astype(str).str.replace(r'[^0-9.]', '', regex=True),
        errors='coerce'
    )

    return df

df = load_products()

# ======================
# Load semantic search model
# ======================
model = SentenceTransformer('all-MiniLM-L6-v2')
descriptions = df['product_description'].astype(str).tolist()
description_embeddings = model.encode(descriptions, convert_to_tensor=True)

# ======================
# Gemini API call
# ======================
def get_gemini_fashion_weather(city: str) -> str:
    prompt = f"""
    Provide insights for festive fashion and weather in {city}.
    Structure the response in two sections exactly:

    Festive Fashion:
    (Write about popular festive clothing, trending colors, accessories, styles currently presently.)

    Weather:
    (Write about the current weather conditions and suitable fabrics to wear currently presently.)
    """
    gem_model = genai.GenerativeModel("gemini-1.5-flash")
    response = gem_model.generate_content(prompt)
    return response.text.strip() if response and response.text else ""

# ======================
# Semantic search returning full product data
# ======================
def recommend_products_from_keywords(keywords, top_n=50):
    if not keywords:
        return []

    query_text = " ".join(keywords)
    query_embedding = model.encode(query_text, convert_to_tensor=True)
    cos_scores = util.cos_sim(query_embedding, description_embeddings)[0]
    top_results = torch.topk(cos_scores, k=min(top_n, len(descriptions)))

    products = []
    for idx in top_results.indices:
        idx = int(idx)
        product = df.iloc[idx].to_dict()

        # Convert NumPy / Pandas types to native Python types
        for k, v in product.items():
            if isinstance(v, (np.integer, np.floating)):
                product[k] = v.item()
            elif isinstance(v, (pd.Timestamp, pd.Timedelta)):
                product[k] = str(v)
            elif isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
                product[k] = None

        products.append(product)
    return products

# ======================
# Keyword lists
# ======================
fashion_keywords = ["saree", "lehenga", "anarkali", "sharara", "kurta", "choli",
                    "dhoti", "pyjama", "sherwani", "bandhgala", "dress", "gown"]
colors = ["red", "green", "blue", "yellow", "pink", "white", "gold", "orange",
          "maroon", "purple", "mustard", "emerald"]
accessories = ["bangles", "jhumkas", "clutches", "necklaces", "bindis", "earrings",
               "rings", "bracelet", "watch", "purse"]
weather_keywords = ["cotton", "linen", "georgette", "chiffon", "lightweight", "breathable",
                    "silk", "wool", "summer", "winter", "rain", "humid", "evening wear"]

# ======================
# Flask app
# ======================
app = Flask(__name__)
CORS(app)

# ----------------------
# Clean JSON utility
# ----------------------
def clean_json(obj):
    if isinstance(obj, dict):
        return {k: clean_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_json(v) for v in obj]
    elif isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    elif isinstance(obj, (np.integer, np.floating)):
        return obj.item()
    elif isinstance(obj, (pd.Timestamp, pd.Timedelta)):
        return str(obj)
    else:
        return obj

# ----------------------
# Recommendations route
# ----------------------
@app.route("/recommendations", methods=["POST"])
def get_recommendations():
    data = request.json
    city = data.get("city", "Delhi")

    # Gemini response
    gemini_text = get_gemini_fashion_weather(city)
    sections = re.split(r'Weather:', gemini_text, flags=re.IGNORECASE)
    fashion_text = sections[0].replace("Festive Fashion:", "").strip()
    weather_text = sections[1].strip() if len(sections) > 1 else ""

    # Extract keywords
    keywords_found = [kw for kw in fashion_keywords if re.search(r'\b' + kw + r's?\b', fashion_text, re.IGNORECASE)]
    colors_found = [color for color in colors if re.search(r'\b' + color + r'\b', fashion_text, re.IGNORECASE)]
    accessories_found = [acc for acc in accessories if re.search(r'\b' + acc + r's?\b', fashion_text, re.IGNORECASE)]
    search_keywords = list(set(keywords_found + colors_found + accessories_found))

    weather_found = [wk for wk in weather_keywords if re.search(r'\b' + wk + r's?\b', weather_text, re.IGNORECASE)]

    # Semantic search returning full product info
    festive_products = recommend_products_from_keywords(search_keywords, top_n=50)
    weather_products = recommend_products_from_keywords(weather_found, top_n=50)

    # Clean data for JSON
    # response_data = clean_json()

    return jsonify({
        "city": city,
        "festive_products": festive_products,
        "weather_products": weather_products,
        "fashion_text": fashion_text,
        "weather_text": weather_text
    })

# ======================
# Run Flask
# ======================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)
