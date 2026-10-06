# CoWrite ✍️🚀

**CoWrite** is a real-time collaborative document editor built to enhance team productivity with seamless editing, live cursors, threaded comments, AI-powered writing assistance, Notion-style slash commands, interactive document copilot, and secure document sharing.

---

## 🔥 Features

### ✏️ Rich Text & Modern Block Editing
- Full rich text editor powered by **TipTap (ProseMirror)**
- Bold, Italic, Underline, Strikethrough, Code Blocks, Blockquotes, Horizontal Dividers
- Headings (H1–H6), font size & family selectors
- Text alignment (Left, Center, Right, Justify)
- Custom text color & color picker palette
- Undo / Redo history management

### ⚡ Notion-Style Slash Commands (`/`)
- Type `/` anywhere to summon a floating command palette with keyboard navigation (`↑`/`↓` and `Enter`)
- Instant commands: Heading 1–3, Bullet List, Numbered List, Blockquote, Code Block, Divider, and AI actions
- **Customizable Order with Drag-and-Drop (`⋮⋮`)**: Reorder slash commands to match your personal workflow. Custom orders are persisted across sessions in `localStorage`.

### 🤖 VS Code Copilot-Style "Doc Copilot" Side Panel
- Dedicated collapsible AI assistant panel docked on the right side of the screen
- **Draggable gutter handle**: Resize the sidebar dynamically with responsive layout adaptations
- **Multi-line expandable query bar**: Auto-growing prompt input with `Enter` (submit) and `Shift+Enter` (new line)
- **Instant Query Pills**: One-click execution for common questions (Summary, Key Points, Critique & Improvements)
- **Smart Contextual Actions**:
  - **Insert into doc**: Appends formatted AI responses directly into the document.
  - **Apply corrections to doc**: For critiques or improvement suggestions, CoWrite extracts and applies only the required corrections directly to the text rather than pasting meta-commentary.

### 👥 Unified Top Navigation & Team Collaboration
- **Unified Single Bar UX**: Clean, distraction-free header following Google Docs / Notion / Figma patterns
- **Live User Presence**: Colored avatars showing active collaborators viewing or editing with live hover tooltips
- **Sleek Share Modal**: Integrated "Share" button opening an invite popover to invite teammates by email and manage current member roles (`Owner` vs `Editor`)
- **Multi-user simultaneous editing** powered by **Yjs + WebSocket**
- **Named live cursors** — each collaborator's cursor displays their name with smooth animation and automatic inactivity fading

### 💬 Google Docs-Style Comments
- Select any text and add a comment from the floating formatting bubble menu
- Aligned comment threads in the right margin
- Multi-reply threading
- Immediate resolve with a ✓ tick — highlight is cleared instantly without page refresh
- Shortcuts: `Enter` to post, `Shift+Enter` for a newline

### 🧠 In-Document AI Writing Tools (Groq / Gemini)
- Summarize Document
- Bullet Point Summary
- Improve Writing & Professional Tone
- Grammar & Spelling Check
- Format Document
- Custom AI Prompt Execution
- Visual diff highlights (green additions / red deletions) with an **Accept / Reject** review bubble

### 📁 Document Dashboard
- Create, rename, and manage personal and shared documents
- **Smart deletion modals:**
  - **Owner**: Warns that collaborators will lose access
  - **Collaborator**: Allows leaving the document without deleting the owner's copy

### 📤 Export & Sharing
- **Download as PDF**: Client-side styled PDF generation via `html2pdf.js`
- **Public View Link**: Document owners can enable a read-only, sanitized public link for viewers without requiring authentication

### 🔐 Security & Auth
- JWT-based authentication with **HttpOnly cookies**
- Google OAuth login & signup
- Protected REST API endpoints
- Static read-only snapshot mode for public viewers completely detached from live WebSocket sync

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, TipTap (ProseMirror), Vite, TailwindCSS |
| **Backend** | Node.js, Express, MongoDB (Mongoose) |
| **Collaboration** | Yjs + y-websocket + y-mongodb-provider |
| **AI** | Groq API / Google Gemini |
| **Auth** | JWT + HttpOnly Cookies, Google OAuth |
| **PDF Export** | html2pdf.js |

---

## 📁 Project Structure

```
CoWrite/
├── Client/                      # React frontend (Vite + TailwindCSS)
│   └── src/
│       ├── Pages/               # Editor, Dashboard, Login, Signup, PublicEditor
│       ├── Components/          # AskDocSidebar, SlashCommandList, AIPreviewBubble, CommentPanel, ...
│       ├── Extensions/          # SlashCommands, SmoothCursor, EditorShortcuts, CommentExtension, ...
│       └── Context/             # AuthContext
├── Server/                      # Express REST API & Yjs WebSocket server
│   ├── Controllers/             # Document, Auth & AI controllers
│   ├── Models/                  # Mongoose schemas (User, Document)
│   ├── Routes/                  # Express routes
│   ├── Middlewares/             # JWT auth middleware
│   └── Config/                  # Yjs & database configuration
└── yjs-server/                  # Dedicated Yjs WebSocket server instance
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas URI (or local MongoDB)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/CoWrite.git
cd CoWrite
```

### 2. Backend Setup
```bash
cd Server
npm install
npm start
```
Create `Server/.env`:
```env
DB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
PORT=3000
GROQ_API_KEY=your_groq_api_key
```

### 3. Frontend Setup
```bash
cd ../Client
npm install
npm run dev
```
Create `Client/.env`:
```env
VITE_URL=http://localhost:3000
VITE_WEBSOCKET_URL=ws://localhost:3000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 4. Running Locally
```bash
# Terminal 1 - Backend (REST API + Yjs WebSocket)
cd Server && npm start

# Terminal 2 - Frontend
cd Client && npm run dev
```

---

## 📌 API Endpoints

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register new account |
| POST | `/api/auth/login` | Email/password login |
| POST | `/api/auth/google-signup` | Google OAuth authentication |
| GET | `/api/auth/me` | Fetch active session |

### Documents
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/documents` | ✅ | List user's documents |
| POST | `/api/documents` | ✅ | Create new document |
| GET | `/api/documents/:id` | ✅ | Get document details |
| PUT | `/api/documents/:id` | ✅ | Update title, content, or visibility |
| DELETE | `/api/documents/:id` | ✅ Owner | Delete document |
| DELETE | `/api/documents/:id/leave` | ✅ Collab | Leave shared document |
| POST | `/api/documents/:id/collaborators` | ✅ Owner | Add collaborator by email |
| GET | `/api/documents/public/:id` | ❌ | Read-only public preview |

### AI
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/ai/transform` | ✅ | Execute writing transformation / critique / corrections |
| POST | `/api/ai/ask` | ✅ | Ask document assistant queries |

---

## 📝 How to Use

| Action | How |
|---|---|
| **Slash Commands** | Type `/` on any line to open the command palette (`↑`/`↓` to navigate, drag `⋮⋮` to reorder) |
| **Doc Copilot** | Click **Doc Copilot** in the top bar to open the resizable AI assistant sidebar |
| **Share Document** | Click **Share** in the top bar to invite teammates or manage access |
| **Comments** | Select text → click 💬 in bubble menu → write & post |
| **AI In-line Fixes** | Highlight text → select an AI action → review diff highlights → Accept/Reject |
| **Export as PDF** | Click **Export** in the top bar → "Download as PDF" |
| **Public Link** | Click **Export** → toggle "Public View Link" → copy URL |

---

## 🌐 Live Deployment

| Service | URL |
|---|---|
| **Frontend** | https://krishan-cowrite.netlify.app |
| **Backend** | https://cowrite-x48q.onrender.com |

---

## 🤝 Contributing
Contributions, feedback, and feature requests are welcome! Feel free to fork the repository and open a pull request. ⭐