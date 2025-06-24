import { createClient } from "@supabase/supabase-js";

// Supabase client for database operations
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Fallback for build time when env vars might not be available
const fallbackUrl = supabaseUrl || "https://test.supabase.co";
const fallbackKey = supabaseServiceKey || "test-service-role-key";

console.log(fallbackUrl, fallbackKey);
const supabase = createClient(fallbackUrl, fallbackKey);

export { supabase };

export async function query<T = unknown>(
  text: string,
  params?: unknown[]
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

export async function queryOne<T = unknown>(
  text: string,
  params?: unknown[]
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

export async function insertGoal(goalData: Record<string, unknown>) {
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
  updateData: Record<string, unknown>
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
export async function selectCategories(/* _userId?: string */) {
  const query = supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  // TODO: Add user filtering after migration
  // if (userId) {
  //   query = query.eq("user_id", userId);
  // }

  const { data, error } = await query;

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

export async function insertCategory(category: Record<string, unknown>) {
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

export async function updateCategory(id: string, updates: Record<string, unknown>) {
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

export async function insertTransaction(transaction: Record<string, unknown>) {
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

export async function updateTransaction(id: string, updates: Record<string, unknown>) {
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

export async function insertBudget(budgetData: Record<string, unknown>) {
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
  updateData: Record<string, unknown>
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
export async function insertBudgetAlert(alertData: Record<string, unknown>) {
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

// Project operations
export async function selectProjects(userId: string) {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch projects: ${error.message}`);
  }

  return data || [];
}

export async function selectProjectById(id: string, userId: string) {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (error) {
    throw new Error(`Failed to fetch project: ${error.message}`);
  }

  return data;
}

export async function insertProject(project: Record<string, unknown>) {
  const { data, error } = await supabase
    .from("projects")
    .insert([project])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create project: ${error.message}`);
  }

  return data;
}

export async function updateProject(id: string, userId: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .eq("is_active", true)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update project: ${error.message}`);
  }

  return data;
}

export async function deleteProject(id: string, userId: string) {
  const { data, error } = await supabase
    .from("projects")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .eq("is_active", true)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to delete project: ${error.message}`);
  }

  return data;
}

// Recurring transactions operations
export async function selectRecurringTransactions(userId: string) {
  const { data, error } = await supabase
    .from("recurring_transactions")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("next_due_date", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch recurring transactions: ${error.message}`);
  }

  return data || [];
}

export async function selectRecurringTransactionById(id: string, userId: string) {
  const { data, error } = await supabase
    .from("recurring_transactions")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (error) {
    throw new Error(`Failed to fetch recurring transaction: ${error.message}`);
  }

  return data;
}

export async function insertRecurringTransaction(transaction: Record<string, unknown>) {
  const { data, error } = await supabase
    .from("recurring_transactions")
    .insert([transaction])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create recurring transaction: ${error.message}`);
  }

  return data;
}

export async function updateRecurringTransaction(id: string, userId: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from("recurring_transactions")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .eq("is_active", true)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update recurring transaction: ${error.message}`);
  }

  return data;
}

export async function deleteRecurringTransaction(id: string, userId: string) {
  const { data, error } = await supabase
    .from("recurring_transactions")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .eq("is_active", true)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to delete recurring transaction: ${error.message}`);
  }

  return data;
}

// Bill reminders operations
export async function selectBillReminders(userId: string, upcomingOnly = false) {
  let query = supabase
    .from("bill_reminders")
    .select("*")
    .eq("user_id", userId);

  if (upcomingOnly) {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    query = query
      .in("status", ["pending", "overdue"])
      .lte("due_date", sevenDaysFromNow.toISOString().split('T')[0]);
  }

  query = query.order("due_date", { ascending: true });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch bill reminders: ${error.message}`);
  }

  return data || [];
}

export async function insertBillReminder(reminder: Record<string, unknown>) {
  const { data, error } = await supabase
    .from("bill_reminders")
    .insert([reminder])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create bill reminder: ${error.message}`);
  }

  return data;
}

export async function updateBillReminderStatus(id: string, userId: string, status: string) {
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'paid') {
    updateData.paid_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("bill_reminders")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to delete bill reminder: ${error.message}`);
  }

  return data;
}
