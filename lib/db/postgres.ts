import { createClient } from "@supabase/supabase-js";

// Supabase client for database operations
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log(supabaseUrl, supabaseServiceKey);
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export { supabase };

export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const { data, error } = await supabase.rpc("execute_sql", {
    query: text,
    params: params || [],
  });

  if (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }

  return data || [];
}

export async function queryOne<T = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

// For simpler operations, we can use Supabase's built-in methods
export async function selectGoals(userId: string, type?: string) {
  let query = supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch goals: ${error.message}`);
  }

  return data || [];
}

export async function insertGoal(goalData: any) {
  const { data, error } = await supabase
    .from("goals")
    .insert(goalData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create goal: ${error.message}`);
  }

  return data;
}

export async function updateGoal(
  goalId: string,
  userId: string,
  updateData: any
) {
  const { data, error } = await supabase
    .from("goals")
    .update(updateData)
    .eq("id", goalId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update goal: ${error.message}`);
  }

  return data;
}

export async function deleteGoal(goalId: string, userId: string) {
  const { error } = await supabase
    .from("goals")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", goalId)
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) {
    throw new Error(`Failed to delete goal: ${error.message}`);
  }

  return true;
}

// Category operations
export async function selectCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  return data || [];
}

export async function selectCategoryById(id: string) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (error) {
    throw new Error(`Failed to fetch category: ${error.message}`);
  }

  return data;
}

export async function insertCategory(category: any) {
  const { data, error } = await supabase
    .from("categories")
    .insert([category])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create category: ${error.message}`);
  }

  return data;
}

export async function updateCategory(id: string, updates: any) {
  const { data, error } = await supabase
    .from("categories")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update category: ${error.message}`);
  }

  return data;
}

export async function deleteCategory(id: string) {
  const { data, error } = await supabase
    .from("categories")
    .update({ is_active: false })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to delete category: ${error.message}`);
  }

  return data;
}

// Transaction operations
export async function selectTransactions(userId: string, limit: number = 50) {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("transaction_date", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  return data || [];
}

export async function insertTransaction(transaction: any) {
  const { data, error } = await supabase
    .from("transactions")
    .insert([transaction])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create transaction: ${error.message}`);
  }

  return data;
}

export async function updateTransaction(id: string, updates: any) {
  const { data, error } = await supabase
    .from("transactions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update transaction: ${error.message}`);
  }

  return data;
}

export async function deleteTransaction(id: string) {
  const { data, error } = await supabase
    .from("transactions")
    .update({ is_active: false })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to delete transaction: ${error.message}`);
  }

  return data;
}

export async function getTransactionStats(
  userId: string,
  startDate?: string,
  endDate?: string
) {
  const { data, error } = await supabase.rpc("get_transaction_stats", {
    p_user_id: userId,
    p_start_date: startDate || null,
    p_end_date: endDate || null,
  });

  if (error) {
    throw new Error(`Failed to get transaction stats: ${error.message}`);
  }

  return (
    data?.[0] || {
      total_income: 0,
      total_expenses: 0,
      net_amount: 0,
      transaction_count: 0,
    }
  );
}

// Budget operations
export async function selectBudgets(userId: string, period?: string) {
  let query = supabase
    .from("budgets")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (period) {
    query = query.eq("period", period);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch budgets: ${error.message}`);
  }

  return data || [];
}

export async function insertBudget(budgetData: any) {
  const { data, error } = await supabase
    .from("budgets")
    .insert(budgetData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create budget: ${error.message}`);
  }

  return data;
}

export async function updateBudget(
  budgetId: string,
  userId: string,
  updateData: any
) {
  const { data, error } = await supabase
    .from("budgets")
    .update(updateData)
    .eq("id", budgetId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update budget: ${error.message}`);
  }

  return data;
}

export async function deleteBudget(budgetId: string, userId: string) {
  const { error } = await supabase
    .from("budgets")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", budgetId)
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) {
    throw new Error(`Failed to delete budget: ${error.message}`);
  }

  return true;
}

// Budget alerts operations
export async function insertBudgetAlert(alertData: any) {
  const { data, error } = await supabase
    .from("budget_alerts")
    .insert(alertData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create budget alert: ${error.message}`);
  }

  return data;
}

export async function selectBudgetAlerts(
  userId: string,
  unacknowledgedOnly = false
) {
  let query = supabase
    .from("budget_alerts")
    .select("*")
    .eq("user_id", userId)
    .order("sent_at", { ascending: false });

  if (unacknowledgedOnly) {
    query = query.eq("acknowledged", false);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch budget alerts: ${error.message}`);
  }

  return data || [];
}

export async function acknowledgeBudgetAlert(alertId: string, userId: string) {
  const { data, error } = await supabase
    .from("budget_alerts")
    .update({
      acknowledged: true,
      acknowledged_at: new Date().toISOString(),
    })
    .eq("id", alertId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to acknowledge budget alert: ${error.message}`);
  }

  return data;
}
