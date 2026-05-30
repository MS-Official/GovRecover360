# GovRecover360 - Asgardeo Identity Platform Guide

## What is Asgardeo?

Asgardeo is a cloud-based identity-as-a-service (IDaaS) platform by WSO2 that provides authentication, authorization, and user management capabilities. In the GovRecover360 architecture, Asgardeo serves as the OpenID Connect (OIDC) identity provider, enabling:

- Single sign-on (SSO) for all platform users
- Role-based access control through Asgardeo roles
- Social login integration (Google, Microsoft, etc.)
- Multi-factor authentication (MFA)
- User self-service registration and profile management
- Centralized user lifecycle management

Asgardeo integrates with the frontend via OIDC and with WSO2 API Manager for token-based API security.

---

## Step 1: Sign Up / Login to Asgardeo

1. Navigate to https://console.asgardeo.io
2. Click **Sign Up** to create a new account, or **Sign In** if you already have one
3. Complete the registration process

---

## Step 2: Create Organization

1. After login, click on your profile icon and select **Organizations**
2. Click **New Organization**
3. Enter:
   - **Organization Name**: `govrecover360`
   - **Description**: `GovRecover360 Disaster Recovery Platform`
4. Click **Create**

---

## Step 3: Create Application (SPA or Web App)

1. In the Asgardeo Console, navigate to **Applications** -> **New Application**
2. Choose **Standard-Based Application** -> **OpenID Connect**
3. Select application type:
   - **Single Page Application** (for React frontend)
   - **Web Application** (for server-side rendering)
4. Enter:
   - **Application Name**: `GovRecover360 Frontend`
5. Click **Create**

---

## Step 4: Configure Callback URLs

In the application settings:

1. Go to **Protocol** tab
2. Add the following **Authorized Redirect URLs**:
   - `http://localhost:3000/callback`
   - `http://localhost:3000`
   - `http://localhost`
3. Add **Allowed Origins**:
   - `http://localhost:3000`
   - `http://localhost`

---

## Step 5: Configure Logout URLs

1. In the same **Protocol** tab
2. Add **Logout URLs**:
   - `http://localhost:3000`
   - `http://localhost:3000/logout`
3. Ensure `http://localhost:3000` is listed as a post-logout redirect URI

---

## Step 6: Create Roles

Navigate to **User Management** -> **Roles** -> **New Role**.

Create the following roles (matching the platform's RBAC model):

| Role Name | Display Name | Description |
|---|---|---|
| ROLE_ADMIN | Administrator | Full system access and user management |
| ROLE_DISASTER_MANAGER | Disaster Manager | Strategic oversight of disaster operations |
| ROLE_FIELD_OFFICER | Field Officer | Household registration and damage assessment |
| ROLE_VERIFIER | Verifier | Application verification and eligibility checks |
| ROLE_PROGRAM_MANAGER | Program Manager | Relief program management and approval |
| ROLE_FINANCE_OFFICER | Finance Officer | Payment processing and approval |
| ROLE_WAREHOUSE_OFFICER | Warehouse Officer | Inventory management and dispatch |
| ROLE_GIS_OFFICER | GIS Officer | Geospatial data management |
| ROLE_NGO_PARTNER | NGO Partner | Relief delivery and task management |
| ROLE_AUDITOR | Auditor | Read-only reports and audit logs |
| ROLE_CITIZEN | Citizen | Self-service portal access |

---

## Step 7: Create Users and Assign Roles

Navigate to **User Management** -> **Users** -> **Add User**.

Create the following demo users:

| Email | First Name | Last Name | Role(s) |
|---|---|---|---|
| admin@govrecover.local | System | Administrator | ROLE_ADMIN |
| disaster-manager@govrecover.local | Disaster | Manager | ROLE_DISASTER_MANAGER |
| field@govrecover.local | Field | Officer | ROLE_FIELD_OFFICER |
| verifier@govrecover.local | Verifier | Priya | ROLE_VERIFIER |
| manager@govrecover.local | Program | Manager | ROLE_PROGRAM_MANAGER |
| finance@govrecover.local | Finance | Officer | ROLE_FINANCE_OFFICER |
| warehouse@govrecover.local | Warehouse | Officer | ROLE_WAREHOUSE_OFFICER |
| gis@govrecover.local | GIS | Officer | ROLE_GIS_OFFICER |
| ngo@govrecover.local | NGO | Partner | ROLE_NGO_PARTNER |
| auditor@govrecover.local | Auditor | Kusum | ROLE_AUDITOR |
| citizen@govrecover.local | Citizen | User | ROLE_CITIZEN |

For each user:
1. Click **Add User**
2. Enter email, first name, last name
3. Set a password or send an invitation email
4. Click **Next**
5. Select the appropriate role(s) from the list
6. Click **Finish**

---

## Step 8: Configure Scopes and Claims

### Custom Scopes

1. Navigate to **User Management** -> **Scopes**
2. Click **Add Scope**
3. Add the following custom scopes:

| Scope | Display Name | Description |
|---|---|---|
| citizen:read | Read Citizen Data | View citizen and household information |
| citizen:write | Create Citizen | Register new citizens and households |
| citizen:manage | Update Citizen | Modify citizen records |
| beneficiary:read | Read Beneficiary | View beneficiary information |
| beneficiary:verify | Verify Beneficiary | Verify beneficiary applications |
| relief:read | Read Relief | View relief program data |
| relief:approve | Approve Relief | Approve relief applications |
| payment:read | Read Payment | View payment requests |
| payment:approve | Approve Payment | Approve payment disbursements |
| inventory:read | Read Inventory | View inventory levels |
| inventory:dispatch | Dispatch Inventory | Dispatch inventory items |
| geo:read | Read GIS | View GIS data |
| geo:manage | Manage GIS | Create and edit GIS zones |
| audit:read | Read Audit | View audit logs |
| admin:manage | Admin Access | Full administrative access |
| report:read | Read Report | View reports and dashboards |
| ai:generate | Generate AI | Use AI-powered features |

### Custom Claims

1. Navigate to **User Management** -> **Attributes** -> **Claims**
2. Click **Add Claim** to create custom claims:

| Claim URI | Display Name | Description | Mapped Attribute |
|---|---|---|---|
| http://govrecover.local/claims/district | District | User's assigned district | district |
| http://govrecover.local/claims/organization | Organization | User's organization | organization |
| http://govrecover.local/claims/department | Department | User's department | department |
| http://govrecover.local/claims/assigned_region | Assigned Region | User's operational region | assigned_region |

---

## Step 9: OIDC Configuration

1. In the application settings, go to **Protocol** tab
2. Copy the following values for integration:
   - **Client ID**: `(copy from application)`
   - **Issuer URL**: `https://api.asgardeo.io/t/<your-org>/oauth2/token`
   - **Authorization URL**: `https://api.asgardeo.io/t/<your-org>/oauth2/authorize`
   - **Token URL**: `https://api.asgardeo.io/t/<your-org>/oauth2/token`
   - **JWKS URL**: `https://api.asgardeo.io/t/<your-org>/oauth2/jwks`
   - **Logout URL**: `https://api.asgardeo.io/t/<your-org>/oidc/logout`

---

## Step 10: Integrate with Frontend

### Frontend OIDC Client Setup

In the React frontend, configure the OIDC integration. The relevant configuration should be in environment variables:

```typescript
// frontend/.env or Vite environment variables
VITE_OIDC_CLIENT_ID=<your-client-id>
VITE_OIDC_ISSUER=https://api.asgardeo.io/t/<your-org>
VITE_OIDC_AUTHORIZATION_URL=https://api.asgardeo.io/t/<your-org>/oauth2/authorize
VITE_OIDC_TOKEN_URL=https://api.asgardeo.io/t/<your-org>/oauth2/token
VITE_OIDC_LOGOUT_URL=https://api.asgardeo.io/t/<your-org>/oidc/logout
VITE_OIDC_CALLBACK_URL=http://localhost:3000/callback
```

The `AuthContext.tsx` handles the OIDC flow:

```typescript
// AuthContext.tsx - OIDC integration
const handleLogin = async () => {
  // Redirect to Asgardeo login page
  const authUrl = `${issuer}/oauth2/authorize?` +
    `client_id=${clientId}&` +
    `redirect_uri=${callbackUrl}&` +
    `response_type=code&` +
    `scope=openid profile email`;
  window.location.href = authUrl;
};

const handleCallback = async (code: string) => {
  // Exchange authorization code for tokens
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      redirect_uri: callbackUrl,
    }),
  });
  const tokens = await response.json();
  // Store tokens and decode user info from ID token
  localStorage.setItem('access_token', tokens.access_token);
};
```

---

## Step 11: Integrate with WSO2

Configure WSO2 API Manager to use Asgardeo as the identity provider:

1. In WSO2 Admin Portal, go to **Key Managers** -> **Add Key Manager**
2. Configure:
   - **Name**: Asgardeo
   - **Type**: OIDC
   - **Well-Known URL**: `https://api.asgardeo.io/t/<your-org>/oauth2/token/.well-known/openid-configuration`
   - **Client ID**: (from Asgardeo application)
   - **Client Secret**: (generated in Asgardeo application settings)
   - **Scopes Claim**: `scope`
3. Click **Add**
4. In each API's settings, select **Asgardeo** as the Key Manager for OAuth2 security

---

## Custom Claim Mapping

The following mapping connects Asgardeo user attributes to GovRecover360 platform fields:

| Asgardeo Claim | Platform Field | Description |
|---|---|---|
| `sub` | id | User's unique identifier |
| `email` | email | User's email address |
| `given_name` | full_name (first part) | User's first name |
| `family_name` | full_name (last part) | User's last name |
| `roles` | role | User's assigned role |
| `http://govrecover.local/claims/district` | district | Operational district |
| `http://govrecover.local/claims/organization` | organization | Organization name |
| `http://govrecover.local/claims/department` | department | Department name |
| `http://govrecover.local/claims/assigned_region` | assigned_region | Operational region |

---

## Testing the Integration

### Test OIDC Login Flow

1. Start the platform: `docker compose up -d`
2. Navigate to http://localhost:3000
3. Click "Login with Asgardeo"
4. You should be redirected to Asgardeo's login page
5. Enter demo user credentials
6. After successful authentication, you are redirected back to the frontend
7. The user's information and role are displayed on the dashboard

### Test Token Validation

Use the access token to call the backend API:

```bash
# Get the access token from browser storage or generate via OAuth2
TOKEN="<access-token-from-asgardeo>"

# Call API with token
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/auth/me
```

---

## Troubleshooting Common Asgardeo Issues

### Redirect URI Mismatch

**Error**: `redirect_uri_mismatch` or "The redirect URI is not registered for the application"

**Solution**: Ensure the exact URL (including trailing slashes) is registered in Asgardeo application settings under Authorized Redirect URLs.

### Invalid Token

**Error**: `401 Unauthorized` - "Invalid token" or "Token validation failed"

**Solution**:
1. Check the token is not expired
2. Verify the token was issued for the correct application
3. Ensure the JWKS endpoint is accessible from the backend/WSO2
4. Check clock synchronization (token validation uses timestamps)

### CORS Errors with Asgardeo

**Error**: CORS error during OIDC flow

**Solution**:
1. Add `http://localhost:3000` to Allowed Origins in Asgardeo application settings
2. Ensure the frontend is sending the correct origin header

### User Not Found in Platform

**Error**: User authenticated with Asgardeo but cannot access platform resources

**Solution**:
1. Ensure the user exists in the GovRecover360 database (created via seed script)
2. Verify the email matches between Asgardeo and the platform database
3. Check that the user's role is correctly mapped

### Role Not Mapped

**Error**: User logs in but has incorrect permissions

**Solution**:
1. Verify the role name in Asgardeo matches the platform role name (e.g., `ROLE_ADMIN`)
2. Check the role mapping configuration in the backend OIDC integration
3. Ensure the user is assigned the correct role in Asgardeo
