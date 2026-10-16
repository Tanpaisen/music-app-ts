import "dotenv/config";
import mongoose from "mongoose";
import { syncAllToMeili } from "../services/meilisearch.service";

async function main() {
  const uri = process.env.MongoDB;
  if (!uri) throw new Error("Missing MongoDB in .env");
  if (!process.env.MEILI_ADMIN_KEY) throw new Error("Missing MEILI_ADMIN_KEY in .env");
  await mongoose.connect(uri);
  try { await syncAllToMeili(); }
  finally { await mongoose.disconnect(); }
}
main().catch(error => { console.error("[Meili sync failed]", error); process.exitCode = 1; });
