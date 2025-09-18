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
    console.log(response.data)
    res.json(response.data);
  } catch (error) {
    console.error("Error calling Flask:", error.message);
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
});

// export default router;
module.exports = router;

