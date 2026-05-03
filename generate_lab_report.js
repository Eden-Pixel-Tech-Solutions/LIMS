'use strict';

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ─── Colors ──────────────────────────────────────────────────────────────────
const C = {
  red:         '#C0272D',
  redDark:     '#9B1E23',
  redLight:    '#FDECEA',
  white:       '#FFFFFF',
  black:       '#000000',
  colHeader:   '#1A1A1A',
  rowText:     '#1A1A1A',
  subHeader:   '#1A1A1A',
  normalVal:   '#166534',   // green for in-range values
  highVal:     '#C0272D',   // red for out-of-range values
  normalFlagBg:'#166534',
  highFlagBg:  '#C0272D',
  flagText:    '#FFFFFF',
  altRow:      '#F9F9F9',
  subHeaderBg: '#F0F0F0',
  borderLight: '#DDDDDD',
  headerLine:  '#CCCCCC',
  gray:        '#555555',
  lightGray:   '#999999',
  footerGray:  '#444444',
};

// ─── Layout constants ─────────────────────────────────────────────────────────
const PAGE_W   = 595.28;   // A4
const PAGE_H   = 841.89;
const MARGIN   = 30;
const CONTENT_W = PAGE_W - MARGIN * 2;

// Column widths (no Method column): Observation | Result | Unit | Ref | Flag
const COL = {
  obs:    CONTENT_W * 0.36,
  result: CONTENT_W * 0.14,
  unit:   CONTENT_W * 0.10,
  ref:    CONTENT_W * 0.30,
  flag:   CONTENT_W * 0.10,
};
const COL_X = {
  obs:    MARGIN,
  result: MARGIN + COL.obs,
  unit:   MARGIN + COL.obs + COL.result,
  ref:    MARGIN + COL.obs + COL.result + COL.unit,
  flag:   MARGIN + COL.obs + COL.result + COL.unit + COL.ref,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveFlag(flag) {
  const f = (flag || 'normal').toLowerCase();
  if (['high','h','critical','c'].includes(f)) {
    return { label: 'HIGH',   valColor: C.highVal,   bgColor: C.highFlagBg,   textColor: C.flagText };
  } else if (['low','l'].includes(f)) {
    return { label: 'LOW',    valColor: C.highVal,   bgColor: C.highFlagBg,   textColor: C.flagText };
  } else {
    return { label: 'NORMAL', valColor: C.normalVal, bgColor: C.normalFlagBg, textColor: C.flagText };
  }
}

/** Draw text clipped to a box, wrapping if needed. Returns final Y. */
function drawWrappedText(doc, text, x, y, maxW, options = {}) {
  const { fontSize = 8, font = 'Helvetica', color = C.rowText, lineGap = 2 } = options;
  doc.font(font).fontSize(fontSize).fillColor(color);
  doc.text(text, x, y, { width: maxW, lineGap, continued: false, ...options });
  return doc.y;
}

/** Measure height of wrapped text without drawing */
function measureTextHeight(doc, text, maxW, fontSize = 8, font = 'Helvetica') {
  doc.font(font).fontSize(fontSize);
  const h = doc.heightOfString(text, { width: maxW, lineGap: 2 });
  return h;
}

/** Draw a filled rectangle */
function rect(doc, x, y, w, h, color) {
  doc.rect(x, y, w, h).fill(color);
}

/** Draw a stroked rectangle */
function rectStroke(doc, x, y, w, h, color, lw = 0.5) {
  doc.rect(x, y, w, h).lineWidth(lw).stroke(color);
}

// ─── Header: Hospital branding ────────────────────────────────────────────────
function drawHospitalHeader(doc, report) {
  const y = MARGIN;

  // Logo block
  doc.font('Helvetica-Bold').fontSize(22).fillColor(C.red);
  doc.text('H·O·D', MARGIN, y);

  doc.font('Helvetica').fontSize(7).fillColor(C.gray);
  doc.text('HOUSE of DIAGNOSTICS', MARGIN, y + 26);

  // Hospital info right side
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

// ─── Patient info block ───────────────────────────────────────────────────────
function drawPatientInfo(doc, report, startY) {
  const y = startY;
  const col = CONTENT_W / 4;
  const fields = [
    [['Patient Name :', report.patient_name], ['Lab No :', report.sample_id]],
    [['Age / Sex :', `${report.age} / ${report.gender}`], ['Registration On :', report.registration_date]],
    [['Referred By :', report.referred_by], ['Patient ID :', report.patient_reg_no]],
    [['Centre :', report.centre], ['', '']],
  ];

  // Draw 2-column layout
  let curY = y;
  const rows = [
    [['Patient Name :', report.patient_name], ['Lab No :', report.sample_id], ['Registration On :', report.registration_date], ['Patient ID :', report.patient_reg_no]],
    [['Age / Sex :', `${report.age} / ${report.gender}`], ['Referred By :', report.referred_by], ['Centre :', report.centre], ['', '']],
  ];

  rows.forEach((row, ri) => {
    row.forEach(([label, value], ci) => {
      const x = MARGIN + ci * col;
      doc.font('Helvetica-Bold').fontSize(8).fillColor(C.colHeader);
      doc.text(label, x, curY, { continued: true });
      doc.font('Helvetica').fillColor(C.gray);
      doc.text('  ' + (value || ''), { continued: false });
    });
    curY += 14;
  });

  // Thin border box around patient info
  rectStroke(doc, MARGIN, y - 3, CONTENT_W, curY - y + 6, C.borderLight, 0.5);

  doc.moveTo(MARGIN, curY + 4).lineTo(PAGE_W - MARGIN, curY + 4).lineWidth(0.5).stroke(C.borderLight);
  return curY + 10;
}

// ─── Section Banner ───────────────────────────────────────────────────────────
function drawSectionBanner(doc, test, startY) {
  const BANNER_H = 20;
  const META_H   = 18;

  // Top red bar: test name | sample type
  rect(doc, MARGIN, startY, CONTENT_W, BANNER_H, C.red);

  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C.white);
  doc.text(test.test_name.toUpperCase(), MARGIN + 6, startY + 5, { width: CONTENT_W * 0.55 });

  doc.font('Helvetica').fontSize(8.5).fillColor(C.white);
  doc.text(test.sample_type || '', MARGIN + 6, startY + 5.5, {
    width: CONTENT_W - 12, align: 'right'
  });

  // Darker sub-row: Accession | Collected | Received | Approved
  const metaY = startY + BANNER_H;
  rect(doc, MARGIN, metaY, CONTENT_W, META_H, C.redDark);

  const metaColW = CONTENT_W / 4;

  // Accession block (spans left side)
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.white);
  doc.text('Accession No:', MARGIN + 6, metaY + 2, { continued: false });
  doc.font('Helvetica').fontSize(7.5).fillColor(C.white);
  doc.text(test.accession_no || 'N/A', MARGIN + 6, metaY + 10);

  // Collected / Received / Approved — spaced across
  const metaItems = [
    { label: 'Collected On:', value: test.collected_on },
    { label: 'Received On:', value: test.received_on },
    { label: 'Approved On:', value: test.approved_on },
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

  // Bottom border under headers
  doc.moveTo(MARGIN, startY + ROW_H).lineTo(PAGE_W - MARGIN, startY + ROW_H)
     .lineWidth(0.8).stroke(C.red);

  const headers = [
    { label: 'Observation',             x: COL_X.obs,    w: COL.obs,    align: 'left'  },
    { label: 'Result',                  x: COL_X.result, w: COL.result, align: 'center'},
    { label: 'Unit',                    x: COL_X.unit,   w: COL.unit,   align: 'center'},
    { label: 'Biological Ref. Interval',x: COL_X.ref,    w: COL.ref,    align: 'left'  },
    { label: 'Flag',                    x: COL_X.flag,   w: COL.flag,   align: 'center'},
  ];

  doc.font('Helvetica-Bold').fontSize(8).fillColor(C.colHeader);
  headers.forEach(h => {
    doc.text(h.label, h.x + (h.align === 'left' ? 5 : 0), startY + 5,
      { width: h.w, align: h.align });
  });

  return startY + ROW_H;
}

// ─── Single data row ──────────────────────────────────────────────────────────
function measureRowHeight(doc, param) {
  if (param.is_subheader) return 16;
  const obsH = measureTextHeight(doc, param.parameter_name || '', COL.obs - 10);
  const refH = measureTextHeight(doc, param.reference_range || '', COL.ref - 10);
  return Math.max(obsH, refH, 18) + 6;
}

function drawDataRow(doc, param, rowY, rowIndex, pageBottom) {
  // Check if we need a new page
  const rowH = measureRowHeight(doc, param);
  if (rowY + rowH > pageBottom) return null; // signal: need new page

  if (param.is_subheader) {
    // Category sub-header row
    rect(doc, MARGIN, rowY, CONTENT_W, rowH, C.subHeaderBg);
    doc.moveTo(MARGIN, rowY + rowH).lineTo(PAGE_W - MARGIN, rowY + rowH)
       .lineWidth(0.4).stroke(C.borderLight);
    doc.font('Helvetica-Bold').fontSize(8).fillColor(C.subHeader);
    doc.text(param.parameter_name, MARGIN + 5, rowY + 4, { width: CONTENT_W - 10 });
    return rowY + rowH;
  }

  // Alternate row background
  if (rowIndex % 2 === 0) {
    rect(doc, MARGIN, rowY, CONTENT_W, rowH, C.altRow);
  }

  const { label: flagLabel, valColor, bgColor } = resolveFlag(param.result_flag);

  const textY = rowY + 5;

  // Observation
  doc.font('Helvetica').fontSize(8).fillColor(C.rowText);
  doc.text(param.parameter_name || '', COL_X.obs + 5, textY, { width: COL.obs - 10, lineGap: 1.5 });

  // Result — colored based on flag
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(valColor);
  doc.text(String(param.result_value || ''), COL_X.result, textY, { width: COL.result, align: 'center' });

  // Unit
  doc.font('Helvetica').fontSize(8).fillColor(C.gray);
  doc.text(param.unit || '', COL_X.unit, textY, { width: COL.unit, align: 'center' });

  // Reference range
  doc.font('Helvetica').fontSize(8).fillColor(C.gray);
  doc.text(param.reference_range || '', COL_X.ref + 5, textY, { width: COL.ref - 10, lineGap: 1.5 });

  // Flag badge
  const BADGE_W  = COL.flag - 8;
  const BADGE_H  = 13;
  const badgeX   = COL_X.flag + (COL.flag - BADGE_W) / 2;
  const badgeY   = rowY + (rowH - BADGE_H) / 2;
  rect(doc, badgeX, badgeY, BADGE_W, BADGE_H, bgColor);
  doc.font('Helvetica-Bold').fontSize(6.5).fillColor(C.white);
  doc.text(flagLabel, badgeX, badgeY + 3, { width: BADGE_W, align: 'center' });

  // Row bottom border
  doc.moveTo(MARGIN, rowY + rowH).lineTo(PAGE_W - MARGIN, rowY + rowH)
     .lineWidth(0.3).stroke(C.borderLight);

  return rowY + rowH;
}

// ─── Remarks line ─────────────────────────────────────────────────────────────
function drawRemarks(doc, remarks, y) {
  if (!remarks) return y;
  doc.font('Helvetica-Oblique').fontSize(7.5).fillColor(C.lightGray);
  doc.text(`Remarks: ${remarks}`, MARGIN + 5, y + 4, { width: CONTENT_W - 10 });
  return doc.y + 4;
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function drawPageFooter(doc, report, pageNum, totalPages) {
  const fY = PAGE_H - MARGIN - 50;

  doc.moveTo(MARGIN, fY).lineTo(PAGE_W - MARGIN, fY).lineWidth(0.5).stroke(C.borderLight);

  // Tested by / Verified by
  doc.font('Helvetica-Bold').fontSize(8).fillColor(C.footerGray);
  doc.text(`Tested By: ${report.tested_by_name || 'N/A'}`, MARGIN, fY + 6);
  doc.font('Helvetica').fontSize(7.5).fillColor(C.lightGray);
  doc.text(`Date: ${report.tested_at || ''}`, MARGIN, fY + 18);

  doc.font('Helvetica-Bold').fontSize(8).fillColor(C.red);
  doc.text(`Verified & Approved By: ${report.verified_by_name || 'N/A'}`, PAGE_W / 2, fY + 6);
  doc.font('Helvetica').fontSize(7.5).fillColor(C.lightGray);
  doc.text(`Date: ${report.verified_at || ''}`, PAGE_W / 2, fY + 18);

  // Signature lines
  const sigY = fY + 32;
  doc.moveTo(MARGIN, sigY).lineTo(MARGIN + 130, sigY).lineWidth(0.5).stroke(C.borderLight);
  doc.moveTo(PAGE_W - MARGIN - 130, sigY).lineTo(PAGE_W - MARGIN, sigY).lineWidth(0.5).stroke(C.borderLight);
  doc.font('Helvetica').fontSize(7.5).fillColor(C.lightGray);
  doc.text('Lab Technician', MARGIN, sigY + 3);
  doc.text('Lab Head / Pathologist', PAGE_W - MARGIN - 130, sigY + 3);

  // Page number + disclaimer
  doc.font('Helvetica-Oblique').fontSize(7).fillColor(C.lightGray);
  doc.text('This is a computer-generated report. No manual signature required.',
    MARGIN, fY + 44, { width: CONTENT_W - 60, align: 'left' });
  doc.text(`Page ${pageNum} of ${totalPages}`,
    MARGIN, fY + 44, { width: CONTENT_W, align: 'right' });
}

// ─── Main PDF generation ──────────────────────────────────────────────────────
function generateLabReport(outputPath, reportData) {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: MARGIN, bottom: MARGIN + 60, left: MARGIN, right: MARGIN },
    bufferPages: true,
  });

  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  const PAGE_BOTTOM = PAGE_H - MARGIN - 65; // leave room for footer

  let curY = drawHospitalHeader(doc, reportData);
  curY     = drawPatientInfo(doc, reportData, curY);

  const tests = reportData.tests || [];

  tests.forEach((test, ti) => {
    // Ensure there's room for at least banner + header + 1 row
    if (curY + 60 > PAGE_BOTTOM) {
      doc.addPage();
      curY = MARGIN + 10;
    }

    curY = drawSectionBanner(doc, test, curY);
    curY = drawColumnHeaders(doc, curY);

    const params = test.parameters || [];
    let dataRowIndex = 0;

    params.forEach(param => {
      // If not enough room, new page
      const estimatedH = measureRowHeight(doc, param);
      if (curY + estimatedH > PAGE_BOTTOM) {
        doc.addPage();
        curY = MARGIN + 10;
        // Re-draw column headers on continuation
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

    // Outer border around the whole test section
    // (drawn after, so we know height)

    // Remarks
    if (test.remarks) {
      if (curY + 20 > PAGE_BOTTOM) { doc.addPage(); curY = MARGIN + 10; }
      curY = drawRemarks(doc, test.remarks, curY);
    }

    // Disclaimer line
    if (curY + 14 < PAGE_BOTTOM) {
      doc.font('Helvetica-Oblique').fontSize(7).fillColor(C.lightGray);
      doc.text(
        'In case of any unexpected or alarming results, please contact us immediately for re-confirmation, clarifications, and rectifications, if needed.',
        MARGIN + 5, curY + 5, { width: CONTENT_W - 10 }
      );
      curY = doc.y + 8;
    }

    // Divider between tests
    if (ti < tests.length - 1) {
      doc.moveTo(MARGIN, curY).lineTo(PAGE_W - MARGIN, curY).lineWidth(0.5).stroke(C.borderLight);
      curY += 10;
    }
  });

  // Add footer to every page
  const totalPages = doc.bufferedPageRange().count;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    drawPageFooter(doc, reportData, i + 1, totalPages);
  }

  doc.end();

  stream.on('finish', () => console.log(`PDF generated: ${outputPath}`));
  stream.on('error', err => console.error('Stream error:', err));
}

// ─── Sample data (mirrors HOD sample report) ──────────────────────────────────
const sampleReport = {
  patient_name:      'Demo Patient Name',
  patient_reg_no:    'UHID.DEMO.001',
  sample_id:         'Demo Visit No',
  gender:            'M',
  age:               '60 Y',
  referred_by:       'DEMO HOSPITAL',
  centre:            'HOD Head Office',
  registration_date: '21-Jan-25 13:40',
  tested_by_name:    'Lab Technician',
  tested_at:         '21-Jan-25 17:23',
  verified_by_name:  'Dr. Pathologist',
  verified_at:       '21-Jan-25 18:00',

  tests: [
    {
      test_name:    'Urine R/M',
      sample_type:  'Urine Sample',
      accession_no: 'DEMO_BARCODE',
      collected_on: '21-Jan-25 13:40',
      received_on:  '21-Jan-25 14:31',
      approved_on:  '21-Jan-25 17:23',
      remarks: 'Microscopy may have supplemented automated measurements, wherever necessary.',
      parameters: [
        { parameter_name: 'Physical Examination', is_subheader: true },
        { parameter_name: 'Urine Quantity',        result_value: '7.5',         unit: 'mL',   reference_range: '7 - 8',          result_flag: 'normal' },
        { parameter_name: 'Urine Colour',          result_value: 'Pale Yellow', unit: '',     reference_range: 'Pale Yellow',     result_flag: 'normal' },
        { parameter_name: 'Urinary Transparency',  result_value: 'Clear',       unit: '',     reference_range: 'Clear',           result_flag: 'normal' },
        { parameter_name: 'Biochemical Examination', is_subheader: true },
        { parameter_name: 'Urinary pH',            result_value: '5.5',         unit: 'pH',   reference_range: '6.0 - 8.0',      result_flag: 'low'    },
        { parameter_name: 'Urinary Specific Gravity', result_value: '1.025',   unit: '',     reference_range: '1.005 - 1.030',  result_flag: 'normal' },
        { parameter_name: 'Urinary Protein',       result_value: 'Negative',    unit: '',     reference_range: 'Negative',        result_flag: 'normal' },
        { parameter_name: 'Urinary Glucose',       result_value: '1+',          unit: '',     reference_range: 'Negative',        result_flag: 'high'   },
        { parameter_name: 'Urinary Ketones',       result_value: 'Negative',    unit: '',     reference_range: 'Negative',        result_flag: 'normal' },
        { parameter_name: 'Urobilinogen',          result_value: 'Negative',    unit: '',     reference_range: 'Negative',        result_flag: 'normal' },
        { parameter_name: 'Urine Bilirubin',       result_value: 'Negative',    unit: '',     reference_range: 'Negative',        result_flag: 'normal' },
        { parameter_name: 'Urinary Nitrites',      result_value: 'Negative',    unit: '',     reference_range: 'Negative',        result_flag: 'normal' },
        { parameter_name: 'Blood [In Urine]',      result_value: 'Negative',    unit: '',     reference_range: 'Negative',        result_flag: 'normal' },
        { parameter_name: 'Leukocyte esterase',    result_value: 'Negative',    unit: '',     reference_range: 'Negative',        result_flag: 'normal' },
        { parameter_name: 'Microscopic Examination', is_subheader: true },
        { parameter_name: 'Pus Cells [In Urine]',  result_value: '1-2',        unit: '/HPF', reference_range: '1 - 2 /HPF',     result_flag: 'normal' },
        { parameter_name: 'Epithelial Cells (Squamous)', result_value: '1-2',  unit: '/HPF', reference_range: '0-2/HPF',        result_flag: 'normal' },
        { parameter_name: 'Epithelial Cells (Non-Squamous)', result_value: 'NIL', unit: '/HPF', reference_range: '0-2/HPF',    result_flag: 'normal' },
        { parameter_name: 'Urinary RBC',           result_value: 'NIL',         unit: '/HPF', reference_range: 'NIL /HPF',       result_flag: 'normal' },
        { parameter_name: 'Hyaline Casts',         result_value: 'NIL',         unit: '/LPF', reference_range: '0-2/LPF',        result_flag: 'normal' },
        { parameter_name: 'Pathological Casts',    result_value: 'NIL',         unit: '/LPF', reference_range: '0-1/LPF',        result_flag: 'normal' },
        { parameter_name: 'Yeast Cells',           result_value: 'NIL',         unit: '/HPF', reference_range: '0-1/HPF',        result_flag: 'normal' },
        { parameter_name: 'Crystals',              result_value: 'NIL',         unit: '/HPF', reference_range: 'NIL/HPF',         result_flag: 'normal' },
        { parameter_name: 'Other Morphology',      result_value: 'NIL',         unit: '',     reference_range: 'NIL',             result_flag: 'normal' },
      ]
    },
    {
      test_name:    'CBC',
      sample_type:  'EDTA Whole Blood Sample',
      accession_no: 'DEMO_BARCODE',
      collected_on: '21-Jan-25 13:40',
      received_on:  '21-Jan-25 14:31',
      approved_on:  '21-Jan-25 17:23',
      remarks: 'Please correlate with clinical conditions.',
      parameters: [
        { parameter_name: 'Hemoglobin',                  result_value: '13.6',  unit: 'gm/dL',       reference_range: '13.0 - 17.0',       result_flag: 'normal' },
        { parameter_name: 'Total RBC',                   result_value: '4.69',  unit: 'million/µL',  reference_range: '4.5 - 5.5',         result_flag: 'normal' },
        { parameter_name: 'Platelet Count',              result_value: '318',   unit: 'X 10³/µL',   reference_range: '150 - 410 x 10³/µL',result_flag: 'normal' },
        { parameter_name: 'Total Leucocyte Count (WBC)', result_value: '7.09',  unit: 'X 10³/µL',   reference_range: '4.0 - 10.0',        result_flag: 'normal' },
        { parameter_name: 'Differential Leucocyte Count (DLC)', is_subheader: true },
        { parameter_name: 'Neutrophils',                 result_value: '50.2',  unit: '%',           reference_range: '40 - 80',           result_flag: 'normal' },
        { parameter_name: 'Lymphocytes',                 result_value: '40.0',  unit: '%',           reference_range: '20 - 40',           result_flag: 'normal' },
        { parameter_name: 'Monocytes',                   result_value: '5.7',   unit: '%',           reference_range: '2 - 10',            result_flag: 'normal' },
        { parameter_name: 'Eosinophils',                 result_value: '3.3',   unit: '%',           reference_range: '1 - 6',             result_flag: 'normal' },
        { parameter_name: 'Basophils',                   result_value: '0.8',   unit: '%',           reference_range: '0 - 1',             result_flag: 'normal' },
        { parameter_name: 'Absolute Neutrophil Count',   result_value: '3.56',  unit: 'X 10³/µL',   reference_range: '2.0 - 7.5',         result_flag: 'normal' },
        { parameter_name: 'Absolute Lymphocyte Count',   result_value: '2.84',  unit: 'X10³/µL',    reference_range: '1.0 - 4.0',         result_flag: 'normal' },
        { parameter_name: 'Absolute Monocyte Count',     result_value: '0.4',   unit: 'X 10³/µL',   reference_range: '0.2 - 1.0',         result_flag: 'normal' },
        { parameter_name: 'Absolute Eosinophil Count',   result_value: '0.23',  unit: 'X 10³/µL',   reference_range: '0.02 - 0.5',        result_flag: 'normal' },
        { parameter_name: 'Absolute Basophil Count',     result_value: '0.07',  unit: 'X10³/µL',    reference_range: '0.00 - 0.30',       result_flag: 'normal' },
        { parameter_name: 'Indices', is_subheader: true },
        { parameter_name: 'Hematocrit (PCV)',             result_value: '43.8',  unit: '%',           reference_range: '40 - 50',           result_flag: 'normal' },
        { parameter_name: 'Mean Corpuscular Volume (MCV)',result_value: '93.3',  unit: 'fL',          reference_range: '83 - 101',          result_flag: 'normal' },
        { parameter_name: 'Mean Corp. Hemoglobin (MCH)', result_value: '28.9',  unit: 'pg',          reference_range: '27 - 32',           result_flag: 'normal' },
        { parameter_name: 'MCH Concentration (MCHC)',    result_value: '30.9',  unit: 'g/dl',        reference_range: '31.5 - 34.5',       result_flag: 'low'    },
        { parameter_name: 'Red Cell Dist. Width (RDW-CV)',result_value: '16.2', unit: '%',           reference_range: '11.5 - 14.5',       result_flag: 'high'   },
        { parameter_name: 'Red Cell Dist. Width (RDW-SD)',result_value: '55.5', unit: 'fL',          reference_range: '39 - 46',           result_flag: 'high'   },
        { parameter_name: 'Mean Platelet Volume (MPV)',   result_value: '10.7',  unit: 'fL',          reference_range: '7-5 - 12.0',        result_flag: 'normal' },
        { parameter_name: 'Neutrophil-Lymphocyte Ratio',  result_value: '1.26',  unit: 'Ratio',       reference_range: '',                   result_flag: 'normal' },
        { parameter_name: 'Mentzer Index',                result_value: '19.89', unit: 'Index',       reference_range: '',                   result_flag: 'normal' },
      ]
    },
    {
      test_name:    'Lipid Profile',
      sample_type:  'Serum Sample',
      accession_no: 'DEMO_BARCODE',
      collected_on: '21-Jan-25 13:40',
      received_on:  '21-Jan-25 14:39',
      approved_on:  '21-Jan-25 15:07',
      remarks: 'Please correlate results clinically. Reports of Lipid Profile are best obtained with 10 hours fasting.',
      parameters: [
        { parameter_name: 'Total Cholesterol',   result_value: '192',  unit: 'mg/dL', reference_range: '<200',     result_flag: 'normal' },
        { parameter_name: 'Triglyceride',         result_value: '200',  unit: 'mg/dL', reference_range: '<150',     result_flag: 'high'   },
        { parameter_name: 'HDL Cholesterol',      result_value: '50',   unit: 'mg/dL', reference_range: '>45',      result_flag: 'normal' },
        { parameter_name: 'VLDL Cholesterol',     result_value: '40',   unit: 'mg/dL', reference_range: '5 - 40',   result_flag: 'normal' },
        { parameter_name: 'LDL Cholesterol',      result_value: '102',  unit: 'mg/dL', reference_range: '<100',     result_flag: 'high'   },
        { parameter_name: 'Non-HDL Cholesterol',  result_value: '142',  unit: 'mg/dL', reference_range: '<130',     result_flag: 'high'   },
        { parameter_name: 'LDL / HDL Ratio',      result_value: '2.04', unit: 'Ratio', reference_range: '1.5-3.5',  result_flag: 'normal' },
        { parameter_name: 'TC / HDL Ratio',       result_value: '3.84', unit: 'Ratio', reference_range: '3-5',      result_flag: 'normal' },
      ]
    },
    {
      test_name:    'Liver Function Test',
      sample_type:  'Serum Sample',
      accession_no: 'DEMO_BARCODE',
      collected_on: '21-Jan-25 13:40',
      received_on:  '21-Jan-25 14:39',
      approved_on:  '21-Jan-25 15:07',
      remarks: 'Please correlate results clinically.',
      parameters: [
        { parameter_name: 'Total Protein',              result_value: '8.2',  unit: 'g/dL',  reference_range: '6.5-7.8',  result_flag: 'high'   },
        { parameter_name: 'Albumin',                    result_value: '4.8',  unit: 'g/dL',  reference_range: '4.2 - 5.0',result_flag: 'normal' },
        { parameter_name: 'Globulin',                   result_value: '3.4',  unit: 'gm/dL', reference_range: '2.0-3.5',  result_flag: 'normal' },
        { parameter_name: 'A/G Ratio',                  result_value: '1.41', unit: 'Ratio', reference_range: '1.5-2.5',  result_flag: 'low'    },
        { parameter_name: 'Total Bilirubin',            result_value: '0.65', unit: 'mg/dL', reference_range: '0.2-1.3',  result_flag: 'normal' },
        { parameter_name: 'Conjugated Bilirubin',       result_value: '0.4',  unit: 'mg/dL', reference_range: '<0.3',     result_flag: 'high'   },
        { parameter_name: 'Unconjugated Bilirubin',     result_value: '0.25', unit: 'mg/dL', reference_range: '<1.1',     result_flag: 'normal' },
        { parameter_name: 'SGOT (AST)',                 result_value: '21',   unit: 'U/L',   reference_range: '18-39',    result_flag: 'normal' },
        { parameter_name: 'SGPT (ALT)',                 result_value: '20',   unit: 'U/L',   reference_range: '4-50',     result_flag: 'normal' },
        { parameter_name: 'Alkaline Phosphatase',       result_value: '57',   unit: 'U/L',   reference_range: '50 - 116', result_flag: 'normal' },
        { parameter_name: 'Gamma Glutamyl Transferase', result_value: '32',   unit: 'U/L',   reference_range: '13 - 109', result_flag: 'normal' },
      ]
    },
    {
      test_name:    'Kidney Function Test',
      sample_type:  'Serum Sample',
      accession_no: 'DEMO_BARCODE',
      collected_on: '21-Jan-25 13:40',
      received_on:  '21-Jan-25 14:39',
      approved_on:  '21-Jan-25 15:07',
      remarks: 'Please correlate results clinically.',
      parameters: [
        { parameter_name: 'Blood Urea',              result_value: '53',    unit: 'mg/dL',         reference_range: '19 - 43',   result_flag: 'high'   },
        { parameter_name: 'Blood Urea Nitrogen',     result_value: '24.77', unit: 'mg/dL',         reference_range: '9-20',      result_flag: 'high'   },
        { parameter_name: 'Creatinine',              result_value: '1.41',  unit: 'mg/dL',         reference_range: '0.6-1.25',  result_flag: 'high'   },
        { parameter_name: 'Estimated GFR',           result_value: '57.10', unit: 'mL/min/1.73m2', reference_range: '',           result_flag: 'normal' },
        { parameter_name: 'Uric Acid',               result_value: '5.7',   unit: 'mg/dL',         reference_range: '3.5 - 8.5', result_flag: 'normal' },
        { parameter_name: 'Calcium',                 result_value: '9.5',   unit: 'mg/dL',         reference_range: '8.4 - 10.2',result_flag: 'normal' },
        { parameter_name: 'Phosphorus',              result_value: '3.4',   unit: 'mg/dL',         reference_range: '2.5 - 4.5', result_flag: 'normal' },
        { parameter_name: 'Electrolytes', is_subheader: true },
        { parameter_name: 'Sodium',                  result_value: '139',   unit: 'mmol/L',        reference_range: '137-145',   result_flag: 'normal' },
        { parameter_name: 'Potassium',               result_value: '5.2',   unit: 'mmol/L',        reference_range: '3.5 - 5.1', result_flag: 'high'   },
        { parameter_name: 'Chloride',                result_value: '104',   unit: 'mmol/L',        reference_range: '98 - 107',  result_flag: 'normal' },
      ]
    },
    {
      test_name:    'Vitamin B12',
      sample_type:  'Serum Sample',
      accession_no: 'DEMO_BARCODE',
      collected_on: '21-Jan-25 13:40',
      received_on:  '21-Jan-25 14:39',
      approved_on:  '21-Jan-25 16:10',
      remarks: 'Please correlate results clinically.',
      parameters: [
        { parameter_name: 'Vitamin B-12', result_value: '971', unit: 'pg/mL', reference_range: '239-931', result_flag: 'high' },
      ]
    },
    {
      test_name:    'Hb A1c',
      sample_type:  'EDTA Whole Blood Sample',
      accession_no: 'DEMO_BARCODE',
      collected_on: '21-Jan-25 13:40',
      received_on:  '21-Jan-25 14:31',
      approved_on:  '21-Jan-25 17:35',
      remarks: 'Please correlate results with clinical conditions.',
      parameters: [
        { parameter_name: 'HbA1C',                       result_value: '5.7',    unit: '%',    reference_range: '4.8-5.7', result_flag: 'normal' },
        { parameter_name: '90 Day Average Blood Glucose', result_value: '116.89', unit: 'mg/dl',reference_range: '90 - 120',result_flag: 'normal' },
      ]
    },
    {
      test_name:    'Free Thyroid Test [FT3, FT4, TSH]',
      sample_type:  'Serum Sample',
      accession_no: 'DEMO_BARCODE',
      collected_on: '21-Jan-25 13:40',
      received_on:  '22-Jan-25 15:52',
      approved_on:  '22-Jan-25 17:35',
      remarks: 'Please correlate results clinically.',
      parameters: [
        { parameter_name: 'Free Triiodothyronine [FT3]',   result_value: '2.85', unit: 'pg/mL', reference_range: '2.77 - 5.27', result_flag: 'normal' },
        { parameter_name: 'Free Thyroxine [FT4]',          result_value: '0.85', unit: 'ng/dL', reference_range: '0.78 - 2.19', result_flag: 'normal' },
        { parameter_name: 'Thyroid Stimulating Hormone (TSH)', result_value: '0.91', unit: 'mIU/L', reference_range: '0.46-4.68', result_flag: 'normal' },
      ]
    },
    {
      test_name:    'ESR',
      sample_type:  'EDTA Whole Blood Sample',
      accession_no: 'DEMO_BARCODE',
      collected_on: '21-Jan-25 13:40',
      received_on:  '21-Jan-25 14:31',
      approved_on:  '21-Jan-25 16:01',
      remarks: 'Please correlate results with clinical conditions.',
      parameters: [
        { parameter_name: 'ESR', result_value: '9', unit: 'mm/hr', reference_range: '<20', result_flag: 'normal' },
      ]
    },
  ]
};

generateLabReport('/mnt/user-data/outputs/lab_report_hod_js.pdf', sampleReport);