import { supabase } from "./postgres";
import { 
  UITransactionBudget, 
  transformTransactionBudgetToUI,
  transformTransactionBudgetToDB,
  CreateTransactionBudgetInput 
} from "./schemas/transaction-budget";

// Create a transaction-budget assignment
export async function createTransactionBudgetAssignment(
  assignmentData: CreateTransactionBudgetInput & { userId: string }
): Promise<UITransactionBudget> {
  // Validate that user owns the transaction
  const { data: transaction, error: transactionError } = await supabase
    .from('transactions')
    .select('id, user_id, amount')
    .eq('id', assignmentData.transactionId)
    .eq('user_id', assignmentData.userId)
    .single();

  if (transactionError || !transaction) {
    throw new Error('Transaction not found or access denied');
  }

  // Validate that user owns the budget
  const { data: budget, error: budgetError } = await supabase
    .from('budgets')
    .select('id, user_id')
    .eq('id', assignmentData.budgetId)
    .eq('user_id', assignmentData.userId)
    .single();

  if (budgetError || !budget) {
    throw new Error('Budget not found or access denied');
  }

  // Calculate assigned amount based on percentage if needed
  let finalAssignedAmount = assignmentData.assignedAmount;
  if (!finalAssignedAmount && assignmentData.assignedPercentage) {
    finalAssignedAmount = (transaction.amount * assignmentData.assignedPercentage) / 100;
  }

  if (!finalAssignedAmount || finalAssignedAmount <= 0) {
    throw new Error('Invalid assigned amount');
  }

  // Check that assigned amount doesn't exceed transaction amount
  if (finalAssignedAmount > Math.abs(transaction.amount)) {
    throw new Error('Assigned amount cannot exceed transaction amount');
  }

  // Check for existing assignment to the same budget
  const { data: existing } = await supabase
    .from('transaction_budgets')
    .select('id')
    .eq('transaction_id', assignmentData.transactionId)
    .eq('budget_id', assignmentData.budgetId)
    .single();

  if (existing) {
    throw new Error('Transaction is already assigned to this budget');
  }

  // Create the assignment
  const dbData = {
    transaction_id: assignmentData.transactionId,
    budget_id: assignmentData.budgetId,
    assigned_amount: finalAssignedAmount,
    assigned_percentage: assignmentData.assignedPercentage,
    notes: assignmentData.notes,
  };

  const { data, error } = await supabase
    .from('transaction_budgets')
    .insert(dbData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create budget assignment: ${error.message}`);
  }

  return transformTransactionBudgetToUI(data);
}

// Get all budget assignments for a transaction
export async function getTransactionBudgetAssignments(
  transactionId: string,
  userId: string
): Promise<UITransactionBudget[]> {
  const { data, error } = await supabase
    .from('transaction_budgets')
    .select(`
      *,
      transactions!inner(user_id)
    `)
    .eq('transaction_id', transactionId)
    .eq('transactions.user_id', userId);

  if (error) {
    throw new Error(`Failed to fetch budget assignments: ${error.message}`);
  }

  return data.map(transformTransactionBudgetToUI);
}

// Get all transactions assigned to a budget
export async function getBudgetTransactionAssignments(
  budgetId: string,
  userId: string
): Promise<UITransactionBudget[]> {
  const { data, error } = await supabase
    .from('transaction_budgets')
    .select(`
      *,
      budgets!inner(user_id)
    `)
    .eq('budget_id', budgetId)
    .eq('budgets.user_id', userId);

  if (error) {
    throw new Error(`Failed to fetch transaction assignments: ${error.message}`);
  }

  return data.map(transformTransactionBudgetToUI);
}

// Update a transaction-budget assignment
export async function updateTransactionBudgetAssignment(
  assignmentId: string,
  userId: string,
  updateData: Partial<CreateTransactionBudgetInput>
): Promise<UITransactionBudget> {
  // Verify ownership through transaction
  const { data: existing, error: fetchError } = await supabase
    .from('transaction_budgets')
    .select(`
      *,
      transactions!inner(user_id, amount)
    `)
    .eq('id', assignmentId)
    .eq('transactions.user_id', userId)
    .single();

  if (fetchError || !existing) {
    throw new Error('Assignment not found or access denied');
  }

  // Calculate new assigned amount if percentage is provided
  let finalAssignedAmount = updateData.assignedAmount;
  if (!finalAssignedAmount && updateData.assignedPercentage) {
    finalAssignedAmount = (existing.transactions.amount * updateData.assignedPercentage) / 100;
  }

  // Validate assigned amount
  if (finalAssignedAmount && finalAssignedAmount > Math.abs(existing.transactions.amount)) {
    throw new Error('Assigned amount cannot exceed transaction amount');
  }

  const dbData = transformTransactionBudgetToDB({
    assignedAmount: finalAssignedAmount,
    assignedPercentage: updateData.assignedPercentage,
    notes: updateData.notes,
  });

  // Remove undefined values
  Object.keys(dbData).forEach(key => {
    if (dbData[key as keyof typeof dbData] === undefined) {
      delete dbData[key as keyof typeof dbData];
    }
  });

  const { data, error } = await supabase
    .from('transaction_budgets')
    .update(dbData)
    .eq('id', assignmentId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update budget assignment: ${error.message}`);
  }

  return transformTransactionBudgetToUI(data);
}

// Delete a transaction-budget assignment
export async function deleteTransactionBudgetAssignment(
  assignmentId: string,
  userId: string
): Promise<void> {
  // Verify ownership through transaction
  const { error: deleteError } = await supabase
    .from('transaction_budgets')
    .delete()
    .eq('id', assignmentId)
    .eq('transactions.user_id', userId);

  if (deleteError) {
    throw new Error(`Failed to delete budget assignment: ${deleteError.message}`);
  }
}

// Get total assigned amount for a transaction
export async function getTransactionAssignedTotal(
  transactionId: string,
  userId: string
): Promise<number> {
  const assignments = await getTransactionBudgetAssignments(transactionId, userId);
  return assignments.reduce((total, assignment) => total + assignment.assignedAmount, 0);
}

// Get unassigned amount for a transaction
export async function getTransactionUnassignedAmount(
  transactionId: string,
  userId: string
): Promise<number> {
  // Get transaction amount
  const { data: transaction, error } = await supabase
    .from('transactions')
    .select('amount')
    .eq('id', transactionId)
    .eq('user_id', userId)
    .single();

  if (error || !transaction) {
    throw new Error('Transaction not found');
  }

  const assignedTotal = await getTransactionAssignedTotal(transactionId, userId);
  return Math.abs(transaction.amount) - assignedTotal;
}