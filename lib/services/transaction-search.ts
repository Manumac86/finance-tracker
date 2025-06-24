/**
 * Transaction Search & Management Service
 * 
 * Implements US-012: Transaction Search & Management
 * - Advanced search and filtering
 * - Bulk transaction editing
 * - Transaction splitting
 * - Duplicate detection
 */

import { UITransaction } from '@/lib/db/schemas/transaction';

export interface SearchFilters {
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  transactionType?: 'income' | 'expense';
  categoryId?: string;
  searchText?: string;
}

export interface DuplicateGroup {
  group: UITransaction[];
  similarity: number;
  criteria: string[];
}

export interface BulkEditValidation {
  isValid: boolean;
  errors: string[];
}

export interface SplitValidation {
  isValid: boolean;
  errors: string[];
}

export interface SplitTransaction {
  amount: number;
  categoryId: string;
  description: string;
}

/**
 * Search and filter transactions based on various criteria
 */
export function searchTransactions(
  transactions: UITransaction[], 
  filters: SearchFilters
): UITransaction[] {
  return transactions.filter(transaction => {
    // Date range filter
    if (filters.startDate && transaction.transactionDate < filters.startDate) {
      return false;
    }
    if (filters.endDate && transaction.transactionDate > filters.endDate) {
      return false;
    }

    // Amount range filter
    if (filters.minAmount !== undefined && transaction.amount < filters.minAmount) {
      return false;
    }
    if (filters.maxAmount !== undefined && transaction.amount > filters.maxAmount) {
      return false;
    }

    // Transaction type filter
    if (filters.transactionType && transaction.transactionType !== filters.transactionType) {
      return false;
    }

    // Category filter
    if (filters.categoryId && transaction.categoryId !== filters.categoryId) {
      return false;
    }

    // Text search filter
    if (filters.searchText) {
      const searchTerm = filters.searchText.toLowerCase();
      const nameMatch = transaction.name.toLowerCase().includes(searchTerm);
      const descriptionMatch = transaction.description?.toLowerCase().includes(searchTerm) || false;
      
      if (!nameMatch && !descriptionMatch) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Detect duplicate transactions based on similarity criteria
 */
export function detectDuplicates(
  transactions: UITransaction[],
  criteria: string[] = ['name', 'amount', 'categoryId']
): DuplicateGroup[] {
  const duplicateGroups: DuplicateGroup[] = [];
  const processed = new Set<string>();

  for (let i = 0; i < transactions.length; i++) {
    const transaction1 = transactions[i];
    
    if (processed.has(transaction1.id!)) {
      continue;
    }

    const group: UITransaction[] = [transaction1];
    
    for (let j = i + 1; j < transactions.length; j++) {
      const transaction2 = transactions[j];
      
      if (processed.has(transaction2.id!)) {
        continue;
      }

      const similarity = calculateSimilarity(transaction1, transaction2, criteria);
      
      if (similarity > 0.8) { // 80% similarity threshold
        group.push(transaction2);
        processed.add(transaction2.id!);
      }
    }

    if (group.length > 1) {
      const similarity = calculateGroupSimilarity(group, criteria);
      duplicateGroups.push({
        group,
        similarity,
        criteria,
      });
      
      // Mark all transactions in the group as processed
      group.forEach(t => processed.add(t.id!));
    }
  }

  return duplicateGroups;
}

/**
 * Calculate similarity between two transactions based on specified criteria
 */
function calculateSimilarity(
  transaction1: UITransaction,
  transaction2: UITransaction,
  criteria: string[]
): number {
  let matches = 0;
  const totalCriteria = criteria.length;

  for (const criterion of criteria) {
    switch (criterion) {
      case 'name':
        if (transaction1.name === transaction2.name) matches++;
        break;
      case 'amount':
        if (Math.abs(transaction1.amount - transaction2.amount) < 0.01) matches++;
        break;
      case 'categoryId':
        if (transaction1.categoryId === transaction2.categoryId) matches++;
        break;
      case 'transactionDate':
        if (transaction1.transactionDate === transaction2.transactionDate) matches++;
        break;
      case 'description':
        if (transaction1.description === transaction2.description) matches++;
        break;
    }
  }

  return matches / totalCriteria;
}

/**
 * Calculate overall similarity for a group of transactions
 */
function calculateGroupSimilarity(group: UITransaction[], criteria: string[]): number {
  if (group.length < 2) return 1.0;

  let totalSimilarity = 0;
  let comparisons = 0;

  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      totalSimilarity += calculateSimilarity(group[i], group[j], criteria);
      comparisons++;
    }
  }

  return comparisons > 0 ? totalSimilarity / comparisons : 0;
}

/**
 * Validate bulk edit operation
 */
export function validateBulkEdit(
  transactionIds: string[],
  updates: Record<string, unknown>
): BulkEditValidation {
  const errors: string[] = [];

  if (!transactionIds || transactionIds.length === 0) {
    errors.push('No transactions selected');
  }

  if (!updates || Object.keys(updates).length === 0) {
    errors.push('No updates provided');
  }

  // Validate update fields
  if (updates.amount !== undefined && (typeof updates.amount !== 'number' || updates.amount <= 0)) {
    errors.push('Amount must be a positive number');
  }

  if (updates.transactionDate && !/^\d{4}-\d{2}-\d{2}$/.test(updates.transactionDate)) {
    errors.push('Invalid date format (expected YYYY-MM-DD)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Prepare bulk edit payload for API call
 */
export function prepareBulkEditPayload(
  transactionIds: string[],
  updates: Record<string, unknown>
): Record<string, unknown> {
  // Transform camelCase to snake_case for database
  const dbUpdates: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(updates)) {
    switch (key) {
      case 'categoryId':
        dbUpdates.category_id = value;
        break;
      case 'transactionType':
        dbUpdates.transaction_type = value;
        break;
      case 'transactionDate':
        dbUpdates.transaction_date = value;
        break;
      default:
        dbUpdates[key] = value;
    }
  }

  dbUpdates.updated_at = new Date().toISOString();

  return {
    transactionIds,
    updates: dbUpdates,
  };
}

/**
 * Validate transaction splitting
 */
export function validateSplitTransaction(
  originalTransaction: UITransaction,
  splits: SplitTransaction[]
): SplitValidation {
  const errors: string[] = [];

  if (!splits || splits.length === 0) {
    errors.push('No split transactions provided');
  }

  if (splits.length < 2) {
    errors.push('At least 2 split transactions required');
  }

  // Check if split amounts add up to original amount
  const totalSplitAmount = splits.reduce((sum, split) => sum + split.amount, 0);
  if (Math.abs(totalSplitAmount - originalTransaction.amount) > 0.01) {
    if (totalSplitAmount > originalTransaction.amount) {
      errors.push('Split amounts exceed original transaction amount');
    } else {
      errors.push('Split amounts are less than original transaction amount');
    }
  }

  // Validate individual splits
  splits.forEach((split, index) => {
    if (!split.amount || split.amount <= 0) {
      errors.push(`Split ${index + 1}: Amount must be positive`);
    }
    if (!split.categoryId) {
      errors.push(`Split ${index + 1}: Category is required`);
    }
    if (!split.description || split.description.trim() === '') {
      errors.push(`Split ${index + 1}: Description is required`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Prepare split transaction payload for API call
 */
export function prepareSplitTransactionPayload(
  originalTransaction: UITransaction,
  splits: SplitTransaction[]
): { originalTransactionId: string; splitTransactions: Record<string, unknown>[] } {
  const splitTransactions = splits.map((split, index) => ({
    user_id: originalTransaction.userId,
    name: `${originalTransaction.name} (Split ${index + 1}/${splits.length})`,
    amount: split.amount,
    transaction_type: originalTransaction.transactionType,
    category_id: split.categoryId,
    description: split.description,
    transaction_date: originalTransaction.transactionDate,
    is_split: true,
    original_transaction_id: originalTransaction.id,
  }));

  return {
    originalTransactionId: originalTransaction.id,
    splitTransactions,
  };
}