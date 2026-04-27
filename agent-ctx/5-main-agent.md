# Task 5: Split massive page.tsx into smaller components to fix OOM crash

## Agent: Main Agent

## Summary
Split the monolithic 2261-line page.tsx into 12 smaller component files to fix the Turbopack OOM crash during compilation. All state management remains in page.tsx; only JSX rendering was moved to child components.

## Files Created
1. `src/components/app/types.ts` - All TypeScript interfaces
2. `src/components/app/utils.ts` - Utility functions (getLanguage, extractCodeBlocksFromMessages, etc.)
3. `src/components/app/chat-message.tsx` - ChatMessage + CopyButton + SaveToProjectButton
4. `src/components/app/quiz-view.tsx` - QuizView component with timer
5. `src/components/app/chat-input.tsx` - ChatInput memo component (preserved local state pattern)
6. `src/components/app/login-screen.tsx` - Login/role selection screen
7. `src/components/app/training-view.tsx` - Employee training view
8. `src/components/app/admin-dashboard.tsx` - Full admin dashboard with all tabs
9. `src/components/app/sidebar.tsx` - Sidebar content
10. `src/components/app/chat-area.tsx` - Main chat area (messages + input)
11. `src/components/app/dialogs.tsx` - All dialog components
12. `src/components/app/code-panel.tsx` - Code panel for viewing code

## Files Modified
- `src/app/page.tsx` - Rewritten as thin shell with dynamic imports

## Key Decisions
- All useState/useEffect/useCallback stay in main page.tsx
- Dynamic imports with `ssr: false` for AdminDashboard and TrainingView
- ChatInput memo with local state pattern preserved exactly
- isLoadingRef pattern preserved in main page
- Props passed as typed interfaces to each child component

## Result
- page.tsx: 2261 → ~990 lines (56% reduction)
- Dev server compiles without OOM
- Lint passes clean
- All functionality preserved
