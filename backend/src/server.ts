import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/users";
import bookRoutes from "./routes/books";
// Load environment variables from .env.local or .env
dotenv.config({ path: ".env.local" });

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/books", bookRoutes);

app.get("/", (req, res) => {
  res.send("📚 Bookly API is running!");
});

app.use((err: any, req: any, res: any, next: any) => {
  console.error("❌ Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
