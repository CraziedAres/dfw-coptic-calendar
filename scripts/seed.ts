// Upserts data/churches.seed.json into the configured store (Supabase if env is set, else data/dev-db.json).
// Run with: npm run seed
import { readFileSync } from "fs";
import path from "path";
import { db } from "../src/lib/db";
import type { Church } from "../src/lib/types";

async function main() {
  const file = path.join(process.cwd(), "data", "churches.seed.json");
  const churches: Omit<Church, "id">[] = JSON.parse(readFileSync(file, "utf8"));
  const n = await db().upsertChurches(churches);
  console.log(`Seeded ${n} churches → ${process.env.SUPABASE_URL ? "Supabase" : "data/dev-db.json"}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
