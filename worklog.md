---
Task ID: 2
Agent: Main
Task: Fix starting page, auto-scroll, and add Code Panel for side-by-side code viewing

Work Log:
- Fixed starting page rendering - welcome screen now shows properly with input field and action cards
- Fixed auto-scroll issue - implemented smart scroll detection:
  - Tracks if user manually scrolls up (150px from bottom threshold)
  - Stops auto-scrolling when user scrolls up
  - Shows "Scroll to bottom" floating button when user is scrolled up
  - Resets scroll state on new conversation
- Added side-by-side Code Panel feature:
  - Desktop: opens as a right-side panel (45% width) with tabs
  - Mobile: opens as a bottom sheet (85vh height)
  - "Current" tab: shows the code block user clicked "View" on
  - "All Code" tab: shows all extracted code blocks from the conversation
  - Each code block has "View" and "Copy" buttons
  - Toggle button in top bar shows code block count
- Added "View" button on every code block in chat messages
- Added max-height (400px) with scroll on inline code blocks to prevent auto-scroll issues
- Welcome screen now has a quick-start input field at the bottom
- All code viewers use Dialog modals instead of inline panels for better mobile experience
- Build and lint pass successfully

Stage Summary:
- Starting page now renders correctly with welcome screen and input
- Auto-scroll no longer traps users at the bottom - they can scroll up freely
- Code Panel allows side-by-side code viewing with copy functionality
- All features are mobile responsive (Sheet for mobile, Panel for desktop)
- Floating "Scroll to bottom" button when user scrolls away from latest messages
