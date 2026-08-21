import cron from 'node-cron';
import { processDueNotifications, triggerDailyReminders, checkAndTriggerPrayerTimes, fetchServerPrayerTimes } from './pushNotificationService.js';

let isInitialized = false;

export function initNotificationScheduler() {
  if (isInitialized) return;
  isInitialized = true;

  console.log('[SCHEDULER]: Initializing Web Push background jobs & Prayer Time monitors...');

  // Run immediate check on startup for pending due notifications and pre-warm prayer times
  processDueNotifications().catch((err) => console.error('[SCHEDULER]: Startup check error:', err));
  fetchServerPrayerTimes().catch((err) => console.error('[SCHEDULER]: Prayer cache pre-warm error:', err));
  checkAndTriggerPrayerTimes().catch((err) => console.error('[SCHEDULER]: Initial prayer time check error:', err));

  // 1. Process due scheduled admin notifications & check prayer times every 1 minute
  cron.schedule('* * * * *', async () => {
    try {
      await processDueNotifications();
    } catch (err) {
      console.error('[SCHEDULER]: Scheduled notification worker error:', err);
    }

    try {
      await checkAndTriggerPrayerTimes();
    } catch (err) {
      console.error('[SCHEDULER]: Prayer time worker error:', err);
    }
  });

  // 2. Daily Swalath reminder at 8:00 PM (20:00) IST -> 14:30 UTC
  // Standard cron format: 30 14 * * * (runs daily at 14:30 UTC / 20:00 IST)
  cron.schedule('30 14 * * *', async () => {
    console.log('[SCHEDULER]: Triggering scheduled daily Swalath reminder...');
    try {
      await triggerDailyReminders();
    } catch (err) {
      console.error('[SCHEDULER]: Daily reminder worker error:', err);
    }
  });

  console.log('[SCHEDULER]: Background notification jobs active.');
}
