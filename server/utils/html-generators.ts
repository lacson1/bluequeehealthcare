import { format } from 'date-fns';

/**
 * Helper function to properly type Zod parse results
 */
export function parseAndType<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  return schema.parse(data) as z.infer<T>;
}

/**
 * Generate prescription HTML for printing
 */
export function generatePrescriptionHTML(prescriptionResult: any): string {
  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'PPP');
  };

  const formatDateTime = (date: string | Date) => {
    return format(new Date(date), 'PPP p');
  };

  // Use organization data from the prescribing staff member
  const orgName = prescriptionResult.organizationName || 'Medical Facility';
  const orgPhone = prescriptionResult.organizationPhone || 'Contact facility directly';
  const orgEmail = prescriptionResult.organizationEmail || 'Contact facility directly';
  const orgAddress = prescriptionResult.organizationAddress || 'Address on file';
  const orgTheme = prescriptionResult.organizationTheme || '#2563eb';

  // Generate organization logo initials
  const orgInitials = orgName.split(' ').map((word: any) => word.charAt(0)).join('').substring(0, 2).toUpperCase();

  return `
<!DOCTYPE html>
<html>
<head>
    <title>Prescription - RX${prescriptionResult.prescriptionId}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .letterhead { border-bottom: 3px solid ${orgTheme}; padding-bottom: 20px; margin-bottom: 30px; }
        .org-logo { float: left; width: 80px; height: 80px; background: ${orgTheme}; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px; }
        .org-info { margin-left: 100px; }
        .org-name { font-size: 24px; font-weight: bold; color: #1e40af; margin-bottom: 5px; }
        .org-details { color: #64748b; line-height: 1.4; }
        .document-title { text-align: center; font-size: 20px; font-weight: bold; color: #1e40af; margin: 30px 0; padding: 10px; border: 2px solid #e2e8f0; background: #f8fafc; }
        .section { margin: 25px 0; }
        .section-title { font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .info-item { margin-bottom: 8px; }
        .label { font-weight: bold; color: #4b5563; }
        .value { color: #1f2937; }
        .medication-box { border: 2px solid #059669; border-radius: 8px; padding: 20px; margin: 20px 0; background: #f0fdf4; }
        .medication-name { font-size: 18px; font-weight: bold; color: #059669; margin-bottom: 15px; text-transform: uppercase; }
        .prescription-details { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .prescription-item { background: white; padding: 10px; border-radius: 6px; border: 1px solid #d1fae5; }
        .instructions-box { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0; }
        .instructions-title { font-weight: bold; color: #92400e; margin-bottom: 8px; }
        .signature-area { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .signature-box { border-top: 1px solid #9ca3af; padding-top: 10px; text-align: center; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
        .rx-symbol { font-size: 24px; font-weight: bold; color: ${orgTheme}; }
        @media print {
            body { print-color-adjust: exact; }
            .letterhead { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="letterhead">
        <div class="org-logo">${orgInitials}</div>
        <div class="org-info">
            <div class="org-name">${orgName}</div>
            <div class="org-details">
                Healthcare Services<br>
                ${orgAddress}<br>
                Phone: ${orgPhone}<br>
                Email: ${orgEmail}<br>
                Pharmacy & Medical Services
            </div>
        </div>
        <div style="clear: both;"></div>
    </div>

    <div class="document-title">
        <span class="rx-symbol">℞</span> PRESCRIPTION
    </div>

    <div class="section">
        <div class="section-title">PATIENT INFORMATION</div>
        <div class="info-grid">
            <div>
                <div class="info-item">
                    <span class="label">Patient Name:</span> 
                    <span class="value">${prescriptionResult.patientFirstName} ${prescriptionResult.patientLastName}</span>
                </div>
                <div class="info-item">
                    <span class="label">Date of Birth:</span> 
                    <span class="value">${prescriptionResult.patientDateOfBirth ? formatDate(prescriptionResult.patientDateOfBirth) : 'Not specified'}</span>
                </div>
                <div class="info-item">
                    <span class="label">Gender:</span> 
                    <span class="value">${prescriptionResult.patientGender || 'Not specified'}</span>
                </div>
            </div>
            <div>
                <div class="info-item">
                    <span class="label">Patient ID:</span> 
                    <span class="value">P${String(prescriptionResult.patientId).padStart(6, '0')}</span>
                </div>
                <div class="info-item">
                    <span class="label">Phone:</span> 
                    <span class="value">${prescriptionResult.patientPhone || 'Not provided'}</span>
                </div>
                <div class="info-item">
                    <span class="label">Address:</span> 
                    <span class="value">${prescriptionResult.patientAddress || 'On file'}</span>
                </div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">PRESCRIBING PHYSICIAN</div>
        <div class="info-grid">
            <div>
                <div class="info-item">
                    <span class="label">Doctor:</span> 
                    <span class="value">Dr. ${prescriptionResult.doctorFirstName || prescriptionResult.doctorUsername} ${prescriptionResult.doctorLastName || ''}</span>
                </div>
                <div class="info-item">
                    <span class="label">Role:</span> 
                    <span class="value">${prescriptionResult.doctorRole ? prescriptionResult.doctorRole.charAt(0).toUpperCase() + prescriptionResult.doctorRole.slice(1) : 'Medical Staff'}</span>
                </div>
                <div class="info-item">
                    <span class="label">Prescription Date:</span> 
                    <span class="value">${formatDate(prescriptionResult.startDate)}</span>
                </div>
            </div>
            <div>
                <div class="info-item">
                    <span class="label">Prescribing Organization:</span> 
                    <span class="value">${prescriptionResult.organizationName || 'Not specified'}</span>
                </div>
                <div class="info-item">
                    <span class="label">Prescription ID:</span> 
                    <span class="value">RX-${String(prescriptionResult.prescriptionId).padStart(4, '0')}</span>
                </div>
            </div>
        </div>
    </div>

    <div class="medication-box">
        <div class="medication-name">${prescriptionResult.medicationName || 'Medication Name'}</div>
        <div class="prescription-details">
            <div class="prescription-item">
                <div class="label">Dosage</div>
                <div class="value">${prescriptionResult.dosage || 'As prescribed'}</div>
            </div>
            <div class="prescription-item">
                <div class="label">Frequency</div>
                <div class="value">${prescriptionResult.frequency || 'As directed'}</div>
            </div>
            <div class="prescription-item">
                <div class="label">Duration</div>
                <div class="value">${prescriptionResult.duration || 'As prescribed'}</div>
            </div>
            <div class="prescription-item">
                <div class="label">Status</div>
                <div class="value">${prescriptionResult.status ? prescriptionResult.status.charAt(0).toUpperCase() + prescriptionResult.status.slice(1) : 'Active'}</div>
            </div>
        </div>
        ${prescriptionResult.endDate ? `
        <div style="margin-top: 15px;">
            <div class="label">Treatment Period:</div>
            <div class="value">${formatDate(prescriptionResult.startDate)} to ${formatDate(prescriptionResult.endDate)}</div>
        </div>
        ` : ''}
    </div>

    ${prescriptionResult.instructions ? `
    <div class="instructions-box">
        <div class="instructions-title">SPECIAL INSTRUCTIONS</div>
        <div>${prescriptionResult.instructions}</div>
    </div>
    ` : ''}

    <div class="signature-area">
        <div class="signature-box">
            <strong>Prescribing Physician</strong><br>
            Dr. ${prescriptionResult.doctorFirstName || prescriptionResult.doctorUsername} ${prescriptionResult.doctorLastName || ''}<br>
            ${prescriptionResult.organizationName}<br>
            Date: ${formatDate(prescriptionResult.startDate)}
        </div>
        <div class="signature-box">
            <strong>Pharmacist Use Only</strong><br>
            Dispensed By: ________________<br>
            Date: _______________________<br>
            Pharmacy Seal: _______________
        </div>
    </div>

    <div class="footer">
        <strong>Prescription ID:</strong> RX-${String(prescriptionResult.prescriptionId).padStart(4, '0')} | 
        <strong>Generated:</strong> ${formatDateTime(new Date())} | 
        <strong>Prescribed by:</strong> ${prescriptionResult.organizationName}<br>
        <em>This prescription is valid for dispensing medication as per the prescribed dosage and duration. Original prescription required for controlled substances.</em>
    </div>
</body>
</html>`;
}

// Note: generateLabOrderHTML and generateLabHistoryHTML are very large (500+ lines each)
// They should be extracted to separate files for better maintainability
// For now, keeping them in routes.ts but they should be moved to:
// - server/utils/lab-order-html.ts
// - server/utils/lab-history-html.ts

/**
 * Generate referral HTML for printing with organizational letterhead
 */
export function generateReferralHTML(referralData: any): string {
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'Not specified';
    try {
      return format(new Date(date), 'PPP');
    } catch {
      return 'Not specified';
    }
  };

  const formatDateTime = (date: string | Date) => {
    return format(new Date(date), 'PPP p');
  };

  // Organization data
  const orgName = referralData.organizationName || 'Medical Facility';
  const orgPhone = referralData.organizationPhone || 'Contact facility directly';
  const orgEmail = referralData.organizationEmail || 'info@clinic.com';
  const orgAddress = referralData.organizationAddress || 'Address on file';
  const orgTheme = referralData.organizationTheme || '#2563eb';
  const orgWebsite = referralData.organizationWebsite || '';

  // Generate organization logo initials
  const orgInitials = orgName.split(' ').map((word: string) => word.charAt(0)).join('').substring(0, 2).toUpperCase();

  // Urgency styling
  const urgencyColors: Record<string, { bg: string; border: string; text: string }> = {
    'urgent': { bg: '#fef2f2', border: '#dc2626', text: '#991b1b' },
    'routine': { bg: '#f0fdf4', border: '#16a34a', text: '#166534' },
    'non-urgent': { bg: '#eff6ff', border: '#2563eb', text: '#1e40af' },
  };
  const urgency = referralData.urgency?.toLowerCase() || 'routine';
  const urgencyStyle = urgencyColors[urgency] || urgencyColors['routine'];
  const urgencyLabel = urgency.charAt(0).toUpperCase() + urgency.slice(1);

  // Referral number
  const referralNumber = `REF-${String(referralData.referralId || referralData.id).padStart(6, '0')}`;

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Referral Letter - ${referralNumber}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            padding: 40px; 
            max-width: 800px; 
            margin: 0 auto;
            color: #1f2937;
            line-height: 1.6;
            background: #ffffff;
        }
        
        /* Letterhead */
        .letterhead { 
            border-bottom: 3px solid ${orgTheme}; 
            padding-bottom: 20px; 
            margin-bottom: 30px;
            display: flex;
            align-items: flex-start;
            gap: 20px;
        }
        .org-logo { 
            width: 80px; 
            height: 80px; 
            background: linear-gradient(135deg, ${orgTheme} 0%, ${orgTheme}dd 100%); 
            border-radius: 12px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-weight: bold; 
            font-size: 24px;
            flex-shrink: 0;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .org-info { flex-grow: 1; }
        .org-name { 
            font-size: 26px; 
            font-weight: bold; 
            color: ${orgTheme}; 
            margin-bottom: 8px; 
        }
        .org-details { 
            color: #64748b; 
            line-height: 1.5; 
            font-size: 13px;
        }
        .org-details a { color: ${orgTheme}; text-decoration: none; }
        
        /* Document Title */
        .document-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
            border-left: 4px solid ${orgTheme};
        }
        .document-title { 
            font-size: 22px; 
            font-weight: bold; 
            color: #1e293b;
        }
        .document-meta {
            text-align: right;
            font-size: 13px;
            color: #64748b;
        }
        .document-meta strong { color: #1e293b; }
        
        /* Urgency Badge */
        .urgency-badge {
            display: inline-block;
            padding: 8px 20px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            background: ${urgencyStyle.bg};
            border: 2px solid ${urgencyStyle.border};
            color: ${urgencyStyle.text};
            margin-bottom: 25px;
        }
        
        /* Letter Content */
        .letter-date {
            text-align: right;
            color: #64748b;
            margin-bottom: 25px;
            font-size: 14px;
        }
        .salutation {
            margin-bottom: 20px;
            font-size: 15px;
        }
        .letter-body {
            margin-bottom: 30px;
            font-size: 15px;
        }
        
        /* Info Sections */
        .section { 
            margin: 25px 0; 
            page-break-inside: avoid;
        }
        .section-title { 
            font-weight: bold; 
            color: ${orgTheme}; 
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #e2e8f0; 
            padding-bottom: 8px; 
            margin-bottom: 15px; 
        }
        .info-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 15px; 
        }
        .info-item { margin-bottom: 10px; }
        .label { 
            font-weight: 600; 
            color: #64748b; 
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            display: block;
            margin-bottom: 4px;
        }
        .value { 
            color: #1e293b; 
            font-size: 14px;
        }
        
        /* Specialty Box */
        .specialty-box {
            background: linear-gradient(135deg, ${orgTheme}10 0%, ${orgTheme}05 100%);
            border: 2px solid ${orgTheme};
            border-radius: 10px;
            padding: 20px;
            margin: 25px 0;
        }
        .specialty-title {
            font-size: 18px;
            font-weight: bold;
            color: ${orgTheme};
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .specialty-icon {
            width: 40px;
            height: 40px;
            background: ${orgTheme};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
        }
        
        /* Reason Box */
        .reason-box {
            background: #fffbeb;
            border: 1px solid #fcd34d;
            border-left: 4px solid #f59e0b;
            border-radius: 0 8px 8px 0;
            padding: 20px;
            margin: 25px 0;
        }
        .reason-title {
            font-weight: bold;
            color: #92400e;
            margin-bottom: 10px;
            font-size: 14px;
            text-transform: uppercase;
        }
        .reason-content {
            color: #78350f;
            white-space: pre-wrap;
            line-height: 1.7;
        }
        
        /* Notes Box */
        .notes-box {
            background: #faf5ff;
            border: 1px solid #e9d5ff;
            border-left: 4px solid #a855f7;
            border-radius: 0 8px 8px 0;
            padding: 20px;
            margin: 25px 0;
        }
        .notes-title {
            font-weight: bold;
            color: #7e22ce;
            margin-bottom: 10px;
            font-size: 14px;
            text-transform: uppercase;
        }
        .notes-content {
            color: #581c87;
            white-space: pre-wrap;
            line-height: 1.7;
        }
        
        /* Signature Area */
        .signature-area { 
            margin-top: 50px; 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 50px; 
        }
        .signature-box { 
            text-align: center; 
        }
        .signature-line {
            border-top: 1px solid #1e293b;
            padding-top: 10px;
            margin-top: 50px;
        }
        .signature-name {
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 4px;
        }
        .signature-title-text {
            color: #64748b;
            font-size: 13px;
        }
        .signature-org {
            color: ${orgTheme};
            font-size: 12px;
            margin-top: 4px;
        }
        
        /* Footer */
        .footer { 
            margin-top: 50px; 
            padding-top: 20px; 
            border-top: 2px solid #e2e8f0; 
            font-size: 11px; 
            color: #64748b; 
        }
        .footer-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 20px;
        }
        .footer-disclaimer {
            font-style: italic;
            line-height: 1.5;
        }
        .footer-tracking {
            text-align: right;
            font-family: 'Courier New', monospace;
        }
        
        /* Print Styles */
        @media print {
            body { 
                print-color-adjust: exact; 
                -webkit-print-color-adjust: exact;
                padding: 20px;
            }
            .letterhead, .section, .specialty-box, .reason-box { 
                page-break-inside: avoid; 
            }
            .signature-area {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <!-- Letterhead -->
    <div class="letterhead">
        <div class="org-logo">${orgInitials}</div>
        <div class="org-info">
            <div class="org-name">${orgName}</div>
            <div class="org-details">
                ${orgAddress}<br>
                📞 ${orgPhone} ${orgEmail ? `| 📧 ${orgEmail}` : ''}<br>
                ${orgWebsite ? `🌐 ${orgWebsite}` : ''}
            </div>
        </div>
    </div>

    <!-- Document Header -->
    <div class="document-header">
        <div class="document-title">PATIENT REFERRAL LETTER</div>
        <div class="document-meta">
            <strong>${referralNumber}</strong><br>
            Date: ${formatDate(referralData.referralDate || referralData.createdAt || new Date())}
        </div>
    </div>

    <!-- Urgency Badge -->
    <div class="urgency-badge">${urgencyLabel} Referral</div>

    <!-- Letter Date -->
    <div class="letter-date">
        ${formatDate(referralData.referralDate || referralData.createdAt || new Date())}
    </div>

    <!-- Salutation -->
    <div class="salutation">
        <p><strong>To Whom It May Concern,</strong></p>
        ${referralData.referredToDoctor ? `<p>Attention: Dr. ${referralData.referredToDoctor}</p>` : ''}
        ${referralData.referredToFacility ? `<p>${referralData.referredToFacility}</p>` : ''}
    </div>

    <!-- Letter Body -->
    <div class="letter-body">
        <p>We are referring the below-named patient to your care for specialist consultation and management.</p>
    </div>

    <!-- Patient Information -->
    <div class="section">
        <div class="section-title">Patient Information</div>
        <div class="info-box">
            <div class="info-grid">
                <div>
                    <div class="info-item">
                        <span class="label">Patient Name</span>
                        <span class="value"><strong>${referralData.patientFirstName || ''} ${referralData.patientLastName || ''}</strong></span>
                    </div>
                    <div class="info-item">
                        <span class="label">Date of Birth</span>
                        <span class="value">${formatDate(referralData.patientDateOfBirth)}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Gender</span>
                        <span class="value">${referralData.patientGender || 'Not specified'}</span>
                    </div>
                </div>
                <div>
                    <div class="info-item">
                        <span class="label">Patient ID / MRN</span>
                        <span class="value">${referralData.patientMrn || `P${String(referralData.patientId).padStart(6, '0')}`}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Phone</span>
                        <span class="value">${referralData.patientPhone || 'On file'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Address</span>
                        <span class="value">${referralData.patientAddress || 'On file'}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Specialty Box -->
    <div class="specialty-box">
        <div class="specialty-title">
            <div class="specialty-icon">🏥</div>
            Referral to: ${referralData.specialty || 'Specialist'}
        </div>
        <div class="info-grid">
            ${referralData.referredToDoctor ? `
            <div class="info-item">
                <span class="label">Referred To Doctor</span>
                <span class="value">Dr. ${referralData.referredToDoctor}</span>
            </div>
            ` : ''}
            ${referralData.referredToFacility ? `
            <div class="info-item">
                <span class="label">Referred To Facility</span>
                <span class="value">${referralData.referredToFacility}</span>
            </div>
            ` : ''}
            ${referralData.appointmentDate ? `
            <div class="info-item">
                <span class="label">Requested Appointment Date</span>
                <span class="value">${formatDate(referralData.appointmentDate)}</span>
            </div>
            ` : ''}
        </div>
    </div>

    <!-- Reason for Referral -->
    <div class="reason-box">
        <div class="reason-title">Reason for Referral</div>
        <div class="reason-content">${referralData.reason || 'Please see patient for specialist evaluation and management.'}</div>
    </div>

    ${referralData.notes ? `
    <!-- Additional Notes -->
    <div class="notes-box">
        <div class="notes-title">Additional Clinical Notes</div>
        <div class="notes-content">${referralData.notes}</div>
    </div>
    ` : ''}

    <!-- Referring Physician Information -->
    <div class="section">
        <div class="section-title">Referring Physician</div>
        <div class="info-box">
            <div class="info-grid">
                <div>
                    <div class="info-item">
                        <span class="label">Physician Name</span>
                        <span class="value"><strong>Dr. ${referralData.doctorFirstName || ''} ${referralData.doctorLastName || referralData.doctorUsername || 'Medical Officer'}</strong></span>
                    </div>
                    <div class="info-item">
                        <span class="label">Designation</span>
                        <span class="value">${referralData.doctorRole ? referralData.doctorRole.charAt(0).toUpperCase() + referralData.doctorRole.slice(1) : 'Medical Staff'}</span>
                    </div>
                </div>
                <div>
                    <div class="info-item">
                        <span class="label">Organization</span>
                        <span class="value">${orgName}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Contact</span>
                        <span class="value">${orgPhone}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Signature Area -->
    <div class="signature-area">
        <div class="signature-box">
            <div class="signature-line">
                <div class="signature-name">Dr. ${referralData.doctorFirstName || ''} ${referralData.doctorLastName || referralData.doctorUsername || ''}</div>
                <div class="signature-title-text">Referring Physician</div>
                <div class="signature-org">${orgName}</div>
            </div>
        </div>
        <div class="signature-box">
            <div class="signature-line">
                <div class="signature-name">_______________________</div>
                <div class="signature-title-text">Receiving Physician</div>
                <div class="signature-org">Date: _______________</div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <div class="footer-grid">
            <div class="footer-disclaimer">
                This referral letter contains confidential patient information and is intended solely for the receiving healthcare provider. 
                Please treat this document in accordance with applicable privacy regulations and medical confidentiality standards.
            </div>
            <div class="footer-tracking">
                <strong>${referralNumber}</strong><br>
                Generated: ${formatDateTime(new Date())}<br>
                ${orgName}
            </div>
        </div>
    </div>
</body>
</html>`;
}

