---
Task ID: 1
Agent: Main
Task: Complete rebuild of Trishul AI Helper with mobile responsive design and direct chat feature

Work Log:
- Updated Prisma schema to make `projectId` optional in Conversation model, added `mode` field ("direct" or "project")
- Pushed schema changes to database with `bun run db:push`
- Created `/api/direct-chats` route to list direct chat conversations
- Updated `/api/chat/route.ts` to support direct chat (no projectId required)
- Updated `/lib/llm.ts` with `buildDirectChatPrompt()` for AI chat without project context
- Updated Zustand store to include `selectedDirectChatId` state
- Completely rebuilt `page.tsx` with:
  - Mobile responsive design using `useIsMobile` hook
  - Sheet (drawer) sidebar on mobile instead of fixed sidebar
  - Direct AI Chat feature - employees can chat without creating a project
  - Mobile-friendly file viewer (dialog modal on mobile, side panel on desktop)
  - Responsive spacing, font sizes, and touch targets
  - Welcome screen with Direct Chat and Create Project cards
  - Quick suggestion buttons for common tasks
- Build passes successfully with `npx next build`

Stage Summary:
- All backend APIs working: projects CRUD, files CRUD, chat, direct-chats listing, conversations
- Frontend completely rebuilt with mobile-first responsive design
- Direct chat feature allows employees to chat with AI (GLM models) without needing a project
- Project-based chat still available with full codebase context
- App compiles and builds successfully
