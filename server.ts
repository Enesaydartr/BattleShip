import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import * as path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/bot-move", async (req, res) => {
    try {
      const { board, difficulty } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      // Convert board to a readable format for Gemini
      let boardStr = "Board state (10x10):\n";
      for (let y = 0; y < 10; y++) {
        let row = "";
        for (let x = 0; x < 10; x++) {
          const cell = board[y][x];
          if (cell.isHit && cell.hasShip) row += "X "; // Hit ship
          else if (cell.isMiss) row += "O "; // Miss
          else row += ". "; // Unknown
        }
        boardStr += row.trim() + "\n";
      }

      const prompt = `You are playing Battleship. The board is 10x10.
Coordinates are x (0-9, left to right) and y (0-9, top to bottom).
. = Unknown
X = Hit ship
O = Miss

${boardStr}

Based on the board state, guess the best next coordinate to attack.
Respond ONLY with a JSON object containing x and y coordinates.
Example: {"x": 3, "y": 4}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response from Gemini");
      }

      const move = JSON.parse(text);
      res.json(move);
    } catch (error: any) {
      console.error("Error generating bot move:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
