from flask import Flask, jsonify, request
import pandas as pd
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer, util
import spacy

app = Flask(__name__)  # fix: __name__

# ================== Step 1: Connect to MongoDB ==================
client = MongoClient("mongodb://localhost:27017/")  # Update if using Atlas
db = client["myntra-clone"]  # database name

# ================== Step 2: Load Models ==================
nlp = spacy.load("en_core_web_sm")  # for keyword extraction
model = SentenceTransformer('all-MiniLM-L6-v2')  # for semantic search

# ================== Step 3: Helper Functions ==================
def get_trending_products(top_n=10):
    cursor = db["products"].find({})
    df = pd.DataFrame(list(cursor))
    if df.empty:
        return []

    df["_id"] = df["_id"].astype(str)
    df = df.drop_duplicates(subset=["title", "url"])
    df = df.dropna(subset=['title', 'initial_price', 'final_price', 'product_description', 'url'])

    df['price'] = pd.to_numeric(df['final_price'].astype(str).str.replace(r'[^0-9.]', '', regex=True), errors='coerce')
    df['mrp'] = pd.to_numeric(df['initial_price'].astype(str).str.replace(r'[^0-9.]', '', regex=True), errors='coerce')
    df['discount'] = pd.to_numeric(df['discount'].astype(str).str.replace(r'[^0-9.]', '', regex=True), errors='coerce')

    df_ranked = df.sort_values(by=['discount', 'price'], ascending=[False, True])
    top_products = df_ranked.head(top_n).copy()
    top_products['score'] = 1.0

    if 'images' not in top_products.columns:  # fix: indentation
        top_products['images'] = None

    return top_products[['_id', 'title', 'product_description', 'url',
                         'initial_price', 'final_price', 'score', 'images']].to_dict(orient="records")


def get_trending_insta(top_n=10):
    cursor = db["instagram_posts"].find({})
    df = pd.DataFrame(list(cursor))
    if df.empty:
        return []

    df["_id"] = df["_id"].astype(str)
    df = df.drop_duplicates(subset=["username", "post_url"])
    df = df.dropna(subset=['username', 'post_url', 'caption', 'likes'])
    df['likes'] = pd.to_numeric(df['likes'], errors='coerce')

    df_ranked = df.sort_values(by='likes', ascending=False)
    top_posts = df_ranked.head(top_n).copy()
    top_posts['score'] = 1.0

    if 'images' not in top_posts.columns:  # fix: indentation
        top_posts['images'] = None

    return top_posts[['_id', 'username', 'caption', 'post_url', 'likes', 'score', 'images']].to_dict(orient="records")


def extract_keywords(captions):
    """
    Extract fashion-related keywords from captions using spaCy.
    """
    fashion_keywords = []
    fashion_terms = ["dress", "makeup", "jewellery", "shoes", "bag", "fashionista", "outfit", "style"]

    for caption in captions:
        doc = nlp(caption.lower())
        for token in doc:
            if token.lemma_ in fashion_terms:
                fashion_keywords.append(token.lemma_)
    return list(set(fashion_keywords))


def semantic_search_products(keywords, top_n=10):
    """
    Perform semantic search on Myntra products based on keywords.
    """
    if not keywords:
        return []

    keyword_text = " ".join(keywords)
    query_embedding = model.encode(keyword_text, convert_to_tensor=True)

    cursor = db["products"].find({})
    products = list(cursor)
    if not products:
        return []

    product_texts = [p['title'] + " " + p.get('product_description', '') for p in products]
    embeddings = model.encode(product_texts, convert_to_tensor=True)

    cos_scores = util.cos_sim(query_embedding, embeddings)[0]
    top_results = cos_scores.topk(top_n)
    results = [products[idx] for idx in top_results[1]]
    # Convert ObjectId to string
    for r in results:
        r["_id"] = str(r["_id"])
    return results


# ================== Step 4: API Routes ==================
@app.route("/trending_insta", methods=["GET"])
def trending():
    top_n = int(request.args.get("n", 10))
    results = get_trending_products(top_n)
    return jsonify({"count": len(results), "results": results})


@app.route("/trending", methods=["GET"])
def trending_insta():
    top_n = int(request.args.get("n", 10))
    results = get_trending_insta(top_n)
    print(results)
    return jsonify({"count": len(results), "results": results})


@app.route("/trending_fashion", methods=["GET"])
def trending_fashion():
    top_n = int(request.args.get("n", 10))
    cursor = db["instagram_posts"].find({})
    df_insta = pd.DataFrame(list(cursor))
    if df_insta.empty:
        return jsonify({"count": 0, "keywords": [], "results": []})

    captions = df_insta['caption'].dropna().tolist()
    keywords = extract_keywords(captions)
    if not keywords:
        return jsonify({"count": 0, "keywords": [], "results": []})

    results = semantic_search_products(keywords, top_n=top_n)
    return jsonify({"count": len(results), "keywords": keywords, "results": results})


# ================== Step 5: Run Flask ==================
if __name__ == "__main__":  # fix: __name__ and "__main__"
    app.run(debug=True, port=6001)
