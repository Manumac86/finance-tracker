import fs from "fs";
import path from "path";
import { query } from "../postgres";

async function runMigration(migrationFile: string) {
  try {
    console.log(`🚀 Running migration: ${migrationFile}`);

    // Read the migration file
    const migrationPath = path.join(
      process.cwd(),
      "lib/db/migrations",
      migrationFile
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    console.log("📄 Migration content:");
    console.log(migrationSQL);
    console.log("\n🔄 Executing migration...");

    // Execute the migration
    await query(migrationSQL);

    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Get migration file from command line argument
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error("❌ Please provide a migration file name");
  console.error(
    "Usage: npx tsx scripts/run-migration.ts 011_create_budget_categories_table.sql"
  );
  process.exit(1);
}

runMigration(migrationFile);
