import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../core/prisma";
import { withdrawBad } from "./service.bad";
import { withdrawGood } from "./service.good";
import { NotFoundError } from "../../core/errors";

const withdrawSchema = z.object({
  accountId: z.string().uuid(),
  amount: z.number().int().positive(),
});

const seedSchema = z.object({
  ownerName: z.string().min(1),
  balance: z.number().int().nonnegative(),
});

export async function seedAccount(req: Request, res: Response) {
  const input = seedSchema.parse(req.body);
  const account = await prisma.account.create({
    data: { ownerName: input.ownerName, balance: input.balance },
  });
  res.status(201).json(account);
}

export async function getAccount(req: Request, res: Response) {
  const accountId = z.string().uuid().parse(req.params.id);
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) throw new NotFoundError("Account");
  res.json(account);
}

export async function withdrawBadHandler(req: Request, res: Response) {
  const input = withdrawSchema.parse(req.body);
  const account = await withdrawBad(input);
  res.json(account);
}

export async function withdrawGoodHandler(req: Request, res: Response) {
  const input = withdrawSchema.parse(req.body);
  const account = await withdrawGood(input);
  res.json(account);
}
