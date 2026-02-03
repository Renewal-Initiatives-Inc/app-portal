# Admin User Guide

This guide explains how to manage the App Portal as an administrator.

## Accessing the Admin Portal

1. Go to [tools.renewalinitiatives.org](https://tools.renewalinitiatives.org)
2. Log in with your admin account
3. Click **Admin** in the header (or navigate to `/admin`)

You'll see the admin dashboard with:
- Quick stats (total apps, users, etc.)
- Recent activity
- Navigation sidebar

## Dashboard Overview

The admin dashboard shows:

| Section | Description |
|---------|-------------|
| **Total Apps** | Number of registered applications |
| **Total Users** | Number of users in the system |
| **Active Users** | Users who are not deactivated |
| **Recent Activity** | Latest user actions and system events |

## Managing Apps

### View All Apps

1. Click **Apps** in the sidebar
2. You'll see a table with all registered apps
3. Information shown:
   - Icon
   - Name
   - Slug (used for permissions)
   - URL
   - Created date

### Add a New App

1. Click **Apps** in the sidebar
2. Click **Add App** button
3. Fill in the form:
   - **Name**: Display name (e.g., "Timesheets")
   - **Slug**: URL-friendly identifier (e.g., `timesheets`)
     - Automatically generated from name
     - Can be customized
     - Used for permission names (`app:timesheets`)
   - **Description**: Brief description of the app
   - **App URL**: Full URL to the application
   - **Icon**: Upload an image (optional)
     - Supported formats: PNG, JPEG, WebP, SVG
     - Maximum size: 1MB
4. Click **Create App**

### Edit an App

1. Click **Apps** in the sidebar
2. Find the app in the table
3. Click the **...** (actions) menu
4. Select **Edit**
5. Make your changes
6. Click **Save Changes**

**Note:** Changing the slug may break existing user permissions. Users will need their permissions updated.

### Delete an App

1. Click **Apps** in the sidebar
2. Find the app in the table
3. Click the **...** (actions) menu
4. Select **Delete**
5. Confirm the deletion

**Warning:** This cannot be undone. The app will be removed from all users' portals.

## Managing Users

### View All Users

1. Click **Users** in the sidebar
2. You'll see a table with all users
3. Information shown:
   - Avatar
   - Name
   - Email
   - Status (active, pending, inactive)
   - Roles
   - Created date

### Invite a New User

1. Click **Users** in the sidebar
2. Click **Invite User** button
3. Fill in the form:
   - **Email** (required): User's email address
   - **First Name** (optional)
   - **Last Name** (optional)
   - **Admin Access**: Check to make them an admin
   - **App Permissions**: Select which apps they can access
4. Click **Send Invitation**

The user will receive an email with instructions to set their password.

### Edit User Permissions

1. Click **Users** in the sidebar
2. Find the user in the table
3. Click the **...** (actions) menu
4. Select **Edit Permissions**
5. Modify settings:
   - Toggle **Administrator** to grant/revoke admin access
   - Check/uncheck apps to grant/revoke access
6. Click **Save Changes**

**Note:** Admins automatically have access to all apps.

### Deactivate a User

1. Click **Users** in the sidebar
2. Find the user in the table
3. Click the **...** (actions) menu
4. Select **Deactivate User**
5. Confirm the deactivation

Deactivated users:
- Cannot log in
- Don't appear in the active users count
- Can be reactivated later

### Reactivate a User

1. Click **Users** in the sidebar
2. Find the inactive user
3. Click the **...** (actions) menu
4. Select **Reactivate User**
5. Confirm the reactivation

### Make a User an Admin

1. Click **Users** in the sidebar
2. Find the user
3. Click the **...** (actions) menu
4. Select **Make Admin**

### Remove Admin Role

1. Click **Users** in the sidebar
2. Find the admin user
3. Click the **...** (actions) menu
4. Select **Remove Admin Role**

**Note:** You cannot remove your own admin role. Another admin must do this. At least one admin must remain in the system.

## Viewing Audit Logs

The audit log shows a history of actions in the system.

### Access Audit Logs

1. Click **Audit Log** in the sidebar
2. View the list of events

### Event Types

| Event | Description |
|-------|-------------|
| **App Access** | User accessed an app from the portal |
| **App Created** | Admin added a new app |
| **App Updated** | Admin modified an app |
| **App Deleted** | Admin removed an app |
| **User Invited** | Admin invited a new user |
| **User Deactivated** | Admin deactivated a user |
| **User Reactivated** | Admin reactivated a user |
| **Permissions Updated** | Admin changed user permissions |

### Filtering Logs

Use the filter controls to narrow down the log:
- **Action**: Filter by event type
- **User**: Filter by specific user
- **App**: Filter by specific app
- **Date Range**: Filter by time period

### Log Retention

Audit logs are retained for 90 days. Older entries are automatically removed.

## Notifications

Notifications alert you to important events.

### Viewing Notifications

1. Click the **bell icon** in the header
2. Unread notifications show a red badge with the count
3. Click to see recent notifications

### Notification Types

You'll receive notifications when:
- A new user accepts their invitation
- Another admin updates user permissions

### Marking as Read

- Click **Mark all read** to clear all notifications
- Click the **checkmark** on individual notifications

## Tips and Best Practices

### User Management

1. **Least Privilege**: Only give users access to apps they need
2. **Regular Audits**: Review user permissions periodically
3. **Deactivate, Don't Delete**: Deactivate users who leave rather than deleting (preserves audit history)

### App Management

1. **Consistent Naming**: Use clear, descriptive names
2. **Meaningful Slugs**: Use lowercase, hyphenated slugs (e.g., `proposal-rodeo`)
3. **Good Icons**: Use recognizable icons that display well at 48x48 pixels

### Security

1. **Multiple Admins**: Always have at least two admin accounts
2. **Check Audit Logs**: Review logs regularly for suspicious activity
3. **Review Invitations**: Only invite users who need access

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Tab` | Navigate between elements |
| `Enter` | Activate buttons/links |
| `Escape` | Close dialogs/menus |

## Mobile Access

The admin portal works on mobile devices:
- Use the bottom navigation bar on small screens
- Tables scroll horizontally to show all columns
- Forms stack vertically for easier input

## Getting Help

If you encounter issues:
1. Check the [Troubleshooting Guide](./troubleshooting.md)
2. Review the [Quick Reference](./quick-reference.md)
3. Contact the development team
