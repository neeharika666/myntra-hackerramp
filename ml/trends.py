from flask import Flask, jsonify, request
import pandas as pd
from pymongo import MongoClient
import re

app = Flask(__name__)

# ================== Step 1: Connect to MongoDB ==================
client = MongoClient("mongodb://localhost:27017/")   # Update if using Atlas
db = client["myntra-clone"]   # database name
collection = db["products"]   # collection name

# Fetch data from MongoDB into DataFrame (keep _id)
cursor = collection.find({})
df = pd.DataFrame(list(cursor))

# ✅ Convert ObjectId to string
if "_id" in df.columns:
    df["_id"] = df["_id"].astype(str)

# ✅ Drop duplicates safely using stable identifiers
if not df.empty:
    df = df.drop_duplicates(subset=["title", "url"])

# Drop rows missing essential fields
df = df.dropna(subset=['title', 'initial_price', 'final_price', 'product_description', 'url'])

# Clean numeric columns
df['price'] = pd.to_numeric(df['final_price'].astype(str).str.replace(r'[^0-9.]', '', regex=True), errors='coerce')
df['mrp'] = pd.to_numeric(df['initial_price'].astype(str).str.replace(r'[^0-9.]', '', regex=True), errors='coerce')
df['discount'] = pd.to_numeric(df['discount'].astype(str).str.replace(r'[^0-9.]', '', regex=True), errors='coerce')

# ================== Step 2: Trending Logic ==================
def get_trending_products(top_n=10):
    """
    Simple heuristic: Trending = highest discount first,
    then lowest price (if tie).
    """
    if df.empty:
        return []

    df_ranked = df.sort_values(by=['discount', 'price'], ascending=[False, True])
    top_products = df_ranked.head(top_n).copy()

    # Add a dummy "score" since this is not similarity based
    top_products['score'] = 1.0  

    # Ensure all requested fields exist, fill missing with None
    for col in ['images']:
        if col not in top_products.columns:
            top_products[col] = None

    return top_products[
        ['_id', 'title', 'product_description', 'url',
         'initial_price', 'final_price', 'score', 'images']
    ].to_dict(orient="records")

# ================== Step 3: API Route ==================
@app.route("/trending", methods=["GET"])
def trending():
    top_n = int(request.args.get("n", 40))  # default 10 results
    results = get_trending_products(top_n)
    return jsonify({
        "count": len(results),
        "results": results
    })

# ================== Step 4: Run ==================
if __name__ == "__main__":
    app.run(debug=True, port=6001)  # ✅ different port than recommend.py
