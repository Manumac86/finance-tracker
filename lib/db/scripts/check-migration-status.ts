import { supabase } from "../postgres";

async function checkMigrationStatus() {
  try {
    console.log("🔍 Checking migration status...");

    // Check if budget_categories table exists
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "budget_categories");

    if (tablesError) {
      console.log(
        "⚠️ Cannot query information schema, trying direct table access..."
      );

      // Try to query the table directly
      const { data, error } = await supabase
        .from("budget_categories")
        .select("count", { count: "exact", head: true });

      if (error) {
        console.log("❌ budget_categories table does not exist");
        console.log("Error:", error.message);
        return false;
      } else {
        console.log("✅ budget_categories table exists");
        console.log("Row count:", data);
        return true;
      }
    }

    if (tables && tables.length > 0) {
      console.log("✅ budget_categories table exists");
      return true;
    } else {
      console.log("❌ budget_categories table does not exist");
      return false;
    }
  } catch (error) {
    console.error("❌ Error checking migration status:", error);
    return false;
  }
}

// Check if budgets table still has category_id column
async function checkBudgetsSchema() {
  try {
    console.log("\n🔍 Checking budgets table schema...");

    // Try to select from budgets to see current schema
    const { data, error } = await supabase.from("budgets").select("*").limit(1);

    if (error) {
      console.log("❌ Error querying budgets table:", error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log("✅ budgets table accessible");
      console.log("Sample record keys:", Object.keys(data[0]));

      if ("category_id" in data[0]) {
        console.log("⚠️ budgets table still has category_id column");
      } else {
        console.log(
          "✅ budgets table does not have category_id column (migration applied)"
        );
      }
    } else {
      console.log("ℹ️ budgets table is empty");
    }
  } catch (error) {
    console.error("❌ Error checking budgets schema:", error);
  }
}

async function main() {
  await checkMigrationStatus();
  await checkBudgetsSchema();
  process.exit(0);
}

main();
