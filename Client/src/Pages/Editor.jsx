import { useEffect, useState, useRef, useMemo } from "react";
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
import { AIBubbleMenu } from "../../Components/AIBubbleMenu";
import { AIDropdownMenu } from "../../Components/AIDropdownMenu";
import toast from "react-hot-toast";
import { FiBold, FiItalic, FiRotateCcw, FiRotateCw } from "react-icons/fi";
import { LuSparkles, LuCircleHelp } from "react-icons/lu";
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
import html2pdf from "html2pdf.js";
import { FormattingBubbleMenu } from "../../Components/FormattingBubbleMenu";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { useAuth } from "../../Context/useAuth";
import { CommentExtension } from "../Extensions/CommentExtension";
import { CommentThread, CommentBubble } from "../../Components/CommentPanel";
import { CollaboratorBar } from "../Components/CollaboratorBar";

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
  const [text, setText] = React.useState('');
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
  const exportMenuRef = useRef(null);

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
      AIExtension.configure({ apiKey: import.meta.env.VITE_GEMINI_API_KEY }),
      AiHighlight,
      CommentExtension,
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

  useEffect(() => {
    fetchCollaborators();
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
  }, [id, editor, user]);



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

  const handleDownloadPDF = () => {
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
    if (!askDocPrompt.trim()) return;
    editor.commands.generateText({
      task: "ask_document",
      prompt: askDocPrompt,
    });
    setShowAskDocInput(false);
    setAskDocPrompt("");
  };

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      <CollaboratorBar 
        collaboratorEmail={collaboratorEmail}
        setCollaboratorEmail={setCollaboratorEmail}
        adding={adding}
        handleAddCollaborator={handleAddCollaborator}
        collaborators={collaborators}
        currentUser={user}
      />

      <div className="flex items-center bg-white px-8 py-3 shadow h-16 border-b border-gray-200">
        <div 
          className="flex items-center gap-3 select-none cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          <img src="/logo.png" alt="CoWrite Logo" className="w-10 h-10" />
          <span className="text-2xl font-extrabold text-blue-700 tracking-wide hover:opacity-80 transition-opacity">
            CoWrite
          </span>
        </div>
        <div className="ml-8 flex-1">
          {user?.id === docOwnerId ? (
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="bg-transparent text-xl font-semibold text-gray-800 border-b border-gray-200 focus:border-blue-500 outline-none px-2 py-1 w-full max-w-lg"
              placeholder="Document Title"
            />
          ) : (
            <input
              type="text"
              value={docTitle}
              disabled
              className="bg-transparent text-xl font-semibold text-gray-800 border-b border-gray-200 px-2 py-1 w-full max-w-lg opacity-70 cursor-not-allowed"
              readOnly
              tabIndex={-1}
              aria-label="Document Title (read only)"
            />
          )}
        </div>

        {awarenessUsers.length > 0 && (
          <div className="flex -space-x-2 mr-4" title="Currently viewing this document">
            {awarenessUsers.map((u, idx) => (
              <div 
                key={idx}
                className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm relative group cursor-pointer hover:z-10 transition-transform hover:scale-110"
                style={{ backgroundColor: u.color }}
              >
                {u.name.charAt(0).toUpperCase()}
                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {u.name}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 ml-4 items-center">
          {/* Export / Share dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(v => !v)}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition font-medium flex items-center gap-2 border border-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                {/* Download PDF */}
                <button
                  onClick={() => { handleDownloadPDF(); setShowExportMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">Download as PDF</div>
                    <div className="text-xs text-gray-500">Save a copy to your device</div>
                  </div>
                </button>

                <div className="border-t border-gray-100 mx-4" />

                {/* Public View Link */}
                {user?.id === docOwnerId ? (
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-800">Public View Link</div>
                          <div className="text-xs text-gray-500">{isPublic ? 'Anyone with the link can view' : 'Only you can access'}</div>
                        </div>
                      </div>
                      {/* Toggle */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only" checked={isPublic} onChange={handlePublicToggle} />
                        <div className={`w-10 h-6 rounded-full transition-colors ${isPublic ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow transition-transform ${isPublic ? 'translate-x-4' : ''}`}></div>
                      </label>
                    </div>
                    {isPublic && (
                      <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                        <span className="text-xs text-gray-500 flex-1 truncate">{window.location.origin}/public/{id}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/public/${id}`);
                            toast.success('Link copied!');
                          }}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 whitespace-nowrap"
                        >
                          Copy
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="px-4 py-3 flex items-center gap-3 opacity-50">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div className="text-sm text-gray-500">Only the owner can share publicly</div>
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
        <button
          onClick={() => setShowAskDocInput((v) => !v)}
          className="p-2 rounded transition text-xl flex items-center justify-center bg-white text-gray-700 hover:bg-blue-50"
          title="Ask Document"
        >
          <LuCircleHelp />
        </button>
        {showAskDocInput && (
          <div
            className="absolute left-1/2 transform -translate-x-1/2 mt-16 bg-white border rounded shadow p-2 z-50 flex flex-col gap-2"
            style={{ minWidth: 320 }}
          >
            <input
              ref={askDocInputRef}
              type="text"
              className="border rounded px-2 py-1 text-sm w-full"
              placeholder="Ask a question about this document..."
              value={askDocPrompt}
              onChange={(e) => setAskDocPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAskDoc();
                if (e.key === "Escape") setShowAskDocInput(false);
              }}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleAskDoc}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                disabled={!askDocPrompt.trim()}
              >
                Ask
              </button>
              <button
                onClick={() => setShowAskDocInput(false)}
                className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm"
              >
                Cancel
              </button>
            </div>
            <span className="text-xs text-gray-400">
              Press <b>Enter</b> to ask, <b>Esc</b> to cancel.
            </span>
          </div>
        )}
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
      <div className="flex-1 overflow-y-auto bg-[#f8f9fa] flex justify-center py-10 relative">
        <div className="bg-white max-w-[850px] w-full min-h-[1056px] shadow-sm border border-gray-200 rounded p-12 md:p-16 mb-20 relative">
          <div className="mx-auto" style={{ maxWidth: 650 }}>
            <EditorContent
              editor={editor}
              className="prose max-w-none text-left tiptap-editor min-h-[500px]"
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
              right: 'max(20px, calc(50vw - 425px - 320px))'
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
    </div>
  );
}
