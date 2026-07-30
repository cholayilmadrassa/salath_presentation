/**
 * Returns formatted Hijri Date (Arabic, Malayalam, English)
 */
export function getHijriDate(date = new Date()) {
  try {
    // 1. Arabic Hijri Formatter
    const formatterAr = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const formattedAr = formatterAr.format(date);

    // 2. English / Malayalam Hijri Formatter
    const formatterEn = new Intl.DateTimeFormat('en-TN-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const parts = formatterEn.formatToParts(date);
    const day = parts.find((p) => p.type === 'day')?.value || '';
    const month = parts.find((p) => p.type === 'month')?.value || '';
    const year = parts.find((p) => p.type === 'year')?.value || '';

    const malayalamMonths = {
      'Muharram': 'മുഹറം',
      'Safar': 'സഫർ',
      'Rabiʻ I': 'റബീഉൽ അവ്വൽ',
      'Rabiʻ II': 'റബീഉൽ ആഖിർ',
      'Jumada I': 'ജമാദുൽ അവ്വൽ',
      'Jumada II': 'ജമാദുൽ ആഖിർ',
      'Rajab': 'റജബ്',
      'Shaʻban': 'ശഅ്ബാൻ',
      'Ramadan': 'റമളാൻ',
      'Shawwal': 'ശവ്വാൽ',
      'Dhuʻl-Qiʻdah': 'ദുൽ ഖഅ്ദ്',
      'Dhuʻl-Hijjah': 'ദുൽ ഹിജ്ജ',
    };

    const mlMonth = malayalamMonths[month] || month;

    return {
      formattedAr, // e.g. ١٤ صفر ١٤٤٨ هـ
      formattedEn: `${day} ${month} ${year} AH`,
      formattedMl: `${day} ${mlMonth} ${year} ഹിജ്റ`,
      day,
      month: mlMonth,
      year,
    };
  } catch (e) {
    return {
      formattedAr: '١٤ صفر ١٤٤٨ هـ',
      formattedEn: 'Hijri Date',
      formattedMl: 'ഹിജ്‌രീ തീയതി',
      day: '',
      month: '',
      year: '',
    };
  }
}
