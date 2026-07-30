import User from '../models/User.js';
import { hashPassword } from './hash.js';

/**
 * Ensures a valid Super Admin account exists and credentials are up to date.
 */
export async function seedSuperAdmin() {
  try {
    const email = (process.env.SUPER_ADMIN_EMAIL || 'superadmin@salath.org').toLowerCase().trim();
    const password = process.env.SUPER_ADMIN_PASSWORD || 'admin123';
    const name = 'Super Administrator';

    let admin = await User.findOne({ email });

    if (!admin) {
      // Check if any super admin exists by role
      admin = await User.findOne({ role: 'super_admin' });
    }

    if (!admin) {
      admin = await User.create({
        name,
        email,
        passwordHash: hashPassword(password),
        role: 'super_admin',
        tenantId: null,
      });
      console.log(`[SEED] Super Admin account created:`);
      console.log(`       Email: ${admin.email}`);
      console.log(`       Password: ${password}`);
    } else {
      // Always update email, role, and password to match env / default settings
      admin.email = email;
      admin.role = 'super_admin';
      admin.passwordHash = hashPassword(password);
      await admin.save();

      console.log(`[SEED] Super Admin account synced:`);
      console.log(`       Email: ${admin.email}`);
      console.log(`       Password: ${password}`);
    }
  } catch (err) {
    console.error('[SEED ERROR] Failed to seed super admin:', err.message);
  }
}
