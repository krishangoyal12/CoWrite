import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Color from "@tiptap/extension-color";
import FontStyle from "../Extensions/FontStyle";
import { AiHighlight } from "../Extensions/AiHighlight";
import { AIExtension } from "../Extensions/AIExtension";
import { EditorShortcuts } from "../Extensions/EditorShortcuts";
import { SlashCommands } from "../Extensions/SlashCommands";
import { TextPredictionExtension } from "../Extensions/TextPredictionExtension";
import { AIPreviewBubble } from "../Components/AIPreviewBubble";
import { AskDocSidebar } from "../Components/AskDocSidebar";

import { AIBubbleMenu } from "../../Components/AIBubbleMenu";
import { AIDropdownMenu } from "../../Components/AIDropdownMenu";
import toast from "react-hot-toast";
import { FiBold, FiItalic, FiRotateCcw, FiRotateCw } from "react-icons/fi";
import { LuSparkles, LuCircleHelp, LuUserPlus, LuUsers } from "react-icons/lu";
import { MdColorize } from "react-icons/md";
import { MdFormatStrikethrough, MdFormatUnderlined } from "react-icons/md";
import { BiHeading } from "react-icons/bi";
import {
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdFormatAlignJustify,
} from "react-icons/md";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { FormattingBubbleMenu } from "../../Components/FormattingBubbleMenu";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { useAuth } from "../../Context/useAuth";
import { CommentExtension } from "../Extensions/CommentExtension";
import { CommentThread, CommentBubble } from "../../Components/CommentPanel";

const COLOR_GRID = [
  "#000000",
  "#434343",
  "#666666",
  "#999999",
  "#cccccc",
  "#ffffff",
  "#ff0000",
  "#ff9900",
  "#ffff00",
  "#00ff00",
  "#00ffff",
  "#0000ff",
  "#9900ff",
  "#ff00ff",
  "#ff99cc",
];

function ColorIcon({ color }) {
  return (
    <span style={{ display: "inline-block", textAlign: "center" }}>
      <span style={{ fontWeight: "bold", fontSize: 18, lineHeight: 1 }}>A</span>
      <span
        style={{
          display: "block",
          height: 3,
          width: 18,
          background: color,
          borderRadius: 2,
          margin: "2px auto 0 auto",
        }}
      />
    </span>
  );
}

const baseURL = import.meta.env.VITE_URL;

const FONT_FAMILIES = [
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Comic Sans MS", value: "'Comic Sans MS', cursive, sans-serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Default", value: "" },
  { label: "Garamond", value: "Garamond, serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Helvetica", value: "Helvetica, sans-serif" },
  { label: "Impact", value: "Impact, Charcoal, sans-serif" },
  { label: "Lato", value: "Lato, sans-serif" },
  { label: "Lucida Console", value: "'Lucida Console', monospace" },
  { label: "Monospace", value: "monospace" },
  { label: "Montserrat", value: "Montserrat, sans-serif" },
  { label: "Open Sans", value: "'Open Sans', sans-serif" },
  {
    label: "Palatino",
    value: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
  },
  { label: "Roboto", value: "Roboto, sans-serif" },
  { label: "Sans-serif", value: "sans-serif" },
  {
    label: "Segoe UI",
    value: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  { label: "Serif", value: "serif" },
  { label: "Source Sans Pro", value: "'Source Sans Pro', sans-serif" },
  { label: "System UI", value: "system-ui, sans-serif" },
  { label: "Tahoma", value: "Tahoma, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
];

const COLLAB_COLORS = [
  "#007bff",
  "#e83e8c",
  "#fd7e14",
  "#28a745",
  "#20c997",
  "#6f42c1",
  "#17a2b8",
  "#ffc107",
  "#dc3545",
  "#343a40",
];

function getUserColor(userIdOrEmail) {
  if (!userIdOrEmail) return COLLAB_COLORS[0];
  let hash = 0;
  for (let i = 0; i < userIdOrEmail.length; i++) {
    hash = userIdOrEmail.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLLAB_COLORS[Math.abs(hash) % COLLAB_COLORS.length];
}

function NewCommentBoxInline({ onCancel, onSave }) {
  const [text, setText] = useState('');
  return (
    <div className="bg-white border rounded-lg shadow-lg p-4 w-80">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (text.trim()) onSave(text.trim()); }
        }}
        placeholder="Add a comment… (Enter to post, Shift+Enter for newline)"
        className="w-full border rounded p-2 text-sm mb-2 resize-none"
        rows={3}
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200">Cancel</button>
        <button onClick={() => { if (text.trim()) onSave(text.trim()); }} disabled={!text.trim()} className="bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:bg-blue-300">Comment</button>
      </div>
    </div>
  );
}

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [docTitle, setDocTitle] = useState("");
  const [docOwnerId, setDocOwnerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [headingLevel, setHeadingLevel] = useState("paragraph");
  const [fontSize, setFontSize] = useState("16px");
  const [fontFamily, setFontFamily] = useState("");
  const [textColor, setTextColor] = useState("#000000");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState("#000000");
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [showAskDocInput, setShowAskDocInput] = useState(false);
  const [askDocPrompt, setAskDocPrompt] = useState("");
  const askDocInputRef = useRef(null);
  const saveTimeout = useRef(null);
  const aiMenuRef = useRef(null);
  const { auth: user } = useAuth();

  const authFetch = (url, options = {}) => {
    const token = localStorage.getItem("token");
    const headers = { ...options.headers };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return fetch(url, { ...options, headers });
  };

  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [collaborators, setCollaborators] = useState([]);
  const [adding, setAdding] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const exportMenuRef = useRef(null);
  const shareModalRef = useRef(null);

  const [ydoc] = useState(() => new Y.Doc());
  const [provider] = useState(
    () => new WebsocketProvider(import.meta.env.VITE_WEBSOCKET_URL, id, ydoc)
  );

  useEffect(() => {
    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [provider, ydoc]);
  
  const [awarenessUsers, setAwarenessUsers] = useState([]);
  useEffect(() => {
    if (!provider) return;
    const updateAwareness = (changes) => {
      const states = provider.awareness.getStates();
      
      // Update UI for active users
      const users = [];
      const seenNames = new Set();
      states.forEach((state, clientID) => {
        if (clientID !== provider.awareness.clientID && state.user) {
          if (!seenNames.has(state.user.name)) {
            seenNames.add(state.user.name);
            users.push(state.user);
          }
        }
      });
      setAwarenessUsers(users);

      // Reset cursor label animation for users who just moved their cursor
    };
    
    provider.awareness.on("change", updateAwareness);
    updateAwareness();

    return () => {
      provider.awareness.off("change", updateAwareness);
    };
  }, [provider]);

  const [activeComment, setActiveComment] = useState(null);
  const [draftComment, setDraftComment] = useState(null);
  const [commentTop, setCommentTop] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      TextStyle,
      FontStyle,
      Underline,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Collaboration.configure({ document: ydoc }),
      CollaborationCursor.configure({
        provider,
        user: {
          name: user?.name || "Guest",
          color: getUserColor(user?.id || user?.email || "guest"),
        },
      }),
      AIExtension,
      AiHighlight,
      CommentExtension,
      EditorShortcuts,
      SlashCommands,
      TextPredictionExtension.configure({
        enabled: true,
        localDebounceMs: 60,
        llmDebounceMs: 250,
        minPrefixLength: 2,
        getDocTitle: () => docTitle || "Untitled Document",
      }),
    ],
    autofocus: true,
    editable: !loading,
    onUpdate: ({ editor }) => {
      const { $from } = editor.state.selection;
      const node = $from.node();
      if (node.type.name === "heading") {
        setHeadingLevel(`heading${node.attrs.level}`);
      } else {
        setHeadingLevel("paragraph");
      }
      const marks = editor.getAttributes("fontStyle");
      setFontSize(marks.fontSize || "16px");
      setFontFamily(marks.fontFamily || "");
      setTextColor(editor.getAttributes("color").color || "#000000");
    },
  });

  useEffect(() => {
    if (!editor) return;
    const handleClick = (e) => {
      // Find the closest comment-mark if we clicked inside one
      const commentMark = e.target.closest('.comment-mark');
      
      if (commentMark) {
        const id = commentMark.getAttribute('data-comment-id');
        const comment = editor.storage.comment?.comments?.[id];
        if (comment && !comment.resolved) {
          setActiveComment(comment);
          setDraftComment(null);
          // calculate position
          try {
            const coords = editor.view.coordsAtPos(comment.from);
            setCommentTop(coords.top);
          } catch (err) {}
        }
      } else {
        // Only close if we click outside the comment thread container
        if (!e.target.closest('.comment-thread-container')) {
          setActiveComment(null);
        }
      }
    };
    
    editor.view.dom.addEventListener('click', handleClick);
    return () => editor.view.dom.removeEventListener('click', handleClick);
  }, [editor]);

  // Update position of draft comment
  useEffect(() => {
    if (draftComment && editor) {
      try {
        const coords = editor.view.coordsAtPos(draftComment.from);
        setCommentTop(coords.top);
      } catch (err) {}
    }
  }, [draftComment, editor]);

  const fetchCollaborators = async () => {
    try {
      const res = await authFetch(`${baseURL}/api/documents/${id}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.data) {
        const owner = data.data.owner;
        const collabs = data.data.collaborators || [];
        const allParticipants = [owner, ...collabs].filter(Boolean);
        setCollaborators(allParticipants);
      }
    } catch {
      // empty
    }
  };

  // fetchCollaborators remains available for re-fetching after adding a collaborator
  useEffect(() => {
    // Only re-fetch if not already populated
  }, [id]);

  const handleAddCollaborator = async () => {
    setAdding(true);
    try {
      const res = await authFetch(`${baseURL}/api/documents/${id}/collaborators`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: collaboratorEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Collaborator added!");
        setCollaboratorEmail("");
        fetchCollaborators();
      } else {
        toast.error(data.message || "Failed to add collaborator");
      }
    } catch {
      toast.error("Failed to add collaborator");
    }
    setAdding(false);
  };

  useEffect(() => {
    if (!editor) return;
    const loadDocument = async () => {
      if (id === "new") {
        setDocTitle("Untitled Document");
        setDocOwnerId(user?.id);
        editor.commands.setContent("<p></p>");
        editor.setEditable(true);
        setLoading(false);
        return;
      }
      try {
        const res = await authFetch(`${baseURL}/api/documents/${id}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error();
        const title = data.data?.title || "Untitled Document";
        setDocTitle(title);
        setDocOwnerId(data.data?.owner?._id || data.data?.owner);
        setIsPublic(data.data?.isPublic || false);

        const collabs = data.data?.collaborators || [];
        const owner = data.data?.owner;
        const allParticipants = [owner, ...collabs].filter(Boolean);
        setCollaborators(allParticipants);

        // Initialize editor content from database if Yjs document is empty or if sync is delayed/fails
        if (data.data?.content) {
          let contentInitialized = false;
          const setInitialContent = () => {
            if (contentInitialized) return;
            const yxml = ydoc.getXmlFragment("default");
            if (yxml.length === 0) {
              editor.commands.setContent(data.data.content);
            }
            contentInitialized = true;
          };

          if (provider.synced) {
            setInitialContent();
          } else {
            provider.once("sync", setInitialContent);
            // Quick fallback timeout
            setTimeout(setInitialContent, 300);
          }
        }

        editor.setEditable(true);
        setLoading(false);
      } catch {
        toast.error("Failed to load document");
        setDocTitle("Untitled Document");
        setDocOwnerId(null);
        editor.commands.setContent("<p></p>");
        editor.setEditable(true);
        setLoading(false);
      }
    };
    loadDocument();
  }, [id, editor, user, provider, ydoc]);



  const saveDocument = async () => {
    try {
      await authFetch(`${baseURL}/api/documents/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: docTitle, content: editor.getHTML() }),
      });
    } catch {
      // empty
    }
  };

  const handleSave = async () => {
    await saveDocument();
    toast.success("Document saved!");
    navigate("/dashboard");
  };

  const handleDownloadPDF = async () => {
    try {
      const { default: html2pdf } = await import("html2pdf.js");
      const element = document.createElement("div");
      element.innerHTML = editor.getHTML();
      element.style.padding = "40px";
      element.style.fontFamily = "sans-serif";
      
      // Minimal styling so the PDF looks okay
      const style = document.createElement("style");
      style.innerHTML = `
        h1, h2, h3 { color: #111; }
        p { color: #333; line-height: 1.5; }
      `;
      element.appendChild(style);

      const opt = {
        margin:       0.5,
        filename:     `${docTitle || 'document'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      toast.promise(
        html2pdf().set(opt).from(element).save(),
        {
          loading: 'Generating PDF...',
          success: 'PDF downloaded!',
          error: 'Failed to generate PDF'
        }
      );
    } catch {
      toast.error('Failed to load PDF export module');
    }
  };

  const handlePublicToggle = async (e) => {
    const newValue = e.target.checked;
    setIsPublic(newValue);
    try {
      const res = await authFetch(`${baseURL}/api/documents/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          isPublic: newValue,
          // Snapshot current content+title to DB so the public viewer is up-to-date
          ...(newValue && { title: docTitle, content: editor.getHTML() }),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(newValue ? "Public link enabled!" : "Public link disabled");
    } catch {
      toast.error("Failed to update public setting");
      setIsPublic(!newValue); // revert
    }
  };

  // Close export dropdown on outside click
  useEffect(() => {
    if (!showExportMenu) return;
    const handler = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showExportMenu]);

  // Close share popover on outside click
  useEffect(() => {
    if (!showShareModal) return;
    const handler = (e) => {
      if (shareModalRef.current && !shareModalRef.current.contains(e.target)) {
        setShowShareModal(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showShareModal]);

  const handleHeadingChange = (e) => {
    const value = e.target.value;
    setHeadingLevel(value);
    if (value === "paragraph") {
      editor.chain().focus().setParagraph().run();
    } else {
      const level = Number(value.replace("heading", ""));
      editor.chain().focus().toggleHeading({ level }).run();
    }
  };

  const handleFontSizeChange = (e) => {
    const value = e.target.value;
    setFontSize(value);
    editor
      .chain()
      .focus()
      .setMark("fontStyle", { fontSize: value, fontFamily })
      .run();
  };

  const handleFontFamilyChange = (e) => {
    const value = e.target.value;
    setFontFamily(value);
    editor
      .chain()
      .focus()
      .setMark("fontStyle", { fontFamily: value, fontSize })
      .run();
  };

  const handleColorSelect = (color) => {
    setTextColor(color);
    setCustomColor(color);
    editor.chain().focus().setColor(color).run();
    setShowColorPicker(false);
  };

  const handleCustomColor = (e) => {
    const value = e.target.value;
    setCustomColor(value);
    setTextColor(value);
    editor.chain().focus().setColor(value).run();
  };

  useEffect(() => {
    if (!showColorPicker) return;
    const onClick = (e) => {
      if (!e.target.closest(".color-picker-popover")) setShowColorPicker(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [showColorPicker]);

  useEffect(() => {
    if (!showAiMenu) return;
    const handleClickOutside = (event) => {
      if (aiMenuRef.current && !aiMenuRef.current.contains(event.target)) {
        setShowAiMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAiMenu]);

  // Auto-focus Ask Document input when shown
  useEffect(() => {
    if (showAskDocInput && askDocInputRef.current) {
      askDocInputRef.current.focus();
    }
  }, [showAskDocInput]);

  // Close Ask Document input on outside click
  useEffect(() => {
    if (!showAskDocInput) return;
    const handleClick = (e) => {
      if (
        askDocInputRef.current &&
        !askDocInputRef.current.contains(e.target)
      ) {
        setShowAskDocInput(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showAskDocInput]);

  const handleAskDoc = () => {
    if (!askDocPrompt.trim() || !editor) return;
    editor.commands.generateText({
      task: "ask_document",
      prompt: askDocPrompt,
    });
    setShowAskDocInput(false);
    setAskDocPrompt("");
  };

  const [aiBubble, setAiBubble] = useState({
    isOpen: false,
    task: null,
    result: "",
    loading: false,
    targetScope: "upstream",
    insertPos: 0,
    replaceFrom: null,
    replaceTo: null,
    inputText: "",
    isPromptInput: false,
  });
  const [aiCustomPrompt, setAiCustomPrompt] = useState("");

  const triggerAIOperation = async ({ task, inputText, targetScope, insertPos, replaceFrom, replaceTo }) => {
    setAiBubble({
      isOpen: true,
      task,
      result: "",
      loading: true,
      targetScope,
      insertPos,
      replaceFrom,
      replaceTo,
      inputText,
      isPromptInput: false,
    });

    try {
      const url = `${import.meta.env.VITE_URL}/api/ai/generate`;
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({
          text: inputText,
          task,
          docHTML: editor ? editor.getHTML() : "",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to generate AI response");
      }

      let formattedResult = data.data || "";
      if (task === "summarize_document" && formattedResult) {
        // Ensure standard heading appears at the top of the summary if model omitted it
        if (!/^\s*<h[1-3][^>]*>.*Summary/i.test(formattedResult)) {
          formattedResult = `<h3>Summary:</h3>\n${formattedResult}`;
        }
      }

      setAiBubble((prev) => ({
        ...prev,
        result: formattedResult,
        loading: false,
      }));
    } catch (err) {
      toast.error(err.message || "AI generation failed");
      setAiBubble((prev) => ({
        ...prev,
        loading: false,
      }));
    }
  };

  useEffect(() => {
    const handleAISlashCommand = (e) => {
      if (!editor) return;
      const { task, range } = e.detail;

      const { state } = editor;
      const { selection } = state;
      const hasSelection = !selection.empty;

      let inputText = "";
      let targetScope = "upstream";
      let replaceFrom = null;
      let replaceTo = null;
      let insertPos = range ? range.from : selection.from;

      if (hasSelection) {
        targetScope = "selection";
        inputText = state.doc.textBetween(selection.from, selection.to, "\n\n");
        replaceFrom = selection.from;
        replaceTo = selection.to;
      } else {
        targetScope = "upstream";
        const cursorPosition = range ? range.from : selection.from;
        inputText = state.doc.textBetween(0, cursorPosition, "\n\n");
        replaceFrom = 0;
        replaceTo = cursorPosition;
      }

      if (task === "prompt_generate") {
        setAiBubble({
          isOpen: true,
          task: "generate",
          result: "",
          loading: false,
          targetScope,
          insertPos,
          replaceFrom: null,
          replaceTo: null,
          inputText: "",
          isPromptInput: true,
        });
        setAiCustomPrompt("");
        return;
      }

      if (!inputText.trim()) {
        toast("Write some content first to use this command", { icon: "ℹ️" });
        return;
      }

      triggerAIOperation({
        task,
        inputText,
        targetScope,
        insertPos,
        replaceFrom: task === "improve_document" || task === "grammar_check" ? replaceFrom : null,
        replaceTo: task === "improve_document" || task === "grammar_check" ? replaceTo : null,
      });
    };

    window.addEventListener("cowrite:ai-slash-command", handleAISlashCommand);
    return () => {
      window.removeEventListener("cowrite:ai-slash-command", handleAISlashCommand);
    };
  }, [editor]);

  const handleAiBubbleAccept = () => {
    if (!editor || !aiBubble.result) return;

    if (
      (aiBubble.task === "improve_document" || aiBubble.task === "grammar_check") &&
      aiBubble.replaceFrom !== null &&
      aiBubble.replaceTo !== null
    ) {
      editor
        .chain()
        .focus()
        .deleteRange({ from: aiBubble.replaceFrom, to: aiBubble.replaceTo })
        .insertContentAt(aiBubble.replaceFrom, aiBubble.result)
        .run();
    } else {
      const pos = aiBubble.insertPos != null ? aiBubble.insertPos : editor.state.selection.from;
      editor
        .chain()
        .focus()
        .insertContentAt(pos, aiBubble.result)
        .run();
    }

    setAiBubble((prev) => ({ ...prev, isOpen: false }));
    toast.success("Content updated!");
  };

  const handleAiBubbleDiscard = () => {
    setAiBubble((prev) => ({ ...prev, isOpen: false, isPromptInput: false }));
  };

  const handleAiBubbleRegenerate = () => {
    if (!aiBubble.task || !aiBubble.inputText) return;
    triggerAIOperation({
      task: aiBubble.task,
      inputText: aiBubble.inputText,
      targetScope: aiBubble.targetScope,
      insertPos: aiBubble.insertPos,
      replaceFrom: aiBubble.replaceFrom,
      replaceTo: aiBubble.replaceTo,
    });
  };

  const handlePromptSubmit = (e) => {
    e.preventDefault();
    if (!aiCustomPrompt.trim()) return;
    triggerAIOperation({
      task: "generate",
      inputText: aiCustomPrompt,
      targetScope: "cursor",
      insertPos: aiBubble.insertPos,
      replaceFrom: null,
      replaceTo: null,
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      <div className="flex items-center justify-between bg-white px-6 py-2.5 shadow-sm h-16 border-b border-gray-200">
        {/* Left: Branding & Document Title */}
        <div className="flex items-center gap-4 flex-1 min-w-0 mr-4">
          <div 
            className="flex items-center gap-2.5 select-none cursor-pointer flex-shrink-0"
            onClick={() => navigate("/dashboard")}
          >
            <img src="/logo.png" alt="CoWrite Logo" className="w-9 h-9 object-contain" />
            <span className="text-2xl font-extrabold text-blue-700 tracking-tight hover:opacity-85 transition-opacity hidden sm:inline">
              CoWrite
            </span>
          </div>

          <div className="h-6 w-px bg-gray-200 hidden sm:block flex-shrink-0 mx-1"></div>

          <div className="flex-1 max-w-xl min-w-[160px]">
            {user?.id === docOwnerId ? (
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="bg-transparent text-lg font-semibold text-gray-800 hover:bg-gray-50 focus:bg-white rounded-md border border-transparent focus:border-blue-400 outline-none px-2.5 py-1 w-full transition-colors truncate"
                placeholder="Untitled Document"
              />
            ) : (
              <input
                type="text"
                value={docTitle}
                disabled
                className="bg-transparent text-lg font-semibold text-gray-700 px-2.5 py-1 w-full opacity-80 cursor-not-allowed truncate"
                readOnly
                tabIndex={-1}
                aria-label="Document Title (read only)"
              />
            )}
          </div>
        </div>

        {/* Right: Collaborators, Share, Doc Copilot, Export, Save */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Active Live Awareness Avatars */}
          {awarenessUsers.length > 0 && (
            <div className="flex -space-x-2 mr-2" title="Currently viewing this document">
              {awarenessUsers.map((u, idx) => (
                <div 
                  key={idx}
                  className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm relative group cursor-pointer hover:z-10 transition-transform hover:scale-110"
                  style={{ backgroundColor: u.color }}
                >
                  {u.name.charAt(0).toUpperCase()}
                  <div className="absolute top-9 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md">
                    {u.name} (viewing)
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Share Button & Popover */}
          <div className="relative" ref={shareModalRef}>
            <button
              onClick={() => setShowShareModal((v) => !v)}
              className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-2 border text-sm transition-all duration-200 active:scale-95 shadow-xs ${
                showShareModal
                  ? "bg-blue-50 text-blue-700 border-blue-300 ring-2 ring-blue-500/20"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
              }`}
              title="Share document and manage collaborators"
            >
              <LuUserPlus className="text-blue-600 text-base" />
              <span>Share</span>
              {collaborators.length > 1 && (
                <span className="ml-0.5 bg-blue-100 text-blue-700 text-[11px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {collaborators.length}
                </span>
              )}
            </button>

            {showShareModal && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden p-5 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <LuUsers className="text-lg" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 leading-tight">Share Document</h4>
                      <p className="text-[12px] text-gray-500">Invite teammates to collaborate in real-time</p>
                    </div>
                  </div>
                </div>

                {/* Invite Email Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!collaboratorEmail || adding) return;
                    handleAddCollaborator();
                  }}
                  className="flex gap-2 mb-4"
                >
                  <input
                    type="email"
                    value={collaboratorEmail}
                    onChange={(e) => setCollaboratorEmail(e.target.value)}
                    placeholder="Enter collaborator's email"
                    className="flex-1 border border-gray-200 px-3.5 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-2xs"
                    disabled={adding}
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
                    disabled={adding || !collaboratorEmail}
                  >
                    {adding ? "Adding..." : "Add"}
                  </button>
                </form>

                {/* Collaborators List */}
                <div className="border-t border-gray-100 pt-3">
                  <div className="text-[12px] font-semibold text-gray-500 mb-2 flex items-center justify-between">
                    <span>Collaborators with access</span>
                    <span className="text-gray-400 font-normal">
                      {collaborators.length} {collaborators.length === 1 ? "member" : "members"}
                    </span>
                  </div>
                  
                  <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                    {collaborators.length === 0 ? (
                      <p className="text-xs text-gray-400 italic py-2 text-center">No other collaborators yet</p>
                    ) : (
                      collaborators.map((c) => {
                        const cId = typeof c === "object" && c._id ? c._id : c;
                        const cName = typeof c === "object" ? c.name || c.username || c.email : c;
                        const cEmail = typeof c === "object" ? c.email : "";
                        const isOwner = cId === docOwnerId;
                        const isYou = cId === user?.id || (cEmail && cEmail === user?.email);

                        return (
                          <div
                            key={cId}
                            className="flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className="w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold shadow-2xs flex-shrink-0"
                                style={{ backgroundColor: getUserColor(cId || cEmail || cName) }}
                              >
                                {String(cName || "U").charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-medium text-gray-800 truncate flex items-center gap-1.5">
                                  <span>{cName}</span>
                                  {isYou && (
                                    <span className="text-[10px] text-gray-400 font-normal">(you)</span>
                                  )}
                                </div>
                                {cEmail && cEmail !== cName && (
                                  <div className="text-[11px] text-gray-400 truncate">{cEmail}</div>
                                )}
                              </div>
                            </div>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                              isOwner
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-blue-50 text-blue-600 border border-blue-100"
                            }`}>
                              {isOwner ? "Owner" : "Editor"}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Doc Copilot Toggle Button */}
          <button
            onClick={() => setShowAskDocInput((v) => !v)}
            className={`px-3.5 py-2 rounded-lg transition-all duration-200 font-semibold flex items-center gap-2 border text-sm shadow-xs ${
              showAskDocInput
                ? "bg-blue-50 text-blue-700 border-blue-300 shadow-sm ring-2 ring-blue-500/20"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
            }`}
            title="Toggle Doc Copilot"
          >
            <LuSparkles className={`text-sm ${showAskDocInput ? "text-blue-600 animate-pulse" : "text-blue-600"}`} />
            <span>Doc Copilot</span>
          </button>

          {/* Export / Share dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(v => !v)}
              className="bg-white hover:bg-gray-50 active:scale-95 text-gray-700 px-4 py-2 rounded-lg transition-all duration-200 font-semibold flex items-center gap-2 border border-gray-200 shadow-sm text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 w-76 bg-white border border-gray-150 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Download PDF */}
                <button
                  onClick={() => { handleDownloadPDF(); setShowExportMenu(false); }}
                  className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100/70 transition text-left group"
                >
                  <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center group-hover:bg-rose-100 transition duration-250">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-800">Download as PDF</div>
                    <div className="text-[11px] text-gray-400 font-medium">Save a copy to your local device</div>
                  </div>
                </button>

                {/* Public View Link */}
                {user?.id === docOwnerId ? (
                  <div className="px-4 py-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-800">Public View Link</div>
                          <div className="text-[11px] text-gray-400 font-medium">{isPublic ? 'Anyone with link can view' : 'Only collaborators can access'}</div>
                        </div>
                      </div>
                      {/* Toggle Switch */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only" checked={isPublic} onChange={handlePublicToggle} />
                        <div className={`w-9 h-5 rounded-full transition-colors duration-250 ${isPublic ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
                        <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full shadow transition-transform duration-250 ${isPublic ? 'translate-x-4' : ''}`}></div>
                      </label>
                    </div>
                    {isPublic && (
                      <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-2 border border-gray-150 mt-3 transition-all duration-300">
                        <span className="text-[11px] font-medium text-gray-500 flex-1 truncate">{window.location.origin}/public/{id}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/public/${id}`);
                            setCopied(true);
                            toast.success('Link copied!');
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className={`text-xs font-bold whitespace-nowrap transition-colors duration-200 ${copied ? 'text-emerald-600' : 'text-blue-600 hover:text-blue-700'}`}
                        >
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="px-4 py-3.5 flex items-center gap-3.5 opacity-55 bg-gray-50/50">
                    <div className="w-9 h-9 rounded-lg bg-gray-150 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-700">View Link Disabled</div>
                      <div className="text-[11px] text-gray-400 font-medium">Only the document owner can share</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition"
          >
            Save
          </button>
        </div>
      </div>

      <div className="flex gap-2 items-center bg-gray-50 px-8 py-2 shadow-sm border-b border-gray-100 relative">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="p-2 rounded transition text-xl flex items-center justify-center bg-white text-gray-700 hover:bg-blue-50"
          title="Undo"
        >
          <FiRotateCcw />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="p-2 rounded transition text-xl flex items-center justify-center bg-white text-gray-700 hover:bg-blue-50"
          title="Redo"
        >
          <FiRotateCw />
        </button>

        <span className="mx-2 border-l border-gray-300 h-6" />

        <div className="relative" ref={aiMenuRef}>
          <button
            onClick={() => setShowAiMenu((v) => !v)}
            className={`p-2 rounded transition text-xl flex items-center justify-center gap-1.5 ${
              showAiMenu
                ? "bg-blue-100 text-blue-700"
                : "bg-white text-gray-700 hover:bg-blue-50"
            }`}
            title="AI Tools"
          >
            <LuSparkles />
            <span className="text-sm font-medium pr-1">AI Tools</span>
          </button>
          {showAiMenu && (
            <AIDropdownMenu
              editor={editor}
              closeMenu={() => setShowAiMenu(false)}
            />
          )}
        </div>

        <span className="mx-2 border-l border-gray-300 h-6" />

        <label className="flex items-center gap-1">
          <BiHeading className="text-xl text-gray-500" />
          <select
            value={headingLevel}
            onChange={handleHeadingChange}
            className="bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none"
          >
            <option value="paragraph">Normal</option>
            <option value="heading1">Heading 1</option>
            <option value="heading2">Heading 2</option>
            <option value="heading3">Heading 3</option>
            <option value="heading4">Heading 4</option>
            <option value="heading5">Heading 5</option>
            <option value="heading6">Heading 6</option>
          </select>
        </label>
        <select
          value={fontSize}
          onChange={handleFontSizeChange}
          className="bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none ml-2"
          style={{ width: 70 }}
        >
          <option value="12px">12</option> <option value="14px">14</option>{" "}
          <option value="16px">16</option>
          <option value="18px">18</option> <option value="20px">20</option>{" "}
          <option value="24px">24</option>
          <option value="28px">28</option> <option value="32px">32</option>
        </select>
        <select
          value={fontFamily}
          onChange={handleFontFamilyChange}
          className="bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none ml-2"
          style={{ width: 140 }}
        >
          {FONT_FAMILIES.map((f) => (
            <option
              key={f.value}
              value={f.value}
              style={{ fontFamily: f.value }}
            >
              {f.label}
            </option>
          ))}
        </select>
        <div className="relative ml-2">
          <button
            type="button"
            className={`p-2 rounded transition text-xl flex items-center justify-center bg-white text-gray-700 hover:bg-blue-50`}
            title="Text Color"
            onClick={() => setShowColorPicker((v) => !v)}
            style={{ minWidth: 28 }}
          >
            <ColorIcon color={textColor} />
          </button>
          {showColorPicker && (
            <div className="color-picker-popover absolute z-50 mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-xl p-4 min-w-[140px]">
              <div className="grid grid-cols-5 gap-3 mb-3">
                {COLOR_GRID.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition ${
                      color.toLowerCase() === textColor.toLowerCase()
                        ? "border-blue-600 ring-2 ring-blue-200"
                        : "border-gray-200 hover:border-blue-400"
                    }`}
                    style={{ background: color }}
                    onClick={() => handleColorSelect(color)}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                <label className="relative">
                  <input
                    type="color"
                    value={customColor}
                    onChange={handleCustomColor}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="Custom Color"
                  />
                  <span
                    className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center"
                    style={{ background: customColor }}
                  >
                    <MdColorize className="text-xl text-gray-700" />
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>
        <span className="mx-2 border-l border-gray-300 h-6" />
        <button
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={`p-2 rounded transition text-xl flex items-center justify-center ${
            editor.isActive({ textAlign: "left" })
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-blue-50"
          }`}
          title="Align Left"
        >
          <MdFormatAlignLeft />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={`p-2 rounded transition text-xl flex items-center justify-center ${
            editor.isActive({ textAlign: "center" })
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-blue-50"
          }`}
          title="Align Center"
        >
          <MdFormatAlignCenter />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={`p-2 rounded transition text-xl flex items-center justify-center ${
            editor.isActive({ textAlign: "right" })
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-blue-50"
          }`}
          title="Align Right"
        >
          <MdFormatAlignRight />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          className={`p-2 rounded transition text-xl flex items-center justify-center ${
            editor.isActive({ textAlign: "justify" })
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-blue-50"
          }`}
          title="Justify"
        >
          <MdFormatAlignJustify />
        </button>
        <span className="mx-2 border-l border-gray-300 h-6" />
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-2 rounded transition text-xl flex items-center justify-center ${
            editor.isActive("bold")
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-blue-50"
          }`}
          title="Bold"
        >
          <FiBold />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-2 rounded transition text-xl flex items-center justify-center ${
            editor.isActive("italic")
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-blue-50"
          }`}
          title="Italic"
        >
          <FiItalic />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={`p-2 rounded transition text-xl flex items-center justify-center ${
            editor.isActive("strike")
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-blue-50"
          }`}
          title="Strikethrough"
        >
          <MdFormatStrikethrough />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
          className={`p-2 rounded transition text-xl flex items-center justify-center ${
            editor.isActive("underline")
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-blue-50"
          }`}
          title="Underline"
        >
          <MdFormatUnderlined />
        </button>
      </div>

      {/* Loading overlay — sits on top but editor stays mounted so Yjs can sync */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-100/80 z-[100] backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-blue-700 font-medium">Loading document...</span>
          </div>
        </div>
      )}
      {/* Main Content Area: Editor Canvas + Side Copilot Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Scrollable Document Canvas */}
        <div className="flex-1 overflow-y-auto bg-[#f8f9fa] flex justify-center items-start py-8 relative">
          <div className="bg-white max-w-[1000px] w-full min-h-[1056px] shadow-sm border border-gray-200 rounded-lg p-8 md:p-12 mb-20 relative">
            <div className="mx-auto w-full" style={{ maxWidth: 860 }}>
              <EditorContent
                editor={editor}
                className="prose max-w-none text-left text-black tiptap-editor"
              />
              {editor && (
                <FormattingBubbleMenu 
                  editor={editor} 
                  onAddComment={() => {
                    const { from, to } = editor.state.selection;
                    if (from !== to) {
                      setDraftComment({ from, to });
                    }
                  }}
                />
              )}
            </div>
          </div>

          {/* Floating Right Margin Comments */}
          {(activeComment || draftComment) && (
            <div 
              className="comment-thread-container fixed z-40 transition-all duration-200 ease-out"
              style={{ 
                top: Math.max(130, commentTop), 
                right: showAskDocInput 
                  ? 'max(20px, calc(50vw - 500px - 320px + 180px))'
                  : 'max(20px, calc(50vw - 500px - 320px))'
              }}
            >
              {draftComment ? (
                <NewCommentBoxInline 
                  onCancel={() => setDraftComment(null)}
                  onSave={(text) => {
                    editor.commands.addComment({
                      text,
                      from: draftComment.from,
                      to: draftComment.to,
                      userId: user?.id,
                      userName: user?.name || 'Anonymous'
                    });
                    setDraftComment(null);
                    toast.success("Comment added");
                  }}
                />
              ) : (
                <CommentThread 
                  comment={activeComment}
                  editor={editor}
                  onClose={() => setActiveComment(null)}
                />
              )}
            </div>
          )}
        </div>

        {/* VS Code Copilot-Style Side Panel */}
        <AskDocSidebar
          isOpen={showAskDocInput}
          onClose={() => setShowAskDocInput(false)}
          editor={editor}
        />
      </div>

      {/* Interactive AI Preview Bubble */}
      {aiBubble.isOpen && !aiBubble.isPromptInput && (
        <AIPreviewBubble
          task={aiBubble.task}
          originalText={aiBubble.inputText}
          result={aiBubble.result}
          loading={aiBubble.loading}
          targetScope={aiBubble.targetScope}
          onAccept={handleAiBubbleAccept}
          onDiscard={handleAiBubbleDiscard}
          onRegenerate={handleAiBubbleRegenerate}
        />
      )}

      {/* Ask AI / Custom Prompt Input Modal */}
      {aiBubble.isOpen && aiBubble.isPromptInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="w-full max-w-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200/90 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white border-b border-gray-150">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <LuSparkles className="text-base" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 leading-tight">
                  Ask Groq AI to Write
                </h3>
                <p className="text-[11px] text-gray-500 font-medium">
                  Type instructions or a topic to generate content
                </p>
              </div>
            </div>

            <form onSubmit={handlePromptSubmit} className="p-5">
              <textarea
                value={aiCustomPrompt}
                onChange={(e) => setAiCustomPrompt(e.target.value)}
                placeholder="e.g. Write an executive summary about quarterly results..."
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none transition-all"
                rows={3}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handlePromptSubmit(e);
                  }
                }}
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-[11px] text-gray-400">
                  Press Enter to generate, Shift+Enter for new line
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAiBubbleDiscard}
                    className="px-3.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 active:scale-95 rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!aiCustomPrompt.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <LuSparkles className="text-xs" />
                    <span>Generate</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
