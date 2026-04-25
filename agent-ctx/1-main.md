# Task 1 - Main Agent - Fix 5 Critical Bugs

## Summary
Applied 5 bug fixes to `/home/z/my-project/src/app/page.tsx`:

### CHANGE 1: Fix Dialog Popups Not Showing in Dashboard
- Dashboard view (`activeView==='dashboard'`) returns early, so Dialog components defined after the return were never rendered
- Added all critical dialogs INSIDE the dashboard return block (New Employee, New Training, Assign Training, Reset Password, Change Password, Delete Requests, Bulk Hide)

### CHANGE 2: Fix Direct Chat Locking
- Admin can now lock a direct chat away from employees
- Updated `handleSelectDirectChat` to block employees if admin has locked the chat, and lock with `lockedBy:'admin'` when admin opens
- Added `isChatLockedForEmployee` and `isProjectLockedForEmployee` variables
- Updated chat input section to show locked message when admin is using the chat/project

### CHANGE 3: Fix Trishul B.A. Chat Using Wrong AI
- Simplified `isBusiness` condition from redundant `!!selectedBusinessChatId||activeView==='chat'&&userRole==='admin'&&!!selectedBusinessChatId` to `!!selectedBusinessChatId`

### CHANGE 4: Fix Employee Test - Prevent Retake After Completion
- Removed `canRetake` variable and `retakeApproved` local variable
- Replaced finished training view with view-only questions showing CheckCircle2/XCircle icons
- Removed "Start Retake Quiz" button from finished state - employee must request retake from admin
- Removed retake request/pending badges from video view section
- Changed "Start Quiz" button to only show if training is NOT finished

### CHANGE 5: Ensure handleSendMessage checks project locks
- Added lock checks at beginning of `handleSendMessage` for both direct chat and project locks by admin

## Verification
- `bun run lint` passes with no errors
- Dev server running clean, no compilation errors
