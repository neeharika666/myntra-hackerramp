import React, { useState } from "react";
// import { mapColors } from "../../services/colorService"; // <-- Correct path
import { mapColors } from "../../services/colourService";
const ColorMapper = () => {
  const [inputColors, setInputColors] = useState("");
  const [mappedColors, setMappedColors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    const colorsArray = inputColors
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    if (colorsArray.length === 0) return;

    const results = await mapColors(colorsArray); // Calls backend at 5003
    setMappedColors(results);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      <h2>Color Mapper</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Enter colors separated by commas"
          value={inputColors}
          onChange={(e) => setInputColors(e.target.value)}
          style={{ width: "80%", padding: "8px" }}
        />
        <button type="submit" style={{ padding: "8px 16px", marginLeft: "10px" }}>
          Map Colors
        </button>
      </form>

      {Object.keys(mappedColors).length > 0 && (
        <div>
          <h3>Mapped Colors:</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Original</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Family</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Hex</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Preview</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(mappedColors).map(([color, data]) => (
                <tr key={color}>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>{color}</td>
                  {data ? (
                    <>
                      <td style={{ border: "1px solid #ccc", padding: "8px" }}>{data.family}</td>
                      <td style={{ border: "1px solid #ccc", padding: "8px" }}>{data.hex}</td>
                      <td
                        style={{
                          border: "1px solid #ccc",
                          padding: "8px",
                          backgroundColor: data.hex,
                          width: "50px",
                        }}
                      ></td>
                    </>
                  ) : (
                    <td colSpan="3" style={{ border: "1px solid #ccc", padding: "8px" }}>
                      Failed to map
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ColorMapper;
