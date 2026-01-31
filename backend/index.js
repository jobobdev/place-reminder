// backend/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import placeRoutes from "./routes/placeRoutes.js";

dotenv.config();
const app = express();

const allowedOrigins = [
  "https://gooooooood.site",
  "https://www.goooooood.site",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // origin이 없는 요청(예: curl, health check)은 허용
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

// MongoDB 연결
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// 라우터 등록
app.use("/places", placeRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
