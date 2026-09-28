// Fires N withdrawal requests IN PARALLEL against the bad endpoint,
// then against the good endpoint, from the same starting balance,
// and prints the expected vs actual final balance.
//
// Usage: npm run test:race-condition

const BASE_URL = "http://localhost:5000";
const STARTING_BALANCE = 10000; // 100.00 in cents
const WITHDRAW_AMOUNT = 3000; // 30.00 in cents
const CONCURRENT_REQUESTS = 5; // 5 x 30.00 = 150.00, more than the 100.00 balance

async function seedAccount(ownerName: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/concepts/race-condition/seed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ownerName, balance: STARTING_BALANCE }),
  });
  const account = await res.json();
  return account.id;
}

async function getBalance(accountId: string): Promise<number> {
  const res = await fetch(
    `${BASE_URL}/api/concepts/race-condition/accounts/${accountId}`,
  );
  const account = await res.json();
  return account.balance;
}

async function fireConcurrentWithdrawals(
  accountId: string,
  mode: "bad" | "good",
) {
  const requests = Array.from({ length: CONCURRENT_REQUESTS }, () =>
    fetch(`${BASE_URL}/api/concepts/race-condition/${mode}/withdraw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, amount: WITHDRAW_AMOUNT }),
    }).then((r) => r.status),
  );
  return Promise.all(requests);
}

async function runScenario(mode: "bad" | "good") {
  const accountId = await seedAccount(`Test ${mode}`);
  const statuses = await fireConcurrentWithdrawals(accountId, mode);
  const finalBalance = await getBalance(accountId);

  const successes = statuses.filter((s) => s === 200).length;
  const rejections = statuses.filter((s) => s === 409).length;

  console.log(`\n--- Mode: ${mode.toUpperCase()} ---`);
  console.log(`Starting balance: ${STARTING_BALANCE / 100}`);
  console.log(
    `${CONCURRENT_REQUESTS} concurrent withdrawals of ${WITHDRAW_AMOUNT / 100} each`,
  );
  console.log(
    `Succeeded: ${successes} | Rejected (insufficient funds): ${rejections}`,
  );
  console.log(`Final balance: ${finalBalance / 100}`);
  console.log(
    finalBalance < 0
      ? "RESULT: negative balance -> the race condition produced an impossible balance."
      : "RESULT: balance never went negative -> the extra withdrawals were correctly blocked.",
  );
}

async function main() {
  await runScenario("bad");
  await runScenario("good");
}

main().catch((err) => {
  console.error("Error while running the test:", err);
  process.exit(1);
});
