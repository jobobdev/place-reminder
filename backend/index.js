import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import placeRoutes from "./routes/placeRoutes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// MongoDB 연결
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// 라우터 등록
app.use("/places", placeRoutes);

const PORT = process.env.PORT || 3000;
app.listen(process.env.PORT, () => {
  console.log("Server running on port", process.env.PORT);
});
