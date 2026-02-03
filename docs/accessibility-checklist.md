# Accessibility Checklist

**Target Standard**: WCAG 2.1 AA / Section 508

## Keyboard Navigation

### General Navigation
- [ ] All interactive elements reachable via Tab key
- [ ] Tab order follows logical reading order
- [ ] Skip link available to bypass navigation (if applicable)
- [ ] No keyboard traps (can escape all areas)

### Buttons and Links
- [ ] Enter/Space activates buttons
- [ ] Enter activates links
- [ ] Visible focus indicator on all interactive elements

### Dialogs/Modals
- [ ] Focus moves into dialog when opened
- [ ] Focus trapped within dialog while open
- [ ] Escape key closes dialog
- [ ] Focus returns to trigger element on close

### Dropdowns and Menus
- [ ] Arrow keys navigate menu items
- [ ] Escape closes menu
- [ ] Enter/Space selects item
- [ ] Focus returns to trigger on close

### Forms
- [ ] Tab navigates between form fields
- [ ] Labels associated with inputs
- [ ] Error messages announced to screen readers
- [ ] Submit button activates with Enter

## Screen Reader Support

### Page Structure
- [ ] Page has a unique, descriptive title
- [ ] Main content area marked with `<main>` or `role="main"`
- [ ] Navigation marked with `<nav>` or `role="navigation"`
- [ ] Headings follow logical hierarchy (h1, h2, h3, etc.)

### Interactive Elements
- [ ] Buttons have accessible names (visible text or aria-label)
- [ ] Icon-only buttons have `aria-label` or `sr-only` text
- [ ] Links have descriptive text (avoid "click here")
- [ ] Images have alt text (decorative images use `alt=""`)

### Dynamic Content
- [ ] Loading states announced via `aria-live` regions
- [ ] Error messages announced via `aria-live="polite"`
- [ ] Notifications use appropriate `aria-live` setting
- [ ] `aria-expanded` on expandable controls

### Tables
- [ ] Tables have captions or are labeled
- [ ] Header cells use `<th>` with appropriate scope
- [ ] Complex tables avoid or include proper relationships

### Forms
- [ ] Labels associated via `for`/`id` or nesting
- [ ] Required fields indicated and announced
- [ ] Invalid fields have `aria-invalid="true"`
- [ ] Error messages linked via `aria-describedby`

## Visual Requirements

### Color Contrast
- [ ] Normal text: 4.5:1 contrast ratio minimum
- [ ] Large text (18pt+): 3:1 contrast ratio minimum
- [ ] UI components and graphical objects: 3:1 minimum
- [ ] Focus indicators meet contrast requirements

### Color Independence
- [ ] Information not conveyed by color alone
- [ ] Error states have icon/text, not just red
- [ ] Links distinguishable without color

### Text
- [ ] Text resizable to 200% without loss of content
- [ ] No horizontal scrolling at 320px width
- [ ] Line height at least 1.5 for body text

### Motion
- [ ] Animations respect `prefers-reduced-motion`
- [ ] No content flashes more than 3 times per second

## Touch/Mobile

### Touch Targets
- [ ] All interactive elements at least 44x44px
- [ ] Adequate spacing between touch targets (8px min)
- [ ] No hover-only interactions on mobile

### Mobile Screen Readers
- [ ] Test with VoiceOver (iOS)
- [ ] Test with TalkBack (Android)

## Components Checklist

### Portal Home
- [ ] App cards are keyboard navigable
- [ ] App cards have descriptive link text
- [ ] Empty state is announced properly

### Admin Navigation
- [ ] Current page indicated visually and programmatically
- [ ] Mobile nav is keyboard accessible
- [ ] Bottom nav items have focus indicators

### Tables (Apps, Users, Audit Log)
- [ ] Action buttons have accessible names
- [ ] Row context available to screen readers
- [ ] Responsive table still usable with screen reader

### Forms (App, User Invite, Permissions)
- [ ] All fields labeled
- [ ] Validation errors linked to fields
- [ ] Required fields marked accessibly
- [ ] File upload accessible

### Dialogs (Delete, Deactivate, Reactivate)
- [ ] Focus management correct
- [ ] Title announced when opened
- [ ] Action buttons clearly labeled

### Notifications Dropdown
- [ ] Unread count announced
- [ ] Notification content accessible
- [ ] Mark as read button has proper label

## Testing Tools

### Automated
- Lighthouse Accessibility audit
- axe DevTools browser extension
- WAVE browser extension

### Manual
- Keyboard-only navigation test
- VoiceOver (Mac) or NVDA (Windows)
- Screen magnifier (200% zoom)

## Quick Tests

1. **Tab through the entire page** - Can you reach everything?
2. **Press Escape** - Do dialogs/menus close?
3. **Close your eyes and use a screen reader** - Does it make sense?
4. **Zoom to 200%** - Is everything still usable?
5. **Check focus indicators** - Can you always see where you are?

## Common Issues to Watch

- [ ] Icon buttons without labels
- [ ] Low contrast placeholder text
- [ ] Focus order jumping unexpectedly
- [ ] Dynamic content not announced
- [ ] Dialogs not trapping focus
- [ ] Form errors not linked to fields

---

## Notes

Document any accessibility issues found during testing:
