import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import itemsRouter from "./routes/items.routes.js";
dotenv.config();

const app = express();
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/items", itemsRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
