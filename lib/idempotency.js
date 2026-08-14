// lib/idempotency.js
// Idempotency tracking for webhook and critical operations
// In production, use Redis or database for persistence across restarts

const logger = require('./logger');

class IdempotencyStore {
  constructor() {
    this.store = new Map(); // key -> { timestamp, response }
    this.ttl = 3600000; // 1 hour in milliseconds
  }

  /**
   * Record an operation with its result
   */
  set(key, value) {
    this.store.set(key, {
      timestamp: Date.now(),
      response: value
    });
    logger.debug('Idempotency key stored', { key });
  }

  /**
   * Retrieve a previously processed operation
   */
  get(key) {
    const record = this.store.get(key);
    if (!record) return null;

    // Check if record has expired
    if (Date.now() - record.timestamp > this.ttl) {
      this.store.delete(key);
      logger.debug('Idempotency key expired', { key });
      return null;
    }

    return record.response;
  }

  /**
   * Check if operation was already processed
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Clear all expired records
   */
  cleanup() {
    const now = Date.now();
    let count = 0;
    for (const [key, record] of this.store.entries()) {
      if (now - record.timestamp > this.ttl) {
        this.store.delete(key);
        count++;
      }
    }
    if (count > 0) {
      logger.debug('Idempotency cleanup completed', { removedCount: count });
    }
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      totalKeys: this.store.size,
      timestamp: new Date().toISOString()
    };
  }
}

// Global idempotency store
const idempotencyStore = new IdempotencyStore();

// Cleanup every 30 minutes
setInterval(() => {
  idempotencyStore.cleanup();
}, 1800000);

module.exports = idempotencyStore;
