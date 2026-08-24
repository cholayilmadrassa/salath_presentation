/**
 * Utility functions for evaluating campaign Swalath submission window and cutoff countdowns.
 */

const ML_MONTHS = [
  'ജനുവരി', 'ഫെബ്രുവരി', 'മാർച്ച്', 'ഏപ്രിൽ', 'മെയ്', 'ജൂൺ',
  'ജൂലൈ', 'ആഗസ്റ്റ്', 'സെപ്റ്റംബർ', 'ഒക്ടോബർ', 'നവംബർ', 'ഡിസംബർ'
];

/**
 * Format a Date object or ISO string into a readable Malayalam + English date-time representation.
 * Example: "2026 ആഗസ്റ്റ് 28, 11:59 PM"
 */
export function formatCutoffDateTime(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  const day = d.getDate();
  const monthMl = ML_MONTHS[d.getMonth()] || '';
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;

  return `${year} ${monthMl} ${day}, ${hours}:${minutes} ${ampm}`;
}

/**
 * Calculate time remaining from now until target date.
 */
export function getTimeRemaining(targetDate) {
  if (!targetDate) return { totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };

  const targetTime = new Date(targetDate).getTime();
  if (isNaN(targetTime)) return { totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };

  const now = Date.now();
  const totalMs = targetTime - now;

  if (totalMs <= 0) {
    return { totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const seconds = Math.floor((totalMs / 1000) % 60);
  const minutes = Math.floor((totalMs / 1000 / 60) % 60);
  const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));

  return {
    totalMs,
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
  };
}

/**
 * Returns comprehensive submission status for a tenant:
 * - isOpen: boolean (whether user can submit right now)
 * - isScheduled: boolean (whether a cutoff date was configured)
 * - isClosed: boolean (submissions stopped manually or cutoff reached)
 * - status: 'open' | 'scheduled' | 'expired' | 'closed'
 * - cutoffDate: Date | null
 * - formattedCutoff: string
 * - timeRemaining: Object
 */
export function getSubmissionStatus(tenant) {
  const settings = tenant?.settings || {};
  const allowAddSwalath = settings.allowAddSwalath !== false; // Default true
  const submissionCutoff = settings.submissionCutoff || null;

  if (!allowAddSwalath) {
    return {
      isOpen: false,
      isClosed: true,
      isScheduled: false,
      status: 'closed',
      reason: 'manually_closed',
      cutoffDate: null,
      formattedCutoff: '',
      timeRemaining: { totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true },
    };
  }

  if (submissionCutoff) {
    const cutoffDate = new Date(submissionCutoff);
    if (!isNaN(cutoffDate.getTime())) {
      const timeRemaining = getTimeRemaining(cutoffDate);
      const isExpired = timeRemaining.isExpired;

      return {
        isOpen: !isExpired,
        isClosed: isExpired,
        isScheduled: true,
        status: isExpired ? 'expired' : 'scheduled',
        reason: isExpired ? 'cutoff_reached' : 'scheduled_active',
        cutoffDate,
        formattedCutoff: formatCutoffDateTime(cutoffDate),
        timeRemaining,
      };
    }
  }

  return {
    isOpen: true,
    isClosed: false,
    isScheduled: false,
    status: 'open',
    reason: 'always_open',
    cutoffDate: null,
    formattedCutoff: '',
    timeRemaining: { totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true },
  };
}
