import "dotenv/config";
import { app } from "./app";

const port = process.env.PORT ? Number(process.env.PORT) : 5000;

app.listen(port, () => {
  console.log(`Backend concepts lab listening on http://localhost:${port}`);
});
