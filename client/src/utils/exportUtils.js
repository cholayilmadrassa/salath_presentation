import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Helper to format numbers nicely
const formatNum = (val) => {
  const num = Number(val) || 0;
  return num.toLocaleString('en-IN');
};

// Safe text cleaner for PDF rendering
const safePdfText = (str) => {
  if (!str) return '';
  return String(str).trim();
};

// Helper to convert Image URL or file path to Base64 Data URL for jsPDF
async function getLogoBase64(logoUrl) {
  const urlToTry = logoUrl || '/appLogo.png';
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(null);

    if (urlToTry.startsWith('data:image')) {
      return resolve(urlToTry);
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 100;
        canvas.height = img.naturalHeight || img.height || 100;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } catch (e) {
        if (urlToTry !== '/appLogo.png') {
          getLogoBase64('/appLogo.png').then(resolve);
        } else {
          resolve(null);
        }
      }
    };
    img.onerror = () => {
      if (urlToTry !== '/appLogo.png') {
        getLogoBase64('/appLogo.png').then(resolve);
      } else {
        resolve(null);
      }
    };
    img.src = urlToTry;
  });
}

/**
 * EXPORT ALL MEMBERS SUMMARY TO EXCEL
 */
export function exportMembersToExcel({ members = [], eventName = 'Salath Presentation' }) {
  const totalSwalath = members.reduce((sum, u) => sum + (Number(u.totalCount) || 0), 0);
  const nowStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Top Title & Heading block
  const headerData = [
    [safePdfText(eventName).toUpperCase()],
    ['MEMBERS DETAILS & ALL SWALATH COUNT REPORT'],
    [`Generated: ${nowStr}   |   Total Members: ${members.length}   |   Grand Total Swalath: ${formatNum(totalSwalath)}`],
    [], // empty row for spacing
    ['Sl. No.', 'Member Name', 'Phone Number', 'Place / Location', 'Total Swalath Count', 'Joined Date'],
  ];

  // Data rows
  const tableRows = members.map((u, idx) => [
    idx + 1,
    safePdfText(u.name || 'Member'),
    safePdfText(u.phone || '-'),
    safePdfText(u.place || u.address || '-'),
    Number(u.totalCount) || 0,
    u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '-',
  ]);

  // Total Summary Footer Row
  tableRows.push([
    '',
    `TOTAL SUMMARY (${members.length} Members)`,
    '',
    '',
    totalSwalath,
    '',
  ]);

  const fullData = [...headerData, ...tableRows];
  const ws = XLSX.utils.aoa_to_sheet(fullData);

  ws['!cols'] = [
    { wch: 8 },  // Sl. No.
    { wch: 28 }, // Name
    { wch: 20 }, // Phone
    { wch: 24 }, // Place
    { wch: 22 }, // Total Count
    { wch: 15 }, // Joined Date
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Members Details');

  const cleanEventName = eventName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `${cleanEventName}_members_details_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * EXPORT ALL MEMBERS SUMMARY TO PDF (WITH BRANDING LOGO)
 */
export async function exportMembersToPdf({ members = [], eventName = 'Salath Presentation', logoUrl = '' }) {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const totalSwalath = members.reduce((sum, u) => sum + (Number(u.totalCount) || 0), 0);
  const nowStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Load Base64 Logo Image
  const logoBase64 = await getLogoBase64(logoUrl);

  // Header Banner Background
  doc.setFillColor(41, 110, 55); // #296E37 Primary Green
  doc.rect(0, 0, 210, 28, 'F');

  let textX = 14;
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 14, 4, 20, 20);
      textX = 38;
    } catch (e) {
      console.warn('PDF image draw error:', e);
      textX = 14;
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(safePdfText(eventName), textX, 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('MEMBERS DETAILS & ALL SWALATH COUNT REPORT', textX, 21);

  doc.setFontSize(8);
  doc.text(`Generated: ${nowStr}`, 196, 21, { align: 'right' });

  // Summary Card Box
  doc.setFillColor(243, 248, 244);
  doc.setDrawColor(200, 225, 205);
  doc.roundedRect(14, 32, 182, 18, 3, 3, 'FD');

  doc.setTextColor(41, 110, 55);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Members:', 20, 43);

  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.text(`${members.length}`, 50, 43);

  doc.setTextColor(41, 110, 55);
  doc.text('Grand Total Swalath Count:', 100, 43);

  doc.setTextColor(212, 175, 55); // Gold Accent
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`${formatNum(totalSwalath)}`, 155, 43);

  // Table Columns & Data
  const tableHead = [['#', 'Member Name', 'Contact Details', 'Place / Location', 'Total Swalath']];
  const tableRows = members.map((u, idx) => [
    idx + 1,
    safePdfText(u.name || 'Member'),
    safePdfText(u.phone || u.email || '-'),
    safePdfText(u.place || u.address || '-'),
    formatNum(u.totalCount || 0),
  ]);

  // Total Summary Footer Row in Table
  tableRows.push([
    '',
    `TOTAL (${members.length} Members)`,
    '',
    '',
    formatNum(totalSwalath),
  ]);

  autoTable(doc, {
    startY: 55,
    head: tableHead,
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 110, 55],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [40, 40, 40],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 55, fontStyle: 'bold' },
      2: { cellWidth: 50 },
      3: { cellWidth: 40 },
      4: { cellWidth: 27, halign: 'right', fontStyle: 'bold', textColor: [41, 110, 55] },
    },
    alternateRowStyles: {
      fillColor: [248, 251, 248],
    },
    didParseCell: (data) => {
      // Highlight last summary row
      if (data.section === 'body' && data.rowIndex === tableRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [230, 244, 234];
        data.cell.styles.textColor = [41, 110, 55];
      }
    },
    didDrawPage: (data) => {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount} • ${eventName}`,
        105,
        290,
        { align: 'center' }
      );
    },
    margin: { top: 55, left: 14, right: 14, bottom: 15 },
  });

  const cleanEventName = eventName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `${cleanEventName}_members_details_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

/**
 * EXPORT INDIVIDUAL MEMBER HISTORY TO EXCEL
 */
export function exportMemberHistoryToExcel({
  member = {},
  historyItems = [],
  eventName = 'Salath Presentation',
  memberTotal = 0,
}) {
  const nowStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const memberName = safePdfText(member.name || 'Member');
  const contactInfo = member.phone || member.email || 'N/A';
  const locationInfo = member.place || 'N/A';

  // Top Heading & Info block
  const headerData = [
    [safePdfText(eventName).toUpperCase()],
    [`MEMBER SWALATH HISTORY REPORT - ${memberName.toUpperCase()}`],
    [`Contact: ${contactInfo}   |   Location: ${locationInfo}   |   Total Swalath: ${formatNum(memberTotal)}   |   Submissions: ${historyItems.length}`],
    [`Generated: ${nowStr}`],
    [], // empty spacing row
    ['Sl. No.', 'Date', 'Time', 'Swalath Count Added', 'Note / Remark'],
  ];

  const tableRows = historyItems.map((item, idx) => {
    const createdTime = item.createdAt
      ? new Date(item.createdAt).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '-';

    return [
      idx + 1,
      item.date || '-',
      createdTime,
      Number(item.value) || 0,
      safePdfText(item.note || '-'),
    ];
  });

  // Append Total Row
  tableRows.push([
    '',
    `TOTAL (${historyItems.length} Submissions)`,
    '',
    Number(memberTotal) || 0,
    '',
  ]);

  const fullData = [...headerData, ...tableRows];
  const ws = XLSX.utils.aoa_to_sheet(fullData);

  ws['!cols'] = [
    { wch: 8 },  // Sl No
    { wch: 15 }, // Date
    { wch: 12 }, // Time
    { wch: 22 }, // Count
    { wch: 30 }, // Note
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Member History');

  const cleanName = memberName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `${cleanName}_swalath_history_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * EXPORT INDIVIDUAL MEMBER HISTORY TO PDF (WITH BRANDING LOGO)
 */
export async function exportMemberHistoryToPdf({
  member = {},
  historyItems = [],
  eventName = 'Salath Presentation',
  memberTotal = 0,
  logoUrl = '',
}) {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const nowStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Load Base64 Logo Image
  const logoBase64 = await getLogoBase64(logoUrl);

  // Header Banner Background
  doc.setFillColor(41, 110, 55); // Primary Green
  doc.rect(0, 0, 210, 28, 'F');

  let textX = 14;
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 14, 4, 20, 20);
      textX = 38;
    } catch (e) {
      console.warn('PDF image draw error:', e);
      textX = 14;
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(safePdfText(eventName), textX, 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`MEMBER HISTORY REPORT: ${safePdfText(member.name || 'Member').toUpperCase()}`, textX, 21);

  doc.setFontSize(8);
  doc.text(`Generated: ${nowStr}`, 196, 21, { align: 'right' });

  // Member Summary Box
  doc.setFillColor(243, 248, 244);
  doc.setDrawColor(200, 225, 205);
  doc.roundedRect(14, 32, 182, 24, 3, 3, 'FD');

  doc.setTextColor(41, 110, 55);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(safePdfText(member.name || 'Member Details'), 20, 40);

  doc.setTextColor(80, 80, 80);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  const contactText = `Contact: ${member.phone || member.email || 'N/A'}${member.place ? ` • Location: ${member.place}` : ''}`;
  doc.text(safePdfText(contactText), 20, 48);

  doc.setTextColor(41, 110, 55);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Swalath:', 130, 40);
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(12);
  doc.text(`${formatNum(memberTotal)}`, 160, 40);

  doc.setTextColor(41, 110, 55);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Submissions:', 130, 48);
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(10);
  doc.text(`${historyItems.length} entries`, 160, 48);

  // Table Data
  const tableHead = [['#', 'Date', 'Time', 'Swalath Added', 'Notes / Remarks']];
  const tableRows = historyItems.map((item, idx) => {
    const createdTime = item.createdAt
      ? new Date(item.createdAt).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '-';

    return [
      idx + 1,
      item.date || '-',
      createdTime,
      `+${formatNum(item.value || 0)}`,
      safePdfText(item.note || '-'),
    ];
  });

  // Summary footer row
  tableRows.push([
    '',
    `TOTAL (${historyItems.length} Entries)`,
    '',
    `+${formatNum(memberTotal)}`,
    '',
  ]);

  autoTable(doc, {
    startY: 60,
    head: tableHead,
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 110, 55],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [40, 40, 40],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 35, fontStyle: 'bold' },
      2: { cellWidth: 25 },
      3: { cellWidth: 35, fontStyle: 'bold', textColor: [41, 110, 55] },
      4: { cellWidth: 77 },
    },
    alternateRowStyles: {
      fillColor: [248, 251, 248],
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.rowIndex === tableRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [230, 244, 234];
        data.cell.styles.textColor = [41, 110, 55];
      }
    },
    didDrawPage: (data) => {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount} • ${safePdfText(member.name)} (${eventName})`,
        105,
        290,
        { align: 'center' }
      );
    },
    margin: { top: 60, left: 14, right: 14, bottom: 15 },
  });

  const cleanName = (member.name || 'member').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `${cleanName}_swalath_history_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
