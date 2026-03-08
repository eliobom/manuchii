# AI Coding Agent Instructions for web-admin

## Project Overview
**Train with Morale** - A React + Vite admin dashboard application with role-based access (Admin vs Trainer). Communicates with Supabase as the primary database via a custom API client layer. Uses Tailwind CSS for styling and Recharts for analytics visualization.

## Architecture & Data Flow

### Core Stack
- **Frontend**: React 19 + Vite with HMR, Tailwind CSS, PostCSS
- **Database**: Supabase (PostgreSQL) via `@supabase/supabase-js`
- **Real-time**: Socket.io-client for live updates
- **Charts**: Recharts for analytics dashboards
- **HTTP Client**: Axios (installed but apiClient wraps calls)
- **Icons**: Lucide-react

### Key Architecture Patterns

**Authentication Flow** (`src/apiClient.js`, `src/App.jsx`):
- Custom user/password authentication (NOT Supabase Auth)
- Credentials checked against `users` table (fallback to `app_users` table)
- Password stored as `password_hash` - verify before login
- Token + user object stored in localStorage
- Role-based routing: 'admin' → Dashboard, 'trainer' → TrainerDashboard

**API Client Pattern** (`src/apiClient.js`):
- Singleton class wrapping all Supabase queries
- Methods: `login()`, `getStats()`, `getWebContent()`, `getTasks()`, etc.
- Returns promises, handles errors with Spanish error messages
- Token management via `setToken()` / `getAuthHeaders()`
- **Important**: Some endpoints may still reference backend (cleanup needed)

**Component Organization**:
- **Pages** (`src/pages/`): Login, Dashboard, TrainerDashboard - manage own state
- **Components** (`src/components/`): Reusable UI (Sidebar, Modals, Charts, Cards)
- Modal components (UserModal, TaskModal) use callback props for data sync
- StatCard/ChartCard are dashboard layout primitives

### Critical Data Tables (Supabase)
Infer table structure from `apiClient.js` queries:
- `users` - authentication (id, username, password_hash, email, role)
- `app_users` - fallback user table
- `web_content` - CMS content by section
- `stats` - dashboard metrics
- `tasks` - task management
- `classes` - training classes
- Other tables referenced: comments, attachments, etc.

## Developer Workflows

### Build & Dev
```bash
npm run dev        # Start Vite dev server with HMR (localhost:5173 default)
npm run build      # Production build to dist/
npm run lint       # ESLint check (eslint.config.js)
npm run preview    # Preview production build locally
```

### Environment Setup
Create `.env.local` (Vite convention):
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```
Access via `import.meta.env.VITE_*` in code.

### Styling
- **Tailwind CSS** is primary (configured in `tailwind.config.js`)
- CSS files in `src/*.css` import global styles
- No CSS-in-JS; use className strings with clsx() for conditional classes
- PostCSS handles Tailwind compilation (watch mode in dev)

## Project Conventions & Patterns

### Error Handling
- **Spanish error messages** throughout (user-facing errors)
- API errors logged with `console.error()` then rethrown with user-friendly message
- Modal components show toast errors via Toast component
- Login page displays auth errors in form

### State Management
- Component-level React hooks (useState, useEffect) - no global state manager
- Each major page (Dashboard, TrainerDashboard) manages its own domain state
- Loading states paired with data states (e.g., `statsLoading` + `stats`)
- Modal open/close + selected item pattern for editing

### Naming Conventions
- Boolean props: `isLoading`, `isOpen`, `isChatOpen`
- Handlers: `handleSubmit`, `onLogout`, `onTabChange`
- Fetch functions: `fetch*` (e.g., `fetchStats`, `fetchWebContent`)
- Supabase tables: snake_case (user_growth_chart, profile_image_url)
- Components: PascalCase, export as default

### Modal Pattern (UserModal, TaskModal)
```jsx
// Parent manages: isOpen, selectedItem, onClose callback
// Modal calls props.onSave(updatedData) for synchronous updates
// Loading state prevents double-submit
```

### Tab/Navigation Pattern (Dashboard)
- Single `activeTab` state string
- Sidebar passes `menuItems` array with id/label/icon
- Conditional rendering per tab in Dashboard body
- Mobile toggle: `sidebarOpen` boolean

## Common Pitfalls & Important Details

1. **Supabase Query Quirks**:
   - Use `.ilike()` for case-insensitive searches (username matching)
   - String normalization: `String(value ?? '').trim()` before queries
   - Check for null tables before `.find()` operations

2. **Token Persistence**:
   - Always call `apiClient.setToken()` after login (updates localStorage + instance)
   - Logout removes token AND user from localStorage
   - Initial app load checks both token AND user in localStorage

3. **Component Re-renders**:
   - Modals should close immediately on successful operation (do NOT await validation)
   - Use `useCallback` for event handlers that depend on changing state
   - SearchTerm/filter changes should refetch/re-filter data

4. **Responsive Layout**:
   - Mobile menu: Sidebar hidden by default, toggled by Menu button
   - Use Tailwind responsive classes (`hidden md:flex` pattern)
   - Main content area: adjust padding when sidebar toggled

5. **Real-time Updates** (Socket.io):
   - Imported but usage not visible in current pages
   - When implementing: connect on mount, disconnect on unmount
   - Emit/listen for events matching backend event names

## File Reference Guide

| File | Purpose |
|------|---------|
| `src/apiClient.js` | All Supabase queries + auth logic - **central integration point** |
| `src/supabaseClient.js` | Supabase client initialization (env config) |
| `src/App.jsx` | Root component, auth state, page routing |
| `src/pages/Dashboard.jsx` | Admin dashboard with stats/charts/users/tasks/classes |
| `src/pages/TrainerDashboard.jsx` | Trainer-specific dashboard (structure TBD) |
| `src/components/Sidebar.jsx` | Navigation menu, requires menuItems prop |
| `tailwind.config.js` | Tailwind theme customization |
| `vite.config.js` | Minimal config, PostCSS disabled (handled by Tailwind) |

## Before You Code

- Check `apiClient.js` for existing method before creating new API calls
- All Supabase table operations should go through apiClient, not direct supabase calls
- Spanish language UI is expected; maintain consistency in error/success messages
- Test auth flow with different roles; Dashboard routing is role-based
