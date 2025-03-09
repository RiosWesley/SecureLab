// services/cacheService.js
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0 };
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes in ms
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) {
      this.stats.misses++;
      return null;
    }
    
    if (item.expiry && Date.now() > item.expiry) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return item.value;
  }

  set(key, value, ttl = this.defaultTTL) {
    const expiry = ttl ? Date.now() + ttl : null;
    this.cache.set(key, { value, expiry });
    return true;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;
    if (item.expiry && Date.now() > item.expiry) {
      this.delete(key);
      return false;
    }
    return true;
  }

  clear() {
    this.cache.clear();
    return true;
  }

  async getOrSet(key, callback, ttl = this.defaultTTL) {
    const cachedValue = this.get(key);
    if (cachedValue !== null) return cachedValue;
    
    try {
      const value = await callback();
      this.set(key, value, ttl);
      return value;
    } catch (error) {
      logger.error(`Cache getOrSet error for key ${key}: ${error.message}`);
      throw error;
    }
  }
  
  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses || 1)
    };
  }
}

const cacheService = new CacheService();
module.exports = cacheService;