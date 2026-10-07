# Notion-Style Slash Commands (`/`) Specification & Implementation Plan ⚡

This specification details the architecture, design, and step-by-step implementation plan for adding **Notion/Linear-style Slash Commands (`/`)** to CoWrite using TipTap's native suggestion engine.

---

## 🎯 User Experience & Goals
1. **Trigger**: When a user types `/` in an empty line or at the beginning of a word, a sleek floating command palette appears directly beneath the cursor.
2. **Filtering**: As the user types (e.g. `/h1`, `/bullet`, `/ai`), the list instantly fuzzy-filters down to matching commands.
3. **Keyboard First**: 
   - `ArrowDown` & `ArrowUp` to navigate items.
   - `Enter` to execute and insert.
   - `Escape` or Backspace to dismiss.
4. **Seamless Collaboration (Yjs Safe)**:
   - Command triggers are purely local UI interactions and do not pollute CRDT transaction history until the user explicitly executes a command.

---

## 🧩 Architectural Design

```
User types "/"
      │
      ▼
[SlashCommand Extension] (@tiptap/suggestion)
      │
      ├──> Triggers TiTi Suggestion Plugin
      │
      ├──> Computes caret screen coordinates (DOMRect)
      │
      ├──> Renders [SlashCommandList.jsx] into a Floating Portal
      │
      └──> User selects item:
             1. Deletes "/" query range
             2. Executes TipTap command (e.g., setHeading, bulletList, callAI)
```

---

## 📋 Command Palette Item Catalog

### 1. Basic Text & Headings
- **Text / Paragraph**: Switch to normal body text.
- **Heading 1**: Large document section header (`/h1`, `/heading 1`).
- **Heading 2**: Medium section subheader (`/h2`, `/heading 2`).
- **Heading 3**: Small subsection header (`/h3`, `/heading 3`).

### 2. Lists & Organization
- **Bullet List**: Standard unordered bulleted list (`/bullet`, `/ul`).
- **Numbered List**: Sequential numbered list (`/numbered`, `/ol`).
- **Task List (Checklist)**: Interactive checkbox list (`/todo`, `/check`, `/task`).
- **Blockquote**: Stylized quote block (`/quote`, `/blockquote`).
- **Horizontal Rule (Divider)**: Clean line separator (`/divider`, `/hr`, `/line`).

### 3. Rich Media & Code
- **Code Block**: Monospace code container with syntax formatting (`/code`).
- **Table**: 3x3 interactive editable grid (`/table`).

### 4. Groq AI Commands & Interactive Preview Bubble
- **Scoping Rule (Upstream Context)**:
  - If text is actively highlighted → operates specifically on the highlighted text.
  - If triggered via `/` on a line with no active selection → automatically collects **all the text in the document above the cursor position** (`editor.state.doc.textBetween(0, from, '\n\n')`). This allows users to write naturally, hit Enter, type `/summarize`, `/improve`, or `/grammar`, and have the AI process everything written so far.

- **Interactive Preview Bubble (Non-Destructive Workflow)**:
  - **No blind insertion/replacement**: AI results never silently overwrite document content.
  - Generates the result inside a floating **AI Preview Card / Bubble** right at the cursor position.
  - **User Actions inside the Bubble**:
    1. **Read & Review**: Read the formatted output directly in the floating popover.
    2. **✓ Insert / Accept**:
       - For `/summarize` & `/ai`: Inserts the output directly at the cursor.
       - For `/improve` & `/grammar`: Replaces the targeted upstream text or selection with the improved version.
    3. **✕ Discard / Close**: Closes the bubble without touching the document.
    4. **🔄 Retry / Regenerate**: Reruns the Groq prompt with one click.

---

## 🎨 UI & Visual Aesthetics
- **Floating Popover**: Max height 320px with custom scrollbar, `backdrop-blur-md`, soft shadow (`shadow-2xl`), and rounded-xl card (`rounded-xl border border-gray-200/90`).
- **Item Layout**: Icon (tinted blue/gray) + Bold Command Title + Subtle Gray Hint/Description (e.g., "Heading 1 — Large section heading").
- **Hover & Active State**: Fluid background transition (`bg-blue-50/80` with dark text) when arrow keys or mouse hover over items.
- **Category Headers**: Subtle uppercase labels (`TEXT BLOCKS`, `LISTS`, `AI TOOLS`).

---

## 🛠️ Step-by-Step Implementation Steps

### Step 1: Install Required Dependencies
- `@tiptap/suggestion` (TipTap's official autocomplete & slash command engine)
- `tippy.js` (or lightweight headless portal positioning for reliable anchor tracking)

### Step 2: Create `SlashCommand.js` (TipTap Extension)
- Defines the trigger character `/`.
- Connects suggestion items and search filtering.
- Implements render lifecycle (`onStart`, `onUpdate`, `onKeyDown`, `onExit`).

### Step 3: Build `SlashCommandList.jsx` (React UI Component)
- Renders the interactive command items.
- Handles keyboard navigation (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`).
- Grouping by category (Basic, Lists, AI).

### Step 4: Register Extension in `Editor.jsx`
- Add `SlashCommand` to the `extensions` array alongside existing collaboration extensions.

### Step 5: Test & Validate
- Test keyboard navigation, fuzzy search, insertion, and real-time collaboration safety across multiple browsers.
