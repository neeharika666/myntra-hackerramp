import pandas as pd
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer, util
from flask import Flask, request, jsonify

# ===========================
# Step 1: Connect to MongoDB
# ===========================
client = MongoClient("mongodb://localhost:27017/")  # Update if needed
db = client["myntra-clone"]
collection = db["products"]

# ===========================
# Step 2: Load data
# ===========================
data = list(collection.find({}))
if not data:
    print("⚠️ No documents found in MongoDB. Please insert data first.")
    exit()

df = pd.DataFrame(data)
print("✅ Columns in MongoDB:", df.columns.tolist())

# ===========================
# Step 3: Map columns
# ===========================
column_mapping = {
    'title': 'title',
    'product_description': 'product_description',
    'url': 'url',
    'initial_price': 'initial_price',
    'final_price': 'final_price'
}

valid_mapping = {k: v for k, v in column_mapping.items() if v in df.columns}
df = df.rename(columns=valid_mapping)
print("✅ Using columns:", df.columns.tolist())

required_cols = list(valid_mapping.keys())
df = df.dropna(subset=required_cols)
print(f"✅ {len(df)} products after dropping missing required fields.")

# ===========================
# Step 4: Build embeddings
# ===========================
model = SentenceTransformer('all-MiniLM-L6-v2')
df['combined_text'] = df['title'] + " " + df['product_description']
df['embedding'] = df['combined_text'].apply(lambda x: model.encode(x, convert_to_tensor=True))
print("✅ Embeddings generated for products:", len(df))

# ===========================
# Step 5: Recommendation function
# ===========================
def recommend_products(query, top_k=30):
    query_embedding = model.encode(query, convert_to_tensor=True)
    df['score'] = df['embedding'].apply(lambda emb: util.cos_sim(query_embedding, emb).item())
    results = df.sort_values(by='score', ascending=False).head(top_k)
    # Select columns to return
    results = results[['title', 'product_description', 'url', 'initial_price', 'final_price', 'score', "_id","images"]]
    results['_id'] = results['_id'].astype(str)  # Convert ObjectId to string for JSON
    return results

# ===========================
# Step 6: Flask API
# ===========================
app = Flask(__name__)

@app.route("/recommend", methods=["POST"])
def recommend_api():
    data = request.json
    keywords = data.get("keywords", [])
    top_k = int(data.get("top_n", 30))

    if not keywords:
        return jsonify({"error": "Missing keywords"}), 400

    # Combine keywords into single query string
    query_text = " ".join(keywords)
    results = recommend_products(query_text, top_k)

    return jsonify(results.to_dict(orient="records"))

# ===========================
# Step 7: Run Flask
# ===========================
if __name__ == "__main__":
    app.run(debug=True)
