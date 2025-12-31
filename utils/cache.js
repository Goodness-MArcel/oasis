// Simple in-memory cache for performance optimization
class MemoryCache {
  constructor() {
    this.cache = new Map();
  }

  set(key, value, ttlMs = 300000) { // Default 5 minutes TTL
    const expiresAt = Date.now() + ttlMs;
    this.cache.set(key, { value, expiresAt });

    // Auto-cleanup expired entries
    setTimeout(() => this.cache.delete(key), ttlMs);
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

export const cache = new MemoryCache();

// Cache keys for common data
export const CACHE_KEYS = {
  TOTAL_USERS: 'total_users',
  TOTAL_COURSES: 'total_courses',
  ANALYTICS_DATA: 'analytics_data',
  DASHBOARD_STATS: 'dashboard_stats'
};