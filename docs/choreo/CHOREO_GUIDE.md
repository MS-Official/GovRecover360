# GovRecover360 - Choreo Deployment Guide for Disaster Notification Service

## What is Choreo?

Choreo is an internal developer platform (IDP) by WSO2 that simplifies cloud-native application deployment. It provides managed infrastructure for deploying microservices, APIs, and integrations without managing the underlying Kubernetes infrastructure.

In the GovRecover360 architecture, the **disaster-notification-service** (located at `choreo-notification-service/`) is designed to be deployed on Choreo as a cloud-native microservice. This service handles SMS and email notifications to citizens regarding their relief application status, dispatch updates, and disaster alerts.

---

## Service Overview

The disaster-notification-service is a Node.js Express application that provides:

- **POST /api/notifications/send** - Send SMS, email, or both to a recipient
- **POST /api/notifications/application-approved** - Notify citizen when application is approved
- **POST /api/notifications/dispatch-update** - Log dispatch status changes
- **GET /health** - Health check endpoint

**GitHub Repository**: The service code is in `choreo-notification-service/` within the GovRecover360 repository.

---

## Prerequisites

- Choreo account (sign up at https://console.choreo.dev)
- GitHub account with the GovRecover360 repository
- Git CLI installed
- Basic knowledge of GitHub and CI/CD

---

## Step 1: Push Service to GitHub Repository

Ensure the `choreo-notification-service` directory is pushed to a GitHub repository:

```bash
# If the entire project is in a monorepo
git add choreo-notification-service/
git commit -m "Add disaster notification service for Choreo deployment"
git push origin main
```

Choreo can work with monorepos by specifying the path to the component directory.

---

## Step 2: Login to Choreo Console

1. Navigate to https://console.choreo.dev
2. Log in with your Choreo credentials (can use GitHub account)
3. Select or create an organization/project for GovRecover360

---

## Step 3: Create a New Service Component

1. Click **Create** -> **Service**
2. Select **Node.js** as the runtime
3. Click **Next**

---

## Step 4: Connect GitHub Repository

1. Click **Authorize with GitHub**
2. Follow the GitHub OAuth flow to grant Choreo access
3. Select the repository containing the notification service
4. If using a monorepo, specify the path: `choreo-notification-service/`
5. Select the branch (e.g., `main`)
6. Click **Next**

---

## Step 5: Configure Build Settings

| Setting | Value |
|---|---|
| Build Context | `/choreo-notification-service` (or `/` if standalone) |
| Build Pack | Node.js |
| Node.js Version | 18.x |
| Port | 8055 |
| Command | `npm start` |

1. Enter the build configuration as shown above
2. Click **Next**

---

## Step 6: Set Environment Variables

Add the following environment variables in the Choreo console:

| Variable | Description | Example Value |
|---|---|---|
| PORT | Server port | 8055 |
| NODE_ENV | Environment mode | production |
| NOTIFICATION_SERVICE_URL | Service URL | https://<choreo-host>/ |
| SMS_PROVIDER | SMS gateway provider | twilio |
| TWILIO_ACCOUNT_SID | Twilio account SID | (optional) |
| TWILIO_AUTH_TOKEN | Twilio auth token | (optional) |
| TWILIO_FROM_NUMBER | Sender phone number | (optional) |
| EMAIL_PROVIDER | Email service provider | sendgrid |
| SENDGRID_API_KEY | SendGrid API key | (optional) |
| SENDGRID_FROM_EMAIL | Sender email address | noreply@govrecover.gov |

Note: SMS and email providers are optional. In development mode, the service logs notifications to the console.

1. Click **Next**

---

## Step 7: Deploy the Service

1. Review the configuration summary
2. Click **Deploy**
3. Choreo will:
   - Clone the repository
   - Build the Docker image
   - Deploy to the managed Kubernetes cluster
4. Monitor the deployment progress in the Choreo console

Deployment typically takes 2-5 minutes for the first build.

---

## Step 8: Test the Deployed Service

### Health Check

```bash
curl https://<choreo-host>/health
# Response: {"status": "healthy"}
```

### Send Notification

```bash
curl -X POST https://<choreo-host>/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+94711234567",
    "subject": "Relief Update",
    "message": "Your relief application has been approved.",
    "type": "sms"
  }'
# Response: {"success": true, "message": "Notification sent"}
```

### Application Approved Notification

```bash
curl -X POST https://<choreo-host>/api/notifications/application-approved \
  -H "Content-Type: application/json" \
  -d '{
    "applicationId": "APP-2024-001",
    "citizenName": "Saman Weerasinghe",
    "citizenPhone": "+94711234567",
    "message": "Your relief package will be dispatched within 3 working days."
  }'
# Response: {"success": true, "message": "Approval notification sent"}
```

---

## Step 9: Configure API Management in Choreo

Choreo provides built-in API management capabilities:

1. In the service component, go to **API Management**
2. Click **Publish as API**
3. Configure:
   - **API Name**: Disaster Notification Service
   - **Context**: `/api/notifications`
   - **Version**: v1
4. Define resources and rate limits
5. Click **Publish**

Choreo will generate an API endpoint with built-in authentication, rate limiting, and analytics.

---

## Step 10: Monitor Logs and Usage

### View Logs

1. In the Choreo console, navigate to the service component
2. Go to **Monitoring** -> **Logs**
3. View real-time application logs
4. Filter by severity (INFO, ERROR, WARN)

### View Metrics

1. Go to **Monitoring** -> **Metrics**
2. View:
   - Request rate (requests/second)
   - Response time (p50, p95, p99)
   - Error rate
   - CPU and memory usage

### Set Up Alerts

1. Go to **Monitoring** -> **Alerts**
2. Configure alerts for:
   - Error rate exceeds 5%
   - Response time exceeds 2 seconds
   - Service unavailable

---

## Security Considerations

### API Security

- Enable **OAuth2** authentication in Choreo API Management
- Use **mutual TLS** for backend-to-backend communication
- Restrict API access to the GovRecover360 backend IP range
- Implement request signing for sensitive operations

### Data Protection

- Do not log Personally Identifiable Information (PII) like full phone numbers or addresses
- Use environment variables for all secrets (API keys, tokens)
- Enable encryption in transit (TLS 1.2+)
- Rotate secrets regularly

### Rate Limiting

Configure rate limits in Choreo to prevent abuse:

| Tier | Rate | Burst |
|---|---|---|
| Free | 100 req/min | 20 req |
| Standard | 1000 req/min | 100 req |
| Enterprise | 10000 req/min | 500 req |

---

## Environment Variables Table

| Variable | Required | Default | Description |
|---|---|---|---|
| PORT | No | 8055 | HTTP server port |
| NODE_ENV | No | development | Environment mode |
| NOTIFICATION_SERVICE_URL | No | http://localhost:8055 | Self-referencing URL |
| SMS_PROVIDER | No | console | SMS provider (console, twilio) |
| TWILIO_ACCOUNT_SID | No | - | Twilio account identifier |
| TWILIO_AUTH_TOKEN | No | - | Twilio authentication token |
| TWILIO_FROM_NUMBER | No | - | SMS sender phone number |
| EMAIL_PROVIDER | No | console | Email provider (console, sendgrid) |
| SENDGRID_API_KEY | No | - | SendGrid API key |
| SENDGRID_FROM_EMAIL | No | - | Email sender address |

---

## API Endpoints Reference

| Method | Endpoint | Description | Request Body | Response |
|---|---|---|---|---|
| GET | /health | Health check | - | `{ "status": "healthy" }` |
| POST | /api/notifications/send | Send SMS/email notification | `{ to, subject, message, type }` | `{ success, message }` |
| POST | /api/notifications/application-approved | Notify application approval | `{ applicationId, citizenName, citizenPhone, message }` | `{ success, message }` |
| POST | /api/notifications/dispatch-update | Log dispatch update | `{ dispatchId, status, notes }` | `{ success, message }` |
