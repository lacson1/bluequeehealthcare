import { format } from 'date-fns';

/**
 * Generate lab order HTML for printing (Global Standards Compliant)
 */
export function generateLabOrderHTML(orderResult: any, orderItems: any[]): string {
  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'dd/MM/yyyy');
  };

  const formatDateTime = (date: string | Date) => {
    return format(new Date(date), 'dd/MM/yyyy HH:mm');
  };

  const formatTime = (date: string | Date) => {
    return format(new Date(date), 'HH:mm');
  };

  // Use organization data from the requesting staff member
  const orgName = orderResult.organizationName || 'Medical Facility';
  const orgPhone = orderResult.organizationPhone || '';
  const orgEmail = orderResult.organizationEmail || '';
  const orgAddress = orderResult.organizationAddress || '';
  const orgTheme = orderResult.organizationTheme || '#1a365d';

  // Generate accession number
  const accessionNumber = `ACC-${format(new Date(orderResult.createdAt), 'yyyyMMdd')}-${String(orderResult.orderId).padStart(4, '0')}`;

  // Calculate patient age
  const patientAge = orderResult.patientDateOfBirth
    ? Math.floor((new Date().getTime() - new Date(orderResult.patientDateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return `
<!DOCTYPE html>
<html lang="en" style="color-scheme: light;">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light">
    <title>Laboratory Requisition - ${accessionNumber}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html {
            background: #ffffff !important;
            background-color: #ffffff !important;
            color-scheme: light !important;
        }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            font-size: 11px;
            line-height: 1.4;
            color: #1a1a1a !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            padding: 15px;
            max-width: 210mm;
            margin: 0 auto;
        }
        
        /* Header Section */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid ${orgTheme};
            padding-bottom: 12px;
            margin-bottom: 15px;
        }
        .org-section { flex: 1; }
        .org-name {
            font-size: 18px;
            font-weight: 700;
            color: ${orgTheme};
            margin-bottom: 4px;
        }
        .org-details {
            font-size: 10px;
            color: #4a5568;
            line-height: 1.5;
        }
        .doc-info {
            text-align: right;
            min-width: 180px;
        }
        .doc-title {
            font-size: 14px;
            font-weight: 700;
            color: ${orgTheme};
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }
        .accession {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            font-weight: 700;
            background: #f0f4f8;
            padding: 6px 10px;
            border: 1px solid #cbd5e0;
            display: inline-block;
        }
        .barcode-placeholder {
            margin-top: 8px;
            font-family: 'Libre Barcode 39', monospace;
            font-size: 28px;
            letter-spacing: 2px;
        }
        
        /* Main Grid */
        .main-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
        }
        
        /* Info Boxes */
        .info-box {
            border: 1px solid #e2e8f0;
            padding: 10px;
        }
        .info-box-header {
            background: ${orgTheme};
            color: white;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 5px 8px;
            margin: -10px -10px 10px -10px;
        }
        .info-row {
            display: flex;
            margin-bottom: 4px;
        }
        .info-label {
            font-weight: 600;
            color: #4a5568;
            min-width: 90px;
            font-size: 10px;
        }
        .info-value {
            color: #1a202c;
            font-weight: 500;
        }
        .info-value-large {
            font-size: 13px;
            font-weight: 700;
            color: #1a202c;
        }
        
        /* Patient ID Badge */
        .patient-id-badge {
            display: inline-block;
            background: #edf2f7;
            border: 1px solid #a0aec0;
            padding: 2px 8px;
            font-family: 'Courier New', monospace;
            font-weight: 700;
            font-size: 11px;
        }
        
        /* Priority Indicator */
        .priority-routine { color: #2d7d46; }
        .priority-urgent { color: #c53030; font-weight: 700; }
        .priority-stat { color: #c53030; font-weight: 700; background: #fed7d7; padding: 2px 6px; }
        
        /* Tests Table */
        .tests-section { margin-bottom: 15px; }
        .section-header {
            background: ${orgTheme};
            color: white;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 6px 10px;
        }
        .tests-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
        }
        .tests-table th {
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            padding: 6px 8px;
            text-align: left;
            font-weight: 600;
            color: #4a5568;
            text-transform: uppercase;
            font-size: 9px;
        }
        .tests-table td {
            border: 1px solid #e2e8f0;
            padding: 8px;
            vertical-align: top;
        }
        .tests-table tr:nth-child(even) { background: #f7fafc; }
        .result-pending { color: #718096; font-style: italic; }
        .result-value {
            font-weight: 600;
            font-family: 'Courier New', monospace;
        }
        
        /* Specimen Section */
        .specimen-section {
            background: #fffbeb;
            border: 1px solid #f6e05e;
            padding: 10px;
            margin-bottom: 15px;
        }
        .specimen-header {
            font-weight: 600;
            color: #744210;
            font-size: 10px;
            text-transform: uppercase;
            margin-bottom: 8px;
        }
        .specimen-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
        }
        .specimen-item label {
            font-size: 9px;
            color: #744210;
            display: block;
            margin-bottom: 2px;
        }
        .specimen-input {
            border-bottom: 1px solid #d69e2e;
            min-height: 18px;
        }
        
        /* Clinical Info */
        .clinical-section {
            border: 1px solid #e2e8f0;
            margin-bottom: 15px;
        }
        .clinical-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            padding: 10px;
        }
        .clinical-item label {
            font-size: 9px;
            color: #4a5568;
            text-transform: uppercase;
            display: block;
            margin-bottom: 4px;
        }
        .clinical-input {
            border: 1px dashed #cbd5e0;
            min-height: 25px;
            padding: 4px;
        }
        
        /* Signatures */
        .signatures-section {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
        }
        .signature-box {
            border: 1px solid #e2e8f0;
            padding: 10px;
            text-align: center;
        }
        .signature-title {
            font-size: 9px;
            color: #4a5568;
            text-transform: uppercase;
            margin-bottom: 25px;
        }
        .signature-line {
            border-top: 1px solid #1a202c;
            margin-top: 20px;
            padding-top: 4px;
            font-size: 9px;
        }
        .signature-prefilled {
            font-weight: 600;
            font-size: 11px;
        }
        
        /* Footer */
        .footer {
            border-top: 2px solid ${orgTheme};
            padding-top: 10px;
            font-size: 9px;
            color: #718096;
        }
        .footer-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 15px;
        }
        .disclaimer {
            font-style: italic;
            line-height: 1.4;
        }
        .doc-tracking {
            text-align: right;
            font-family: 'Courier New', monospace;
        }
        
        /* Print Optimization */
        @media print {
            body { 
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
                background: #ffffff !important;
                background-color: #ffffff !important;
                color: #1a1a1a !important;
                padding: 0;
            }
            html {
                background: #ffffff !important;
                background-color: #ffffff !important;
            }
            .info-box-header, .section-header {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
            * { color-scheme: light !important; }
        }
        
        /* Page Break Control */
        .tests-section, .signatures-section {
            page-break-inside: avoid;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <div class="org-section">
            <div class="org-name">${orgName}</div>
            <div class="org-details">
                ${orgAddress ? `${orgAddress}<br>` : ''}
                ${orgPhone ? `Tel: ${orgPhone}` : ''}${orgPhone && orgEmail ? ' | ' : ''}${orgEmail ? `Email: ${orgEmail}` : ''}<br>
                Laboratory Services Department
            </div>
        </div>
        <div class="doc-info">
            <div class="doc-title">Laboratory Requisition</div>
            <div class="accession">${accessionNumber}</div>
            <div class="barcode-placeholder">*${accessionNumber}*</div>
        </div>
    </div>

    <!-- Patient & Order Info Grid -->
    <div class="main-grid">
        <!-- Patient Information -->
        <div class="info-box">
            <div class="info-box-header">Patient Information</div>
            <div class="info-row">
                <span class="info-label">Full Name:</span>
                <span class="info-value-large">${orderResult.patientFirstName} ${orderResult.patientLastName}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Patient ID:</span>
                <span class="patient-id-badge">P${String(orderResult.patientId).padStart(6, '0')}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Date of Birth:</span>
                <span class="info-value">${orderResult.patientDateOfBirth ? formatDate(orderResult.patientDateOfBirth) : '—'}</span>
                ${patientAge ? `<span style="margin-left: 8px; color: #718096;">(${patientAge} years)</span>` : ''}
            </div>
            <div class="info-row">
                <span class="info-label">Gender:</span>
                <span class="info-value">${orderResult.patientGender ? orderResult.patientGender.charAt(0).toUpperCase() + orderResult.patientGender.slice(1) : '—'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Contact:</span>
                <span class="info-value">${orderResult.patientPhone || '—'}</span>
            </div>
        </div>

        <!-- Order Information -->
        <div class="info-box">
            <div class="info-box-header">Order Information</div>
            <div class="info-row">
                <span class="info-label">Order Date:</span>
                <span class="info-value">${formatDate(orderResult.createdAt)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Order Time:</span>
                <span class="info-value">${formatTime(orderResult.createdAt)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Priority:</span>
                <span class="info-value priority-routine">ROUTINE</span>
            </div>
            <div class="info-row">
                <span class="info-label">Ordering MD:</span>
                <span class="info-value">Dr. ${orderResult.doctorFirstName || orderResult.doctorUsername || ''} ${orderResult.doctorLastName || ''}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Facility:</span>
                <span class="info-value">${orderResult.organizationName || '—'}</span>
            </div>
        </div>
    </div>

    <!-- Tests Requested -->
    <div class="tests-section">
        <div class="section-header">Tests Requested (${orderItems.length})</div>
        <table class="tests-table">
            <thead>
                <tr>
                    <th style="width: 5%;">#</th>
                    <th style="width: 35%;">Test Name</th>
                    <th style="width: 20%;">Category</th>
                    <th style="width: 25%;">Reference Range</th>
                    <th style="width: 15%;">Result</th>
                </tr>
            </thead>
            <tbody>
                ${orderItems.map((item, index) => `
                <tr>
                    <td style="text-align: center;">${index + 1}</td>
                    <td><strong>${item.testName || 'Unknown Test'}</strong></td>
                    <td>${item.testCategory || 'General'}</td>
                    <td>${item.referenceRange || '—'}</td>
                    <td>${item.result ? `<span class="result-value">${item.result}</span>` : '<span class="result-pending">Pending</span>'}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <!-- Specimen Collection (Lab Use) -->
    <div class="specimen-section">
        <div class="specimen-header">Specimen Collection (Laboratory Use Only)</div>
        <div class="specimen-grid">
            <div class="specimen-item">
                <label>Collection Date</label>
                <div class="specimen-input"></div>
            </div>
            <div class="specimen-item">
                <label>Collection Time</label>
                <div class="specimen-input"></div>
            </div>
            <div class="specimen-item">
                <label>Collected By</label>
                <div class="specimen-input"></div>
            </div>
            <div class="specimen-item">
                <label>Specimen Type</label>
                <div class="specimen-input"></div>
            </div>
        </div>
    </div>

    <!-- Clinical Information -->
    <div class="clinical-section">
        <div class="section-header">Clinical Information</div>
        <div class="clinical-grid">
            <div class="clinical-item">
                <label>Diagnosis / ICD-10 Code</label>
                <div class="clinical-input"></div>
            </div>
            <div class="clinical-item">
                <label>Relevant Clinical History</label>
                <div class="clinical-input"></div>
            </div>
            <div class="clinical-item">
                <label>Current Medications</label>
                <div class="clinical-input"></div>
            </div>
            <div class="clinical-item">
                <label>Special Instructions</label>
                <div class="clinical-input"></div>
            </div>
        </div>
    </div>

    <!-- Signatures -->
    <div class="signatures-section">
        <div class="signature-box">
            <div class="signature-title">Ordering Physician</div>
            <div class="signature-prefilled">Dr. ${orderResult.doctorFirstName || orderResult.doctorUsername || ''} ${orderResult.doctorLastName || ''}</div>
            <div class="signature-line">Signature / Date: ${formatDate(orderResult.createdAt)}</div>
        </div>
        <div class="signature-box">
            <div class="signature-title">Specimen Received By</div>
            <div class="signature-line">Signature / Date</div>
        </div>
        <div class="signature-box">
            <div class="signature-title">Results Verified By</div>
            <div class="signature-line">Signature / Date</div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <div class="footer-grid">
            <div class="disclaimer">
                <strong>CONFIDENTIAL:</strong> This laboratory requisition contains protected health information (PHI). 
                Handle in accordance with applicable privacy regulations. Results should be reviewed by qualified healthcare personnel.
                Critical values will be communicated immediately to the ordering physician.
            </div>
            <div class="doc-tracking">
                <strong>Accession:</strong> ${accessionNumber}<br>
                <strong>Printed:</strong> ${formatDateTime(new Date())}<br>
                <strong>Page:</strong> 1 of 1
            </div>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Generate lab history HTML for printing (Global Standards Compliant)
 */
export function generateLabHistoryHTML(patientData: any, labResultsData: any[], orgData: any): string {
  const formatDate = (date: string | Date | null) => {
    if (!date) return '—';
    return format(new Date(date), 'dd/MM/yyyy');
  };

  const formatDateTime = (date: string | Date) => {
    return format(new Date(date), 'dd/MM/yyyy HH:mm');
  };

  // Use organization data
  const orgName = orgData?.name || 'Medical Facility';
  const orgPhone = orgData?.phone || '';
  const orgEmail = orgData?.email || '';
  const orgAddress = orgData?.address || '';
  const orgTheme = orgData?.themeColor || '#1a365d';

  // Calculate patient age
  const patientAge = patientData.dateOfBirth
    ? Math.floor((new Date().getTime() - new Date(patientData.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  // Generate report number
  const reportNumber = `RPT-${format(new Date(), 'yyyyMMdd')}-${String(patientData.patientId).padStart(4, '0')}`;

  // Group results by date for better organization
  const groupedByDate = labResultsData.reduce((acc: any, result: any) => {
    const dateKey = result.testDate ? format(new Date(result.testDate), 'yyyy-MM-dd') : 'unknown';
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(result);
    return acc;
  }, {});

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laboratory Report - ${patientData.firstName} ${patientData.lastName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            font-size: 10px;
            line-height: 1.4;
            color: #1a1a1a;
            padding: 15px;
            max-width: 210mm;
            margin: 0 auto;
        }
        
        /* Header */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid ${orgTheme};
            padding-bottom: 12px;
            margin-bottom: 15px;
        }
        .org-section { flex: 1; }
        .org-name {
            font-size: 18px;
            font-weight: 700;
            color: ${orgTheme};
            margin-bottom: 4px;
        }
        .org-details {
            font-size: 9px;
            color: #4a5568;
            line-height: 1.5;
        }
        .report-info {
            text-align: right;
            min-width: 160px;
        }
        .report-title {
            font-size: 13px;
            font-weight: 700;
            color: ${orgTheme};
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 6px;
        }
        .report-number {
            font-family: 'Courier New', monospace;
            font-size: 11px;
            font-weight: 700;
            background: #f0f4f8;
            padding: 4px 8px;
            border: 1px solid #cbd5e0;
            display: inline-block;
        }
        
        /* Patient Card */
        .patient-card {
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            border: 1px solid #e2e8f0;
            border-left: 4px solid ${orgTheme};
            padding: 12px 15px;
            margin-bottom: 15px;
        }
        .patient-name {
            font-size: 16px;
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 8px;
        }
        .patient-details {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
        }
        .patient-field label {
            font-size: 8px;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: block;
            margin-bottom: 2px;
        }
        .patient-field span {
            font-size: 10px;
            font-weight: 600;
            color: #2d3748;
        }
        .patient-id-badge {
            font-family: 'Courier New', monospace;
            background: ${orgTheme};
            color: white;
            padding: 2px 6px;
            font-size: 10px;
        }
        
        /* Summary Stats */
        .summary-bar {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 15px;
        }
        .stat-box {
            background: white;
            border: 1px solid #e2e8f0;
            padding: 10px;
            text-align: center;
        }
        .stat-value {
            font-size: 20px;
            font-weight: 700;
            color: ${orgTheme};
        }
        .stat-label {
            font-size: 8px;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        /* Results Table */
        .results-section { margin-bottom: 15px; }
        .section-header {
            background: ${orgTheme};
            color: white;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 6px 10px;
        }
        .results-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
        }
        .results-table th {
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            padding: 6px 8px;
            text-align: left;
            font-weight: 600;
            color: #4a5568;
            text-transform: uppercase;
            font-size: 8px;
        }
        .results-table td {
            border: 1px solid #e2e8f0;
            padding: 8px;
            vertical-align: middle;
        }
        .results-table tr:nth-child(even) { background: #f7fafc; }
        .result-value {
            font-family: 'Courier New', monospace;
            font-size: 11px;
            font-weight: 700;
        }
        .result-normal { color: #2d7d46; }
        .result-abnormal { color: #c53030; }
        .reference-range {
            font-size: 8px;
            color: #718096;
        }
        .no-results {
            text-align: center;
            padding: 40px;
            color: #718096;
            font-style: italic;
            background: #f7fafc;
        }
        
        /* Interpretation Section */
        .interpretation-section {
            border: 1px solid #e2e8f0;
            margin-bottom: 15px;
        }
        .interpretation-content {
            padding: 12px;
            font-size: 9px;
            color: #4a5568;
            line-height: 1.6;
        }
        .interpretation-content ul {
            margin: 0;
            padding-left: 16px;
        }
        .interpretation-content li {
            margin-bottom: 4px;
        }
        
        /* Footer */
        .footer {
            border-top: 2px solid ${orgTheme};
            padding-top: 10px;
            margin-top: 15px;
        }
        .footer-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
            font-size: 8px;
        }
        .footer-section h4 {
            font-size: 9px;
            color: ${orgTheme};
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        .disclaimer {
            font-style: italic;
            color: #718096;
            font-size: 8px;
            margin-top: 10px;
            padding: 8px;
            background: #f7fafc;
            border: 1px solid #e2e8f0;
        }
        
        /* Print */
        @media print {
            body { 
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
                padding: 0;
            }
            .results-table { page-break-inside: auto; }
            .results-table tr { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <div class="org-section">
            <div class="org-name">${orgName}</div>
            <div class="org-details">
                ${orgAddress ? `${orgAddress}<br>` : ''}
                ${orgPhone ? `Tel: ${orgPhone}` : ''}${orgPhone && orgEmail ? ' | ' : ''}${orgEmail ? `Email: ${orgEmail}` : ''}<br>
                Laboratory Services Department
            </div>
        </div>
        <div class="report-info">
            <div class="report-title">Laboratory Report</div>
            <div class="report-number">${reportNumber}</div>
        </div>
    </div>

    <!-- Patient Card -->
    <div class="patient-card">
        <div class="patient-name">${patientData.firstName} ${patientData.lastName}</div>
        <div class="patient-details">
            <div class="patient-field">
                <label>Patient ID</label>
                <span class="patient-id-badge">P${String(patientData.patientId).padStart(6, '0')}</span>
            </div>
            <div class="patient-field">
                <label>Date of Birth</label>
                <span>${formatDate(patientData.dateOfBirth)}${patientAge ? ` (${patientAge}y)` : ''}</span>
            </div>
            <div class="patient-field">
                <label>Gender</label>
                <span>${patientData.gender ? patientData.gender.charAt(0).toUpperCase() + patientData.gender.slice(1) : '—'}</span>
            </div>
            <div class="patient-field">
                <label>Contact</label>
                <span>${patientData.phone || '—'}</span>
            </div>
        </div>
    </div>

    <!-- Summary Stats -->
    <div class="summary-bar">
        <div class="stat-box">
            <div class="stat-value">${labResultsData.length}</div>
            <div class="stat-label">Total Tests</div>
        </div>
        <div class="stat-box">
            <div class="stat-value">${Object.keys(groupedByDate).length}</div>
            <div class="stat-label">Test Sessions</div>
        </div>
        <div class="stat-box">
            <div class="stat-value">${labResultsData.filter(r => r.result).length}</div>
            <div class="stat-label">Completed</div>
        </div>
        <div class="stat-box">
            <div class="stat-value">${labResultsData.filter(r => !r.result).length}</div>
            <div class="stat-label">Pending</div>
        </div>
    </div>

    <!-- Results Table -->
    <div class="results-section">
        <div class="section-header">Laboratory Results</div>
        ${labResultsData.length === 0 ? `
        <div class="no-results">No laboratory results found for this patient.</div>
        ` : `
        <table class="results-table">
            <thead>
                <tr>
                    <th style="width: 12%;">Date</th>
                    <th style="width: 30%;">Test Name</th>
                    <th style="width: 18%;">Result</th>
                    <th style="width: 20%;">Reference Range</th>
                    <th style="width: 20%;">Notes</th>
                </tr>
            </thead>
            <tbody>
                ${labResultsData.map((result) => `
                <tr>
                    <td>${formatDate(result.testDate)}</td>
                    <td><strong>${result.testName || 'Unknown Test'}</strong></td>
                    <td>
                        ${result.result
      ? `<span class="result-value">${result.result}</span>`
      : '<span style="color: #718096; font-style: italic;">Pending</span>'}
                    </td>
                    <td><span class="reference-range">${result.normalRange || '—'}</span></td>
                    <td style="font-size: 8px; color: #4a5568;">${result.notes || '—'}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        `}
    </div>

    <!-- Interpretation Notes -->
    <div class="interpretation-section">
        <div class="section-header">Clinical Notes</div>
        <div class="interpretation-content">
            <ul>
                <li>This cumulative laboratory report contains all available test results for the patient.</li>
                <li>Results should be interpreted in conjunction with clinical findings and patient history.</li>
                <li>Reference ranges are method and instrument specific; variations between laboratories may occur.</li>
                <li>For critical or significantly abnormal results, please contact the laboratory directly.</li>
            </ul>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <div class="footer-grid">
            <div class="footer-section">
                <h4>Report Information</h4>
                Report #: ${reportNumber}<br>
                Generated: ${formatDateTime(new Date())}<br>
                Total Results: ${labResultsData.length}
            </div>
            <div class="footer-section">
                <h4>Patient Information</h4>
                ID: P${String(patientData.patientId).padStart(6, '0')}<br>
                ${patientData.firstName} ${patientData.lastName}<br>
                ${patientData.phone || ''}
            </div>
            <div class="footer-section">
                <h4>Facility</h4>
                ${orgName}<br>
                ${orgPhone ? `Tel: ${orgPhone}` : ''}<br>
                ${orgEmail || ''}
            </div>
        </div>
        <div class="disclaimer">
            <strong>CONFIDENTIALITY NOTICE:</strong> This report contains protected health information (PHI) and is intended solely for the named patient and authorized healthcare providers. 
            Unauthorized disclosure, copying, or distribution is prohibited. Results should be reviewed and interpreted by qualified medical personnel. 
            This report does not constitute a diagnosis. Please consult with your healthcare provider for medical advice.
        </div>
    </div>
</body>
</html>`;
}

