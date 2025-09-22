
// src/pages/userservices/colorService.js
import axios from "axios";

const BASE_URL = "http://127.0.0.1:6010";

export const mapColors = async (colors) => {
  try {
    const response = await axios.post(`${BASE_URL}/map_colors`, { colors });
    return response.data;
  } catch (err) {
    console.error("Error mapping colors:", err);
    throw err;
  }
};

export const mapTags = async (description) => {
  try {
    const response = await axios.post(`${BASE_URL}/map_tags`, { description });
    return response.data;
  } catch (err) {
    console.error("Error mapping tags:", err);
    throw err;
  }
};
