import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';

/**
 * Require valid JWT authentication header
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No authentication token provided' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // Payload shape: { userId, role, tenantId }
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Require specific user role(s)
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
}

/**
 * Require that tenant_admin belongs to the currently resolved req.tenant.
 * Super admin bypasses this check.
 */
export function requireTenantMatch(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role === 'super_admin') {
    return next();
  }

  if (req.user.role === 'tenant_admin') {
    if (req.tenant) {
      const userTenantId = req.user.tenantId ? req.user.tenantId.toString() : null;
      const resolvedTenantId = req.tenant._id.toString();

      if (userTenantId !== resolvedTenantId) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission for this tenant' });
      }
    } else {
      if (!req.user.tenantId) {
        return res.status(404).json({ error: 'Tenant context missing' });
      }
    }

    return next();
  }

  return res.status(403).json({ error: 'Forbidden: Tenant admin access required' });
}

// Export auth alias for backward compatibility
export const auth = requireAuth;
