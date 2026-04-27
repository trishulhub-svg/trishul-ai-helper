---
Task ID: 1
Agent: Main Agent
Task: Fix app not loading - diagnose and resolve server and client-side issues

Work Log:
- Discovered the dev server was not running (port 3000 not listening)
- Multiple attempts to start the server revealed it kept dying after ~15-30 seconds
- Eventually found that using `start-stop-daemon` properly daemonizes the process and keeps it alive
- Verified both direct (port 3000) and Caddy proxy (port 81) return 200 OK
- Ran comprehensive code audit of all client-side components
- Found and fixed the following bugs:
  1. ChatInput not cleared when switching chats (missing setChatInputClearSignal)
  2. extractCodeBlocksFromMessages running on every render (added useMemo)
  3. Added useMemo to imports
- Verified Enter key and Send button work correctly in ChatInput
- Confirmed no client-side runtime errors that would prevent app from loading
- Database status: Admin exists, 2 projects exist, employees were previously lost
- Lint passes clean

Stage Summary:
- App is now loading and serving correctly on both port 3000 and port 81
- Dev server started with: `start-stop-daemon --start --background --make-pidfile --pidfile /home/z/my-project/.pids/next.pid --chdir /home/z/my-project --exec /home/z/my-project/start.sh`
- Fixed 2 bugs in main-app.tsx (chatInputClearSignal not incremented, extractCodeBlocks not memoized)
- Enter key and Send button verified working correctly
