import { prisma } from "../../core/prisma";
import { InsufficientFundsError, NotFoundError } from "../../core/errors";
import { WithdrawInput } from "./types";

// FIX: check AND write in the SAME atomic SQL statement.
// Postgres guarantees no other query can interleave between the
// condition (balance >= amount) and the update itself: the database
// engine serializes concurrent access to the same row for us.
export async function withdrawGood({ accountId, amount }: WithdrawInput) {
  const result = await prisma.account.updateMany({
    where: {
      id: accountId,
      balance: { gte: amount }, // the condition is part of the UPDATE itself
    },
    data: {
      balance: { decrement: amount },
    },
  });

  if (result.count === 0) {
    // Either the account doesn't exist, or the balance was insufficient.
    // We distinguish the two to return a precise error.
    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundError("Account");
    throw new InsufficientFundsError();
  }

  return prisma.account.findUniqueOrThrow({ where: { id: accountId } });
}
