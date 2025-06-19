# CoWrite ✍️🚀

**CoWrite** is a real-time collaborative document editor, built to enhance team productivity with seamless editing, live cursors, comments, and AI-powered writing assistance.

## 🔥 Features
- 📝 Rich text editing using TipTap (ProseMirror)
- 🔁 Real-time multi-user collaboration powered by Yjs
- 📁 Document dashboard (create, rename, delete)
- 💾 Auto-save functionality
- 👥 Live cursors and user presence
- 💬 Threaded comment system (like Google Docs)
- 🧠 AI-enhanced tools (rewrite, grammar fix, summarize)

## 🛠️ Tech Stack
- **Frontend:** React, TipTap, Tailwind CSS
- **Backend:** Node.js, Express, MongoDB
- **Collaboration:** Yjs + WebRTC or WebSocket provider
- **AI Integration:** OpenAI API (GPT)
- **Auth:** JWT-based authentication

## 📌 MVP Goals
- Authentication (signup, login, logout)
- Document CRUD with auto-save
- Real-time collaboration (text, cursors)
- Commenting system
- AI-powered writing assistant

# CoWrite - Day 1 Tasks

## ✅ Day 1 Progress

### 1. Project Setup
- Initialized the CoWrite project structure for both client and server.
- Installed required dependencies for backend (Express, Mongoose, dotenv, cors, cookie-parser, etc.).
- Installed required dependencies for frontend (React, react-router-dom, @react-oauth/google, etc.).

### 2. Environment Configuration
- Created `.env` files for both client and server.
- Set up environment variables for database URI, JWT secret, Google Client ID, and frontend URL.

### 3. Basic Authentication Endpoints
- Implemented backend routes for:
  - `/api/auth/signup`
  - `/api/auth/login`
  - `/api/auth/google-signup`
  - `/api/auth/me` (protected route)
- Added JWT-based authentication with HttpOnly cookies.
- Added CORS configuration for cross-origin requests.

### 4. Frontend Pages
- Created Signup and Login pages with forms and Google authentication.
- Implemented protected Dashboard page.

### 5. Route Protection
- Added a `PrivateRoute` component to protect the Dashboard route.
- Verified that only authenticated users can access the Dashboard.

### 6. Google OAuth Integration
- Integrated Google OAuth using `@react-oauth/google`.
- Handled Google signup and login on both frontend and backend.

**End of Day 1**

---

## ✅ Day 2 Progress

### 1. Document Dashboard
- Created a document dashboard page to list all user documents.
- Added functionality to create, rename, and delete documents from the dashboard.
- Enabled navigation from the dashboard to the editor for any document.

### 2. Editor Integration
- Integrated the rich text editor()tip-tap into the main application flow.
- Connected the editor to the backend for loading and saving documents.
- Ensured seamless transition between the dashboard and the editor.

### 3. Basic text decoration functionality
- Implemented the functionality for bold, italic, strikethrough by using tip-tap's inbuilt extension.

### 4. Font Size and Font Family Functionality
- Implemented a custom `FontStyle` mark extension to support inline font size and font family changes.
- Added font size and font family dropdowns to the editor toolbar.
- Ensured font size and font family can be applied to any selection, including inside headings and paragraphs.

### 5. Autosave Feature
- Implemented autosave functionality to save the editor content to the backend every 3 seconds.
- Used `setInterval` within a React `useEffect` to trigger the save operation.
- Ensured autosave does not interfere with manual save operations.

### 6. Heading Functionality
- Verified and fixed heading support using the default TipTap `Heading` extension.
- Ensured selecting a heading from the toolbar correctly changes the block type and displays the appropriate HTML (`<h1>`, `<h2>`, etc.).
- Confirmed compatibility of headings with font size and font family marks.

---

## 📝 How to Use

- **Font Size/Family:** Select text and choose a font size or family from the toolbar to apply the style.
- **Headings:** Use the dropdown to switch between normal text and headings (H1–H6).
- **Autosave:** The editor automatically saves your work every 3 seconds.
- **Manual Save:** Click the "Save" button to save and return to the dashboard.
- **Dashboard:** View, create, rename, and delete your documents from the dashboard. Click any document to open it in the editor.

**End of Day 2**

---

## 🚧 Work in Progress
This project is actively being developed. Contributions and ideas are welcome!

---
**Netlify**:- https://krishan-cowrite.netlify.app  
**Render**:- https://cowrite-x48q.onrender.com

Stay tuned for updates, and feel free to fork, star ⭐, or contribute!
