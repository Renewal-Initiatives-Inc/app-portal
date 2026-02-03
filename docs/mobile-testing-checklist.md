# Mobile Testing Checklist

## Test Devices / Viewports

| Device | Width | Priority |
|--------|-------|----------|
| iPhone SE | 375px | High |
| iPhone 14/15 | 390px | High |
| Android (typical) | 360px | Medium |
| iPad Mini | 768px | Medium |
| iPad | 820px | Low |

## Pages to Test

### Portal Home (`/`)
- [ ] App cards display in single column on mobile
- [ ] App cards are tappable with adequate touch target (44px+)
- [ ] App icons display correctly
- [ ] Empty state displays properly
- [ ] Header is not truncated

### Login (`/login`)
- [ ] Login form fits screen width
- [ ] Submit button is easily tappable
- [ ] Error messages display without overflow

### Admin Dashboard (`/admin`)
- [ ] Stats cards stack properly
- [ ] Recent activity list scrolls if needed
- [ ] Mobile bottom nav is visible
- [ ] Active nav state shows correctly

### Admin Apps List (`/admin/apps`)
- [ ] Table scrolls horizontally
- [ ] All columns accessible via scroll
- [ ] Action menu opens correctly
- [ ] "Add App" button is accessible

### Admin Apps Form (`/admin/apps/new`, `/admin/apps/[id]/edit`)
- [ ] Form fields are full-width
- [ ] Icon upload button is tappable
- [ ] Icon preview displays correctly
- [ ] Form actions stack (primary button on top)
- [ ] Keyboard doesn't obscure inputs

### Admin Users List (`/admin/users`)
- [ ] Table scrolls horizontally
- [ ] User avatars display correctly
- [ ] Status badges are readable
- [ ] Action menu opens correctly

### Admin User Detail (`/admin/users/[id]`)
- [ ] User info card displays properly
- [ ] Permissions checkboxes are tappable
- [ ] Form actions stack on mobile
- [ ] Switch control is large enough

### Admin User Invite (`/admin/users/invite`)
- [ ] Form fields are full-width
- [ ] App permission checkboxes are tappable
- [ ] Form actions stack on mobile

### Admin Audit Log (`/admin/audit-log`)
- [ ] Table scrolls horizontally
- [ ] Filters dropdown works on mobile
- [ ] Pagination controls are tappable

## Mobile Navigation

- [ ] Bottom nav is fixed at bottom
- [ ] Icons are clearly visible (no emojis)
- [ ] Active state is visible
- [ ] All 5 nav items fit on screen
- [ ] Tap targets are at least 44x44px
- [ ] Safe area padding works on iPhone (notch)

## Notifications Dropdown

- [ ] Opens correctly on mobile
- [ ] Doesn't overflow screen
- [ ] Mark as read buttons are tappable
- [ ] Scrollable if many notifications

## General Checks

- [ ] No horizontal scrolling on main content (except tables)
- [ ] Text is readable without zooming
- [ ] Touch targets are at least 44x44px
- [ ] Modals/dialogs fit on screen
- [ ] Loading states display correctly
- [ ] Error messages are visible
- [ ] Toast notifications appear and dismiss properly

## Orientation Testing

- [ ] Portrait mode works for all pages
- [ ] Landscape mode doesn't break layout (optional)

## Performance on Mobile

- [ ] Pages load without visible jank
- [ ] Scrolling is smooth
- [ ] No excessive battery drain

## Notes

Add any issues discovered during testing below:

---
