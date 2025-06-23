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
export async function cacheUserGoals(userId: string, goals: any[], ttl = 300) {
  await redis.setex(CACHE_KEYS.USER_GOALS(userId), ttl, JSON.stringify(goals));
}

export async function getCachedUserGoals(userId: string) {
  try {
    const cached = await redis.get(CACHE_KEYS.USER_GOALS(userId));
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
    // Clear the corrupted cache entry
    await redis.del(CACHE_KEYS.USER_GOALS(userId));
    return null;
  }
}

export async function invalidateUserGoalsCache(userId: string) {
  await redis.del(CACHE_KEYS.USER_GOALS(userId));
}

export async function cacheGoalDetail(goalId: string, goal: any, ttl = 600) {
  await redis.setex(CACHE_KEYS.GOAL_DETAIL(goalId), ttl, JSON.stringify(goal));
}

export async function getCachedGoalDetail(goalId: string) {
  try {
    const cached = await redis.get(CACHE_KEYS.GOAL_DETAIL(goalId));
    if (!cached || cached === '') return null;
    return JSON.parse(cached as string);
  } catch (error) {
    console.error('Redis cache parse error:', error);
    return null;
  }
}

export async function invalidateGoalCache(goalId: string, userId: string) {
  await Promise.all([
    redis.del(CACHE_KEYS.GOAL_DETAIL(goalId)),
    redis.del(CACHE_KEYS.USER_GOALS(userId)),
  ]);
}

export async function cacheDashboardData(userId: string, date: string, data: any, ttl = 300) {
  await redis.setex(CACHE_KEYS.DASHBOARD(userId, date), ttl, JSON.stringify(data));
}

export async function getCachedDashboardData(userId: string, date: string) {
  try {
    const cached = await redis.get(CACHE_KEYS.DASHBOARD(userId, date));
    if (!cached || cached === '') return null;
    return JSON.parse(cached as string);
  } catch (error) {
    console.error('Redis cache parse error:', error);
    return null;
  }
}

// Budget cache functions
export async function cacheUserBudgets(userId: string, budgets: any[], ttl = 300) {
  try {
    await redis.setex(CACHE_KEYS.USER_BUDGETS(userId), ttl, JSON.stringify(budgets));
  } catch (error) {
    console.error('Redis cache error:', error);
  }
}

export async function getCachedUserBudgets(userId: string) {
  try {
    const cached = await redis.get(CACHE_KEYS.USER_BUDGETS(userId));
    if (!cached || cached === '') return null;
    return JSON.parse(cached as string);
  } catch (error) {
    console.error('Redis cache parse error:', error);
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

export async function cacheBudgetDetail(budgetId: string, budget: any, ttl = 600) {
  try {
    await redis.setex(CACHE_KEYS.BUDGET_DETAIL(budgetId), ttl, JSON.stringify(budget));
  } catch (error) {
    console.error('Redis cache error:', error);
  }
}

export async function getCachedBudgetDetail(budgetId: string) {
  try {
    const cached = await redis.get(CACHE_KEYS.BUDGET_DETAIL(budgetId));
    if (!cached || cached === '') return null;
    return JSON.parse(cached as string);
  } catch (error) {
    console.error('Redis cache parse error:', error);
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