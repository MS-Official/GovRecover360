# GovRecover360 - Client Demo Script

## Preparation Checklist

Before beginning the demo, ensure the following:

- [ ] All Docker containers are running: `docker compose ps` shows all services as "Up"
- [ ] Seed data has loaded (runs automatically on backend startup): Check backend logs for "Seed completed successfully!"
- [ ] Frontend is accessible at http://localhost:3000
- [ ] Backend API is accessible at http://localhost:8000/docs
- [ ] Superset is accessible at http://localhost:8088 (admin/admin)
- [ ] Odoo is accessible at http://localhost:8069 (demo/demo)
- [ ] Browser tabs are open and ready for each step
- [ ] Presenter has admin credentials ready

Total demo time: approximately 30-40 minutes.

---

## Step 1: Admin Login and System Overview

**Who**: System Administrator  
**What they do**: Log in as admin and demonstrate the admin dashboard  
**What they see**: Admin dashboard with system statistics, user management panel, and navigation menu  

**Presenter Talking Points**:
- "This is the GovRecover360 platform, a comprehensive disaster recovery management system built for the National Disaster Management Centre."
- "The platform supports eleven distinct user roles, each with specific permissions and dashboards."
- "As the Administrator, I have full visibility into all system operations."

**Action**:
1. Navigate to http://localhost:3000
2. Click "Login" and enter:
   - Email: `admin@govrecover.local`
   - Password: `Demo@12345`
3. Show the admin dashboard with summary statistics (total households, applications, payments, dispatch orders)
4. Navigate to User Management section
5. Show the list of all users with their roles

**Expected Outcome**: Admin dashboard is displayed with correct statistics. User list shows all registered users with their roles.

---

## Step 2: GIS Officer - Mapping Flood Zones

**Who**: GIS Officer  
**What they do**: Log in as GIS Officer and view flood zones on the GIS dashboard  
**What they see**: GIS dashboard with disaster zones, shelters, and distribution points  

**Presenter Talking Points**:
- "GIS data is fundamental to disaster response. The GIS Officer maps affected areas, shelters, and distribution points."
- "This geospatial data feeds into the entire relief workflow."

**Action**:
1. Log out and log in as:
   - Email: `gis@govrecover.local`
   - Password: `Demo@12345`
2. Show the GIS Dashboard
3. Point out the Southwest Monsoon Floods 2024 disaster event
4. Show the mapped flood zones (Galle Flood Zone A, Matara Flood Zone B)
5. Show shelters and distribution points
6. (Optional) If GeoNode is integrated, show the GIS layer management

**Expected Outcome**: GIS dashboard displays flood zones, shelters, and distribution points with geospatial data.

---

## Step 3: Field Officer - Household Registration

**Who**: Field Officer  
**What they do**: Register a new affected household and perform damage assessment  
**What they see**: Field Officer dashboard with household registration form and assessment tools  

**Presenter Talking Points**:
- "Field Officers are on the ground, registering affected households and assessing damage."
- "They capture household details, family composition, and damage levels which initiate the relief process."

**Action**:
1. Log out and log in as:
   - Email: `field@govrecover.local`
   - Password: `Demo@12345`
2. Navigate to Household Registration
3. Click "Register New Household"
4. Fill in the form:
   - Head of Household: "Mr. Saman Weerasinghe"
   - NIC: `901234567V`
   - Phone: `071-2345678`
   - District: "Galle"
   - DS Division: "Divisional Secretariat A"
   - GN Division: "Grama Niladhari 01"
   - Family Size: 5
   - Damage Level: "SEVERE"
   - Damage Description: "House severely damaged by flood waters. Roof collapsed, walls damaged."
   - Coordinates: Latitude 6.03, Longitude 80.22
5. Submit the registration
6. Show the household appearing in the household list

**Expected Outcome**: New household is registered successfully and appears in the household list with status "REGISTERED".

---

## Step 4: Verifier - Application Verification

**Who**: Verifier  
**What they do**: Review pending applications and verify household eligibility  
**What they see**: Verifier dashboard with pending applications list and verification form  

**Presenter Talking Points**:
- "The Verifier role ensures integrity of the relief process. They review applications, check documentation, and verify eligibility."
- "This is a crucial checkpoint to prevent fraud and ensure aid reaches genuine beneficiaries."

**Action**:
1. Log out and log in as:
   - Email: `verifier@govrecover.local`
   - Password: `Demo@12345`
2. Navigate to Pending Applications
3. Select a SUBMITTED application
4. Review the household details and damage assessment
5. Click "Verify Application"
6. Add verification notes: "Identity verified. Documentation complete. Household eligible for relief."
7. Confirm verification

**Expected Outcome**: Application status changes to "VERIFIED". Verification record is created in the audit log.

---

## Step 5: Program Manager - Relief Approval

**Who**: Program Manager  
**What they do**: Approve relief for verified households  
**What they see**: Program Manager dashboard with verified applications pending approval  

**Presenter Talking Points**:
- "The Program Manager oversees relief programs and approves verified applications for relief distribution."
- "They can see the big picture - which programs have budget available and which households are eligible."

**Action**:
1. Log out and log in as:
   - Email: `manager@govrecover.local`
   - Password: `Demo@12345`
2. Navigate to Relief Programs section
3. Show the active relief programs (Emergency Food Distribution, Shelter Restoration, Medical Assistance)
4. Navigate to Applications Pending Approval
5. Select a VERIFIED application
6. Click "Approve Relief"
7. Confirm the approval

**Expected Outcome**: Application status changes to "APPROVED_FOR_RELIEF". Approval timestamp and user are recorded.

---

## Step 6: Finance Officer - Payment Approval

**Who**: Finance Officer  
**What they do**: Approve payment requests for approved relief applications  
**What they see**: Finance dashboard with payment requests list  

**Presenter Talking Points**:
- "The Finance Officer handles the financial aspects - approving cash payments, vouchers, or bank transfers to beneficiaries."
- "This ensures financial controls are maintained throughout the relief process."

**Action**:
1. Log out and log in as:
   - Email: `finance@govrecover.local`
   - Password: `Demo@12345`
2. Navigate to Payments section
3. Show pending payment requests
4. Select an APPROVED_FOR_RELIEF application with a pending payment
5. Click "Approve Payment"
6. Confirm the approval

**Expected Outcome**: Payment status changes to "PAYMENT_APPROVED". Finance Officer's approval is recorded.

---

## Step 7: Warehouse Officer - Aid Dispatch

**Who**: Warehouse Officer  
**What they do**: Dispatch aid items from inventory to approved households  
**What they see**: Warehouse dashboard with inventory levels and dispatch orders  

**Presenter Talking Points**:
- "The Warehouse Officer manages inventory and dispatches physical aid items to beneficiaries."
- "They coordinate with NGO partners for last-mile delivery."

**Action**:
1. Log out and log in as:
   - Email: `warehouse@govrecover.local`
   - Password: `Demo@12345`
2. Navigate to Inventory section
3. Show the current inventory levels across warehouses
4. Navigate to Dispatch Orders
5. Click "Create Dispatch Order"
6. Select an approved application, warehouse, and items
7. Submit the dispatch order
8. Navigate to the dispatch order and click "Dispatch"
9. Confirm the dispatch

**Expected Outcome**: Dispatch order is created and status updated to "IN_TRANSIT". Inventory is updated.

---

## Step 8: Citizen Portal - Application Status

**Who**: Citizen  
**What they do**: Check application status and view notifications  
**What they see**: Citizen portal showing their household, application status, and notifications  

**Presenter Talking Points**:
- "Citizens have their own portal where they can register their household, submit applications, and track progress."
- "This provides transparency and reduces the need for beneficiaries to visit government offices."

**Action**:
1. Log out and log in as:
   - Email: `citizen@govrecover.local`
   - Password: `Demo@12345`
2. Show the Citizen Dashboard
3. Show their registered household
4. Show the application status timeline
5. Navigate to Notifications section
6. Show the notification messages

**Expected Outcome**: Citizen can see their household, application status, and notifications.

---

## Step 9: Auditor - Reports and Audit Logs

**Who**: Auditor  
**What they do**: View reports, audit logs, and Superset dashboards  
**What they see**: Auditor dashboard with summary reports, audit trail, and analytics  

**Presenter Talking Points**:
- "The Auditor role provides complete visibility into all platform activities with read-only access."
- "Every action is logged in the audit trail, ensuring accountability and transparency."

**Action**:
1. Log out and log in as:
   - Email: `auditor@govrecover.local`
   - Password: `Demo@12345`
2. Show the Auditor Dashboard with summary statistics
3. Navigate to Reports section:
   - Show "By District" report
   - Show "By Status" report
   - Show Inventory report
   - Show NGO Performance report
4. Navigate to Audit Logs
5. Show the list of all logged actions with timestamps, users, and actions
6. (Optional) Open Apache Superset at http://localhost:8088 (admin/admin)
7. Show the Superset dashboard with visualizations

**Expected Outcome**: Auditor can view all reports and audit logs. Superset dashboards display analytics.

---

## Step 10: Postman API Security Testing

**Who**: Presenter / Developer  
**What they do**: Demonstrate role-based API enforcement using Postman  
**What they see**: API responses showing allowed and denied requests based on roles  

**Presenter Talking Points**:
- "The platform enforces role-based access at the API level. Let's demonstrate how permissions work."
- "Each user's JWT token contains their permissions, and the backend validates every request."

**Action**:
1. Open Postman with the GovRecover360 collection
2. Log in as different users and obtain tokens
3. Test allowed scenarios:
   - Field Officer registering a household (POST /api/households/register)
   - Verifier verifying an application (POST /api/applications/{id}/verify)
   - Finance Officer approving payment (POST /api/payments/{id}/approve)
4. Test denied scenarios:
   - Citizen trying to access audit logs (GET /api/audit-logs)
   - Field Officer trying to approve relief (POST /api/applications/{id}/approve-relief)
   - Warehouse Officer trying to approve payments (POST /api/payments/{id}/approve)
5. Show the 403 Forbidden responses for unauthorized actions

**Expected Outcome**: Authorized requests succeed (200/201). Unauthorized requests return 403 Forbidden.

---

## Step 10A: Integration Command Center

**Who**: Admin / Presenter  
**What they do**: Show platform integrations and console access from the frontend  
**What they see**: Government-style integration dashboard with status cards, demo actions, architecture journey, and platform console hub

**Action**:
1. Log in as admin (`admin@govrecover.local` / `Demo@12345`).
2. Open Admin -> Integrations.
3. Confirm the banner says `GovRecover360 Integration Command Center`.
4. Show the architecture journey: Citizen / Officer -> Asgardeo Login -> WSO2 API Gateway -> Backend -> OpenG2P / Odoo / Choreo / Superset.
5. Click test actions for Backend, OpenG2P, WSO2 gateway, Choreo notifier, and AI health.
5a. Point out the newly added "Odoo OpenG2P Modules & Workflows" section, showing that the official OpenG2P registry addons are mounted and installed, connected to our GovAid module via the bridge module.
6. Open Superset, Odoo, Asgardeo, Choreo, and WSO2 in new tabs from the Platform Console Hub.

**Presenter Talking Points**:
- "Local demo mode keeps the recovery workflow running while external platforms are configured."
- "Asgardeo and Choreo open in new tabs because cloud consoles often block embedded iframes."
- "The local WSO2 gateway is demo-compatible; production uses full WSO2 API Manager."
- "If Odoo Settings shows a stock/SMS popup, use the direct Disaster Recovery module button for the demo."

**Expected Outcome**: The Integrations page renders without crashing, status badges are visible even if a backend key is missing, and API calls use `VITE_API_BASE_URL` instead of the frontend static container.

---

## Step 10B: OpenG2P Connector Security

**Who**: Presenter / Developer  
**What they do**: Demonstrate both direct OpenG2P runtime flow and backend-mediated connector security  
**What they see**: Direct OpenG2P runtime calls pass, then backend connector calls run with an Admin demo token

**Action**:
1. Run `./demo.sh .env.demo`.
2. Confirm the direct OpenG2P runtime section passes:
   - Beneficiary sync
   - Eligibility check
   - Entitlements
   - Program enrollment
3. Confirm the backend connector section requests an Admin demo token from `/api/auth/login`.
4. Confirm the script uses that token for:
   - `GET /api/integrations/openg2p/status`
   - `POST /api/integrations/openg2p/sync-beneficiary`
   - `POST /api/integrations/openg2p/check-eligibility`
   - `GET /api/integrations/openg2p/entitlements`
   - `POST /api/integrations/openg2p/program-enrollment`

**Presenter Talking Points**:
- "The direct OpenG2P demo runtime proves the beneficiary, eligibility, entitlement, and enrollment API flow."
- "The backend-mediated connector is protected by RBAC, so write operations require a valid platform token."
- "A 401 without a token is expected and demonstrates security. The demo script now uses the Admin token for the protected connector flow."

**Expected Outcome**: `./demo.sh .env.demo` exits 0 with no scary warning for protected OpenG2P connector endpoints.

---

## Step 11: AI Features

**Who**: Presenter  
**What they do**: Demonstrate AI-powered features for damage summarization, citizen messaging, and report generation  
**What they see**: AI-generated content based on platform data  

**Presenter Talking Points**:
- "GovRecover360 includes AI capabilities powered by large language models."
- "We support multiple providers - OpenAI, Google Gemini, and Minimax AI - with a mock provider for development."
- "AI helps automate time-consuming tasks like writing damage summaries, citizen communications, and situation reports."

**Action**:
1. Log in as admin (`admin@govrecover.local` / `Demo@12345`)
2. Navigate to AI Features section (or use Postman)
3. **Summarize Damage**: Click "Generate Damage Summary" and show the AI-generated damage assessment
4. **Generate Citizen Message**: Click "Generate Citizen Message" and show the personalized notification
5. **Generate Disaster Report**: Click "Generate Disaster Report" and show the comprehensive report
6. (If using real AI providers) Point out the integration with OpenAI/Gemini

**Expected Outcome**: AI generates contextually relevant content based on the prompt and platform data.

---

## Demo Flow Summary

| Step | Role | Primary Action | Key Outcome |
|---|---|---|---|
| 1 | Admin | Login & Overview | System statistics visible |
| 2 | GIS Officer | Map flood zones | Geospatial data displayed |
| 3 | Field Officer | Register household | New household created |
| 4 | Verifier | Verify application | Application status = VERIFIED |
| 5 | Program Manager | Approve relief | Application status = APPROVED_FOR_RELIEF |
| 6 | Finance Officer | Approve payment | Payment status = PAYMENT_APPROVED |
| 7 | Warehouse Officer | Dispatch aid | Dispatch order = IN_TRANSIT |
| 8 | Citizen | Check status | Application progress visible |
| 9 | Auditor | View reports | Reports & audit logs displayed |
| 10 | Presenter | API security test | RBAC enforcement demonstrated |
| 11 | Presenter | AI features | AI-generated content shown |

## Presenter Tips

- Keep the demo moving at a steady pace. Each step should take 2-4 minutes.
- Emphasize the end-to-end workflow - how data flows from GIS mapping through to aid delivery.
- Highlight the security and audit features - every action is logged and traceable.
- For the AI features, mention that real LLM integration provides richer results than the mock provider.
- If time is limited, Steps 1-7 provide the core workflow; Steps 8-11 are supplementary.
- Have the Superset dashboard open in a separate tab for quick switching during Step 9.
- Prepare the Postman collection with pre-configured requests for Step 10 to avoid live typing.
