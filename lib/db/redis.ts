import { Redis } from '@upstash/redis';

// Upstash Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export { redis };

// Cache keys
export const CACHE_KEYS = {
  USER_GOALS: (userId: string) => `user:${userId}:goals`,
  GOAL_DETAIL: (goalId: string) => `goal:${goalId}`,
  USER_BUDGETS: (userId: string) => `user:${userId}:budgets`,
  BUDGET_DETAIL: (budgetId: string) => `budget:${budgetId}`,
  BUDGET_ALERTS: (userId: string) => `user:${userId}:budget_alerts`,
  DASHBOARD: (userId: string, date: string) => `dashboard:${userId}:${date}`,
  GOAL_PROGRESS: (userId: string, goalId: string) => `progress:${userId}:${goalId}`,
};

// Cache helper functions
export async function cacheUserGoals(userId: string, goals: unknown[], ttl = 300) {
  // Ensure we're storing a proper JSON string
  const jsonString = JSON.stringify(goals);
  await redis.setex(CACHE_KEYS.USER_GOALS(userId), ttl, jsonString);
}

export async function getCachedUserGoals(userId: string) {
  try {
    const cached = await redis.get(CACHE_KEYS.USER_GOALS(userId));
    if (!cached || cached === '' || cached === null || cached === undefined) {
      return null;
    }
    
    // Check for common invalid JSON strings
    const cachedString = typeof cached === 'string' ? cached : String(cached);
    if (
      cachedString.trim() === '' || 
      cachedString === 'null' || 
      cachedString === 'undefined' ||
      cachedString === '[object Object]' ||
      cachedString === '[object Array]'
    ) {
      console.warn(`Invalid cached value for user ${userId}: "${cachedString}"`);
      await redis.del(CACHE_KEYS.USER_GOALS(userId));
      return null;
    }
    
    return JSON.parse(cachedString);
  } catch (error) {
    console.error('Redis cache parse error:', error);
    console.error('Cached value that caused error:', await redis.get(CACHE_KEYS.USER_GOALS(userId)));
    // Clear the corrupted cache entry
    await redis.del(CACHE_KEYS.USER_GOALS(userId));
    return null;
  }
}

export async function invalidateUserGoalsCache(userId: string) {
  await redis.del(CACHE_KEYS.USER_GOALS(userId));
}

export async function cacheGoalDetail(goalId: string, goal: unknown, ttl = 600) {
  // Ensure we're storing a proper JSON string
  const jsonString = JSON.stringify(goal);
  await redis.setex(CACHE_KEYS.GOAL_DETAIL(goalId), ttl, jsonString);
}

export async function getCachedGoalDetail(goalId: string) {
  try {
    const cached = await redis.get(CACHE_KEYS.GOAL_DETAIL(goalId));
    if (!cached || cached === '' || cached === null || cached === undefined) {
      return null;
    }
    
    // Check for common invalid JSON strings
    const cachedString = typeof cached === 'string' ? cached : String(cached);
    if (
      cachedString.trim() === '' || 
      cachedString === 'null' || 
      cachedString === 'undefined' ||
      cachedString === '[object Object]' ||
      cachedString === '[object Array]'
    ) {
      console.warn(`Invalid cached value for goal ${goalId}: "${cachedString}"`);
      await redis.del(CACHE_KEYS.GOAL_DETAIL(goalId));
      return null;
    }
    
    return JSON.parse(cachedString);
  } catch (error) {
    console.error('Redis cache parse error:', error);
    console.error('Cached value that caused error:', await redis.get(CACHE_KEYS.GOAL_DETAIL(goalId)));
    await redis.del(CACHE_KEYS.GOAL_DETAIL(goalId));
    return null;
  }
}

export async function invalidateGoalCache(goalId: string, userId: string) {
  await Promise.all([
    redis.del(CACHE_KEYS.GOAL_DETAIL(goalId)),
    redis.del(CACHE_KEYS.USER_GOALS(userId)),
  ]);
}

export async function cacheDashboardData(userId: string, date: string, data: unknown, ttl = 300) {
  // Ensure we're storing a proper JSON string
  const jsonString = JSON.stringify(data);
  await redis.setex(CACHE_KEYS.DASHBOARD(userId, date), ttl, jsonString);
}

export async function getCachedDashboardData(userId: string, date: string) {
  try {
    const cached = await redis.get(CACHE_KEYS.DASHBOARD(userId, date));
    if (!cached || cached === '' || cached === null || cached === undefined) {
      return null;
    }
    
    // Additional validation for valid JSON string
    const cachedString = typeof cached === 'string' ? cached : String(cached);
    if (cachedString.trim() === '' || cachedString === 'null' || cachedString === 'undefined') {
      return null;
    }
    
    return JSON.parse(cachedString);
  } catch (error) {
    console.error('Redis cache parse error:', error);
    await redis.del(CACHE_KEYS.DASHBOARD(userId, date));
    return null;
  }
}

// Budget cache functions
export async function cacheUserBudgets(userId: string, budgets: unknown[], ttl = 300) {
  try {
    // Ensure we're storing a proper JSON string
    const jsonString = JSON.stringify(budgets);
    await redis.setex(CACHE_KEYS.USER_BUDGETS(userId), ttl, jsonString);
  } catch (error) {
    console.error('Redis cache error:', error);
  }
}

export async function getCachedUserBudgets(userId: string) {
  try {
    const cached = await redis.get(CACHE_KEYS.USER_BUDGETS(userId));
    if (!cached || cached === '' || cached === null || cached === undefined) {
      return null;
    }
    
    // Check for common invalid JSON strings
    const cachedString = typeof cached === 'string' ? cached : String(cached);
    if (
      cachedString.trim() === '' || 
      cachedString === 'null' || 
      cachedString === 'undefined' ||
      cachedString === '[object Object]' ||
      cachedString === '[object Array]'
    ) {
      console.warn(`Invalid cached value for user budgets ${userId}: "${cachedString}"`);
      await redis.del(CACHE_KEYS.USER_BUDGETS(userId));
      return null;
    }
    
    return JSON.parse(cachedString);
  } catch (error) {
    console.error('Redis cache parse error:', error);
    console.error('Cached value that caused error:', await redis.get(CACHE_KEYS.USER_BUDGETS(userId)));
    // Clear the corrupted cache entry
    await redis.del(CACHE_KEYS.USER_BUDGETS(userId));
    return null;
  }
}

export async function invalidateUserBudgetsCache(userId: string) {
  try {
    await redis.del(CACHE_KEYS.USER_BUDGETS(userId));
  } catch (error) {
    console.error('Redis cache error:', error);
  }
}

export async function cacheBudgetDetail(budgetId: string, budget: unknown, ttl = 600) {
  try {
    // Ensure we're storing a proper JSON string
    const jsonString = JSON.stringify(budget);
    await redis.setex(CACHE_KEYS.BUDGET_DETAIL(budgetId), ttl, jsonString);
  } catch (error) {
    console.error('Redis cache error:', error);
  }
}

export async function getCachedBudgetDetail(budgetId: string) {
  try {
    const cached = await redis.get(CACHE_KEYS.BUDGET_DETAIL(budgetId));
    if (!cached || cached === '' || cached === null || cached === undefined) {
      return null;
    }
    
    // Check for common invalid JSON strings
    const cachedString = typeof cached === 'string' ? cached : String(cached);
    if (
      cachedString.trim() === '' || 
      cachedString === 'null' || 
      cachedString === 'undefined' ||
      cachedString === '[object Object]' ||
      cachedString === '[object Array]'
    ) {
      console.warn(`Invalid cached value for budget ${budgetId}: "${cachedString}"`);
      await redis.del(CACHE_KEYS.BUDGET_DETAIL(budgetId));
      return null;
    }
    
    return JSON.parse(cachedString);
  } catch (error) {
    console.error('Redis cache parse error:', error);
    console.error('Cached value that caused error:', await redis.get(CACHE_KEYS.BUDGET_DETAIL(budgetId)));
    // Clear the corrupted cache entry
    await redis.del(CACHE_KEYS.BUDGET_DETAIL(budgetId));
    return null;
  }
}

export async function invalidateBudgetCache(budgetId: string, userId: string) {
  try {
    await Promise.all([
      redis.del(CACHE_KEYS.BUDGET_DETAIL(budgetId)),
      redis.del(CACHE_KEYS.USER_BUDGETS(userId)),
    ]);
  } catch (error) {
    console.error('Redis cache error:', error);
  }
}

// Budget alerts cache functions
export async function cacheBudgetAlerts(userId: string, alerts: unknown[], ttl = 300) {
  try {
    // Ensure we're storing a proper JSON string
    const jsonString = JSON.stringify(alerts);
    await redis.setex(CACHE_KEYS.BUDGET_ALERTS(userId), ttl, jsonString);
  } catch (error) {
    console.error('Redis cache error:', error);
  }
}

export async function getCachedBudgetAlerts(userId: string) {
  try {
    const cached = await redis.get(CACHE_KEYS.BUDGET_ALERTS(userId));
    if (!cached || cached === '' || cached === null || cached === undefined) {
      return null;
    }
    
    // Check for common invalid JSON strings
    const cachedString = typeof cached === 'string' ? cached : String(cached);
    if (
      cachedString.trim() === '' || 
      cachedString === 'null' || 
      cachedString === 'undefined' ||
      cachedString === '[object Object]' ||
      cachedString === '[object Array]'
    ) {
      console.warn(`Invalid cached value for budget alerts ${userId}: "${cachedString}"`);
      await redis.del(CACHE_KEYS.BUDGET_ALERTS(userId));
      return null;
    }
    
    return JSON.parse(cachedString);
  } catch (error) {
    console.error('Redis cache parse error:', error);
    console.error('Cached value that caused error:', await redis.get(CACHE_KEYS.BUDGET_ALERTS(userId)));
    // Clear the corrupted cache entry
    await redis.del(CACHE_KEYS.BUDGET_ALERTS(userId));
    return null;
  }
}

export async function invalidateBudgetAlertsCache(userId: string) {
  try {
    await redis.del(CACHE_KEYS.BUDGET_ALERTS(userId));
  } catch (error) {
    console.error('Redis cache error:', error);
  }
}