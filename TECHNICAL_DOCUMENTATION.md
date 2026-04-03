# Snippet Extension - Technical Documentation

**Version:** 1.0.0  
**Last Updated:** April 3, 2026

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Core Features](#core-features)
6. [Data Models](#data-models)
7. [Backend API](#backend-api)
8. [Frontend Architecture](#frontend-architecture)
9. [Chrome Extension Components](#chrome-extension-components)
10. [Setup & Installation](#setup--installation)
11. [Development Workflow](#development-workflow)
12. [Deployment](#deployment)
13. [Security Considerations](#security-considerations)

---

## Project Overview

**Snippet Extension** is a Chrome browser extension that provides intelligent snippet management and autocomplete functionality within web browsers. Users can:

- Create and manage text snippets with keyboard shortcuts
- Receive AI-powered autocomplete suggestions in real-time
- Track usage history and analytics
- Sync snippets across devices via cloud synchronization
- Customize settings per site or globally

The extension integrates with the Anthropic Claude AI API for intelligent suggestions and communicates with a backend server for persistent cloud storage and user management.

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Ch rome Browser                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐          ┌──────────────────────┐   │
│  │  Content Scripts │◄────────►│  Background Service  │   │
│  │  (Trigger)       │          │  Worker              │   │
│  └──────────────────┘          └──────────────────────┘   │
│           ▲                              ▲                │
│           │                              │                 │
│           └──────────┬───────────────────┘                 │
│                      │                                      │
│           ┌──────────▼──────────┐                          │
│           │  Chrome Storage API  │                         │
│           │  (sync & local)      │                         │
│           └─────────────────────┘                          │
│                                                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │         Popup UI (React + TypeScript)              │    │
│  │  ┌──────────────┐  ┌──────────────────────────┐   │   │
│  │  │ Home         │  │ Add Snippet, Settings    │   │   │
│  │  │ History      │  │ History View              │   │   │
│  │  └──────────────┘  └──────────────────────────┘   │   │
│  └────────────────────────────────────────────────────┘   │
│                      │                                      │
└──────────────────────┼──────────────────────────────────────┘
                       │
              ┌────────▼────────┐
              │   Anthropic AI  │
              │   API (Claude)  │
              └────────────────┘
                       │
              ┌────────▼────────┐
              │  Backend Server │
              │  (Node.js/Expr) │
              └─────────────────┘
                       │
              ┌────────▼────────┐
              │   Database      │
              │   (TBD)         │
              └─────────────────┘
```

### Data Flow

1. **Extension → Content Script**: User triggers snippet via keyboard shortcut or text detection
2. **Content Script → Background Worker**: Sends request for suggestions or to record usage
3. **Background Worker → Chrome Storage**: Reads/writes snippets, settings, analytics
4. **Background Worker → AI Engine**: Requests intelligent completions from Claude API
5. **Background Worker → Backend**: Syncs data with cloud server for persistence
6. **Popup UI → Chrome Storage**: Manages settings, creates/edits snippets
7. **Popup UI → Background Worker**: Requests latest data and sends commands

---

## Technology Stack

### Frontend
- **Runtime**: TypeScript 5.9.3
- **UI Framework**: React 19.2.4
- **Routing**: React Router DOM 7.13.2
- **Styling**: Tailwind CSS 4.2.2 + @tailwindcss/vite
- **Build Tool**: Vite 8.0.1
- **Chrome Extension Plugin**: @crxjs/vite-plugin 2.4.0
- **Linting**: ESLint 9.39.4 + TypeScript ESLint 8.57.0
- **Type Definitions**: @types/chrome 0.1.39, @types/react 19.2.14

### Backend
- **Runtime**: Node.js (CommonJS module system)
- **Framework**: Express.js 5.2.1
- **Middleware**: CORS 2.8.6
- **Authentication**: jsonwebtoken 9.0.3
- **Password Hashing**: bcryptjs 3.0.3 (and bcrypt 6.0.0)
- **Configuration**: dotenv 17.4.0
- **Development**: nodemon 3.1.14

### External Services
- **AI API**: Anthropic Claude (v1 API)
- **Storage**: Chrome Storage Sync API (cross-device sync)
- **Analytics**: Local storage analytics with cloud sync option

---

## Project Structure

```
chrome-extention/
├── frontend/
│   ├── src/
│   │   ├── background/
│   │   │   ├── aiEngine.ts          # AI suggestion generation (Claude API)
│   │   │   ├── cloudSync.ts         # Cloud sync logic (backend integration)
│   │   │   ├── snipMatcher.ts       # Fuzzy matching for snippets
│   │   │   └── index.ts             # Service worker main entry point
│   │   ├── content/
│   │   │   ├── index.ts             # Content script entry
│   │   │   ├── overLayout.ts        # UI overlay rendering
│   │   │   ├── textInserter.ts      # Insert snippet text into page
│   │   │   └── triggerDetector.ts   # Detect snippet triggers
│   │   ├── hooks/
│   │   │   ├── useHistory.ts        # Hook for history management
│   │   │   ├── useSettings.ts       # Hook for settings management
│   │   │   ├── useSnippet.ts        # Hook for snippet CRUD
│   │   │   └── useStorage.ts        # Hook for chrome.storage wrapper
│   │   ├── pages/
│   │   │   ├── AddSnippet.tsx       # Page: create/edit snippet
│   │   │   ├── History.tsx          # Page: view usage history
│   │   │   ├── Home.tsx             # Page: home/snippets list
│   │   │   └── Settings.tsx         # Page: extension settings
│   │   ├── popup/
│   │   │   ├── index.html           # Popup HTML
│   │   │   ├── main.tsx             # React entry
│   │   │   └── Popup.tsx            # Popup router component
│   │   ├── stores/
│   │   │   └── index.ts             # State management (if needed)
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript interfaces
│   │   └── index.css                # Global styles
│   ├── public/                      # Static assets
│   ├── manifest.json                # Extension manifest
│   ├── tsconfig.json                # TypeScript config
│   ├── tsconfig.app.json            # App-specific TS config
│   ├── tsconfig.node.json           # Node tools TS config
│   ├── vite.config.ts               # Vite build config
│   ├── eslint.config.js             # ESLint rules
│   └── package.json
│
├── backend/
│   ├── index.js                     # Express server entry (TBD)
│   ├── controllers/                 # Route handlers
│   ├── routes/                      # API route definitions
│   └── package.json
│
└── README.md
```

---

## Core Features

### 1. Snippet Management
- **Create/Edit/Delete**: Full CRUD operations for text snippets
- **Keyboard Shortcuts**: Trigger snippets with custom shortcut sequences (e.g., `/addr`)
- **Labels & Tags**: Organize snippets with descriptive labels and tags
- **Usage Tracking**: Automatic tracking of snippet usage count and last used date
- **Auto-Generation**: Snippets created automatically from frequently-used text patterns

**Data Model:**
```typescript
interface Snippet {
  id: string;                    // Unique identifier
  shortcut: string;              // Trigger string (e.g., "/addr")
  label: string;                 // Display name
  content: string;               // Snippet text content
  tags: string[];                // Categorization
  usageCount: number;            // Times used
  lastUsed: number | null;       // Timestamp of last usage
  createdAt: number;             // Creation timestamp
  updatedAt: number;             // Last modification timestamp
  syncedAt?: number;             // Last cloud sync timestamp
}
```

### 2. Intelligent Suggestions
- **Shortcut Matching**: Exact/prefix match on `/shortcut` patterns
- **Fuzzy Content Matching**: Find snippets by partial label/content text
- **AI Completions**: Claude API integration for context-aware suggestions
- **Ranking**: Sort results by relevance score and usage frequency
- **IDE-Style Autocomplete**: Type text → see dropdown with matching snippets → Tab to insert

**Matching Algorithm:**
1. Exact shortcut match (confidence: 1.0)
2. Prefix shortcut match (confidence: 0.85)
3. Fuzzy label/content match (confidence: 0.4-0.9 based on similarity)
4. AI-powered completions (fallback when no local matches)

### 3. Automatic Pattern Learning
- **Smart Pattern Detection**: Learns from repeatedly-typed text
- **Usage Threshold**: Suggests snippet creation after text is typed 3+ times
- **No Manual Entry**: Users don't manually create snippets—they appear as suggestions
- **Pattern Expiry**: Old patterns fade away (30-day sliding window)
- **One-Click Creation**: Convert pattern to snippet with auto-generated shortcut

**Pattern Detection Flow:**
1. User types text repeatedly on websites
2. Extension tracks text patterns in local storage
3. After 3 occurrences, pattern appears in "Quick Open" as "LEARN" suggestion
4. User clicks "Create snippet" → auto-generates shortcut & saves

**Example Pattern Learning:**
```
User types "asynchronous programming" 3 times
→ Extension suggests: "asynchronous programming" (seen 3 times)
→ User clicks → Auto-shortcut: "/ap"
→ Snippet created: /ap → "asynchronous programming"
```

### 4. Automatic Shortcut Generation
- **First-Letter Based**: "Hello World" → `/hw`
- **Consonant-Based**: "Email" → `/ml`
- **Smart Fallback**: "asynchronous" → `/asy`
- **Conflict Resolution**: Auto-appends numbers if shortcut taken (`/hw2`, `/hw3`)
- **Multiple Options**: Show 3 alternatives for user to choose from

**Generation Strategies:**
```typescript
// Strategy 1: First letters of words
"Your Company Name" → "/ycn"

// Strategy 2: Consonants (for single words)
"Programming" → "/prgrm"

// Strategy 3: Beginning characters
"asynchronous" → "/asy"

// Auto-resolve conflicts
"/hw" taken → "/hw2" → "/hw3"
```

### 5. Cloud Synchronization
- **Cross-Device Sync**: Access snippets across any device where extension is installed
- **Last-Write-Wins Merge**: Conflict resolution based on `updatedAt` timestamp
- **User Authentication**: JWT-based auth tokens for secure API access
- **Selective Sync**: Users can enable/disable cloud sync in settings

**Sync Flow:**
```
Local Change → Debounce 5000ms → Sync to Cloud
Cloud Change (another device) → Fetch on startup → Merge locally
```

### 6. Usage Analytics
- **Local Analytics**: Track every snippet expansion with context
- **History View**: Browse all expansions with timestamps and site info
- **Usage Statistics**: Total expansions, per-snippet counts, top shortcuts
- **Persistent Storage**: Keep last 500 entries in local storage

**Analytics Model:**
```typescript
interface AnalyticsEntry {
  snippetId: string;             // Which snippet was used
  usedAt: number;                // When it was used
  site: string;                  // URL of the website
  trigger: "shortcut" | "keyboard" | "ai";  // How it was triggered
}
```

### 7. Settings & Configuration
- **Global Settings**:
  - Enable/disable extension
  - AI suggestions toggle
  - Gemini API key management
  - Min characters before suggestions
  - Max suggestions to show
  - Cloud sync toggle
  - Backend URL configuration

- **Per-Site Settings** (planned):
  - Excluded sites where extension doesn't work
  - Custom exclusion patterns

---

## Data Models

### TypeScript Interfaces

```typescript
// Snippet - Core data unit
export interface Snippet {
  id: string;
  shortcut: string;
  label: string;
  content: string;
  tags: string[];
  usageCount: number;
  lastUsed: number | null;
  createdAt: number;
  updatedAt: number;
  syncedAt?: number;
}

// User - Authentication & profile
export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  token: string;  // JWT token
}

// Settings - Extension configuration
export interface Settings {
  enabled: boolean;
  aiEnabled: boolean;
  geminiApiKey: string;
  minChars: number;
  maxSuggestions: number;
  keyboardShortcut: string;
  excludedSites: string[];
  cloudSyncEnabled: boolean;
  backendUrl: string;
}

// AnalyticsEntry - Usage tracking
export interface AnalyticsEntry {
  snippetId: string;
  usedAt: number;
  site: string;
  trigger: "shortcut" | "keyboard" | "ai";
}

// AISuggestion - Suggestion result
export interface AISuggestion {
  text: string;
  confidence: number;
  source: "history" | "ai";
}

// Messages - Content script ↔ Background worker communication
export type MessageType =
  | { type: "GET_SUGGESTIONS"; prefix: string; context: string }
  | { type: "INSERT_SNIPPET"; snippetId: string; trigger: string }
  | { type: "RECORD_USAGE"; snippetId: string; site: string; trigger: string }
  | { type: "SYNC_TO_CLOUD" }
  | { type: "GET_SETTINGS" }
  | { type: "OPEN_POPUP" };
```

### Storage Schema

**Chrome Storage (Sync)**
- `settings` - User preferences
- `snippets` - Array of Snippet objects
- `user` - Current user object (if logged in)

**Chrome Storage (Local)**
- `analytics` - Array of last 500 AnalyticsEntry objects

---

## Backend API

### Base URL
```
http://localhost:4000  (configurable in settings)
```

### Authentication
All requests (except login/signup) require:
```
Authorization: Bearer <JWT_TOKEN>
```

### Endpoints

#### Auth
```
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
```

#### Snippets
```
GET    /api/snippets              # Fetch all user snippets
GET    /api/snippets/:id          # Get single snippet
POST   /api/snippets              # Create snippet
PUT    /api/snippets/:id          # Update snippet
DELETE /api/snippets/:id          # Delete snippet
POST   /api/snippets/sync         # Sync snippets with cloud
```

#### Analytics
```
POST   /api/analytics/track       # Record snippet usage
GET    /api/analytics/history     # Get usage history
GET    /api/analytics/stats       # Get statistics
```

### Request/Response Format

**Create Snippet (POST /api/snippets)**
```json
{
  "shortcut": "/addr",
  "label": "Address Template",
  "content": "123 Main St, City, State 12345",
  "tags": ["contact", "personal"]
}
```

**Sync Request (POST /api/snippets/sync)**
```json
{
  "snippets": [
    { "id": "1", "shortcut": "/addr", ... },
    { "id": "2", "shortcut": "/phone", ... }
  ]
}
```

---

## Frontend Architecture

### Component Hierarchy

```
Popup.tsx (Router)
├── Home.tsx
│   └── Snippet list with add/edit actions
├── AddSnippet.tsx
│   └── Form to create/edit snippets
├── History.tsx
│   └── Formatted timeline of expansions
│       └── Statistics display
└── Settings.tsx
    └── Configuration form with cloud sync toggle
```

### Key React Hooks

#### useStorage
Wraps `chrome.storage.sync` as React state with auto-sync across tabs.

```typescript
const [snippets, setSnippets, loading] = useStorage<Snippet[]>("snippets", []);
```

#### useSnippet
Full CRUD operations for snippets with automatic persistence.

```typescript
const { snippets, add, update, delete: remove, loading } = useSnippet();
```

#### useHistory
Read-only access to analytics history with statistics.

```typescript
const { history, stats, loading, clearHistory, removeEntry } = useHistory();
```

#### useSettings
Settings management with preset defaults and validation.

```typescript
const { settings, update, reset, loading } = useSettings();
```

### State Management

- **Local Component State**: React `useState` for transient UI state
- **Chrome Storage**: `chrome.storage.sync` for persistent, cross-tab state
- **Message Passing**: `chrome.runtime.sendMessage` for background worker communication

No external state management library (Redux/Zustand) needed currently due to Chrome Storage API providing cross-tab sync.

---

## Chrome Extension Components

### Manifest (manifest.json)
- **Permissions**: `storage`, `tabs`, `scripting`, `messages`
- **Content Scripts**: Injected into all web pages to detect triggers
- **Background Service Worker**: Handles message passing and API calls
- **Action Popup**: Extension popup UI (470px wide, flexible height)
- **Icons**: Multiple sizes for toolbar display

### New Components for Auto-Snippet Creation

#### Pattern Detector (`background/patternDetector.ts`)
**Purpose**: Learn from user typing patterns and suggest snippet creation

**Key Functions:**
- `recordPattern(text)` - Track text user types
- `getPatterns()` - Retrieve patterns from storage
- `getSuggestionPatterns()` - Get patterns ready for snippets (3+ occurrences)
- `removePattern(text)` - Remove pattern from suggestions

**Storage Structure:**
```typescript
// chrome.storage.local
{
  patterns: {
    "hello world": {
      text: "hello world",
      count: 5,
      lastSeen: 1712145600000,
      suggestedShortcut: "/hw"
    },
    // ... more patterns
  }
}
```

#### Shortcut Generator (`background/shortcutGenerator.ts`)
**Purpose**: Auto-generate meaningful shortcuts from text content

**Key Functions:**
- `generateShortcut(text)` - Generate single shortcut (e.g., "/hw")
- `generateUniqueShortcut(text)` - Auto-resolve conflicts ("/hw2", "/hw3")
- `suggestShortcuts(text)` - Return 3 alternative shortcuts for user choice
- `checkShortcutAvailable(shortcut)` - Check if shortcut is taken

**Algorithm:**
1. Try first letters of words
2. Try consonants (skip vowels) for word compression
3. Try beginning characters for long words
4. Append numbers to resolve conflicts

#### Quick-Open Component (`components/QuickOpen.tsx`)
**Purpose**: IDE-style Cmd+K / Ctrl+Shift+P command palette

**Features:**
- Search snippets by shortcut, label, or content
- Show "LEARN" suggestions for patterns awaiting creation
- Keyboard navigation (arrows, Enter, Escape)
- Click to select or see pattern details
- One-click snippet creation from patterns

**Keyboard Shortcuts:**
- `Ctrl+Shift+P` / `Cmd+Shift+P` - Open quick-open
- `↑` / `↓` - Navigate results
- `Enter` - Select item or create snippet
- `Esc` - Close

### Content Script

**Purpose**: Detect when user is typing snippet triggers and show suggestions.

**Responsibilities**:
1. Monitor user input in all text fields (`<input>`, `<textarea>`, `contenteditable`)
2. Detect `/shortcut` patterns and contextual cues
3. Request suggestions from background worker
4. Track text patterns for learning
5. Render overlay UI with suggestions
6. Insert selected snippet into page
7. Track usage (trigger type, site, timestamp)

**Key Files**:
- `content/triggerDetector.ts` - Detects when to request suggestions + tracks patterns
- `content/overLayout.ts` - Renders suggestion overlay UI
- `content/textInserter.ts` - Inserts text into active element
- `content/index.ts` - Content script entry point

**Updated Pattern Tracking:**
- On Enter key: Records full line as potential pattern
- On space key: Records individual words as patterns
- Background worker dedupes and aggregates

### Background Service Worker

**Purpose**: Central hub for processing, API calls, and storage management.

**Responsibilities**:
1. Receive messages from content script and popup
2. Query local snippets via `chrome.storage.sync.get`
3. Match user input against snippets (exact, prefix, fuzzy)
4. Call Claude API for AI suggestions
5. Detect and process text patterns
6. Generate shortcuts automatically
7. Create snippets from patterns
8. Handle cloud sync (upload/download from backend)
9. Aggregate analytics data
10. Manage user authentication state

**Key Files**:
- `background/index.ts` - Main logic and message handlers
- `background/snipMatcher.ts` - Fuzzy matching algorithm
- `background/aiEngine.ts` - Claude API integration
- `background/cloudSync.ts` - Cloud sync logic
- `background/patternDetector.ts` - Pattern learning
- `background/shortcutGenerator.ts` - Auto-shortcut creation

**New Message Types:**
```typescript
{ type: "RECORD_TEXT"; text: string }
{ type: "GET_PATTERNS" }
{ type: "CREATE_SNIPPET_FROM_PATTERN"; pattern: string }
{ type: "SUGGEST_SHORTCUT"; text: string }
```

### Popup UI

**Purpose**: Provide UI for snippet management and settings.

**Pages**:
1. **Home** - List all snippets, add new, search
2. **AddSnippet** - Create/edit snippet form
3. **History** - View past expansions with stats
4. **Settings** - Configure extension behavior
5. **QuickOpen** - Global search & pattern suggestions (Cmd+K)

**Entry Point**:
- `popup/index.html` - Contains `<div id="root">`
- `popup/main.tsx` - React root with router
- `popup/Popup.tsx` - Router component defining routes + QuickOpen

---

## Setup & Installation

### Prerequisites
- Node.js 18+ and npm
- Chrome browser (or Chromium-based)

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Development server
npm run dev

# Build extension
npm run build

# Lint code
npm run lint
```

**Loading in Chrome**:
1. Open `chrome://extensions`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select `frontend/dist` folder

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=4000
DATABASE_URL=<your-database-url>
JWT_SECRET=<your-jwt-secret>
FORWARD_AUTH_TOKEN=<your-forward-auth-token>
EOF

# Development server (with auto-reload)
nodemon index.js

# or regular start
node index.js
```

### Environment Variables

**Backend (.env)**
```
PORT=4000
DATABASE_URL=postgresql://...  # If using DB
JWT_SECRET=your-secret-key-min-32-chars
NODE_ENV=development
```

**Frontend (built-in)**
- Claude API key: Set in extension settings (never in code)
- Backend URL: Configurable in extension settings (default: http://localhost:4000)

---

## Development Workflow

### Project Commands

**Frontend**
```bash
npm run dev        # Start dev server with hot reload
npm run build      # Build for production
npm run lint       # Check code style
npm run preview    # Preview production build
```

**Backend**
```bash
npm install        # Install dependencies
node index.js      # Start server
npm run test       # Run tests (not yet implemented)
```

### Code Structure Best Practices

1. **Type Safety**: All code uses TypeScript with strict mode enabled
2. **Component Composition**: Break UI into small, reusable components
3. **Custom Hooks**: Extract logic into hooks for reusability
4. **Message Types**: Define all Chrome message types in `types/index.ts`
5. **Error Handling**: Always wrap API calls with try/catch
6. **Async/Await**: Prefer async/await over `.then()` chains

### ESLint Configuration

```js
// eslint.config.js enforces:
- No unused variables
- No unused parameters
- Proper React hook usage (purity, dependencies)
- TypeScript best practices
```

Run before committing:
```bash
npm run lint
```

### Debugging

**Content Script**:
- Open DevTools on any website (F12)
- Go to "Sources" tab
- Find snippet content in left sidebar
- Set breakpoints and inspect variables

**Background Worker**:
- Open `chrome://extensions`
- Find Snippet Extension
- Click "Background page" link
- Inspect console, network, storage tabs

**Popup**:
- Right-click extension icon → "Inspect popup"
- Normal DevTools debugging

---

## Deployment

### Frontend Deployment

1. **Build the extension**
   ```bash
   cd frontend
   npm run build
   ```

2. **Package for Chrome Web Store**
   ```bash
   # Create .crx file (signed)
   # See: https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world/
   ```

3. **Submit to Chrome Web Store**
   - Create developer account
   - Upload `.zip` of `dist/` folder
   - Add store metadata (icons, description, screenshots)

### Backend Deployment

1. **Environment Setup**
   - Deploy to hosting (Heroku, Railway, AWS, etc.)
   - Set environment variables (JWT_SECRET, DATABASE_URL)
   - Ensure HTTPS is enabled

2. **Database Migration**
   - Run migrations (using pending ORM setup)
   - Seed initial data if needed

3. **API Security**
   - Enable CORS only for extension origin
   - Validate JWT tokens
   - Rate limiting on endpoints

### Post-Deploy Checklist
- [ ] Extension connects to production backend
- [ ] Cloud sync works across devices
- [ ] Analytics persists and syncs
- [ ] No console errors in extension
- [ ] Settings page shows correct backend URL
- [ ] Snippets load correctly on first sync

---

## Security Considerations

### Chrome Storage
- **Sync Storage**: Syncs user's Google account (encrypted in transit)
- **Local Storage**: Stays on device, not synced
- **Sensitive Data**: Store API keys only in settings, never in code

### API Communication
- **HTTPS Only**: All backend requests must use HTTPS
- **JWT Tokens**: Short-lived tokens with refresh mechanism
- **CORS**: Restrict to extension origin only
- **Rate Limiting**: Implement to prevent abuse

### AI API Security
- **API Key**: Never committed to repository
- **Anthropic**: Uses HTTPS, secure headers on all requests
- **Prompt Injection**: Validate user input before sending to AI

### Best Practices
1. Never log sensitive data (tokens, API keys)
2. Always validate backend responses
3. Use TypeScript strict mode (enables by default)
4. Review ESLint warnings before committing
5. Keep dependencies up-to-date with `npm audit`
6. Implement HTTPS on all API endpoints
7. Rotate JWT secrets regularly
8. Monitor analytics for unusual patterns

---

## Future Enhancements

### Planned Features
1. **Database Integration**: Replace placeholder backend with real database
2. **User Accounts**: Full authentication system with email verification
3. **Team Snippets**: Share snippet libraries within teams
4. **Snippet Versioning**: Track changes and restore previous versions
5. **Advanced Analytics**: Dashboard with usage insights and trends
6. **Custom Themes**: Dark mode and custom color schemes
7. **Keyboard Shortcuts**: Global hotkeys for Quick open
8. **Power User Features**: Bulk import/export, macros, templates

### Architecture Improvements
1. **State Management**: Consider Zustand for complex state
2. **Database ORM**: Prisma or TypeORM for backend
3. **API Documentation**: Swagger/OpenAPI specification
4. **Testing**: Unit tests and E2E tests with Playwright
5. **Logging**: Server-side logging with structured logs
6. **Monitoring**: Error tracking with Sentry or similar

---

## Troubleshooting

### Extension not detecting triggers
- Check that content script has access to the site (not blocked by CSP)
- Verify trigger pattern matches shortcut exactly
- Check "Excluded sites" in settings

### Cloud sync not working
- Verify backend URL in settings
- Check network requests in DevTools
- Ensure JWT token is still valid
- Check browser console for error messages

### AI suggestions not appearing
- Verify Gemini API key in settings
- Check API quota/billing
- Ensure AI is enabled in settings
- Review background worker console for errors

### Suggestions showing "[object Object]"
- Type definition mismatch for AISuggestion
- Check that `source` field is strictly "history" or "ai"
- Verify fuzzy matching returns proper format

---

## References

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/api/storage/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [Express.js Guide](https://expressjs.com/)
- [Anthropic Claude API](https://docs.anthropic.com/)

---

## Contact & Support

For issues, feature requests, or contributions:
- GitHub Issues: [project-repo]/issues
- Documentation: See README.md files in each folder
- Email: [contact information]

