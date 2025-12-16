# Psychiatry Workspace Organization Guide

## A Psychiatrist's Perspective on Multi-Specialist Application Layout

### Executive Summary

As a psychiatrist working in a multi-specialist healthcare application, I need a workspace that prioritizes **mental health workflows**, **risk assessment**, and **longitudinal patient care** while maintaining access to essential medical information. This document outlines the ideal organization from a psychiatrist's clinical perspective.

---

## 🎯 Core Principles

1. **Risk-First Design**: Suicide and violence risk assessment must be immediately accessible
2. **Longitudinal View**: Psychiatric care requires tracking symptoms, medications, and functioning over time
3. **Assessment Integration**: Standardized scales (PHQ-9, GAD-7, etc.) should be seamlessly integrated
4. **Medication Focus**: Psychiatric medications require careful monitoring of adherence, side effects, and interactions
5. **Therapy Tracking**: Psychotherapy notes and progress should be easily accessible
6. **Crisis Management**: Emergency protocols and safety planning must be prominent

---

## 📋 Recommended Workspace Structure

### 1. **Psychiatry Dashboard** (Primary Landing Page)

**Location**: `/psychiatry-dashboard` or role-based redirect for psychiatrists

**Components**:

```
┌─────────────────────────────────────────────────────────┐
│  Psychiatry Dashboard                                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  [CRITICAL ALERTS BANNER]                                │
│  • High-risk patients requiring follow-up                │
│  • Patients with missed appointments                     │
│  • Medication adherence alerts                           │
│                                                           │
│  [QUICK ACTIONS]                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ New      │ │ Risk     │ │ Quick    │ │ Patient  │  │
│  │ Consult  │ │ Assess   │ │ PHQ-9    │ │ Search   │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                           │
│  [MY PATIENTS - PRIORITIZED]                             │
│  • Today's appointments                                  │
│  • High-risk patients (flagged)                          │
│  • Follow-up due this week                               │
│  • Medication review needed                              │
│                                                           │
│  [CLINICAL METRICS]                                      │
│  • Active patients                                        │
│  • Average session duration                              │
│  • Treatment outcomes (improvement rates)                │
│  • Medication adherence rates                            │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**Key Features**:
- **Risk Alert System**: Visual indicators for patients requiring immediate attention
- **Quick Assessment Tools**: One-click access to PHQ-9, GAD-7, suicide risk scales
- **Appointment Integration**: Today's schedule with patient risk levels
- **Medication Alerts**: Patients with adherence issues or side effects

---

### 2. **Patient Profile - Psychiatry View**

**Enhanced Patient Profile with Psychiatry-Specific Tabs**:

```
┌─────────────────────────────────────────────────────────┐
│  Patient: [Name] | DOB: [Date] | MRN: [ID]              │
│  [RISK BADGE: High/Medium/Low] [CRISIS PROTOCOL BUTTON] │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  TABS:                                                    │
│  [Overview] [Psychiatric History] [Assessments]         │
│  [Medications] [Therapy] [Risk Tracking] [Documents]    │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │ TAB: Psychiatric History                         │    │
│  │                                                  │    │
│  │ [Timeline View - Chronological]                  │    │
│  │ • 2024-12-09: Initial consult - MDD             │    │
│  │ • 2024-11-15: Follow-up - improved mood         │    │
│  │ • 2024-10-20: Crisis assessment - low risk      │    │
│  │                                                  │    │
│  │ [Diagnosis History]                              │    │
│  │ • Current: Major Depressive Disorder (F32.1)     │    │
│  │ • Past: Generalized Anxiety Disorder (F41.1)     │    │
│  │                                                  │    │
│  │ [Hospitalization History]                        │    │
│  │ • 2023-05-10: Inpatient - 7 days                │    │
│  │                                                  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │ TAB: Assessments                                  │    │
│  │                                                  │    │
│  │ [Standardized Scales - Visual Timeline]          │    │
│  │ PHQ-9: [Graph showing scores over time]           │    │
│  │ GAD-7: [Graph showing scores over time]          │    │
│  │ Suicide Risk: [Timeline with risk levels]       │    │
│  │                                                  │    │
│  │ [Quick Assessment Buttons]                        │    │
│  │ [PHQ-9] [GAD-7] [PCL-5] [MSE] [Risk Assessment] │    │
│  │                                                  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │ TAB: Medications (Psychiatric Focus)            │    │
│  │                                                  │    │
│  │ [Current Psychiatric Medications]                │    │
│  │ • Sertraline 100mg daily - Started: 2024-09-01  │    │
│  │   [Adherence: 85%] [Side Effects: Mild nausea]  │    │
│  │                                                  │    │
│  │ [Medication History]                             │    │
│  │ • Previous: Fluoxetine 20mg (stopped - SE)      │    │
│  │                                                  │    │
│  │ [Drug Interactions Check]                        │    │
│  │ • No significant interactions                    │    │
│  │                                                  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │ TAB: Therapy                                     │    │
│  │                                                  │    │
│  │ [Therapy Sessions Timeline]                      │    │
│  │ • 2024-12-09: CBT - Session 12                   │    │
│  │   Focus: Cognitive restructuring                 │    │
│  │                                                  │    │
│  │ [Therapy Types]                                  │    │
│  │ • Cognitive Behavioral Therapy (CBT)             │    │
│  │ • Dialectical Behavior Therapy (DBT)            │    │
│  │                                                  │    │
│  │ [Progress Notes]                                 │    │
│  │ • Patient showing improvement in mood            │    │
│  │                                                  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │ TAB: Risk Tracking                               │    │
│  │                                                  │    │
│  │ [Risk Assessment History]                        │    │
│  │ • 2024-12-09: LOW - Protective factors present   │    │
│  │ • 2024-11-15: MEDIUM - Increased ideation        │    │
│  │                                                  │    │
│  │ [Safety Plans]                                   │    │
│  │ • Current safety plan (view/edit)               │    │
│  │                                                  │    │
│  │ [Crisis Contacts]                                │    │
│  │ • Emergency contact: [Name] [Phone]             │    │
│  │                                                  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**Key Features**:
- **Risk Badge**: Prominent visual indicator of current risk level
- **Crisis Protocol Button**: One-click access to emergency procedures
- **Timeline View**: Chronological view of psychiatric history
- **Assessment Graphs**: Visual tracking of standardized scale scores
- **Medication Adherence Tracking**: Real-time adherence monitoring
- **Therapy Integration**: Seamless therapy session documentation

---

### 3. **Consultation Workflow - Psychiatry Optimized**

**Enhanced Consultation Wizard with Psychiatry-First Approach**:

```
┌─────────────────────────────────────────────────────────┐
│  New Psychiatric Consultation                           │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  STEPS:                                                    │
│  [1. Risk Assessment] ← START HERE FOR PSYCHIATRY        │
│  [2. Presenting Concerns]                                 │
│  [3. Mental State Examination]                            │
│  [4. Psychiatric History]                                 │
│  [5. Functional Assessment]                               │
│  [6. Standardized Assessments]                            │
│  [7. Diagnosis & Formulation]                             │
│  [8. Treatment Plan]                                      │
│  [9. Medications]                                         │
│  [10. Safety Planning]                                     │
│  [11. Follow-up]                                           │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │ STEP 1: Risk Assessment (REQUIRED FIRST)        │    │
│  │                                                  │    │
│  │ [CRITICAL - Complete before proceeding]          │    │
│  │                                                  │    │
│  │ Suicidal Ideation: [ ] None [ ] Passive         │    │
│  │                    [ ] Active [ ] With Plan      │    │
│  │                                                  │    │
│  │ If active: [Details textarea]                    │    │
│  │ Plan: [Details textarea]                         │    │
│  │ Means: [Details textarea]                       │    │
│  │ Intent: [Details textarea]                       │    │
│  │                                                  │    │
│  │ Homicidal Ideation: [Similar structure]         │    │
│  │                                                  │    │
│  │ Self-Harm: [ ] None [ ] History [ ] Current      │    │
│  │                                                  │    │
│  │ Risk Level: [ ] LOW [ ] MEDIUM [ ] HIGH          │    │
│  │                                                  │    │
│  │ [If HIGH RISK: Emergency Protocol Activated]     │    │
│  │                                                  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │ STEP 6: Standardized Assessments                │    │
│  │                                                  │    │
│  │ [Quick Assessment Tools]                         │    │
│  │                                                  │    │
│  │ [PHQ-9 Depression Scale]                          │    │
│  │ [GAD-7 Anxiety Scale]                            │    │
│  │ [PCL-5 PTSD Scale]                               │    │
│  │ [MADRS Depression Rating]                        │    │
│  │ [YMRS Mania Rating]                              │    │
│  │ [MMSE Cognitive Screening]                       │    │
│  │                                                  │    │
│  │ [Results Auto-Populate Consultation Form]        │    │
│  │                                                  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**Key Features**:
- **Risk-First Workflow**: Risk assessment is the first step, not buried
- **Integrated Assessment Tools**: Standardized scales embedded in workflow
- **Auto-Population**: Assessment results automatically populate consultation notes
- **Emergency Protocols**: Automatic activation for high-risk patients
- **Safety Planning**: Built-in safety plan creation

---

### 4. **Sidebar Navigation - Psychiatry Role**

**Recommended Sidebar Structure for Psychiatrists**:

```
┌─────────────────────┐
│  CLINIC CONNECT      │
│  [Logo]              │
├─────────────────────┤
│                     │
│  MAIN               │
│  ┌─────────────────┐│
│  │ 🏠 Dashboard    ││ ← Psychiatry Dashboard
│  │ 👥 My Patients  ││ ← Filtered to psychiatric patients
│  │ 📅 Appointments││
│  └─────────────────┘│
│                     │
│  PSYCHIATRY         │ ← NEW SECTION
│  ┌─────────────────┐│
│  │ 🧠 Consultations││ ← Quick access to consultation wizard
│  │ ⚠️  Risk Monitor ││ ← High-risk patients dashboard
│  │ 📊 Assessments  ││ ← PHQ-9, GAD-7, etc.
│  │ 💊 Medications  ││ ← Psychiatric medication management
│  │ 🗣️  Therapy     ││ ← Therapy session management
│  │ 📈 Outcomes     ││ ← Treatment outcome tracking
│  └─────────────────┘│
│                     │
│  CLINICAL           │
│  ┌─────────────────┐│
│  │ 🧪 Lab Results  ││ ← Relevant labs (lithium levels, etc.)
│  │ 📄 Documents    ││
│  │ 📋 Form Builder ││
│  └─────────────────┘│
│                     │
│  COLLABORATION      │
│  ┌─────────────────┐│
│  │ 👨‍⚕️ Referrals   ││ ← Refer to other specialists
│  │ 💬 Messages     ││ ← Communication with team
│  └─────────────────┘│
│                     │
│  ADMIN              │
│  ┌─────────────────┐│
│  │ ⚙️  Settings    ││
│  └─────────────────┘│
│                     │
└─────────────────────┘
```

**Key Features**:
- **Dedicated Psychiatry Section**: All psychiatry-specific tools in one place
- **Risk Monitor**: Dedicated section for high-risk patients
- **Assessment Tools**: Quick access to standardized scales
- **Therapy Management**: Separate section for therapy documentation
- **Outcomes Tracking**: Visual tracking of treatment effectiveness

---

### 5. **Quick Actions & Floating Menu**

**Psychiatry-Specific Quick Actions**:

```
┌─────────────────────────────────────┐
│  [Floating Action Button]            │
│  ┌─────────────────────────────────┐ │
│  │ ➕ Quick Actions                │ │
│  ├─────────────────────────────────┤ │
│  │ 🧠 New Consultation             │ │
│  │ ⚠️  Risk Assessment             │ │
│  │ 📊 Run PHQ-9                    │ │
│  │ 📊 Run GAD-7                     │ │
│  │ 💊 Prescribe Medication         │ │
│  │ 🗣️  Log Therapy Session         │ │
│  │ 📋 Create Safety Plan           │ │
│  │ 📄 Add Document                 │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

### 6. **Patient List - Psychiatry View**

**Enhanced Patient List with Psychiatric Indicators**:

```
┌─────────────────────────────────────────────────────────┐
│  My Psychiatric Patients                    [Search] [Filter]│
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌───────────────────────────────────────────────────┐   │
│  │ [🔴 HIGH] John Doe, 45M                            │   │
│  │ MDD | Last visit: 2 days ago | Next: Tomorrow     │   │
│  │ PHQ-9: 18 (Severe) | Adherence: 60% ⚠️           │   │
│  │ [View] [Quick Consult] [Risk Assess]              │   │
│  └───────────────────────────────────────────────────┘   │
│                                                           │
│  ┌───────────────────────────────────────────────────┐   │
│  │ [🟡 MEDIUM] Jane Smith, 32F                       │   │
│  │ GAD | Last visit: 1 week ago | Next: Next week    │   │
│  │ GAD-7: 12 (Moderate) | Adherence: 90% ✓          │   │
│  │ [View] [Quick Consult] [Risk Assess]              │   │
│  └───────────────────────────────────────────────────┘   │
│                                                           │
│  ┌───────────────────────────────────────────────────┐   │
│  │ [🟢 LOW] Bob Johnson, 28M                          │   │
│  │ PTSD | Last visit: 2 weeks ago | Next: 1 month    │   │
│  │ PCL-5: 25 (Mild) | Adherence: 95% ✓              │   │
│  │ [View] [Quick Consult] [Risk Assess]              │   │
│  └───────────────────────────────────────────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**Key Features**:
- **Risk Level Badges**: Color-coded risk indicators
- **Latest Assessment Scores**: Quick view of recent PHQ-9, GAD-7, etc.
- **Medication Adherence**: Visual adherence indicators
- **Quick Actions**: One-click access to common tasks

---

## 🔧 Technical Implementation Recommendations

### 1. **Role-Based Views**

```typescript
// Example: Role-based routing
if (user.role === 'psychiatrist') {
  // Redirect to psychiatry dashboard
  navigate('/psychiatry-dashboard');
} else {
  // Standard dashboard
  navigate('/dashboard');
}
```

### 2. **Patient Filtering**

```typescript
// Filter patients with psychiatric history
const psychiatricPatients = patients.filter(patient => 
  patient.consultations.some(consultation => 
    consultation.specialistRole === 'psychiatrist' ||
    consultation.diagnosis?.category === 'psychiatric'
  )
);
```

### 3. **Risk Assessment Integration**

```typescript
// Risk assessment component
<RiskAssessment
  patientId={patient.id}
  onRiskLevelChange={(level) => {
    // Update patient risk badge
    // Trigger alerts if high risk
    // Activate emergency protocols
  }}
/>
```

### 4. **Assessment Tool Integration**

```typescript
// Standardized assessment tools
<AssessmentTool
  type="PHQ-9"
  patientId={patient.id}
  onComplete={(score, severity) => {
    // Auto-populate consultation form
    // Update patient assessment history
    // Trigger alerts if severe
  }}
/>
```

---

## 📊 Data Visualization Needs

### 1. **Assessment Score Trends**

- **PHQ-9 Timeline**: Graph showing depression scores over time
- **GAD-7 Timeline**: Graph showing anxiety scores over time
- **Risk Level Timeline**: Visual representation of risk changes
- **Medication Adherence Chart**: Percentage adherence over time

### 2. **Treatment Outcomes**

- **Symptom Improvement**: Before/after comparison
- **Functional Improvement**: Work, social, daily living metrics
- **Medication Response**: Effectiveness tracking

---

## 🚨 Critical Features for Psychiatrists

### 1. **Risk Management**

- **Immediate Risk Alerts**: Visual and audio alerts for high-risk patients
- **Safety Plan Templates**: Quick access to safety plan creation
- **Emergency Contacts**: One-click access to crisis contacts
- **Crisis Protocol**: Step-by-step emergency procedures

### 2. **Medication Management**

- **Psychiatric Medication Database**: Comprehensive psychotropic medication library
- **Drug Interaction Warnings**: Specific to psychiatric medications
- **Adherence Monitoring**: Real-time tracking and alerts
- **Side Effect Tracking**: Systematic side effect documentation

### 3. **Assessment Tools**

- **Integrated Scales**: PHQ-9, GAD-7, PCL-5, MADRS, YMRS, MMSE
- **Auto-Calculation**: Automatic score calculation and interpretation
- **Trend Analysis**: Visual representation of scores over time
- **Comparison**: Compare current vs. previous assessments

### 4. **Therapy Documentation**

- **Session Notes**: Structured therapy session documentation
- **Progress Tracking**: Visual progress indicators
- **Treatment Modalities**: CBT, DBT, psychodynamic, etc.
- **Therapist Collaboration**: Notes sharing with therapists

---

## 🎨 UI/UX Considerations

### 1. **Color Coding**

- **Risk Levels**: 
  - 🔴 Red: High risk
  - 🟡 Yellow: Medium risk
  - 🟢 Green: Low risk
- **Assessment Scores**:
  - Red: Severe
  - Orange: Moderate
  - Yellow: Mild
  - Green: Minimal

### 2. **Information Hierarchy**

1. **Risk Assessment** (Top priority)
2. **Current Symptoms** (Second priority)
3. **Medications** (Third priority)
4. **History** (Fourth priority)
5. **Other Medical Info** (Lower priority)

### 3. **Workflow Optimization**

- **Minimize Clicks**: Common tasks should be 1-2 clicks away
- **Keyboard Shortcuts**: Quick access for frequent actions
- **Templates**: Pre-filled forms for common scenarios
- **Auto-Save**: Prevent data loss during long consultations

---

## 📝 Summary: Ideal Psychiatry Workspace

### **Must-Have Features**:

1. ✅ **Risk-First Dashboard**: High-risk patients prominently displayed
2. ✅ **Integrated Assessment Tools**: PHQ-9, GAD-7, etc. embedded in workflow
3. ✅ **Psychiatric Medication Management**: Specialized psychotropic medication handling
4. ✅ **Therapy Documentation**: Dedicated therapy session management
5. ✅ **Longitudinal View**: Timeline of psychiatric history and assessments
6. ✅ **Safety Planning**: Built-in safety plan creation and management
7. ✅ **Crisis Protocols**: Emergency procedures easily accessible
8. ✅ **Outcome Tracking**: Visual representation of treatment effectiveness

### **Nice-to-Have Features**:

1. 📊 **Predictive Analytics**: Identify patients at risk of deterioration
2. 🤖 **AI-Assisted Documentation**: Auto-generate consultation notes from assessments
3. 📱 **Mobile App**: Access patient information on-the-go
4. 🔔 **Smart Notifications**: Proactive alerts for medication reviews, follow-ups
5. 📈 **Comparative Analytics**: Compare outcomes across patient populations

---

## 🔄 Integration with Existing System

### **Leverage Current Features**:

1. **Consultation Forms**: The existing psychiatry consultation form is excellent - make it more prominent
2. **Mental Health Support**: PHQ-9 and GAD-7 already exist - integrate into main workflow
3. **Patient Profiles**: Enhance with psychiatry-specific tabs
4. **Medication System**: Add psychiatric medication-specific features

### **New Components Needed**:

1. **Psychiatry Dashboard**: Role-specific landing page
2. **Risk Monitor**: Dedicated high-risk patient dashboard
3. **Assessment Timeline**: Visual tracking of standardized scales
4. **Therapy Management**: Enhanced therapy documentation
5. **Safety Plan Builder**: Structured safety plan creation tool

---

## 💡 Final Thoughts

As a psychiatrist, I need a workspace that:

1. **Prioritizes Safety**: Risk assessment and crisis management are paramount
2. **Supports Longitudinal Care**: Mental health requires tracking over time
3. **Integrates Assessments**: Standardized scales should be part of the workflow, not separate
4. **Focuses on Functioning**: Beyond symptoms, track daily functioning
5. **Facilitates Collaboration**: Easy communication with therapists, primary care, etc.

The current system has excellent foundations - the psychiatry consultation form is comprehensive, and the assessment tools exist. The key is **organization and prioritization** to make psychiatry workflows efficient and safe.

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Author**: Psychiatry Clinical Workflow Design Team

