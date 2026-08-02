import webpush from 'web-push';
import { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } from '../config.js';

console.log('Testing VAPID Key Configuration...');
console.log('Subject:', VAPID_SUBJECT);
console.log('Public Key:', VAPID_PUBLIC_KEY);
console.log('Private Key Length:', VAPID_PRIVATE_KEY ? VAPID_PRIVATE_KEY.length : 0);

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('✅ VAPID Keys setup SUCCESSFUL! Valid P-256 ECDSA key pair.');
} catch (err) {
  console.error('❌ VAPID Keys setup FAILED:', err.message);
}
