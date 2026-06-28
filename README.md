# CoWrite ✍️🚀

**CoWrite** is a real-time collaborative document editor built to enhance team productivity with seamless editing, live cursors, threaded comments, AI-powered writing assistance, and secure document sharing.

---

## 🔥 Features

### ✏️ Rich Text Editing
- Full rich text editor powered by **TipTap (ProseMirror)**
- Bold, Italic, Underline, Strikethrough
- Headings (H1–H6), font size & family selectors
- Text alignment (Left, Center, Right, Justify)
- Text color with color picker
- Undo / Redo

### 🔁 Real-Time Collaboration
- Multi-user simultaneous editing powered by **Yjs + WebSocket**
- **Named live cursors** — each collaborator's cursor shows their name and a unique color (Google Docs style), fading out after inactivity
- Live user presence avatars in the top bar with hover tooltips
- Invite collaborators by email from inside the editor

### 💬 Google Docs-Style Comments
- Select any text and add a comment from the formatting bubble menu
- Comments appear in the **right margin** aligned to the selected text
- Threaded replies on each comment
- Resolve comments with a ✓ tick — yellow highlight is **immediately** removed without requiring a page reload
- `Enter` to post, `Shift+Enter` for a new line inside the comment box

### 🧠 AI Writing Tools (Google Gemini)
- Summarize Document
- Bullet Point Summary
- Improve Writing
- Grammar Check
- Professional Tone
- Format Document
- Custom AI Prompt
- **Ask Document** — ask questions about the content

### 📁 Document Dashboard
- Create, rename, and delete documents
- **Smart deletion modals:**
  - If you are the **owner** → warns that all collaborators will lose access
  - If you are a **collaborator** → warns that your access will be revoked and removes you from the doc (owner's copy is unaffected)
- Shared documents appear clearly in your dashboard

### 📤 Export & Share
- **Download as PDF** — generates a clean, styled PDF in the browser (no server required)
- **Public View Link** — owners can toggle a public link; anyone with the link can view a **read-only, static snapshot** of the document without logging in
- Both options live in a single **Export dropdown** in the editor toolbar

### 🔐 Security
- JWT-based auth with **HttpOnly cookies**
- Public document endpoint (`/api/documents/public/:id`) requires `isPublic: true` — hard `403` for private docs
- Public viewer is fully stripped of Yjs/WebSocket — physically cannot edit or connect to the live editing session
- Only the document **owner** can toggle public access or change `isPublic`

### 🔒 Authentication
- Email/password Signup & Login
- Google OAuth integration
- Protected routes — unauthenticated users are redirected to login

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, TipTap, Vite, CSS |
| **Backend** | Node.js, Express, MongoDB (Mongoose) |
| **Collaboration** | Yjs + y-websocket + y-mongodb-provider |
| **AI** | Google Gemini API |
| **Auth** | JWT + HttpOnly Cookies, Google OAuth |
| **PDF Export** | html2pdf.js (client-side) |

---

## 📁 Project Structure

```
CoWrite/
├── Client/          # React frontend (Vite)
│   └── src/
│       ├── Pages/         # Editor, Dashboard, Login, Signup, PublicEditor
│       ├── Components/    # CollaboratorBar, EditorToolbar, CommentPanel, ...
│       ├── Extensions/    # TipTap custom extensions (CommentExtension, FontStyle, AIExtension)
│       └── Context/       # Auth context
├── Server/          # Express REST API
│   ├── Controllers/       # Document & Auth controllers
│   ├── Models/            # Mongoose schemas (User, Document)
│   ├── Routes/            # API routes
│   └── Middlewares/       # JWT auth middleware
└── yjs-server/      # Dedicated Yjs WebSocket server with MongoDB persistence
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas URI (or local MongoDB)

### 1. Clone the repo
```bash
git clone https://github.com/your-username/CoWrite.git
cd CoWrite
```

### 2. Server setup
```bash
cd Server
npm install
```
Create `Server/.env`:
```env
DB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
PORT=8000
YJS_PORT=1234
```

### 3. Yjs WebSocket server
```bash
cd yjs-server
npm install
node yjs-server.js
```

### 4. Client setup
```bash
cd Client
npm install
```
Create `Client/.env`:
```env
VITE_URL=http://localhost:8000
VITE_WEBSOCKET_URL=ws://localhost:1234
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 5. Start everything
```bash
# Terminal 1 - Backend
cd Server && node server.js

# Terminal 2 - Yjs server
cd yjs-server && node yjs-server.js

# Terminal 3 - Frontend
cd Client && npm run dev
```

---

## 📌 API Endpoints

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/google-signup` | Google OAuth |
| GET | `/api/auth/me` | Get current user |

### Documents
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/documents` | ✅ | List all documents for user |
| POST | `/api/documents` | ✅ | Create new document |
| GET | `/api/documents/:id` | ✅ | Get document (owner/collaborator only) |
| PUT | `/api/documents/:id` | ✅ | Update title / content / isPublic |
| DELETE | `/api/documents/:id` | ✅ Owner only | Delete document |
| DELETE | `/api/documents/:id/leave` | ✅ Collaborator | Remove self from collaborators |
| POST | `/api/documents/:id/collaborators` | ✅ Owner only | Add collaborator by email |
| GET | `/api/documents/public/:id` | ❌ No auth | View public document (read-only, sanitized) |

---

## 📝 How to Use

| Action | How |
|---|---|
| **Create a doc** | Dashboard → "+ New Document" |
| **Invite collaborator** | Open doc → type email in the top bar → "Add" |
| **Leave a shared doc** | Dashboard → ⋮ menu → Delete (you'll be prompted) |
| **Add a comment** | Select text → click 💬 in the bubble menu |
| **Resolve a comment** | Click the ✓ on the comment thread |
| **Download PDF** | Editor → "Export ↓" → "Download as PDF" |
| **Share public link** | Editor → "Export ↓" → toggle "Public View Link" → Copy |
| **AI tools** | Editor → "✨ AI Tools" dropdown |

---

## 🌐 Live Links

| Service | URL |
|---|---|
| **Frontend (Netlify)** | https://krishan-cowrite.netlify.app |
| **Backend (Render)** | https://cowrite-x48q.onrender.com |

> **Note:** The backend is hosted on Render's free tier and may take 30–60s to wake up from a cold start. Consider setting up [UptimeRobot](https://uptimerobot.com) to ping it every 5 minutes to keep it warm.

---

## 🚧 Work in Progress
This project is actively being developed. Contributions and ideas are welcome!

Feel free to fork, star ⭐, and contribute!