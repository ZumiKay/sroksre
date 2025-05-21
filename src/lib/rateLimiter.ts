// lib/ratelimit.ts
interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitRecord {
  timestamps: number[];
  blockedUntil?: number;
}

type RateLimitKey = string; // IP + Route identifier

export class RateLimiter {
  private store: Map<RateLimitKey, RateLimitRecord>;
  private readonly options: RateLimitOptions;

  constructor(options: RateLimitOptions) {
    this.store = new Map();
    this.options = {
      windowMs: options.windowMs || 60 * 1000, // Default: 1 minute
      maxRequests: options.maxRequests || 60, // Default: 60 requests per window
    };

    // Setup cleanup to prevent memory leaks
    setInterval(() => this.cleanup(), 10 * 60 * 1000); // Cleanup every 10 minutes
  }

  /**
   * Try a request against the rate limiter
   * @param key The identifier (usually IP + route)
   * @returns An object containing whether the request is allowed and rate limit information
   */
  public try(key: RateLimitKey) {
    const now = Date.now();
    const record = this.getRecord(key);

    // Check if the IP is currently blocked
    if (record.blockedUntil && record.blockedUntil > now) {
      const retryAfter = Math.ceil((record.blockedUntil - now) / 1000);
      return {
        success: false,
        limit: this.options.maxRequests,
        remaining: 0,
        retryAfter,
        reset: Math.ceil(record.blockedUntil / 1000),
      };
    }

    // Clean old timestamps outside of the current window
    const windowStart = now - this.options.windowMs;
    record.timestamps = record.timestamps.filter(
      (timestamp) => timestamp > windowStart
    );

    // Check if the request exceeds the rate limit
    if (record.timestamps.length >= this.options.maxRequests) {
      // Block the IP for the window duration
      record.blockedUntil = now + this.options.windowMs;

      // Return failure
      return {
        success: false,
        limit: this.options.maxRequests,
        remaining: 0,
        retryAfter: Math.ceil(this.options.windowMs / 1000),
        reset: Math.ceil(record.blockedUntil / 1000),
      };
    }

    // Add current timestamp and update the record
    record.timestamps.push(now);
    this.store.set(key, record);

    // Return success
    return {
      success: true,
      limit: this.options.maxRequests,
      remaining: this.options.maxRequests - record.timestamps.length,
      reset: Math.ceil((now + this.options.windowMs) / 1000),
    };
  }

  /**
   * Reset rate limit for a specific key
   * @param key The identifier to reset
   */
  public reset(key: RateLimitKey) {
    this.store.delete(key);
  }

  /**
   * Get all current rate limit records (for debugging)
   */
  public getAll() {
    return Object.fromEntries(this.store);
  }

  /**
   * Create or retrieve the rate limit record for a key
   */
  private getRecord(key: RateLimitKey): RateLimitRecord {
    if (!this.store.has(key)) {
      this.store.set(key, { timestamps: [] });
    }
    return this.store.get(key)!;
  }

  /**
   * Clean up old records to prevent memory leaks
   */
  private cleanup() {
    const now = Date.now();

    // Get all keys first to avoid iteration issues
    const keys = Array.from(this.store.keys());

    // Check each key and remove if needed
    keys.forEach((key) => {
      const record = this.store.get(key)!;

      // If there are no recent timestamps and not currently blocked, delete the record
      const hasRecentActivity = record.timestamps.some(
        (timestamp) => timestamp > now - this.options.windowMs * 2
      );

      if (
        !hasRecentActivity &&
        (!record.blockedUntil || record.blockedUntil < now)
      ) {
        this.store.delete(key);
      }
    });
  }
}

// Create specific rate limiters
export const globalRateLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 100,
});
export const authRateLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
});
export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
});

/**
 * Helper function to create a rate limit key from an IP and path
 */
export function getRateLimitKey(ip: string, path: string): string {
  return `${ip}:${path}`;
}
