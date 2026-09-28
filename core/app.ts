import express from "express";
import { errorHandler } from "./errorHandler";
import { raceConditionRouter } from "../modules/race-condition/routes";

export const app = express();

app.use(express.json());

// Each module exposes its own router, mounted here under /api/concepts/<slug>.
// To add a new concept: create modules/<slug>/routes.ts and mount it here.
app.use("/api/concepts/race-condition", raceConditionRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Always last: catches every error forwarded by asyncHandler.
app.use(errorHandler);
