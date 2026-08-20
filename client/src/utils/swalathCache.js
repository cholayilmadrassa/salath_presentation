import { api } from '../api.js';

const TOTAL_CACHE_PREFIX = 'salath_total_count_cache_';
const CACHE_EVENT_NAME = 'swalath_total_cache_updated';

/**
 * Extract consistent tenant identifier for caching
 */
export function getTenantCacheKey(tenant) {
  if (!tenant) return 'global';
  if (typeof tenant === 'string') return tenant;
  return tenant._id || tenant.slug || 'global';
}

/**
 * Read cached total swalath data for a tenant from localStorage.
 * Returns { total: number, memberCount: number, updatedAt: number } or null.
 */
export function getCachedTotalSwalath(tenant) {
  try {
    const key = TOTAL_CACHE_PREFIX + getTenantCacheKey(tenant);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'number') {
      return { total: parsed, memberCount: 0, updatedAt: 0 };
    }
    if (parsed && typeof parsed.total === 'number') {
      return {
        total: Number(parsed.total) || 0,
        memberCount: Number(parsed.memberCount) || 0,
        updatedAt: Number(parsed.updatedAt) || 0,
      };
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Save total swalath to localStorage cache and notify any active components.
 */
export function setCachedTotalSwalath(tenant, data) {
  try {
    const tenantKey = getTenantCacheKey(tenant);
    const key = TOTAL_CACHE_PREFIX + tenantKey;
    const cacheObj = {
      total: Number(data.total) || 0,
      memberCount: Number(data.memberCount) || 0,
      updatedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cacheObj));

    // Dispatch event so all active views update in real-time
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(CACHE_EVENT_NAME, {
          detail: { tenantKey, ...cacheObj },
        })
      );
    }
    return cacheObj;
  } catch (err) {
    // Ignore storage quota errors
  }
}

/**
 * Optimistically increment total count in cache (e.g. after submitting a count).
 */
export function incrementCachedTotalSwalath(tenant, incrementBy) {
  try {
    const current = getCachedTotalSwalath(tenant);
    const prevTotal = current?.total || 0;
    const memberCount = current?.memberCount || 0;
    const newTotal = Math.max(0, prevTotal + (Number(incrementBy) || 0));
    return setCachedTotalSwalath(tenant, { total: newTotal, memberCount });
  } catch (err) {
    // Ignore
  }
}

/**
 * Fetch latest total swalath from the backend and update the cache.
 */
export async function fetchAndCacheTotalSwalath(tenant) {
  const tenantKey = getTenantCacheKey(tenant);
  try {
    // 1. Try fast dedicated /counts/total endpoint
    const res = await api('/counts/total').catch(() => null);

    if (res && typeof res.total === 'number') {
      const result = {
        total: Number(res.total) || 0,
        memberCount: Number(res.memberCount) || 0,
      };
      setCachedTotalSwalath(tenantKey, result);
      return result;
    }

    // 2. Fallback to /counts/leaderboard/all
    const allRows = await api('/counts/leaderboard/all?limit=100').catch(() => null);
    if (Array.isArray(allRows)) {
      const sum = allRows.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
      const result = {
        total: sum,
        memberCount: allRows.length,
      };
      setCachedTotalSwalath(tenantKey, result);
      return result;
    }

    return null;
  } catch (err) {
    console.warn('[TOTAL SWALATH FETCH ERROR]:', err);
    return null;
  }
}

export { CACHE_EVENT_NAME };
