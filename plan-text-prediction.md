# Plan: Smart AI Text Prediction & Ghostwriting ("Smart Compose") 🔮✨

This implementation plan details the architecture and step-by-step roadmap to build an inline, low-latency **AI Text Prediction & Ghostwriting engine** into **CoWrite** (similar to **GitHub Copilot, Gmail Smart Compose, and Notion AI**).

---

## 🎯 1. Goals & User Experience (UX)

### Primary Goals:
1. **Zero Disruption / Non-Intrusive**: As the user types, a faint inline gray completion ("ghost text") appears ahead of the cursor when typing pauses briefly (debounced ~400ms).
2. **Instant Acceptance**:
   - `Tab` or `ArrowRight`: Accepts the entire suggested completion and seamlessly incorporates it into the document.
   - `Esc`: Dismisses the current suggestion.
   - Any further typing: If the user continues typing and matches the suggestion, advance the suggestion; if the user deviates or types a backspace, discard/cancel the ghost text cleanly.
3. **Ghostwriting / "Continue Writing" Trigger**:
   - Shortcut trigger (e.g. `Ctrl + Space` / `Cmd + Space` or typing `+++`) to explicitly ask AI to generate the next paragraph/sentence on demand.
4. **Yjs & Multi-User Safety**: Ghost text must be rendered **client-side only** using ProseMirror inline widget decorations so that temporary ghost text is **never** synchronized over Yjs CRDT or saved into the database until accepted.
5. **Blazing Fast Latency**: Powered by Groq's high-throughput LLaMA 3 / 8B or Mixtral models with small token completions (10–30 tokens) for sub-200ms round trips.

---

## 🏗️ 2. Architectural Design

```
+-----------------------------------------------------------------------------------+
| TipTap Editor (Client)                                                            |
|                                                                                   |
| 1. User types: "The project timeline for Q3 is..."                                |
| 2. Debounce timer (350-500ms) fires when user stops typing                        |
| 3. Extract Context: ~200 chars preceding cursor (and optional heading/title)     |
| 4. Fetch /api/ai/predict -> Groq LLaMA 3.1 8B instant completion                  |
| 5. ProseMirror Decoration Plugin renders faint inline widget:                     |
|       "The project timeline for Q3 is [expected to complete ahead of schedule]"  |
|                                        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^  |
|                                             (Faint gray inline ghost text)        |
| 6. User presses Tab -> Text inserted into doc via standard editor transaction     |
| 7. User presses Esc or types different key -> Decoration cleared instantly        |
+-----------------------------------------------------------------------------------+
                                    |
                                    v (HTTP POST /api/ai/predict)
+-----------------------------------------------------------------------------------+
| Backend (Server/Controllers/aiController.js)                                      |
|                                                                                   |
| - Endpoint: POST /api/ai/predict                                                  |
| - Fast system prompt: "Complete the next 1-2 phrases or sentence naturally.       |
|   Return ONLY the continuation plain text. Do not repeat the prefix."             |
| - Low max_tokens (e.g., 20-35 tokens), temperature 0.2-0.3, stop tokens: ["\n"]   |
+-----------------------------------------------------------------------------------+
```

---

## 🧩 3. Key Components to Build

### 1. Backend: Ultra-Fast Completion Endpoint
- **File**: `Server/Controllers/aiController.js` & `Server/Routes/aiRoutes.js`
- **Function**: `predictTextCompletion`
- **Input**:
  - `prefix`: Text immediately before cursor (last 200–500 characters).
  - `suffix`: Text immediately after cursor (optional, for fill-in-the-middle).
  - `docTitle`: Current document title for topical awareness.
- **Model Choice**: `llama-3.1-8b-instant` on Groq (instant TTFT < 100ms).
- **Prompt Design**:
  ```text
  You are an inline autocomplete engine. Complete the text following the cursor.
  Return ONLY the immediate natural continuation (10 to 30 words max).
  Do NOT repeat the provided prefix. Do NOT use markdown. Do NOT add notes.
  ```

### 2. Frontend: TipTap/ProseMirror Inline Ghost Extension
- **File**: `Client/src/Extensions/TextPredictionExtension.js`
- **Decorations**:
  - Uses `DecorationSet` and `Decoration.widget(pos, domNode)`.
  - DOM node with styling:
    ```css
    .cowrite-ghost-text {
      color: #9ca3af; /* muted gray-400 */
      pointer-events: none;
      user-select: none;
      font-style: italic;
      opacity: 0.85;
    }
    ```
- **State Management**:
  - Tracks `activeSuggestion: string | null`, `suggestionPos: number | null`, `abortController`.
  - Abort previous in-flight requests whenever a new keystroke occurs (`AbortController.abort()`).

### 3. Keyboard Bindings & Event Handlers
- **Tab / ArrowRight (when at end of text)**:
  - Intercepted by the extension's `addKeyboardShortcuts`.
  - If `activeSuggestion` exists:
    ```javascript
    editor.commands.insertContentAt(suggestionPos, activeSuggestion);
    clearSuggestion();
    return true; // prevent focus loss
    ```
- **Escape**: Dismisses ghost text without inserting.
- **Backspace / Typing non-matching characters**: Dismisses ghost text.
- **Manual Trigger Shortcut**: `Ctrl + Space` / `Cmd + Space` (forces immediate prediction without waiting for debounce).

### 4. User Toggle / Settings
- Small toggle switch in the editor toolbar or status bar: **"AI Autocomplete (Tab to accept): ON/OFF"**.
- Stored in `localStorage` so users who prefer manual-only AI can easily disable background auto-predictions.

---

## 📋 4. Step-by-Step Implementation Roadmap

### Step 1: Server Completion API
- [x] Add `predictTextCompletion` in `Server/Controllers/aiController.js`.
- [x] Expose route `POST /api/ai/predict` in `Server/Routes/aiRoutes.js`.
- [x] Test with curl / quick test script for latency and output formatting.

### Step 2: Client Extension (`TextPredictionExtension`)
- [x] Create `Client/src/Extensions/TextPredictionExtension.js`.
- [x] Implement ProseMirror plugin with widget decoration for ghost text.
- [x] Wire up debounced fetcher (380ms) using `AbortController`.
- [x] Handle cursor movement, selection change, and document edits.

### Step 3: Keyboard Interactions & Hotkeys
- [x] Wire up `Tab` and `ArrowRight` key handlers to commit predicted text.
- [x] Wire up `Esc` key handler to dismiss suggestions.
- [x] Add `Mod-Space` (`Ctrl+Space` / `Cmd+Space`) manual trigger for instant completion.

### Step 4: Styling & UI Polish
- [x] Add smooth CSS styling for `.cowrite-ghost-text` in `Client/src/App.css`.
- [x] Add subtle indicator / shortcut hint (e.g., small faint badge `Tab ⇥`).
- [x] Add toggle switch in editor toolbar (Enable / Disable smart autocomplete with persistent `localStorage`).

### Step 5: Testing & Verification
- [x] Verify that ghost text is never saved to database or synced to other Yjs collaborators (ProseMirror client-only widget decorations).
- [x] Verify typing over / ignoring suggestions feels natural and lag-free.
- [x] Run Vite production build (`npm run build`).

---

## ⚡ 5. Performance & Edge Case Considerations

| Scenario | Potential Issue | Solution |
|---|---|---|
| **Fast Typing** | Spamming AI requests | 350-400ms debounce + abort previous fetch via `AbortController`. |
| **Yjs Sync** | Ghost text syncing to peers | Use ProseMirror client-only widget decoration (`Decoration.widget`), strictly avoid modifying Yjs document state until accepted. |
| **Multi-line / Code blocks** | Weird predictions inside code | Disable auto-predictions inside code blocks or tables unless manually triggered. |
| **Empty document** | Irrelevant predictions | Only trigger when prefix has at least 5-10 characters of context. |
| **Tab key conflict** | Tab normally indents lists/code | Only intercept `Tab` if an active prediction widget is currently displayed. |
