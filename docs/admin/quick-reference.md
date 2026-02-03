# Admin Quick Reference

One-page reference for common admin tasks.

---

## URLs

| Resource | URL |
|----------|-----|
| Portal | tools.renewalinitiatives.org |
| Admin Dashboard | tools.renewalinitiatives.org/admin |
| Apps Management | tools.renewalinitiatives.org/admin/apps |
| Users Management | tools.renewalinitiatives.org/admin/users |
| Audit Log | tools.renewalinitiatives.org/admin/audit-log |

---

## Common Tasks

### Add a New App

1. Go to **Apps** → **Add App**
2. Fill in: Name, Slug, Description, URL
3. Upload icon (optional)
4. Click **Create App**

### Invite a User

1. Go to **Users** → **Invite User**
2. Enter email address
3. Select app permissions
4. Click **Send Invitation**

### Grant App Access

1. Go to **Users** → Click user row → **Edit Permissions**
2. Check the app(s)
3. Click **Save Changes**

### Revoke App Access

1. Go to **Users** → Click user row → **Edit Permissions**
2. Uncheck the app(s)
3. Click **Save Changes**

### Deactivate a User

1. Go to **Users** → Find user
2. Click **...** → **Deactivate User**
3. Confirm

### Reactivate a User

1. Go to **Users** → Find inactive user
2. Click **...** → **Reactivate User**
3. Confirm

---

## User Statuses

| Status | Meaning |
|--------|---------|
| **Active** | Can log in and use portal |
| **Pending** | Invited but hasn't set password |
| **Inactive** | Deactivated, cannot log in |

---

## Permission Rules

- **Admin** users see ALL apps automatically
- **Regular** users see only assigned apps
- Permissions are set per-app, per-user
- At least one admin must exist at all times

---

## Icon Requirements

- **Formats**: PNG, JPEG, WebP, SVG
- **Max size**: 1MB
- **Recommended**: Square, 256x256px or larger

---

## Audit Log Events

| Event | Logged When |
|-------|-------------|
| App Access | User clicks app in portal |
| App Created | Admin adds new app |
| App Updated | Admin edits app details |
| App Deleted | Admin removes app |
| User Invited | Admin invites new user |
| User Deactivated | Admin deactivates user |
| User Reactivated | Admin reactivates user |
| Permissions Updated | Admin changes user permissions |

---

## Quick Fixes

| Problem | Solution |
|---------|----------|
| User can't see app | Check permissions → Add app access |
| User can't log in | Check if user is deactivated → Reactivate |
| Invite not received | Check spam folder → Resend from Zitadel |
| App icon broken | Re-upload icon |
| Changes not showing | User should log out and back in |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Tab | Move to next element |
| Shift+Tab | Move to previous element |
| Enter | Activate button/link |
| Escape | Close dialog/menu |
| Space | Toggle checkbox |

---

## Need Help?

1. Check [Troubleshooting Guide](./troubleshooting.md)
2. Check [Full User Guide](./user-guide.md)
3. Contact development team

---

*Last updated: February 2026*
