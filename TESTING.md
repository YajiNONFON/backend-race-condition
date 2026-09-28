# Testing the race condition module

Three ways to reproduce this, from fastest to most hands-on.

## Option 1 — Automated script (recommended)

```bash
npm run test:race-condition
```

This script:

1. Creates a test account with a balance of 100
2. Fires 5 withdrawal requests of 30 each **in parallel** against
   `/bad/withdraw`
3. Prints the final balance — you should see a negative or incoherent
   balance
4. Repeats the exact same scenario against `/good/withdraw`
5. Prints the final balance — it never goes below 0, and some requests
   get rejected with a 409 status

## Option 2 — Postman collection (proper way to import it)

Don't retype the requests by hand — import the file directly:

1. Open Postman → **Import** (top left) → select `postman/collection.json`
2. This creates a **"Race condition"** folder with 4 ready-to-use
   requests (method, URL, and raw JSON body already filled in)
3. Run **Seed account** first — its response automatically saves the
   returned `id` into the collection variable `accountId` (a small test
   script is attached to that request for this)
4. Every other request already references `{{accountId}}`, so you never
   need to copy-paste it manually
5. Open several tabs with **Bad withdraw** and send them as fast as
   possible one after another to simulate concurrency, then check
   **Get account** to see the final balance
6. Repeat with **Good withdraw**

## Option 3 — Raw curl examples (copy-paste)

Replace `ACCOUNT_ID` with the id returned by the seed call.

**Seed an account:**

```bash
curl -X POST http://localhost:5000/api/concepts/race-condition/seed \
  -H "Content-Type: application/json" \
  -d '{"ownerName": "Test", "balance": 10000}'
```

**Check the balance:**

```bash
curl http://localhost:5000/api/concepts/race-condition/accounts/ACCOUNT_ID
```

**Fire 5 concurrent bad withdrawals (bash):**

```bash
for i in 1 2 3 4 5; do
  curl -X POST http://localhost:5000/api/concepts/race-condition/bad/withdraw \
    -H "Content-Type: application/json" \
    -d '{"accountId": "ACCOUNT_ID", "amount": 3000}' &
done
wait
```

**Same test on the good endpoint:**

```bash
for i in 1 2 3 4 5; do
  curl -X POST http://localhost:5000/api/concepts/race-condition/good/withdraw \
    -H "Content-Type: application/json" \
    -d '{"accountId": "ACCOUNT_ID", "amount": 3000}' &
done
wait
```

## Expected results

|                        | bad/withdraw                        | good/withdraw                               |
| ---------------------- | ----------------------------------- | ------------------------------------------- |
| Possible final balance | Negative (e.g. -50)                 | Never negative                              |
| Extra requests         | All accepted (200)                  | Rejected with 409 `INSUFFICIENT_FUNDS`      |
| Root cause             | Read and write separated by a delay | Condition + write in the same SQL statement |

## What this concretely teaches

The bug isn't in the business logic (the balance check is correct) — it's
in the **timing** between reading a value and writing a value derived
from it. Any endpoint that follows "read → decide → write" on a shared
resource (balance, stock, seat, quota) is vulnerable the same way, unless
the check and the write happen inside the same atomic database operation.

If you rerun the bad test multiple times, the result may vary slightly
depending on exact timing — that's expected, and it's part of the lesson:
a race condition isn't always 100% reproducible, which makes it more
dangerous in production (it can pass unnoticed in testing and only
surface under real concurrent load).
