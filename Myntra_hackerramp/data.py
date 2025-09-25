import pandas as pd
import json

# -----------------------------
# Fashion-rule aware mappings
# -----------------------------
top_colors_map = {
    "fair": ["pink", "mint", "light yellow", "white", "peach"],
    "medium": ["blue", "beige", "purple", "lavender", "coral"],
    "dark": ["red", "green", "navy", "black", "orange"]
}

bottom_colors_map = {
    "pink": ["white", "beige"],
    "mint": ["white", "navy"],
    "light yellow": ["denim", "white"],
    "white": ["denim", "black"],
    "peach": ["beige", "brown"],
    "blue": ["white", "black"],
    "beige": ["brown", "navy"],
    "purple": ["black", "grey"],
    "lavender": ["white", "beige"],
    "coral": ["white", "denim"],
    "red": ["black", "white"],
    "green": ["beige", "brown"],
    "navy": ["white", "grey"],
    "black": ["grey", "white"],
    "orange": ["white", "beige"]
}

dress_type_map = {
    "hourglass": ["A-line", "Bodycon", "Fit-and-Flare"],
    "pear": ["Shift", "Fit-and-Flare", "Maxi"],
    "apple": ["Empire", "Sheath", "Bodycon"],
    "rectangle": ["Sheath", "Shift", "Ballgown"],
    "inverted_triangle": ["Mermaid", "Maxi", "Ballgown"]
}

pattern_map = {
    "hourglass": ["geometric", "abstract", "plain"],
    "pear": ["floral", "polka dots", "plain"],
    "apple": ["striped", "geometric", "plain"],
    "rectangle": ["bold", "stripes", "floral"],
    "inverted_triangle": ["paisley", "floral", "polka dots"]
}

fabrics_map = {
    "A-line": ["cotton", "linen"],
    "Bodycon": ["silk", "polyester"],
    "Fit-and-Flare": ["cotton", "chiffon"],
    "Shift": ["linen", "cotton"],
    "Maxi": ["silk", "chiffon"],
    "Ballgown": ["silk", "chiffon"],
    "Sheath": ["linen", "polyester"],
    "Mermaid": ["silk", "chiffon"],
    "Empire": ["cotton", "linen"]
}

accessories_list = ["necklace", "bracelet", "earrings", "belt", "sunglasses", "hat", "scarf"]
occasions_list = ["casual", "office", "formal", "party", "evening", "weekend"]

skin_tones = ["fair","medium","dark"]
body_types = ["hourglass","pear","apple","rectangle","inverted_triangle"]

# -----------------------------
# Generate deterministic dataset
# -----------------------------
dataset = []
entry_id = 1

for skin in skin_tones:
    for body in body_types:
        tops = top_colors_map[skin]
        dresses = dress_type_map[body]
        patterns = pattern_map[body]
        for top in tops:
            for bottom in bottom_colors_map[top]:
                for dress in dresses:
                    for pattern in patterns:
                        fabric = fabrics_map[dress][0]  # pick first fabric deterministically
                        accessories = accessories_list[:2]  # first two accessories
                        occasion = occasions_list[entry_id % len(occasions_list)]
                        recommended_outfit = f"{top} top with {bottom} bottom, {dress} dress with {pattern} pattern"
                        entry = {
                            "id": entry_id,
                            "top_color": top,
                            "bottom_color": bottom,
                            "dress_type": dress,
                            "pattern": pattern,
                            "skin_tone": skin,
                            "body_type": body,
                            "fabric": fabric,
                            "accessories": accessories,
                            "occasion": occasion,
                            "recommended_outfit": recommended_outfit
                        }
                        dataset.append(entry)
                        entry_id += 1

# -----------------------------
# Save dataset
# -----------------------------
df = pd.DataFrame(dataset)
df.to_csv("custom_fashion_dataset.csv", index=False)
with open("custom_fashion_dataset.json","w") as f:
    json.dump(dataset,f,indent=4)

print(f"Custom deterministic fashion dataset created with {len(dataset)} entries!")
