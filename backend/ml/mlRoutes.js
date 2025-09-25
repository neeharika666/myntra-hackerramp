// routes/recommend.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Ensure uploads folder exists
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Multer storage to save files on disk
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, '_'); // replace spaces
    cb(null, `${timestamp}_${safeName}`);
  },
});

const upload = multer({ storage });

// Route: handle person + outfit images
router.post('/virtual-try', upload.any(), async (req, res) => {
  try {
    const { body_type, body_weight, body_height, angle, product_id } = req.body;

    // Check person image exists
    const personFile = req.files.find(f => f.fieldname === 'person_image');
    if (!personFile) return res.status(400).json({ error: 'Person image is required' });

    // All other files are outfits/products (one image per dress)
    const outfitFiles = req.files.filter(f => f.fieldname !== 'person_image');
    if (!outfitFiles.length) return res.status(400).json({ error: 'At least one outfit image is required' });

    // Create FormData to send to Flask
    const form = new FormData();
    form.append('body_type', body_type);
    form.append('body_weight', body_weight);
    form.append('body_height', body_height);
    form.append('angle', angle);
    form.append('product_id', product_id);

    // Append person image
    form.append('person_image', fs.createReadStream(personFile.path));

    // Append outfit images with field names like outfit_image_0, outfit_image_1, ...
    outfitFiles.forEach((file, i) => {
      form.append(`outfit_image_${i}`, fs.createReadStream(file.path));
    });

    // Send to Flask backend
    const flaskRes = await axios.post('http://localhost:6090/generate', form, {
      headers: form.getHeaders(),
      responseType: 'arraybuffer', // to handle image buffer
    });

    // Save the generated image locally
    const outputPath = path.join(UPLOAD_DIR, `generated_${Date.now()}.png`);
    fs.writeFileSync(outputPath, flaskRes.data);

    res.json({
      message: 'Images stored and sent to Flask successfully',
      generated_image: `/ml/uploads/${path.basename(outputPath)}`,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});




router.post("/", async (req, res) => {
  try {
    const { city } = req.body;
    console.log("City:", city);

    // Call Flask service
    const response = await axios.post(
      "http://127.0.0.1:5000/recommendations",
      { city }
    );

    // Send only the data from Flask (plain JSON)
    res.json(response.data);
  } catch (error) {
    console.error("Error calling Flask:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
});


// Endpoint to handle file upload from frontend and forward to Flask




router.post("/trending", async (req, res) => {
  try {
    const { limit = 10 } = req.query; // default to 10 items if not passed
    console.log("i am in trending")
    // If you want trending from your Flask service:
    const response = await axios.get(`http://127.0.0.1:6001/trending?limit=${limit}`);

    // console.log("Trending products from Flask:", response.data);
    res.json(response.data);

    // OR, if you’re fetching from DB instead of Flask:
    // const products = await Product.find().sort({ popularity: -1 }).limit(Number(limit));
    // res.json({ products });

  } catch (error) {
    console.error("Error fetching trending products:", error.message);
    res.status(500).json({ error: "Failed to fetch trending products" });
  }
});

router.post("/colors", async (req, res) => {
  try {
    const { colors } = req.body;
    if (!colors || !Array.isArray(colors)) {
      return res.status(400).json({ error: "Please provide an array of colors" });
    }

    console.log("Received colors:", colors);

    // Call your Flask ML service
    const response = await axios.post("http://127.0.0.1:6010/map_colors", { colors });

    console.log("Response from ML model:", response.data);

    // Send the mapped colors back to frontend
    return res.json(response.data);

  } catch (error) {
    console.error("Error mapping colors:", error.message);
    res.status(500).json({ error: "Failed to map colors" });
  }
});

// export default router;
module.exports = router;
