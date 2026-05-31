# GovRecover360 UI Visual & UX QA Checklist

This document provides a step-by-step checklist to manually audit and verify GovRecover360's user interface and layout compliance across various screen widths and device viewports.

---

## 1. Global Layout & Alignment
- [ ] **Centering & Viewport Lock**: Verify that the main workspace layout centers itself and stays locked at `max-width: 1440px` on wide screens.
- [ ] **No Horizontal Overflow**: Ensure that no horizontal scrollbars appear on any page during layout scaling.
- [ ] **Sidebar Stable Columns**: Check that the desktop sidebar is a stable column of width `w-64` (expanded) or `w-20` (collapsed) and does not overlay the main content grid.

## 2. Mobile Responsiveness (Breakpoint 390px - 768px)
- [ ] **Hamburger Toggle Button**: Check that the floating hamburger drawer toggle triggers correctly on mobile, and doesn't overlap header content.
- [ ] **Header Left Padding**: Verify that the header contains `pl-16` padding on mobile viewports so that the floating toggle button doesn't cover page titles or breadcrumbs.
- [ ] **Pill/Card Stacking**: Verify that all multi-column layouts scale down to a single column (1 card per row) on screens narrower than 640px.
- [ ] **Tables Horizontal Scroll**: Check that data tables wrap inside a scrollable container with horizontal overflow support, preventing the rest of the layout from breaking.

## 3. Reports & Analytics Page (`/admin/reports`)
- [ ] **Page Header & Subtitle**: Ensure the title is exactly `Government Relief Operations Reports` and the subtitle is `Beneficiary & entitlement management, API governance, ERP back office, and analytics overview.`.
- [ ] **Executive KPIs Grid**:
  - Verify that the 8 cards match exactly: Total Users, Active Disasters, Total Households, Verified Applications, Approved Relief, Dispatched Orders, Warehouses, NGO Partners.
  - Scale down from 4-columns (desktop) to 2-columns (tablet) to 1-column (mobile).
- [ ] **Summary Cards**: Check the 6 operational summary cards inside the grid layout.
- [ ] **Dynamic Recharts Graphs**: Check that both the Pie and Bar charts render and handle container resize events gracefully.
- [ ] **Superset analytics section**:
  - Show "live" or "configured" status badge.
  - Show Open Superset and Open Superset Dashboard buttons.
  - Check presence of the note: `“Superset provides deeper analytics dashboards for disaster recovery KPIs.”`.
- [ ] **Action Buttons**: Verify that "Refresh Report Data", "Open Backend Reports API", and "Open Swagger Docs" buttons open their respective tabs/endpoints.

## 4. AI Decision Support Tools Page (`/admin/ai-tools`)
- [ ] **Page Header**: Ensure the title is `AI Decision Support Tools` and the subtitle is `AI-assisted summaries, citizen messages, field reports, and disaster recovery insights.`.
- [ ] **AI Provider Status**: Verify status badges and buttons for testing AI health, opening AI Swagger, and AI OpenAPI JSON.
- [ ] **AI Safety Note Panel**: Check that the governance disclaimer is visible and shows the text: `“AI outputs are assistive and must be reviewed by authorized officers before official use.”`.
- [ ] **AI Cards Interactivity & Fallback**:
  - [ ] **Damage Assessment Summarizer**: Fill inputs, click "Generate Summary", check generated summary block.
  - [ ] **Citizen Alert Notice Generator**: Select status, click "Generate Citizen Message", check message draft.
  - [ ] **Situation Report Drafter**: Input stats, click "Generate Situation Report", verify paragraph block.
  - [ ] **Audit Logs Analyzer**: Check custom log input text area, click "Summarize Audit Logs", verify summary output.
  - [ ] **Mock Fallback Badge**: Ensure that if the AI microservice is down, responses fall back gracefully to local mocked templates labeled with "Demo fallback".

## 5. Sidebar Navigation
- [ ] **Highlight Status**: Confirm that navigation items highlight as active based on pathname (e.g. clicking Reports highlights only Reports).
- [ ] **Links Verification**: Check that all sidebar links map to their correct routes:
  - Dashboard -> `/admin`
  - Users -> `/admin/users`
  - Disaster Events -> `/admin/disasters`
  - Relief Programs -> `/admin/relief-programs`
  - Reports -> `/admin/reports`
  - Audit Logs -> `/admin/audit-logs`
  - Integrations -> `/admin/integrations`
  - AI Tools -> `/admin/ai-tools`
