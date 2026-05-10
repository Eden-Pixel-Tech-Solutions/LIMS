import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import '../../assets/CSS/LabReportDownload.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://172.16.11.160:5000';

const LabReportDownload = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportDetails, setReportDetails] = useState(null);
  const printRef = useRef(null);

  useEffect(() => {
    fetchApprovedReports();
  }, []);

  const fetchApprovedReports = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/lab/approved-reports`);
      const data = await res.json();
      if (data.success) {
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE}/api/lab/approved-reports`;
      const params = new URLSearchParams();

      if (searchQuery) params.append('search', searchQuery);
      if (dateRange.from) params.append('from', dateRange.from);
      if (dateRange.to) params.append('to', dateRange.to);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error searching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async (report) => {
    try {
      const res = await fetch(`${API_BASE}/api/lab/report-details/${report.sample_id}`);
      const data = await res.json();
      if (data.success) {
        setReportDetails(data);
        setSelectedReport(report);
      }
    } catch (error) {
      console.error('Error fetching report details:', error);
    }
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Lab Report - ${reportDetails?.sample_id}</title>
            <style>
              body { font-family: 'IBM Plex Sans', sans-serif; margin: 0; padding: 0; }
              .report-preview { padding: 40px; }
              .report-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; }
              .hospital-name { font-size: 24px; font-weight: 800; color: #0f172a; font-family: 'Outfit', sans-serif; }
              .hospital-address { font-size: 13px; color: #64748b; margin-top: 5px; line-height: 1.5; }
              .report-meta-box { text-align: right; }
              .report-title { font-size: 14px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
              .report-id-badge { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #64748b; background: #f1f5f9; padding: 4px 10px; border-radius: 6px; }
              .section { margin-bottom: 24px; }
              .section-title { font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 700; color: #1d4ed8; background: #eff6ff; padding: 8px 12px; margin-bottom: 15px; border-left: 4px solid #3b82f6; text-transform: uppercase; letter-spacing: 0.1em; }
              .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
              .info-row { display: flex; flexDirection: column; gap: 4px; }
              .info-label { font-family: 'IBM Plex Mono', monospace; font-size: 9px; font-weight: 600; color: #94a3b8; text-transform: uppercase; }
              .info-value { font-size: 13px; color: #0f172a; font-weight: 600; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th { background: #0f172a; color: rgba(255,255,255,0.7); padding: 10px; text-align: left; font-size: 10px; text-transform: uppercase; font-family: 'IBM Plex Mono', monospace; }
              td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
              .result-value { font-family: 'IBM Plex Mono', monospace; font-weight: 600; font-size: 14px; }
              .normal { color: #16a34a; }
              .low { color: #d97706; }
              .high { color: #e11d48; }
              .critical { color: #7c3aed; font-weight: bold; }
              .flag-badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
              .flag-badge.normal { background: #f0fdf4; color: #166534; border: 1px solid #86efac; }
              .footer { margin-top: 40px; border-top: 2px solid #e2e8f0; padding-top: 20px; }
              .audit-row { display: flex; gap: 40px; margin-bottom: 20px; }
              .signature-section { display: flex; justify-content: space-between; margin-top: 60px; }
              .signature-box { text-align: center; }
              .signature-line { border-top: 1px solid #94a3b8; width: 200px; margin-top: 40px; padding-top: 8px; font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; }
              .report-footer-note { text-align: center; margin-top: 30px; font-size: 11px; color: #94a3b8; font-family: 'IBM Plex Mono', monospace; border-top: 1px dashed #e2e8f0; padding-top: 15px; }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="report-preview">
              ${printRef.current.innerHTML}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const handleDownloadPDF = async (sampleId) => {
    try {
      const res = await fetch(`${API_BASE}/api/lab/generate-report-pdf/${sampleId}`);
      if (!res.ok) {
        throw new Error('Failed to generate PDF');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lab-report-${sampleId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExportCSV = () => {
    if (reports.length === 0) return;

    const headers = ['Sample ID', 'Patient Name', 'Test Name', 'Tested Date', 'Approved Date'];
    const csvRows = [headers.join(',')];

    reports.forEach(report => {
      const row = [
        report.sample_id,
        `"${report.patient_name}"`,
        `"${report.test_name}"`,
        formatDate(report.tested_at),
        formatDate(report.verified_at)
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lab_reports_list_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadAllPDFs = async () => {
    if (reports.length === 0) return;
    if (!window.confirm(`Are you sure you want to download ${reports.length} reports as PDF? Your browser may ask for permission to download multiple files.`)) return;

    for (const report of reports) {
      await handleDownloadPDF(report.sample_id);
      // Add a small delay to prevent browser blocking
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  };

  return (
    <div className="lab-report-download-page">
      <div className="report-header-section">
        <div>
          <h1>Lab Test Report Download</h1>
          <p className="subtitle">Download approved lab test reports for clinical verification</p>
        </div>
      </div>

      <div className="search-section">
        <div className="search-filters">
          <div className="filter-group">
            <label>Search Reports</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sample ID, Patient or Test Name..."
              className="search-input"
            />
          </div>
          <div className="filter-group">
            <label>From Date</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            />
          </div>
          <div className="filter-group">
            <label>To Date</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            />
          </div>
          <button className="search-btn" onClick={handleSearch}>
            🔍 Search
          </button>
          <button className="reset-btn" onClick={() => { setSearchQuery(''); setDateRange({ from: '', to: '' }); fetchApprovedReports(); }}>
            ↺ Reset
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Initializing clinical reports...</div>
      ) : (
        <div className="reports-table-container">
          <div className="table-toolbar">
            <div className="table-toolbar-title">
              Approved Laboratory Reports
              <span className="table-result-count">{reports.length} Records Found</span>
            </div>
            <div className="table-toolbar-actions">
              <button className="toolbar-export-btn" onClick={handleExportCSV}>
                📄 Export List (CSV)
              </button>
              <button className="toolbar-download-all-btn" onClick={handleDownloadAllPDFs}>
                📚 Download All (PDF)
              </button>
            </div>
          </div>
          <table className="reports-table">
            <thead>
              <tr>
                <th>Sample ID</th>
                <th>Patient Name</th>
                <th>Test Name</th>
                <th>Tested Date</th>
                <th>Approved Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data">No approved reports found in the selected criteria</td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id}>
                    <td><span className="sample-id">{report.sample_id}</span></td>
                    <td className="patient-name-cell">{report.patient_name}</td>
                    <td>{report.test_name}</td>
                    <td className="date-cell">{formatDate(report.tested_at)}</td>
                    <td className="date-cell">{formatDate(report.verified_at)}</td>
                    <td>
                      <button className="view-btn" onClick={() => handleViewReport(report)}>
                        👁 View / Download
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Report Preview Modal */}
      {selectedReport && reportDetails && createPortal(
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="report-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Lab Test Report Document</h2>
              <div className="modal-actions">
                <button className="download-btn" onClick={() => handleDownloadPDF(reportDetails?.sample_id)}>
                  📥 Download PDF
                </button>
                <button className="print-btn" onClick={handlePrint}>
                  🖨️ Print
                </button>
                <button className="close-modal-btn" onClick={() => setSelectedReport(null)}>
                  ✕
                </button>
              </div>
            </div>

            <div className="report-preview" ref={printRef}>
              {/* Report Header */}
              <div className="report-header">
                <div className="hospital-logo-placeholder">LIS</div>
                <div className="hospital-info">
                  <div className="hospital-name">Meril HIMS Hospital</div>
                  <div className="hospital-address">
                    123 Healthcare Avenue, Medical District<br />
                    Phone: +91-1234567890 | Email: lab@merilhims.com
                  </div>
                </div>
                <div className="report-meta-box">
                  <div className="report-title">Laboratory Test Report</div>
                  <div className="report-id-badge">ID: {reportDetails.sample_id}</div>
                </div>
              </div>

              {/* Patient Info */}
              <div className="section">
                <div className="section-title">Patient Demographics</div>
                <div className="info-grid">
                  <div className="info-row">
                    <span className="info-label">Patient Name</span>
                    <span className="info-value">{reportDetails.patient_name}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">CRN No</span>
                    <span className="info-value">{reportDetails.patient_reg_no}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Sample ID</span>
                    <span className="info-value">{reportDetails.sample_id}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Test Name</span>
                    <span className="info-value">{reportDetails.test_name}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Collection Date</span>
                    <span className="info-value">{formatDate(reportDetails.tested_at)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Machine ID</span>
                    <span className="info-value">{reportDetails.machine_no || 'LIS-AUTO-01'}</span>
                  </div>
                </div>
              </div>

              {/* Test Results */}
              <div className="section">
                <div className="section-title">Clinical Findings</div>
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Parameter</th>
                      <th>Result</th>
                      <th>Unit</th>
                      <th>Reference Range</th>
                      <th>Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportDetails.results?.map((result, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 500 }}>{result.parameter_name}</td>
                        <td className={`result-value ${result.result_flag?.toLowerCase()}`}>
                          {result.result_value}
                        </td>
                        <td style={{ fontFamily: 'IBM Plex Mono' }}>{result.unit}</td>
                        <td style={{ color: '#64748b', fontSize: '12px' }}>{result.reference_range}</td>
                        <td>
                          <span className={`flag-badge ${result.result_flag?.toLowerCase()}`}>
                            {result.result_flag}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Notes */}
              {reportDetails.notes && (
                <div className="section">
                  <div className="section-title">Clinical Notes</div>
                  <p className="notes-text">{reportDetails.notes}</p>
                </div>
              )}

              {/* Footer with Signatures */}
              <div className="footer">
                <div className="audit-row">
                  <div className="audit-item">
                    <span className="info-label">Tested By:</span>
                    <span className="info-value" style={{ fontSize: '12px' }}>{reportDetails.tested_by_name} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({formatDateTime(reportDetails.tested_at)})</span></span>
                  </div>
                  <div className="audit-item">
                    <span className="info-label verified-by">Verified & Approved By:</span>
                    <span className="info-value approved-by" style={{ fontSize: '12px' }}>{reportDetails.verified_by_name} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({formatDateTime(reportDetails.verified_at)})</span></span>
                  </div>
                </div>

                <div className="signature-section">
                  <div className="signature-box">
                    <div className="signature-line">Lab Technician</div>
                  </div>
                  <div className="signature-box">
                    <div className="signature-line">Pathologist / Lab Head</div>
                  </div>
                </div>

                <div className="report-footer-note">
                  <p>This is a computer-generated report verified digitally in the HIMS LIS system.</p>
                  <p>*** END OF REPORT ***</p>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default LabReportDownload;