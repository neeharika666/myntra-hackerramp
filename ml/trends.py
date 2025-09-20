# Step 0: Install dependencies
!pip install -q sentence-transformers requests beautifulsoup4 pandas torch

# Step 1: Import libraries
import pandas as pd
from sentence_transformers import SentenceTransformer, util
import torch
import requests
from bs4 import BeautifulSoup
import re

# Step 2: Load CSV directly from /content/
csv_filename = "/content/Myntra products .csv"  # Update path if needed
df = pd.read_csv(csv_filename)

# Step 3: Clean CSV
df = df.drop_duplicates()
df = df.dropna(subset=['title', 'initial_price', 'final_price', 'product_description', 'url'])

df['price'] = pd.to_numeric(df['final_price'].astype(str).str.replace(r'[^0-9.]', '', regex=True), errors='coerce')
df['mrp'] = pd.to_numeric(df['initial_price'].astype(str).str.replace(r'[^0-9.]', '', regex=True), errors='coerce')
df['discount'] = pd.to_numeric(df['discount'].astype(str).str.replace(r'[^0-9.]', '', regex=True), errors='coerce')

print("✅ CSV Loaded and Cleaned")
print(df[['title', 'price', 'mrp', 'discount', 'url']].head())

# Step 4: Load semantic search model
model = SentenceTransformer('all-MiniLM-L6-v2')
descriptions = df['product_description'].astype(str).tolist()
description_embeddings = model.encode(descriptions, convert_to_tensor=True)

# Step 5: Web scrape Pinterest trending pins for keywords
def get_pinterest_keywords(board_url="https://in.pinterest.com/"):  # Pinterest home for India
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }
    try:
        response = requests.get(board_url, headers=headers)
        soup = BeautifulSoup(response.text, "html.parser")

        # Extract all pin descriptions
        pins = soup.find_all("meta", {"property":"og:description"})
        text = " ".join([p.get("content", "") for p in pins]).lower()

        # Split into words, remove punctuation
        words = re.findall(r'\b[a-z]+\b', text)
        keywords = list(set(words))
        return keywords
    except Exception as e:
        print("Error scraping Pinterest:", e)
        return []

# Step 6: Get Pinterest keywords dynamically
pinterest_keywords = get_pinterest_keywords()
print("\n🔥 Pinterest Keywords Found:", pinterest_keywords[:50])

# Step 7: Semantic search against CSV
query_text = " ".join(pinterest_keywords)
query_embedding = model.encode(query_text, convert_to_tensor=True)
cos_scores = util.cos_sim(query_embedding, description_embeddings)[0]

# Step 8: Add scores to dataframe and rank
df['score'] = cos_scores.cpu().numpy()
df_ranked = df.sort_values(by='score', ascending=False).reset_index(drop=True)

# Step 9: Show top products
top_n = 20
top_products = df_ranked.head(top_n)
print("\n=== Top Products from Database ===")
print(top_products[['title', 'price', 'discount', 'score', 'url']])
