# Multi-Tenant Company Registration & Approval Setup Guide

This guide walks you through the company registration system where users can request company registration and an owner/admin can approve or deny requests via email.

## Architecture Overview

- **Stack:** MongoDB (existing) + Express + tRPC + React
- **Email:** Gmail API with service account (or Ethereal for dev testing)
- **Company Registration Flow:** Users submit registration requests on `/register-company` page
- **Owner Approval:** You review requests in `/admin/company-requests` 
- **Invite Tokens:** On approval, secure 72-hour invite links sent via email
- **Collections:** `companies`, `company_requests`, `invites` (MongoDB)

## Setup Steps

### 1. Environment Variables (\.env)

```env
# Session
SESSION_SECRET=ftar-dev-secret-key-change-in-production

# Environment
NODE_ENV=development

# Development: Email uses Ethereal test account (free, no setup needed)
EMAIL_DEV_MODE=true

# Email settings
OWNER_EMAIL=owner@example.com
APP_URL=http://localhost:3000
INVITE_TOKEN_EXPIRY_HOURS=72

# Production: Add Google Service Account JSON (stringified)
# GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

**Getting Google Service Account Key (for production):**
You already have this from Google Cloud! To use it:
1. Keep the JSON file safe
2. When deploying to production, stringify it: `JSON.stringify(keyObject)`
3. Add to production secrets as `GOOGLE_SERVICE_ACCOUNT_KEY`

### 2. Server Installation (Already Done)

Dependencies added:
```bash
pnpm add googleapis nodemailer @types/nodemailer
```

### 3. Frontend Routes (TODO - Need to Add)

Add these routes to your frontend router (likely in `client/src/main.tsx` or routing config):

```typescript
import RegisterCompany from "@/pages/RegisterCompany";
import CompanyRequestsAdmin from "@/pages/Admin/CompanyRequests";

// Add routes:
{ path: "/register-company", component: RegisterCompany },
{ path: "/admin/company-requests", component: CompanyRequestsAdmin },
```

Make sure `/admin/company-requests` is protected so only admins can access it.

### 4. Link Registration from Login Page

In `client/src/pages/Login.tsx`, add a link:

```tsx
<p className="text-sm text-gray-600">
  Don't have a company? <a href="/register-company">Request company registration</a>
</p>
```

## Data Model (MongoDB Collections)

### `companies`
```javascript
{
  _id: ObjectId,
  name: "Company Name",
  code: "COMP001",  // optional
  status: "pending" | "approved" | "denied",
  createdAt: Date,
  updatedAt: Date
}
```

### `company_requests`
```javascript
{
  _id: ObjectId,
  companyId: ObjectId,  // Reference to companies
  companyName: "Company Name",
  companyEmail: "contact@company.com",
  requesterName: "John Doe",
  requesterEmail: "john@company.com",
  companyCode: "COMP001",
  notes: "Additional notes from requester",
  status: "pending" | "approved" | "denied",
  reviewedBy: ObjectId,  // User ID of owner
  reviewedAt: Date,
  reviewReason: "Reason for denial",
  createdAt: Date,
  updatedAt: Date
}
```

### `invites`
```javascript
{
  _id: ObjectId,
  companyId: ObjectId,  // Reference to companies
  requesterEmail: "john@company.com",
  tokenHash: "sha256_hash_of_token",  // Never store plain token
  expiresAt: Date,
  used: false,
  usedAt: Date,
  createdAt: Date
}
```

## API Endpoints (tRPC)

### Public Endpoints
- **POST `/api/trpc/company.submitRequest`** - Submit company registration
  - Input: `{ companyName, companyEmail, requesterName, requesterEmail, companyCode?, notes? }`
  
- **GET `/api/trpc/company.validateInvite`** - Validate invite token
  - Input: `{ token }`
  
- **POST `/api/trpc/company.redeemInvite`** - Redeem invite and create user
  - Input: `{ token, name, email }`

### Admin-Only Endpoints
- **GET `/api/trpc/company.getPendingRequests`** - List pending approval requests
  
- **POST `/api/trpc/company.approveRequest`** - Approve and send invite
  - Input: `{ requestId }`
  
- **POST `/api/trpc/company.denyRequest`** - Deny request
  - Input: `{ requestId, reason? }`

## Email Flow

### 1. On Submission (→ Admin/Owner)
When user submits registration:
- **To:** `OWNER_EMAIL` 
- **Subject:** "New company request: {CompanyName}"
- **Content:** Requester info, notes, link to `/admin/company-requests`
- **Action:** Owner reviews and clicks Approve/Deny

### 2. On Approval (→ Requester)
When owner approves:
- **To:** `requester_email`
- **Subject:** "{CompanyName} registration approved! Set up your admin account"
- **Content:** 72-hour invite link, login URL
- **Link Format:** `{APP_URL}/register?invite=SECURE_TOKEN`
- **Action:** Requester clicks link, sets up account

### 3. On Denial (→ Requester)
When owner denies:
- **To:** `requester_email`
- **Subject:** "{CompanyName} request denied"
- **Content:** Reason for denial (if provided)
- **Action:** Requester can resubmit if issues are resolved

## Development Testing

### Email in Development
With `EMAIL_DEV_MODE=true`:
- Uses **Ethereal** (free test email service)
- Emails are intercepted and preview URLs printed to console
- No actual emails sent — safe for testing

**Console Output Example:**
```
[Email] Preview URL: https://ethereal.email/message/abc123...
```

Click the URL to see what the email looks like!

### Testing Workflow
1. Go to `http://localhost:3000/register-company`
2. Fill form and submit
3. Check server logs for Ethereal preview URL
4. View "new request" email to find admin link
5. Click admin link → should go to `/admin/company-requests`
6. Click Approve → another email preview for invite link
7. Copy invite token from URL
8. Test `/register?invite=TOKEN` page

## Production Setup

### 1. Google Service Account for Gmail
[You already have this!] To use in production:

```bash
# Stringify your service account JSON:
# const key = {type: "service_account", ...}
# const stringified = JSON.stringify(key)
```

Add to production environment:
```env
GOOGLE_SERVICE_ACCOUNT_KEY=<stringified-service-account-json>
EMAIL_DEV_MODE=false
OWNER_EMAIL=owner@example.com
APP_URL=https://yourdomain.com
```

### 2. Database Indexes
MongoDB indexes are created automatically via `company-collections.ts`:
- `companies`: `code`, `status`, `createdAt`
- `company_requests`: `companyId`, `status`, `requesterEmail`, `createdAt`
- `invites`: `companyId`, `tokenHash` (unique), `expiresAt`, `requesterEmail`

### 3. Security Checklist
- [ ] `SESSION_SECRET` is strong and random
- [ ] `GOOGLE_SERVICE_ACCOUNT_KEY` is stored securely (never in git)
- [ ] `EMAIL_DEV_MODE=false` in production
- [ ] `APP_URL` points to your production domain
- [ ] Invite tokens are never logged in plain text
- [ ] Rate limiting added to `/register-company` endpoint (if public)
- [ ] CAPTCHA added to registration form (recommended)

## Files Added/Modified

**New Files:**
- `server/company-collections.ts` - MongoDB collection helpers & TypeScript types
- `server/company-routers.ts` - tRPC endpoints for company management
- `server/_core/email.ts` - Email transport (Gmail API + Ethereal)
- `client/src/pages/RegisterCompany.tsx` - Company registration form
- `client/src/pages/Admin/CompanyRequests.tsx` - Admin approval dashboard
- `.env.example` - Environment variable template
- `.env` - Development configuration

**Modified Files:**
- `server/_core/index.ts` - Initialize email on startup
- `server/routers.ts` - Add company router to main app
- `drizzle/schema.ts` - Removed (reverted MySQL, MongoDB only)

## Troubleshooting

### "No email transport configured"
- Check `EMAIL_DEV_MODE` is set in `.env`
- If production: verify `GOOGLE_SERVICE_ACCOUNT_KEY` is valid JSON
- Server logs should show which transport is being used

### MongoDB connection issues
- Ensure `MONGODB_URI` is set in your `.env`
- Make sure MongoDB connection string is reachable
- Check server logs for connection errors

### Invite token not working
- Validate expiry time (`INVITE_TOKEN_EXPIRY_HOURS`)
- Check token is not already redeemed (`used=true`)
- Ensure tokenHash matches (SHA256 hash of provided token)

### Emails not sending in dev
- Go to ethereal preview URL in browser
- Check Ethereal account has email (should auto-create)
- Server logs show preview URL with each test email

### Frontend routes not working
- Make sure routes are added to your router config
- `RegisterCompany` component is at `client/src/pages/RegisterCompany.tsx`
- `CompanyRequestsAdmin` is at `client/src/pages/Admin/CompanyRequests.tsx`
- Verify path names match router configuration

## Next Steps: Multi-Tenant Implementation

Once company registration is working, next phase (to be implemented):

1. **Add `company_id` to users** - Link user accounts to companies
2. **Company selection at login** - Dropdown to choose company if multi-company user
3. **Tenant middleware** - Inject `company_id` into context on each request
4. **Query filtering** - Add `company_id` filters to all data queries
5. **Permission checks** - Validate user belongs to company
6. **Department scoping** - Filter by department within company
7. **Testing** - Verify cross-tenant data isolation

## Running The Dev Server

```bash
pnpm run dev
```

Server will start on `http://localhost:3000` (or next available port if 3000 is busy).

With the current setup:
- MongoDB collections for companies are auto-created
- Email sends to Ethereal test account in dev mode
- All endpoints accessible via tRPC

## Questions?

Refer to this guide or check:
- Server logs for email transport initialization
- MongoDB indexes in `company-collections.ts`
- Email templates in `server/_core/email.ts`
- tRPC endpoints in `server/company-routers.ts`

