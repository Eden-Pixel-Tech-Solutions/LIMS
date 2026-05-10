import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  red:          '#C0272D',
  redDark:      '#9B1E23',
  redLight:     '#FDECEA',
  white:        '#FFFFFF',
  black:        '#000000',
  colHeader:    '#1A1A1A',
  rowText:      '#1A1A1A',
  subHeader:    '#1A1A1A',
  normalVal:    '#166534',
  highVal:      '#C0272D',
  normalFlagBg: '#166534',
  highFlagBg:   '#C0272D',
  flagText:     '#FFFFFF',
  altRow:       '#F9F9F9',
  subHeaderBg:  '#F0F0F0',
  borderLight:  '#DDDDDD',
  headerLine:   '#CCCCCC',
  gray:         '#555555',
  lightGray:    '#999999',
  footerGray:   '#444444',
  patientBg:    '#FAFAFA',
  labelColor:   '#888888',
};

// ─── Layout ───────────────────────────────────────────────────────────────────
const PAGE_W    = 595.28;
const PAGE_H    = 841.89;
const MARGIN    = 30;
const CONTENT_W = PAGE_W - MARGIN * 2;

// Column widths: Observation | Result | Unit | Ref
const COL = {
  obs:    CONTENT_W * 0.40,
  result: CONTENT_W * 0.15,
  unit:   CONTENT_W * 0.12,
  ref:    CONTENT_W * 0.33,
};
const COL_X = {
  obs:    MARGIN,
  result: MARGIN + COL.obs,
  unit:   MARGIN + COL.obs + COL.result,
  ref:    MARGIN + COL.obs + COL.result + COL.unit,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function resolveFlag(flag) {
  const f = (flag || 'normal').toLowerCase();
  if (['high', 'h', 'critical', 'c'].includes(f)) {
    return { label: 'HIGH',   valColor: C.highVal,   bgColor: C.highFlagBg,   textColor: C.flagText };
  } else if (['low', 'l'].includes(f)) {
    return { label: 'LOW',    valColor: C.highVal,   bgColor: C.highFlagBg,   textColor: C.flagText };
  } else {
    return { label: 'NORMAL', valColor: C.normalVal, bgColor: C.normalFlagBg, textColor: C.flagText };
  }
}

function measureTextHeight(doc, text, maxW, fontSize = 8, font = 'Helvetica') {
  doc.font(font).fontSize(fontSize);
  return doc.heightOfString(text, { width: maxW, lineGap: 2 });
}

function rect(doc, x, y, w, h, color) {
  doc.rect(x, y, w, h).fill(color);
}

function rectStroke(doc, x, y, w, h, color, lw = 0.5) {
  doc.rect(x, y, w, h).lineWidth(lw).stroke(color);
}

// ─── Hospital Header ──────────────────────────────────────────────────────────
function drawHospitalHeader(doc, report) {
  const y = MARGIN;

  // Left: Logo mark + tagline
  doc.font('Helvetica-Bold').fontSize(22).fillColor(C.red);
  doc.text('H·O·D', MARGIN, y);
  doc.font('Helvetica').fontSize(7).fillColor(C.gray);
  doc.text('HOUSE of DIAGNOSTICS', MARGIN, y + 26);

  // Right: Hospital name + contact
  const rightX = PAGE_W - MARGIN - 200;
  doc.font('Helvetica-Bold').fontSize(14).fillColor(C.red);
  doc.text('MERIL HIMS HOSPITAL', rightX, y, { width: 200, align: 'right' });
  doc.font('Helvetica').fontSize(7.5).fillColor(C.gray);
  doc.text('123 Healthcare Avenue, Medical District', rightX, y + 18, { width: 200, align: 'right' });
  doc.text('Phone: +91-1234567890  |  lab@merilhims.com', rightX, y + 28, { width: 200, align: 'right' });

  const lineY = y + 44;
  doc.moveTo(MARGIN, lineY).lineTo(PAGE_W - MARGIN, lineY).lineWidth(1.5).stroke(C.red);
  return lineY + 8;
}

// ─── Patient Info Block (with QR code on right) ───────────────────────────────
async function drawPatientInfo(doc, report, startY) {
  const QR_SIZE     = 64;
  const QR_LABEL_H  = 16;  // ← increased from 10 to give label room
  const BLOCK_PAD   = 10;
  const ROW_H       = 16;
  const NUM_ROWS    = 2;

  // Block must be tall enough for both the 2-row fields AND the QR + its label
  const fieldsNeeded = BLOCK_PAD + ROW_H * NUM_ROWS + BLOCK_PAD;
  const qrNeeded     = BLOCK_PAD + QR_SIZE + QR_LABEL_H + BLOCK_PAD;
  const blockH       = Math.max(fieldsNeeded, qrNeeded);

  const fields = [
    { label: 'Patient Name',    value: report.patient_name },
    { label: 'Lab No',          value: report.sample_id },
    { label: 'Registration On', value: report.registration_date },
    { label: 'CRN No',      value: report.patient_reg_no },
    { label: 'Age / Sex',       value: `${report.age} / ${report.gender}` },
    { label: 'Referred By',     value: report.referred_by },
    { label: 'Centre',          value: report.centre },
  ];

  // Background
  rect(doc, MARGIN, startY, CONTENT_W, blockH, C.patientBg);
  rectStroke(doc, MARGIN, startY, CONTENT_W, blockH, C.borderLight, 0.5);

  // Left accent bar
  rect(doc, MARGIN, startY, 3, blockH, C.red);

  // ── QR Code: positioned first, with explicit absolute coordinates ──────────
  const qrX     = PAGE_W - MARGIN - QR_SIZE - BLOCK_PAD;
  // Centre the QR image within the block (label sits below, inside padding)
  const qrAreaH = QR_SIZE + QR_LABEL_H;
  const qrY     = startY + (blockH - qrAreaH) / 2;
  const labelY  = qrY + QR_SIZE + 4; // ← fixed absolute Y, not relative to doc.y

  if (report.report_url) {
    try {
      const qrDataUrl = await QRCode.toDataURL(report.report_url, {
        width: QR_SIZE * 2,
        margin: 1,
        color: { dark: '#000000', light: '#FFFFFF' },
      });
      // Thin border around QR only (not around label)
      rectStroke(doc, qrX - 2, qrY - 2, QR_SIZE + 4, QR_SIZE + 4, C.borderLight, 0.5);
      doc.image(qrDataUrl, qrX, qrY, { width: QR_SIZE, height: QR_SIZE });

      // ← Key fix: use explicit absolute Y, lineBreak:false, and clip to QR width
      doc.font('Helvetica').fontSize(5.5).fillColor(C.lightGray);
      doc.text('Scan to Download Report', qrX, labelY, {
        width: QR_SIZE,
        align: 'center',
        lineBreak: false,
      });
    } catch (e) {
      // QR failed silently
    }
  }

  // Vertical divider before QR area
  const divX = qrX - BLOCK_PAD - 4;
  doc.moveTo(divX, startY + 6).lineTo(divX, startY + blockH - 6)
     .lineWidth(0.4).stroke(C.borderLight);

  // ── Patient fields ─────────────────────────────────────────────────────────
  // Use absolute Y positions derived from startY — never rely on doc.y
  const totalFieldsH = ROW_H * NUM_ROWS + 7 * (NUM_ROWS - 1);
  const fieldsW      = divX - MARGIN - 10;
  const colW         = fieldsW / 4;
  const firstRowY    = startY + (blockH - totalFieldsH) / 2;

  const rows = [fields.slice(0, 4), fields.slice(4)];

  rows.forEach((row, ri) => {
    const rowY = firstRowY + ri * (ROW_H + 7);
    row.forEach(({ label, value }, ci) => {
      const fx = MARGIN + 8 + ci * colW;

      doc.font('Helvetica').fontSize(6.5).fillColor(C.labelColor);
      doc.text(label.toUpperCase(), fx, rowY, { width: colW - 4, lineBreak: false });

      doc.font('Helvetica-Bold').fontSize(8).fillColor(C.colHeader);
      doc.text(value || '—', fx, rowY + 8, { width: colW - 4, lineBreak: false });
    });
  });

  // Bottom separator
  const afterY = startY + blockH;
  doc.moveTo(MARGIN, afterY).lineTo(PAGE_W - MARGIN, afterY)
     .lineWidth(0.5).stroke(C.borderLight);

  return afterY + 8;
}

// ─── Section Banner ───────────────────────────────────────────────────────────
function drawSectionBanner(doc, test, startY) {
  const BANNER_H = 20;
  const META_H   = 18;

  // Red bar: test name | sample type
  rect(doc, MARGIN, startY, CONTENT_W, BANNER_H, C.red);

  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C.white);
  doc.text((test.test_name || '').toUpperCase(), MARGIN + 6, startY + 5, { width: CONTENT_W * 0.55 });

  doc.font('Helvetica').fontSize(8.5).fillColor(C.white);
  doc.text(test.sample_type || '', MARGIN + 6, startY + 5.5, { width: CONTENT_W - 12, align: 'right' });

  // Darker sub-row
  const metaY = startY + BANNER_H;
  rect(doc, MARGIN, metaY, CONTENT_W, META_H, C.redDark);

  const metaColW = CONTENT_W / 4;

  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.white);
  doc.text('Accession No:', MARGIN + 6, metaY + 2);
  doc.font('Helvetica').fontSize(7.5).fillColor(C.white);
  doc.text(test.accession_no || 'N/A', MARGIN + 6, metaY + 10);

  const metaItems = [
    { label: 'Collected On:', value: test.collected_on },
    { label: 'Received On:',  value: test.received_on  },
    { label: 'Approved On:',  value: test.approved_on  },
  ];
  metaItems.forEach((item, i) => {
    const mx = MARGIN + metaColW * (i + 1);
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.white);
    doc.text(`${item.label}  `, mx, metaY + 5, { continued: true });
    doc.font('Helvetica').fontSize(7.5).fillColor(C.white);
    doc.text(item.value || 'N/A', { continued: false });
  });

  return metaY + META_H;
}

// ─── Column Headers ───────────────────────────────────────────────────────────
function drawColumnHeaders(doc, startY) {
  const ROW_H = 18;
  rect(doc, MARGIN, startY, CONTENT_W, ROW_H, '#EEEEEE');

  doc.moveTo(MARGIN, startY + ROW_H).lineTo(PAGE_W - MARGIN, startY + ROW_H)
     .lineWidth(0.8).stroke(C.red);

  const headers = [
    { label: 'Observation',              x: COL_X.obs,    w: COL.obs,    align: 'left'   },
    { label: 'Result',                   x: COL_X.result, w: COL.result, align: 'center' },
    { label: 'Unit',                     x: COL_X.unit,   w: COL.unit,   align: 'center' },
    { label: 'Biological Ref. Interval', x: COL_X.ref,    w: COL.ref,    align: 'left'   },
  ];

  doc.font('Helvetica-Bold').fontSize(8).fillColor(C.colHeader);
  headers.forEach(h => {
    doc.text(h.label, h.x + (h.align === 'left' ? 5 : 0), startY + 5,
      { width: h.w, align: h.align });
  });

  return startY + ROW_H;
}

// ─── Row helpers ──────────────────────────────────────────────────────────────
function measureRowHeight(doc, param) {
  if (param.is_subheader) return 16;
  const obsH = measureTextHeight(doc, param.parameter_name || '', COL.obs - 10);
  const refH = measureTextHeight(doc, param.reference_range || '', COL.ref - 10);
  return Math.max(obsH, refH, 18) + 6;
}

function drawDataRow(doc, param, rowY, rowIndex, pageBottom) {
  const rowH = measureRowHeight(doc, param);
  if (rowY + rowH > pageBottom) return null;

  if (param.is_subheader) {
    rect(doc, MARGIN, rowY, CONTENT_W, rowH, C.subHeaderBg);
    doc.moveTo(MARGIN, rowY + rowH).lineTo(PAGE_W - MARGIN, rowY + rowH)
       .lineWidth(0.4).stroke(C.borderLight);
    doc.font('Helvetica-Bold').fontSize(8).fillColor(C.subHeader);
    doc.text(param.parameter_name, MARGIN + 5, rowY + 4, { width: CONTENT_W - 10 });
    return rowY + rowH;
  }

  if (rowIndex % 2 === 0) {
    rect(doc, MARGIN, rowY, CONTENT_W, rowH, C.altRow);
  }

  const { valColor } = resolveFlag(param.result_flag);
  const textY = rowY + 5;

  doc.font('Helvetica').fontSize(8).fillColor(C.rowText);
  doc.text(param.parameter_name || '', COL_X.obs + 5, textY, { width: COL.obs - 10, lineGap: 1.5 });

  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(valColor);
  doc.text(String(param.result_value || ''), COL_X.result, textY, { width: COL.result, align: 'center' });

  doc.font('Helvetica').fontSize(8).fillColor(C.gray);
  doc.text(param.unit || '', COL_X.unit, textY, { width: COL.unit, align: 'center' });

  doc.font('Helvetica').fontSize(8).fillColor(C.gray);
  doc.text(param.reference_range || '', COL_X.ref + 5, textY, { width: COL.ref - 10, lineGap: 1.5 });

  doc.moveTo(MARGIN, rowY + rowH).lineTo(PAGE_W - MARGIN, rowY + rowH)
     .lineWidth(0.3).stroke(C.borderLight);

  return rowY + rowH;
}

// ─── Remarks ──────────────────────────────────────────────────────────────────
function drawRemarks(doc, remarks, y) {
  if (!remarks) return y;
  doc.font('Helvetica-Oblique').fontSize(7.5).fillColor(C.lightGray);
  doc.text(`Remarks: ${remarks}`, MARGIN + 5, y + 4, { width: CONTENT_W - 10 });
  return doc.y + 4;
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function drawPageFooter(doc, report, pageNum, totalPages) {
  doc.page.margins.bottom = 0;

  const fY = PAGE_H - MARGIN - 46;

  doc.moveTo(MARGIN, fY).lineTo(PAGE_W - MARGIN, fY).lineWidth(0.5).stroke(C.borderLight);

  const midX = PAGE_W / 2;

  // Left column
  doc.font('Helvetica-Bold').fontSize(8).fillColor(C.footerGray);
  doc.text(`Tested By: ${report.tested_by_name || 'N/A'}`, MARGIN, fY + 6, { width: midX - MARGIN - 10 });
  doc.font('Helvetica').fontSize(7.5).fillColor(C.lightGray);
  doc.text(`Date: ${report.tested_at || ''}`, MARGIN, fY + 18, { width: midX - MARGIN - 10 });

  const sigY = fY + 30;
  doc.moveTo(MARGIN, sigY).lineTo(MARGIN + 120, sigY).lineWidth(0.5).stroke(C.borderLight);
  doc.font('Helvetica').fontSize(7).fillColor(C.lightGray);
  doc.text('Lab Technician', MARGIN, sigY + 3, { width: 120 });

  // Right column
  doc.font('Helvetica-Bold').fontSize(8).fillColor(C.red);
  doc.text(`Verified & Approved By: ${report.verified_by_name || 'N/A'}`, midX, fY + 6, { width: midX - MARGIN - 10 });
  doc.font('Helvetica').fontSize(7.5).fillColor(C.lightGray);
  doc.text(`Date: ${report.verified_at || ''}`, midX, fY + 18, { width: midX - MARGIN - 10 });

  doc.moveTo(midX, sigY).lineTo(midX + 150, sigY).lineWidth(0.5).stroke(C.borderLight);
  doc.font('Helvetica').fontSize(7).fillColor(C.lightGray);
  doc.text('Lab Head / Pathologist', midX, sigY + 3, { width: 150 });

  const bottomY = sigY + 14;
  doc.moveTo(MARGIN, bottomY).lineTo(PAGE_W - MARGIN, bottomY).lineWidth(0.3).stroke(C.borderLight);

  doc.font('Helvetica-Oblique').fontSize(6.5).fillColor(C.lightGray);
  doc.text(
    'This is a computer-generated report. No manual signature required.',
    MARGIN, bottomY + 4,
    { width: CONTENT_W * 0.70, align: 'left' }
  );
  doc.font('Helvetica').fontSize(7).fillColor(C.gray);
  doc.text(
    `Page ${pageNum} of ${totalPages}`,
    MARGIN, bottomY + 4,
    { width: CONTENT_W, align: 'right' }
  );
}

// ─── Main PDF generation ──────────────────────────────────────────────────────
export async function generateLabReportPDFStream(reportData) {
  const options = {
    size: 'A4',
    margins: { top: MARGIN, bottom: MARGIN + 60, left: MARGIN, right: MARGIN },
    bufferPages: true,
  };

  // Secure the PDF with a password if the registration number is available
  if (reportData.patient_reg_no && reportData.patient_reg_no !== 'N/A') {
    options.userPassword = reportData.patient_reg_no;
    options.ownerPassword = reportData.patient_reg_no;
  }

  const doc = new PDFDocument(options);

  const PAGE_BOTTOM = PAGE_H - MARGIN - 60;

  let curY = drawHospitalHeader(doc, reportData);
  curY     = await drawPatientInfo(doc, reportData, curY);

  const tests = reportData.tests || [];

  tests.forEach((test, ti) => {
    if (curY + 60 > PAGE_BOTTOM) {
      doc.addPage();
      curY = MARGIN + 10;
    }

    curY = drawSectionBanner(doc, test, curY);
    curY = drawColumnHeaders(doc, curY);

    const params = test.parameters || [];
    let dataRowIndex = 0;

    params.forEach(param => {
      const estimatedH = measureRowHeight(doc, param);
      if (curY + estimatedH > PAGE_BOTTOM) {
        doc.addPage();
        curY = MARGIN + 10;
        curY = drawColumnHeaders(doc, curY);
      }

      const nextY = drawDataRow(doc, param, curY, dataRowIndex, PAGE_BOTTOM);
      if (nextY === null) {
        doc.addPage();
        curY = MARGIN + 10;
        curY = drawColumnHeaders(doc, curY);
        dataRowIndex = 0;
        const retryY = drawDataRow(doc, param, curY, dataRowIndex, PAGE_BOTTOM);
        curY = retryY || curY + 20;
      } else {
        curY = nextY;
      }

      if (!param.is_subheader) dataRowIndex++;
    });

    if (test.remarks) {
      if (curY + 20 > PAGE_BOTTOM) { doc.addPage(); curY = MARGIN + 10; }
      curY = drawRemarks(doc, test.remarks, curY);
    }

    if (curY + 14 < PAGE_BOTTOM) {
      doc.font('Helvetica-Oblique').fontSize(7).fillColor(C.lightGray);
      doc.text(
        'In case of any unexpected or alarming results, please contact us immediately for re-confirmation, clarifications, and rectifications, if needed.',
        MARGIN + 5, curY + 5, { width: CONTENT_W - 10 }
      );
      curY = doc.y + 8;
    }

    if (ti < tests.length - 1) {
      doc.moveTo(MARGIN, curY).lineTo(PAGE_W - MARGIN, curY).lineWidth(0.5).stroke(C.borderLight);
      curY += 10;
    }
  });

  const totalPages = doc.bufferedPageRange().count;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    drawPageFooter(doc, reportData, i + 1, totalPages);
  }

  doc.end();
  return doc;
}