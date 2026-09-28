import { prisma } from "../../core/prisma";
import { InsufficientFundsError, NotFoundError } from "../../core/errors";
import { WithdrawInput } from "./types";

// Artificial delay to make the race condition window reliably visible.
// In production this delay exists naturally (business logic, external
// calls, network latency) even without an explicit setTimeout - here
// it's just made deterministic for the demo.
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// BUG: read the balance, check it, THEN write - as two separate steps.
// Between the read and the write, another concurrent call can read
// the exact same starting balance and pass the exact same check.
// The write uses an atomic decrement, so every accepted request really
// removes money from the account, and the balance can go negative.
export async function withdrawBad({ accountId, amount }: WithdrawInput) {
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) throw new NotFoundError("Account");

  if (account.balance < amount) {
    throw new InsufficientFundsError();
  }

  // Vulnerability window: during these 300ms, other requests can read
  // the same "account.balance" and pass the same check.
  await sleep(300);

  const updated = await prisma.account.update({
    where: { id: accountId },
    data: { balance: { decrement: amount } },
  });

  return updated;
}

// FIX: the condition (balance >= amount) and the write (balance - amount)
// happen in ONE single SQL statement:
//   UPDATE account SET balance = balance - $amount
//   WHERE id = $id AND balance >= $amount
// The database locks the row for that statement, so concurrent requests
// are processed one after the other, each seeing the up-to-date balance.
export async function withdrawGood({ accountId, amount }: WithdrawInput) {
  // Same 300ms delay as the bad version, to prove the fix holds even
  // with a slow business step. It runs BEFORE the atomic update and
  // does not read any balance, so it cannot create a stale check.
  await sleep(300);

  const result = await prisma.account.updateMany({
    where: { id: accountId, balance: { gte: amount } },
    data: { balance: { decrement: amount } },
  });

  if (result.count === 0) {
    // Nothing was updated: either the account does not exist,
    // or the balance was too low.
    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundError("Account");
    throw new InsufficientFundsError();
  }

  return prisma.account.findUniqueOrThrow({ where: { id: accountId } });
}
