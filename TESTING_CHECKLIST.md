# Testing Checklist - Event Completion & Feedback System

## Pre-Deployment Testing

### ✅ Database Setup
- [ ] Run `QUICK_EVENT_COMPLETION_SETUP.sql` in Supabase SQL Editor
- [ ] Verify success message appears
- [ ] Check that `event_feedback` table exists
- [ ] Verify triggers are created and enabled
- [ ] Confirm RLS policies are in place

```sql
-- Quick verification queries:

-- Check table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'event_feedback'
);

-- Check triggers
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname IN (
  'trigger_notify_event_completion',
  'trigger_notify_event_feedback_submitted'
);

-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'event_feedback';
```

## Functional Testing

### 1. Event Completion Notification

#### Test Case 1.1: Single User Registration
- [ ] Create a test event as club rep
- [ ] Register as a student user
- [ ] Mark event as complete (as club rep)
- [ ] **Expected:** Student receives notification
- [ ] **Expected:** Notification shows in bell with badge
- [ ] **Expected:** Notification message is correct
- [ ] **Expected:** Clicking notification goes to event page

#### Test Case 1.2: Multiple User Registrations
- [ ] Create a test event
- [ ] Register 3 different student users
- [ ] Mark event as complete
- [ ] **Expected:** All 3 users receive notifications
- [ ] **Expected:** Each notification is independent
- [ ] **Expected:** Badge count is correct for each user

#### Test Case 1.3: No Registrations
- [ ] Create a test event
- [ ] Don't register any users
- [ ] Mark event as complete
- [ ] **Expected:** No notifications sent
- [ ] **Expected:** No errors in logs

### 2. Profile - Completed Events Tab

#### Test Case 2.1: View Completed Events
- [ ] Register for an event
- [ ] Event gets marked complete
- [ ] Go to Profile page
- [ ] Click "Completed" tab
- [ ] **Expected:** Event appears in list
- [ ] **Expected:** Shows "Completed" badge
- [ ] **Expected:** Shows event details correctly
- [ ] **Expected:** Shows completion date

#### Test Case 2.2: Feedback Status Indicator
- [ ] View completed event (no feedback given)
- [ ] **Expected:** "Give Feedback" button appears
- [ ] Submit feedback for the event
- [ ] Return to Profile → Completed tab
- [ ] **Expected:** "Feedback Given" badge appears
- [ ] **Expected:** "Give Feedback" button is gone

#### Test Case 2.3: Empty State
- [ ] Login as new user (no events)
- [ ] Go to Profile → Completed tab
- [ ] **Expected:** Shows "No completed events yet" message
- [ ] **Expected:** No errors

### 3. Feedback Submission

#### Test Case 3.1: Give Feedback Button
- [ ] Go to Profile → Completed tab
- [ ] Click "Give Feedback" button
- [ ] **Expected:** Redirects to event detail page
- [ ] **Expected:** URL includes `?feedback=true`
- [ ] **Expected:** Page auto-scrolls to feedback form
- [ ] **Expected:** Feedback form is visible

#### Test Case 3.2: Submit Complete Feedback
- [ ] Fill out all feedback fields:
  - [ ] Overall rating: 5
  - [ ] Organization rating: 4
  - [ ] Usefulness rating: 5
  - [ ] Would attend again: Yes
  - [ ] Comments: "Great event!"
- [ ] Click "Submit Feedback"
- [ ] **Expected:** Success toast appears
- [ ] **Expected:** Form clears
- [ ] **Expected:** Feedback appears in reviews section
- [ ] **Expected:** Club owner receives notification

#### Test Case 3.3: Submit Minimal Feedback
- [ ] Fill only required fields:
  - [ ] Overall rating: 3
  - [ ] Organization rating: 3
  - [ ] Usefulness rating: 3
  - [ ] Would attend again: No
  - [ ] Comments: (leave empty)
- [ ] Click "Submit Feedback"
- [ ] **Expected:** Submission succeeds
- [ ] **Expected:** All fields saved correctly

#### Test Case 3.4: Duplicate Feedback Prevention
- [ ] Submit feedback for an event
- [ ] Try to submit feedback again for same event
- [ ] **Expected:** Error message or form disabled
- [ ] **Expected:** Database constraint prevents duplicate

#### Test Case 3.5: Feedback Validation
- [ ] Try submitting without selecting ratings
- [ ] **Expected:** Validation error or default values used
- [ ] Try submitting with invalid data
- [ ] **Expected:** Appropriate error messages

### 4. My Feedback Tab

#### Test Case 4.1: View Submitted Feedback
- [ ] Submit feedback for 2-3 events
- [ ] Go to Profile → My Feedback tab
- [ ] **Expected:** All feedback appears
- [ ] **Expected:** Shows event names
- [ ] **Expected:** Shows ratings
- [ ] **Expected:** Shows comments
- [ ] **Expected:** Shows submission dates
- [ ] **Expected:** Sorted by date (newest first)

#### Test Case 4.2: Empty State
- [ ] Login as new user (no feedback)
- [ ] Go to Profile → My Feedback tab
- [ ] **Expected:** Shows "No event feedback submitted yet"
- [ ] **Expected:** No errors

### 5. Notification System

#### Test Case 5.1: Notification Bell Badge
- [ ] Start with no unread notifications
- [ ] Event gets marked complete
- [ ] **Expected:** Badge appears with count
- [ ] **Expected:** Badge shows correct number
- [ ] Click notification
- [ ] **Expected:** Badge count decreases

#### Test Case 5.2: Notification Content
- [ ] Receive event completion notification
- [ ] Open notification dropdown
- [ ] **Expected:** Shows event name
- [ ] **Expected:** Shows completion message
- [ ] **Expected:** Shows time ago
- [ ] **Expected:** Shows unread indicator (dot)

#### Test Case 5.3: Mark as Read
- [ ] Click on a notification
- [ ] **Expected:** Notification marked as read
- [ ] **Expected:** Unread indicator disappears
- [ ] **Expected:** Badge count updates

#### Test Case 5.4: Mark All as Read
- [ ] Have multiple unread notifications
- [ ] Click "Mark all read" button
- [ ] **Expected:** All notifications marked as read
- [ ] **Expected:** Badge disappears
- [ ] **Expected:** Success toast appears

#### Test Case 5.5: Real-time Updates
- [ ] Open app in two browser windows
- [ ] Mark event complete in window 1
- [ ] **Expected:** Notification appears in window 2 instantly
- [ ] **Expected:** No page refresh needed

### 6. Club Owner Experience

#### Test Case 6.1: Receive Feedback Notification
- [ ] Student submits feedback for your event
- [ ] **Expected:** Notification appears
- [ ] **Expected:** Message says "New Event Feedback Received"
- [ ] **Expected:** Shows event name
- [ ] Click notification
- [ ] **Expected:** Goes to event detail page

#### Test Case 6.2: View Feedback on Event Page
- [ ] Go to event detail page
- [ ] **Expected:** See all submitted feedback
- [ ] **Expected:** Feedback displayed anonymously
- [ ] **Expected:** Shows ratings and comments
- [ ] **Expected:** Shows average ratings

### 7. Edge Cases

#### Test Case 7.1: Event Marked Complete Twice
- [ ] Mark event as complete
- [ ] Try marking as complete again
- [ ] **Expected:** No duplicate notifications sent
- [ ] **Expected:** Trigger only fires on status change

#### Test Case 7.2: User Unregisters After Completion
- [ ] Register for event
- [ ] Event gets completed
- [ ] Unregister from event
- [ ] **Expected:** Notification still exists
- [ ] **Expected:** Can still view event in completed tab

#### Test Case 7.3: Event Deleted After Feedback
- [ ] Submit feedback for event
- [ ] Club deletes the event
- [ ] **Expected:** Feedback is deleted (CASCADE)
- [ ] **Expected:** No orphaned records

#### Test Case 7.4: User Account Deleted
- [ ] Submit feedback
- [ ] Delete user account
- [ ] **Expected:** Feedback is deleted (CASCADE)
- [ ] **Expected:** No orphaned records

### 8. Performance Testing

#### Test Case 8.1: Large Number of Registrations
- [ ] Create event with 100+ registrations
- [ ] Mark event as complete
- [ ] **Expected:** All notifications created
- [ ] **Expected:** Completes in reasonable time (<5 seconds)
- [ ] **Expected:** No timeout errors

#### Test Case 8.2: Many Completed Events
- [ ] User has 50+ completed events
- [ ] Go to Profile → Completed tab
- [ ] **Expected:** Page loads quickly
- [ ] **Expected:** Events display correctly
- [ ] **Expected:** No performance issues

#### Test Case 8.3: Many Notifications
- [ ] User has 100+ notifications
- [ ] Open notification bell
- [ ] **Expected:** Shows latest 10
- [ ] **Expected:** Loads quickly
- [ ] **Expected:** Scrolling works smoothly

### 9. Security Testing

#### Test Case 9.1: RLS - View Other User's Feedback
- [ ] Login as User A
- [ ] Try to query User B's feedback directly
- [ ] **Expected:** Cannot see other user's feedback
- [ ] **Expected:** RLS blocks unauthorized access

#### Test Case 9.2: RLS - Modify Other User's Feedback
- [ ] Login as User A
- [ ] Try to update User B's feedback
- [ ] **Expected:** Update fails
- [ ] **Expected:** RLS prevents modification

#### Test Case 9.3: RLS - View Own Feedback
- [ ] Login as User A
- [ ] Query own feedback
- [ ] **Expected:** Can see own feedback
- [ ] **Expected:** All own records returned

#### Test Case 9.4: Unique Constraint
- [ ] Submit feedback for event
- [ ] Try to submit again via direct database insert
- [ ] **Expected:** Constraint violation error
- [ ] **Expected:** Duplicate prevented

### 10. UI/UX Testing

#### Test Case 10.1: Responsive Design
- [ ] Test on mobile (375px width)
- [ ] Test on tablet (768px width)
- [ ] Test on desktop (1920px width)
- [ ] **Expected:** All layouts work correctly
- [ ] **Expected:** Buttons are clickable
- [ ] **Expected:** Text is readable

#### Test Case 10.2: Loading States
- [ ] Slow down network (Chrome DevTools)
- [ ] Navigate to Profile
- [ ] **Expected:** Loading spinner appears
- [ ] **Expected:** Content loads after data fetched
- [ ] **Expected:** No layout shift

#### Test Case 10.3: Error States
- [ ] Disconnect from internet
- [ ] Try to submit feedback
- [ ] **Expected:** Error message appears
- [ ] **Expected:** User-friendly error text
- [ ] **Expected:** Can retry after reconnecting

#### Test Case 10.4: Empty States
- [ ] Check all empty states:
  - [ ] No completed events
  - [ ] No feedback submitted
  - [ ] No notifications
- [ ] **Expected:** Helpful empty state messages
- [ ] **Expected:** Appropriate icons/illustrations

### 11. Cross-Browser Testing

- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge
- [ ] **Expected:** Works consistently across browsers
- [ ] **Expected:** No browser-specific bugs

### 12. Accessibility Testing

#### Test Case 12.1: Keyboard Navigation
- [ ] Navigate using Tab key
- [ ] **Expected:** Can reach all interactive elements
- [ ] **Expected:** Focus indicators visible
- [ ] **Expected:** Logical tab order

#### Test Case 12.2: Screen Reader
- [ ] Use screen reader (NVDA/JAWS)
- [ ] **Expected:** All content is announced
- [ ] **Expected:** Buttons have proper labels
- [ ] **Expected:** Form fields have labels

## Post-Deployment Monitoring

### Week 1 Checklist
- [ ] Monitor error logs daily
- [ ] Check notification delivery rate
- [ ] Track feedback submission rate
- [ ] Review user feedback
- [ ] Check database performance

### Week 2-4 Checklist
- [ ] Analyze feedback patterns
- [ ] Identify most common issues
- [ ] Gather user feedback
- [ ] Plan improvements
- [ ] Optimize slow queries

## Bug Report Template

If you find a bug, document it:

```
Bug Title: [Short description]

Steps to Reproduce:
1. 
2. 
3. 

Expected Behavior:
[What should happen]

Actual Behavior:
[What actually happens]

Environment:
- Browser: 
- OS: 
- User Role: 
- Date/Time: 

Screenshots/Logs:
[Attach if available]

Severity: [Critical/High/Medium/Low]
```

## Success Criteria

The system is ready for production when:
- [ ] All critical test cases pass
- [ ] No high-severity bugs
- [ ] Performance is acceptable
- [ ] Security tests pass
- [ ] Accessibility requirements met
- [ ] Cross-browser compatibility confirmed
- [ ] Documentation is complete

---

## Quick Test Script

For rapid testing, run through this minimal flow:

1. **Setup** (2 min)
   - [ ] Run SQL script
   - [ ] Verify success

2. **Happy Path** (5 min)
   - [ ] Create event
   - [ ] Register user
   - [ ] Mark complete
   - [ ] Check notification
   - [ ] Submit feedback
   - [ ] Verify in profile

3. **Edge Cases** (3 min)
   - [ ] Try duplicate feedback
   - [ ] Check empty states
   - [ ] Test with no registrations

**Total Time: ~10 minutes**

---

## Automated Testing (Future)

Consider adding:
- Unit tests for functions
- Integration tests for flows
- E2E tests with Playwright/Cypress
- Load testing with k6
- Security scanning

---

Good luck with testing! 🧪✅
