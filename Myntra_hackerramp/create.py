import streamlit as st
import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier

# -----------------------------
# Load datasets
# -----------------------------
@st.cache_data
def load_data():
    fashion_df = pd.read_csv("custom_fashion_dataset.csv")
    myntra_df = pd.read_csv("myntra_products_catalog.csv", nrows=5000)  # limit for speed
    return fashion_df, myntra_df

fashion_df, myntra_df = load_data()

# -----------------------------
# Encode custom fashion dataset
# -----------------------------
label_encoders = {}
categorical_cols = ["top_color","bottom_color","dress_type","pattern",
                    "skin_tone","body_type","fabric","occasion"]

for col in categorical_cols:
    le = LabelEncoder()
    fashion_df[col+"_enc"] = le.fit_transform(fashion_df[col].astype(str))
    label_encoders[col] = le

# Train models
X = fashion_df[["top_color_enc","body_type_enc","skin_tone_enc"]]
y_bottom = fashion_df["bottom_color_enc"]
y_dress = fashion_df["dress_type_enc"]
y_pattern = fashion_df["pattern_enc"]
y_fabric = fashion_df["fabric_enc"]
y_occasion = fashion_df["occasion_enc"]

bottom_model = RandomForestClassifier(n_estimators=100, random_state=42).fit(X, y_bottom)
dress_model = RandomForestClassifier(n_estimators=100, random_state=42).fit(X, y_dress)
pattern_model = RandomForestClassifier(n_estimators=100, random_state=42).fit(X, y_pattern)
fabric_model = RandomForestClassifier(n_estimators=100, random_state=42).fit(X, y_fabric)
occasion_model = RandomForestClassifier(n_estimators=100, random_state=42).fit(X, y_occasion)

# Optional top model to predict top when only bottom is selected
top_model = RandomForestClassifier(n_estimators=100, random_state=42).fit(X, fashion_df["top_color_enc"])

# -----------------------------
# Multiple female users
# -----------------------------
users = {
    "alice": {
        "name": "Alice", "body_type": "hourglass", "skin_tone": "fair",
        "wardrobe": {
            "tops":["red top","mint top","white blouse","blue tank top","pink crop top"],
            "bottoms":["white skirt","denim jeans","black trousers","red pencil skirt"],
            "dresses":["floral maxi dress","a-line red dress","wrap dress","shift dress","bodycon dress",
                      "off-shoulder dress","shirt dress","sundress","evening gown"],
            "accessories":["necklace","bracelet","earrings","scarf","belt"]
        }
    },
    "sophia": {
        "name": "Sophia", "body_type": "pear", "skin_tone": "medium",
        "wardrobe": {
            "tops":["blue top","white linen shirt","yellow blouse","green tank top","striped shirt"],
            "bottoms":["black trousers","denim jeans","floral skirt","beige skirt"],
            "dresses":["bodycon dress","kurta","tunic","maxi dress","fit-and-flare dress",
                      "sheath dress","a-line dress","evening gown"],
            "accessories":["hat","sunglasses","belt","bracelet","necklace"]
        }
    },
    "emma": {
        "name": "Emma", "body_type": "apple", "skin_tone": "light",
        "wardrobe": {
            "tops":["purple blouse","white t-shirt","black crop top","red shirt","blue tank top"],
            "bottoms":["black jeans","denim skirt","white trousers","red skirt"],
            "dresses":["bodycon dress","shift dress","wrap dress","maxi dress","evening gown"],
            "accessories":["bracelet","necklace","watch","earrings"]
        }
    }
}

# -----------------------------
# Helper to add products
# -----------------------------
def add_to_wardrobe(user, product_name):
    product_name = product_name.lower()
    if "dress" in product_name or "kurta" in product_name or "tunic" in product_name:
        if product_name not in user["wardrobe"]["dresses"]:
            user["wardrobe"]["dresses"].append(product_name)
    elif "shirt" in product_name or "top" in product_name:
        if product_name not in user["wardrobe"]["tops"]:
            user["wardrobe"]["tops"].append(product_name)
    elif "jeans" in product_name or "trouser" in product_name or "skirt" in product_name:
        if product_name not in user["wardrobe"]["bottoms"]:
            user["wardrobe"]["bottoms"].append(product_name)
    else:
        if product_name not in user["wardrobe"]["accessories"]:
            user["wardrobe"]["accessories"].append(product_name)

# -----------------------------
# Recommend outfit
# -----------------------------
def recommend_outfit(user, selected_top=None, selected_bottom=None, selected_dress=None):
    try:
        top_enc = label_encoders["top_color"].transform([selected_top])[0] if selected_top else -1
    except:
        top_enc = -1
    try:
        body_enc = label_encoders["body_type"].transform([user['body_type']])[0]
        skin_enc = label_encoders["skin_tone"].transform([user['skin_tone']])[0]
    except:
        body_enc = skin_enc = -1

    # Predict top if only bottom is selected
    if not selected_top and selected_bottom:
        top_enc_pred = top_model.predict([[-1, body_enc, skin_enc]])[0]
        top = label_encoders["top_color"].inverse_transform([top_enc_pred])[0]
    else:
        top = selected_top if selected_top else "any top"

    # Bottom
    if not selected_bottom:
        bottom_enc = bottom_model.predict([[top_enc if top_enc!=-1 else 0, body_enc, skin_enc]])[0]
        bottom = label_encoders["bottom_color"].inverse_transform([bottom_enc])[0]
    else:
        bottom = selected_bottom

    # Dress
    if not selected_dress:
        dress_enc = dress_model.predict([[top_enc if top_enc!=-1 else 0, body_enc, skin_enc]])[0]
        dress = label_encoders["dress_type"].inverse_transform([dress_enc])[0]
    else:
        dress = selected_dress

    # Pattern, fabric, occasion
    pattern = label_encoders["pattern"].inverse_transform([pattern_model.predict([[top_enc if top_enc!=-1 else 0, body_enc, skin_enc]])[0]])[0]
    fabric = label_encoders["fabric"].inverse_transform([fabric_model.predict([[top_enc if top_enc!=-1 else 0, body_enc, skin_enc]])[0]])[0]
    occasion = label_encoders["occasion"].inverse_transform([occasion_model.predict([[top_enc if top_enc!=-1 else 0, body_enc, skin_enc]])[0]])[0]

    # Wardrobe check
    available = {"tops": [], "bottoms": [], "dresses": [], "accessories": []}
    missing = []

    if top != "any top" and any(top.lower() in t.lower() for t in user["wardrobe"]["tops"]):
        available["tops"].append(top)
    else:
        missing.append(top)
    if bottom and any(bottom.lower() in b.lower() for b in user["wardrobe"]["bottoms"]):
        available["bottoms"].append(bottom)
    else:
        missing.append(bottom)
    if dress and any(dress.lower() in d.lower() for d in user["wardrobe"]["dresses"]):
        available["dresses"].append(dress)
    else:
        missing.append(dress)

    available["accessories"] = user["wardrobe"]["accessories"][:3]

    # Myntra suggestions with proper matching
    keywords = [k.lower() for k in missing]
    mask = pd.Series(False, index=myntra_df.index)
    for k in keywords:
        for col in ["ProductName", "ProductBrand", "Category"]:
            if col in myntra_df.columns:
                mask |= myntra_df[col].str.lower().str.contains(k, na=False)

    matched_products = myntra_df[mask]

    if "ProductLink" not in matched_products.columns:
        matched_products["ProductLink"] = matched_products["ProductName"].apply(
            lambda x: f"https://www.myntra.com/{x.replace(' ', '-')}"
        )

    top_products = matched_products[["ProductName","ProductBrand","PrimaryColor","Price (INR)","ProductLink"]].head(5)

    outfit = f"Top: {top}, Bottom: {bottom}, Dress: {dress}, Pattern: {pattern}, Fabric: {fabric}, Occasion: {occasion}, Accessories: {', '.join(available['accessories'])}"

    return outfit, available, missing, top_products

# -----------------------------
# Streamlit UI
# -----------------------------
st.title("👗 AI Personal Stylist Demo")

user_id = st.sidebar.selectbox("Select User", list(users.keys()))
user = users[user_id]
st.sidebar.markdown(f"**Logged in as:** {user['name']}")

st.subheader("Your Virtual Wardrobe")
st.json(user["wardrobe"])

# Select items
selected_top = st.selectbox("Pick a top (optional)", [""] + user["wardrobe"]["tops"])
selected_bottom = st.selectbox("Pick a bottom (optional)", [""] + user["wardrobe"]["bottoms"])
selected_dress = st.selectbox("Pick a dress (optional)", [""] + user["wardrobe"]["dresses"])

# Add new dress
new_dress = st.text_input("Or add a new dress to your wardrobe")
if new_dress:
    if st.button(f"Add '{new_dress}' to wardrobe"):
        add_to_wardrobe(user, new_dress)
        st.success(f"'{new_dress}' added to your wardrobe!")

# Get recommendation
if st.button("Get Outfit Recommendation"):
    outfit, available, missing, suggestions = recommend_outfit(
        user,
        selected_top.lower() if selected_top else None,
        selected_bottom.lower() if selected_bottom else None,
        selected_dress.lower() if selected_dress else None
    )

    st.subheader("👕 Suggested Outfit")
    st.write(outfit)

    st.subheader("✅ Available in Wardrobe")
    st.json(available)

    st.subheader("❌ Missing Items")
    st.write(missing)

    if not suggestions.empty:
        st.subheader("🛍 Product Suggestions from Myntra")
        for i, row in suggestions.iterrows():
            st.markdown(f"- [{row['ProductName']}]({row['ProductLink']}) | {row['ProductBrand']} | {row['PrimaryColor']} | ₹{row['Price (INR)']}")
            if st.button(f"Add {row['ProductName']} to wardrobe", key=row['ProductName']):
                add_to_wardrobe(user, row['ProductName'])
                st.success(f"{row['ProductName']} added to your wardrobe!")
