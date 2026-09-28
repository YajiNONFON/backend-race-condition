import { Router } from "express";
import { asyncHandler } from "../../core/asyncHandler";
import {
  getAccount,
  seedAccount,
  withdrawBadHandler,
  withdrawGoodHandler,
} from "./controller";

export const raceConditionRouter = Router();

// Setup: create a test account with a starting balance.
raceConditionRouter.post("/seed", asyncHandler(seedAccount));

// Read: check the balance at any point (before/after the test).
raceConditionRouter.get("/accounts/:id", asyncHandler(getAccount));

// Both implementations, exposed side by side for live comparison.
raceConditionRouter.post("/bad/withdraw", asyncHandler(withdrawBadHandler));
raceConditionRouter.post("/good/withdraw", asyncHandler(withdrawGoodHandler));
