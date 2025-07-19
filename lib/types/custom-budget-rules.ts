import { z } from "zod";

// Custom budget rule types
export const CustomBudgetRuleTypeEnum = z.enum([
  "amount_range",
  "keywords", 
  "categories",
  "date_pattern",
  "account_type",
  "merchant_name"
]);

// Individual rule schemas
export const AmountRangeRuleSchema = z.object({
  type: z.literal("amount_range"),
  min: z.number().optional(),
  max: z.number().optional(),
});

export const KeywordsRuleSchema = z.object({
  type: z.literal("keywords"),
  keywords: z.array(z.string().min(1)),
  matchMode: z.enum(["any", "all"]).default("any"), // Match any keyword or all keywords
  searchIn: z.enum(["name", "description", "both"]).default("both"),
  caseSensitive: z.boolean().default(false),
});

export const CategoriesRuleSchema = z.object({
  type: z.literal("categories"),
  categoryIds: z.array(z.string().uuid()),
  matchMode: z.enum(["include", "exclude"]).default("include"),
});

export const DatePatternRuleSchema = z.object({
  type: z.literal("date_pattern"),
  pattern: z.enum(["weekdays", "weekends", "month_start", "month_end", "specific_days"]),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(), // 0 = Sunday, 6 = Saturday
  dayRange: z.object({
    start: z.number().min(1).max(31),
    end: z.number().min(1).max(31)
  }).optional(),
});

export const AccountTypeRuleSchema = z.object({
  type: z.literal("account_type"),
  accountTypes: z.array(z.enum(["checking", "savings", "credit", "cash", "investment"])),
  matchMode: z.enum(["include", "exclude"]).default("include"),
});

export const MerchantNameRuleSchema = z.object({
  type: z.literal("merchant_name"),
  merchants: z.array(z.string().min(1)),
  matchMode: z.enum(["include", "exclude"]).default("include"),
  caseSensitive: z.boolean().default(false),
});

// Union of all rule types
export const CustomBudgetRuleSchema = z.discriminatedUnion("type", [
  AmountRangeRuleSchema,
  KeywordsRuleSchema,
  CategoriesRuleSchema,
  DatePatternRuleSchema,
  AccountTypeRuleSchema,
  MerchantNameRuleSchema,
]);

// Custom budget rules container
export const CustomBudgetRulesSchema = z.object({
  rules: z.array(CustomBudgetRuleSchema),
  operator: z.enum(["AND", "OR"]).default("AND"), // How to combine multiple rules
  description: z.string().optional(), // Human-readable description of the rules
});

// Type exports
export type CustomBudgetRule = z.infer<typeof CustomBudgetRuleSchema>;
export type CustomBudgetRules = z.infer<typeof CustomBudgetRulesSchema>;
export type AmountRangeRule = z.infer<typeof AmountRangeRuleSchema>;
export type KeywordsRule = z.infer<typeof KeywordsRuleSchema>;
export type CategoriesRule = z.infer<typeof CategoriesRuleSchema>;
export type DatePatternRule = z.infer<typeof DatePatternRuleSchema>;
export type AccountTypeRule = z.infer<typeof AccountTypeRuleSchema>;
export type MerchantNameRule = z.infer<typeof MerchantNameRuleSchema>;

// Rule evaluation function
export function evaluateCustomBudgetRules(
  rules: CustomBudgetRules,
  transaction: {
    amount: number;
    name: string;
    description?: string;
    categoryId: string;
    transactionDate: string;
    accountId?: string;
    accountName?: string;
  },
  availableCategories: Array<{ id: string; name: string }> = [],
  accountType?: string
): boolean {
  if (!rules.rules || rules.rules.length === 0) {
    return false; // No rules means no match
  }

  const results = rules.rules.map(rule => evaluateSingleRule(rule, transaction, availableCategories, accountType));
  
  // Apply operator
  if (rules.operator === "OR") {
    return results.some(result => result === true);
  } else {
    return results.every(result => result === true);
  }
}

function evaluateSingleRule(
  rule: CustomBudgetRule,
  transaction: {
    amount: number;
    name: string;
    description?: string;
    categoryId: string;
    transactionDate: string;
    accountId?: string;
    accountName?: string;
  },
  availableCategories: Array<{ id: string; name: string }>,
  accountType?: string
): boolean {
  switch (rule.type) {
    case "amount_range":
      return evaluateAmountRange(rule, transaction.amount);
    
    case "keywords":
      return evaluateKeywords(rule, transaction.name, transaction.description);
    
    case "categories":
      return evaluateCategories(rule, transaction.categoryId);
    
    case "date_pattern":
      return evaluateDatePattern(rule, transaction.transactionDate);
    
    case "account_type":
      return evaluateAccountType(rule, accountType);
    
    case "merchant_name":
      return evaluateMerchantName(rule, transaction.name);
    
    default:
      return false;
  }
}

function evaluateAmountRange(rule: AmountRangeRule, amount: number): boolean {
  const absAmount = Math.abs(amount);
  
  if (rule.min !== undefined && absAmount < rule.min) {
    return false;
  }
  
  if (rule.max !== undefined && absAmount > rule.max) {
    return false;
  }
  
  return true;
}

function evaluateKeywords(rule: KeywordsRule, name: string, description?: string): boolean {
  const searchText = rule.searchIn === "name" ? name :
                    rule.searchIn === "description" ? (description || "") :
                    `${name} ${description || ""}`;
  
  const text = rule.caseSensitive ? searchText : searchText.toLowerCase();
  const keywords = rule.caseSensitive ? rule.keywords : rule.keywords.map(k => k.toLowerCase());
  
  const matches = keywords.map(keyword => text.includes(keyword));
  
  return rule.matchMode === "any" ? 
    matches.some(match => match) : 
    matches.every(match => match);
}

function evaluateCategories(rule: CategoriesRule, categoryId: string): boolean {
  const isIncluded = rule.categoryIds.includes(categoryId);
  
  return rule.matchMode === "include" ? isIncluded : !isIncluded;
}

function evaluateDatePattern(rule: DatePatternRule, transactionDate: string): boolean {
  const date = new Date(transactionDate);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  const dayOfMonth = date.getDate();
  
  switch (rule.pattern) {
    case "weekdays":
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    
    case "weekends":
      return dayOfWeek === 0 || dayOfWeek === 6;
    
    case "month_start":
      return dayOfMonth <= 7;
    
    case "month_end":
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      return dayOfMonth >= lastDay - 6;
    
    case "specific_days":
      if (rule.daysOfWeek) {
        return rule.daysOfWeek.includes(dayOfWeek);
      }
      if (rule.dayRange) {
        return dayOfMonth >= rule.dayRange.start && dayOfMonth <= rule.dayRange.end;
      }
      return false;
    
    default:
      return false;
  }
}

function evaluateAccountType(rule: AccountTypeRule, accountType?: string): boolean {
  if (!accountType) {
    return false;
  }
  
  const isIncluded = rule.accountTypes.includes(accountType as typeof rule.accountTypes[number]);
  
  return rule.matchMode === "include" ? isIncluded : !isIncluded;
}

function evaluateMerchantName(rule: MerchantNameRule, transactionName: string): boolean {
  const name = rule.caseSensitive ? transactionName : transactionName.toLowerCase();
  const merchants = rule.caseSensitive ? rule.merchants : rule.merchants.map(m => m.toLowerCase());
  
  const matches = merchants.some(merchant => name.includes(merchant));
  
  return rule.matchMode === "include" ? matches : !matches;
}

// Helper function to generate human-readable rule descriptions
export function generateRuleDescription(rules: CustomBudgetRules): string {
  if (!rules.rules || rules.rules.length === 0) {
    return "No rules defined";
  }
  
  const descriptions = rules.rules.map(rule => {
    switch (rule.type) {
      case "amount_range":
        const min = rule.min ? `$${rule.min}` : "any";
        const max = rule.max ? `$${rule.max}` : "any";
        return `Amount between ${min} and ${max}`;
      
      case "keywords":
        const keywordList = rule.keywords.join(", ");
        return `Contains ${rule.matchMode === "any" ? "any of" : "all of"}: ${keywordList}`;
      
      case "categories":
        return `${rule.matchMode === "include" ? "Include" : "Exclude"} ${rule.categoryIds.length} categories`;
      
      case "date_pattern":
        return `On ${rule.pattern.replace("_", " ")}`;
      
      case "account_type":
        return `${rule.matchMode === "include" ? "Include" : "Exclude"} ${rule.accountTypes.join(", ")} accounts`;
      
      case "merchant_name":
        return `${rule.matchMode === "include" ? "Include" : "Exclude"} merchants: ${rule.merchants.join(", ")}`;
      
      default:
        return "Unknown rule";
    }
  });
  
  const operator = rules.operator === "OR" ? " OR " : " AND ";
  return descriptions.join(operator);
}