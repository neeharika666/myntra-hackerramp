// routes/recommend.js
const express = require('express');
const axios = require('axios');


const router = express.Router();

// POST /api/recommend
router.post("/", async (req, res) => {
  try {
    const { keywords, top_n } = req.body;
    
    // Call Flask service
    const response = await axios.post("http://127.0.0.1:5000/recommend", {
      keywords,
      top_n
    });

    // Forward Python response to frontend
    console.log("this is reccomends backemd")
    // console.log(response.data)
    res.json(response.data);
  } catch (error) {
    console.error("Error calling Flask:", error.message);
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
});
router.post("/trending", async (req, res) => {
  try {
    const { limit = 10 } = req.query; // default to 10 items if not passed
    console.log("i am in trending")
    // If you want trending from your Flask service:
    const response = await axios.get(`http://127.0.0.1:6001/trending?limit=${limit}`);

    console.log("Trending products from Flask:", response.data);
    res.json(response.data);

    // OR, if you’re fetching from DB instead of Flask:
    // const products = await Product.find().sort({ popularity: -1 }).limit(Number(limit));
    // res.json({ products });

  } catch (error) {
    console.error("Error fetching trending products:", error.message);
    res.status(500).json({ error: "Failed to fetch trending products" });
  }
});

// export default router;
module.exports = router;

