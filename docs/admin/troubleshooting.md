# Admin Troubleshooting Guide

Common issues and how to resolve them.

## User Issues

### User Can't Log In

**Symptoms:**
- User sees "Authentication Error" page
- User says password doesn't work
- User sees "Access Denied"

**Solutions:**

1. **Check user status**
   - Go to **Users** in admin
   - Verify user is not "Inactive"
   - If inactive, click **Reactivate User**

2. **Reset password**
   - User can reset via Zitadel login page
   - Click "Forgot Password" on login screen
   - User will receive reset email

3. **Check Zitadel directly**
   - Log in to Zitadel Console
   - Find user by email
   - Verify account is not locked
   - Check user's authentication history

### User Doesn't See Expected App

**Symptoms:**
- App is missing from user's portal
- User says they should have access

**Solutions:**

1. **Verify app permissions**
   - Go to **Users** → find user → **Edit Permissions**
   - Check if the app is selected
   - If not, check the app and save

2. **Check if user is admin**
   - Admins automatically see all apps
   - Regular users only see assigned apps

3. **Verify app is registered**
   - Go to **Apps**
   - Confirm the app exists and URL is correct

4. **Have user refresh**
   - Ask user to log out and back in
   - Or do a hard refresh (Ctrl+Shift+R / Cmd+Shift+R)

### Invitation Email Not Received

**Symptoms:**
- New user says they didn't get the invite email
- User checked spam folder

**Solutions:**

1. **Check spam/junk folder**
   - Email may be filtered
   - Add Zitadel domain to safe senders

2. **Verify email address**
   - Check for typos in the invitation
   - Look in audit log for the invite event

3. **Resend invitation**
   - Currently requires Zitadel Console access
   - Find user → Resend verification email

4. **Check Zitadel email settings**
   - Verify email provider is configured correctly
   - Check Zitadel email logs

### User Sees Wrong Apps After Permission Change

**Symptoms:**
- User still sees old apps after permissions removed
- New permissions not reflected

**Solutions:**

1. **Clear user session**
   - Have user log out completely
   - Clear browser cookies
   - Log back in

2. **Wait a moment**
   - Permission changes may take a few seconds to propagate
   - Refresh the portal page

## App Issues

### App Not Appearing in Portal

**Symptoms:**
- App was added but doesn't show up
- App visible in admin but not in user portal

**Solutions:**

1. **Check app registration**
   - Go to **Apps**
   - Verify the app exists
   - Check all fields are filled correctly

2. **Check user permissions**
   - User needs explicit permission or admin role
   - Go to **Users** → find user → verify app is checked

3. **Verify app URL**
   - URL must be valid and accessible
   - Check for typos in the URL

### App Link Goes to Wrong Page

**Symptoms:**
- Clicking app goes to error page
- App URL seems wrong

**Solutions:**

1. **Update app URL**
   - Go to **Apps** → Edit the app
   - Verify the URL is correct
   - Save changes

2. **Check app is running**
   - The target app may be down
   - Contact app owner/developer

### App Icon Not Displaying

**Symptoms:**
- App shows letter fallback instead of uploaded icon
- Icon appears broken

**Solutions:**

1. **Re-upload icon**
   - Edit the app
   - Upload a new icon
   - Save changes

2. **Check icon format**
   - Supported: PNG, JPEG, WebP, SVG
   - Maximum size: 1MB

3. **Clear browser cache**
   - Old icon may be cached
   - Hard refresh the page

## Admin Portal Issues

### Can't Access Admin Section

**Symptoms:**
- "Access Denied" when going to /admin
- Admin button/link not visible

**Solutions:**

1. **Verify admin role**
   - Another admin needs to check your permissions
   - You need the "admin" role in Zitadel

2. **Clear session**
   - Log out and back in
   - Admin role may have been recently granted

### Changes Not Saving

**Symptoms:**
- Save button doesn't work
- Error message after clicking Save
- Changes disappear

**Solutions:**

1. **Check error message**
   - Read the specific error
   - May indicate validation issue

2. **Check network connection**
   - Ensure you're online
   - Try refreshing the page

3. **Check required fields**
   - All required fields must be filled
   - Look for red error messages

### Notifications Not Appearing

**Symptoms:**
- No notification badge
- Expecting notification but none shown

**Solutions:**

1. **Refresh the page**
   - Notifications load on page load
   - New notifications appear on refresh

2. **Check if already read**
   - You may have already marked them read
   - No way to "unread" notifications

## Authentication Issues

### "Configuration Error" on Login

**Symptoms:**
- Users see "Configuration Error" when trying to log in
- Login redirect fails

**Solutions:**

1. **Check environment configuration**
   - This is a developer issue
   - Contact the development team
   - Usually means Zitadel settings are wrong

### Session Expires Too Quickly

**Symptoms:**
- Users have to log in frequently
- "Session Expired" messages

**Solutions:**

1. **Check session settings**
   - Session timeout is configured in Zitadel
   - Default is typically 24 hours

2. **Check for logout triggers**
   - Browser settings may clear cookies
   - Privacy extensions may interfere

### SSO Not Working Between Apps

**Symptoms:**
- User has to log in again when clicking app
- Should be seamless but isn't

**Solutions:**

1. **Check app domain**
   - Apps should be on `*.renewalinitiatives.org`
   - Cross-domain SSO requires same parent domain

2. **Clear cookies**
   - Old/conflicting cookies may interfere
   - Clear all cookies and try again

3. **Check app configuration**
   - App may not be correctly configured for Zitadel
   - Contact the app developer

## When to Escalate

Contact the development team if:

- [ ] Configuration errors persist
- [ ] Zitadel Console is needed (most admins don't have access)
- [ ] Database issues are suspected
- [ ] Multiple users report the same issue
- [ ] Security concerns arise

## Emergency Contacts

For urgent issues:
- Development Team: [contact info]
- Zitadel Support: support@zitadel.com (for cloud issues)

## Reporting Issues

When reporting a problem, include:
1. What you were trying to do
2. What happened instead
3. Any error messages (screenshot if possible)
4. When it started happening
5. Which user(s) are affected
