# app.py
import os
from flask import Flask, request, jsonify, send_file
from PIL import Image
from io import BytesIO
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load API key
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY not found in .env") # Corrected variable name in error message

client = genai.Client(api_key=API_KEY)
app = Flask(__name__)

# Directories
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "outputs"))
os.makedirs(OUTPUT_DIR, exist_ok=True)

BASE_PROMPT = """
TASK: Generate a photorealistic image of a person wearing the garment.

INPUTS:
- Person image: USE ONLY THE FACE from this image. Do NOT modify it.
- Product image: USE ONLY THE CLOTHING from this image. Do NOT take any face or skin.

PERSON DETAILS:
- Body type: {body_type}
- Weight: {body_weight}
- Height: {body_height}

INSTRUCTIONS:
- Keep the person’s face exactly as in the person image.
- Composite the garment onto the body realistically according to measurements.
- Preserve hair, skin tone, and facial features.
- Maintain fabric texture, folds, and color from the product image.
- Angle: {angle_instructions} (FRONT or BACK)
- Output: clean, high-resolution PNG, studio-style, no text or watermarks.
"""

@app.route("/generate", methods=["POST"])
def generate():
    try:
        # Get form data
        body_type = request.form.get("body_type")
        body_weight = request.form.get("body_weight")
        body_height = request.form.get("body_height")
        angle = request.form.get("angle", "FRONT")
        product_id = request.form.get("product_id", "NA")

        # Validate person image
        if "person_image" not in request.files:
            return jsonify({"error": "Person image is required"}), 400
        person_file = request.files["person_image"]
        person_path = os.path.join(UPLOAD_DIR, person_file.filename)
        person_file.save(person_path)

        # Validate outfit image(s)
        outfit_files = [
            f for key, f in request.files.items() if key.startswith("outfit_image_")
        ]
        if not outfit_files:
            return jsonify({"error": "At least one outfit image is required"}), 400

        outfit_file = outfit_files[0]  # For now, just take first
        outfit_path = os.path.join(UPLOAD_DIR, outfit_file.filename)
        outfit_file.save(outfit_path)

        # Build prompt text
        prompt_text = BASE_PROMPT.format(
            body_type=body_type,
            body_weight=body_weight,
            body_height=body_height,
            angle_instructions=f"Show a clear {angle.upper()} view."
        )

        # Convert files and prompt to Gemini Parts
        with open(person_path, "rb") as f:
            # Correct: Pass data and mime_type as keyword arguments
            person_part = types.Part.from_bytes(data=f.read(), mime_type="image/jpeg")
        with open(outfit_path, "rb") as f:
            # Correct: Pass data and mime_type as keyword arguments
            outfit_part = types.Part.from_bytes(data=f.read(), mime_type="image/png")
        
        # CORRECTED: Pass ONLY the string variable 'prompt_text'
        prompt_part = types.Part.from_text(prompt_text)

        # Call Gemini API
        result = client.models.generate_content(
            model="gemini-2.5-flash-image-preview", 
            contents=[person_part, outfit_part, prompt_part]
        )

        # Extract generated image
        image_bytes = None
        if result.candidates and result.candidates[0].content.parts:
            for part in result.candidates[0].content.parts:
                if getattr(part, "inline_data", None):
                    image_bytes = part.inline_data.data
                    break

        if not image_bytes:
            rejection_reason = "No image returned."
            if result.candidates and result.candidates[0].finish_reason.name != "STOP":
                 rejection_reason = f"Generation failed: {result.candidates[0].finish_reason.name}"
            return jsonify({"error": rejection_reason}), 500

        # Save output
        output_filename = f"generated_{product_id}_{angle}.png"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        Image.open(BytesIO(image_bytes)).save(output_path)

        return send_file(output_path, mimetype="image/png")

    except Exception as e:
        print("ERROR:", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=6090, debug=True)