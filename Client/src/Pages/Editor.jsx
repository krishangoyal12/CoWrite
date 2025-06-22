import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Color from "@tiptap/extension-color";
import FontStyle from "../Extensions/FontStyle";
import { AIExtension } from "../Extensions/AIExtension";
import { AIBubbleMenu } from "../../Components/AIBubbleMenu";
import { AIDropdownMenu } from "../../Components/AIDropdownMenu";
import toast from "react-hot-toast";
import { FiBold, FiItalic, FiRotateCcw, FiRotateCw } from "react-icons/fi";
import { LuSparkles, LuCircleHelp } from 'react-icons/lu';
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
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { useAuth } from "../../Context/useAuth";

const COLOR_GRID = [
  "#000000", "#434343", "#666666", "#999999", "#cccccc", "#ffffff",
  "#ff0000", "#ff9900", "#ffff00", "#00ff00", "#00ffff", "#0000ff",
  "#9900ff", "#ff00ff", "#ff99cc",
];

function ColorIcon({ color }) {
  return (
    <span style={{ display: "inline-block", textAlign: "center" }}>
      <span style={{ fontWeight: "bold", fontSize: 18, lineHeight: 1 }}>A</span>
      <span
        style={{
          display: "block", height: 3, width: 18, background: color,
          borderRadius: 2, margin: "2px auto 0 auto",
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
  { label: "Palatino", value: "'Palatino Linotype', 'Book Antiqua', Palatino, serif" },
  { label: "Roboto", value: "Roboto, sans-serif" },
  { label: "Sans-serif", value: "sans-serif" },
  { label: "Segoe UI", value: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
  { label: "Serif", value: "serif" },
  { label: "Source Sans Pro", value: "'Source Sans Pro', sans-serif" },
  { label: "System UI", value: "system-ui, sans-serif" },
  { label: "Tahoma", value: "Tahoma, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
];

const COLLAB_COLORS = [
  "#007bff", "#e83e8c", "#fd7e14", "#28a745", "#20c997",
  "#6f42c1", "#17a2b8", "#ffc107", "#dc3545", "#343a40",
];

function getUserColor(userIdOrEmail) {
  if (!userIdOrEmail) return COLLAB_COLORS[0];
  let hash = 0;
  for (let i = 0; i < userIdOrEmail.length; i++) {
    hash = userIdOrEmail.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLLAB_COLORS[Math.abs(hash) % COLLAB_COLORS.length];
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

  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [collaborators, setCollaborators] = useState([]);
  const [adding, setAdding] = useState(false);

  const ydoc = useMemo(() => new Y.Doc(), []);
  const provider = useMemo(
    () => new WebsocketProvider(import.meta.env.VITE_WEBSOCKET_URL, id, ydoc),
    [id, ydoc]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      TextStyle, FontStyle, Underline, Color,
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

  const fetchCollaborators = async () => {
    try {
      const res = await fetch(`${baseURL}/api/documents/${id}`, { credentials: "include" });
      const data = await res.json();
      if (res.ok && data.data?.collaborators) {
        setCollaborators(data.data.collaborators);
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
      const res = await fetch(`${baseURL}/api/documents/${id}/collaborators`, {
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
        const res = await fetch(`${baseURL}/api/documents/${id}`, { credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error();
        const title = data.data?.title || "Untitled Document";
        setDocTitle(title);
        setDocOwnerId(data.data?.owner?._id || data.data?.owner);
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

  useEffect(() => {
    if (!editor || loading) return;
    saveTimeout.current = setInterval(() => saveDocument(), 3000);
    return () => clearInterval(saveTimeout.current);
  }, [editor, docTitle, id, loading]);

  const saveDocument = async () => {
    try {
      await fetch(`${baseURL}/api/documents/${id}`, {
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
    editor.chain().focus().setMark("fontStyle", { fontSize: value, fontFamily }).run();
  };

  const handleFontFamilyChange = (e) => {
    const value = e.target.value;
    setFontFamily(value);
    editor.chain().focus().setMark("fontStyle", { fontFamily: value, fontSize }).run();
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
      if (askDocInputRef.current && !askDocInputRef.current.contains(e.target)) {
        setShowAskDocInput(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showAskDocInput]);

  const handleAskDoc = () => {
    if (!askDocPrompt.trim()) return;
    editor.commands.generateText({ task: 'ask_document', prompt: askDocPrompt });
    setShowAskDocInput(false);
    setAskDocPrompt('');
  };

  if (loading || !editor) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-100 z-50">
        <div className="text-lg text-blue-700">Loading...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      <div className="flex items-center gap-3 px-8 py-2 bg-blue-50 border-b border-blue-100">
        <input
          type="email"
          value={collaboratorEmail}
          onChange={(e) => setCollaboratorEmail(e.target.value)}
          placeholder="Invite collaborator by email"
          className="border px-3 py-1 rounded w-64"
          disabled={adding}
        />
        <button
          onClick={handleAddCollaborator}
          className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
          disabled={adding || !collaboratorEmail}
        >
          {adding ? "Adding..." : "Add"}
        </button>
        <div className="ml-6 text-sm text-gray-700">
          <span className="font-semibold">Collaborators:</span>
          {collaborators.length === 0 && <span className="ml-2 text-gray-400">None</span>}
          {collaborators.map((c) => (
            <span key={typeof c === "object" && c._id ? c._id : c} className="ml-2 bg-gray-200 px-2 py-0.5 rounded">
              {typeof c === "object" ? c.email || c.username || c._id : c}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center bg-white px-8 py-3 shadow h-16 border-b border-gray-200">
        <div className="flex items-center gap-3 select-none">
          <img src="/logo.png" alt="CoWrite Logo" className="w-10 h-10" />
          <span className="text-2xl font-extrabold text-blue-700 tracking-wide">CoWrite</span>
        </div>
        <div className="ml-8 flex-1">
          {user?.id === docOwnerId ? (
            <input
              type="text" value={docTitle} onChange={(e) => setDocTitle(e.target.value)}
              className="bg-transparent text-xl font-semibold text-gray-800 border-b border-gray-200 focus:border-blue-500 outline-none px-2 py-1 w-full max-w-lg"
              placeholder="Document Title"
            />
          ) : (
            <input
              type="text" value={docTitle} disabled
              className="bg-transparent text-xl font-semibold text-gray-800 border-b border-gray-200 px-2 py-1 w-full max-w-lg opacity-70 cursor-not-allowed"
              readOnly tabIndex={-1} aria-label="Document Title (read only)"
            />
          )}
        </div>
        <button onClick={handleSave} className="ml-4 bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition">
          Save
        </button>
      </div>

      <div className="flex gap-2 items-center bg-gray-50 px-8 py-2 shadow-sm border-b border-gray-100 relative">
        <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()} className="p-2 rounded transition text-xl flex items-center justify-center bg-white text-gray-700 hover:bg-blue-50" title="Undo">
          <FiRotateCcw />
        </button>
        <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()} className="p-2 rounded transition text-xl flex items-center justify-center bg-white text-gray-700 hover:bg-blue-50" title="Redo">
          <FiRotateCw />
        </button>
        
        <span className="mx-2 border-l border-gray-300 h-6" />

        <div className="relative" ref={aiMenuRef}>
          <button
            onClick={() => setShowAiMenu(v => !v)}
            className={`p-2 rounded transition text-xl flex items-center justify-center gap-1.5 ${showAiMenu ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700 hover:bg-blue-50'}`}
            title="AI Tools"
          >
            <LuSparkles />
            <span className="text-sm font-medium pr-1">AI Tools</span>
          </button>
          {showAiMenu && <AIDropdownMenu editor={editor} closeMenu={() => setShowAiMenu(false)} />}
        </div>

        <span className="mx-2 border-l border-gray-300 h-6" />

        <label className="flex items-center gap-1">
          <BiHeading className="text-xl text-gray-500" />
          <select value={headingLevel} onChange={handleHeadingChange} className="bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none">
            <option value="paragraph">Normal</option>
            <option value="heading1">Heading 1</option>
            <option value="heading2">Heading 2</option>
            <option value="heading3">Heading 3</option>
            <option value="heading4">Heading 4</option>
            <option value="heading5">Heading 5</option>
            <option value="heading6">Heading 6</option>
          </select>
        </label>
        <select value={fontSize} onChange={handleFontSizeChange} className="bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none ml-2" style={{ width: 70 }}>
          <option value="12px">12</option> <option value="14px">14</option> <option value="16px">16</option>
          <option value="18px">18</option> <option value="20px">20</option> <option value="24px">24</option>
          <option value="28px">28</option> <option value="32px">32</option>
        </select>
        <select value={fontFamily} onChange={handleFontFamilyChange} className="bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none ml-2" style={{ width: 140 }}>
          {FONT_FAMILIES.map((f) => (<option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>))}
        </select>
        <div className="relative ml-2">
          <button type="button" className={`p-2 rounded transition text-xl flex items-center justify-center bg-white text-gray-700 hover:bg-blue-50`} title="Text Color" onClick={() => setShowColorPicker((v) => !v)} style={{ minWidth: 28 }}>
            <ColorIcon color={textColor} />
          </button>
          {showColorPicker && (
            <div className="color-picker-popover absolute z-50 mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-xl p-4 min-w-[140px]">
              <div className="grid grid-cols-5 gap-3 mb-3">
                {COLOR_GRID.map((color) => (
                  <button key={color} type="button" className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition ${color.toLowerCase() === textColor.toLowerCase() ? "border-blue-600 ring-2 ring-blue-200" : "border-gray-200 hover:border-blue-400"}`} style={{ background: color }} onClick={() => handleColorSelect(color)} />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                <label className="relative">
                  <input type="color" value={customColor} onChange={handleCustomColor} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="Custom Color" />
                  <span className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center" style={{ background: customColor }}>
                    <MdColorize className="text-xl text-gray-700" />
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>
        <span className="mx-2 border-l border-gray-300 h-6" />
        <button onClick={() => editor.chain().focus().setTextAlign("left").run()} className={`p-2 rounded transition text-xl flex items-center justify-center ${editor.isActive({ textAlign: "left" }) ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-blue-50"}`} title="Align Left">
          <MdFormatAlignLeft />
        </button>
        <button onClick={() => editor.chain().focus().setTextAlign("center").run()} className={`p-2 rounded transition text-xl flex items-center justify-center ${editor.isActive({ textAlign: "center" }) ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-blue-50"}`} title="Align Center">
          <MdFormatAlignCenter />
        </button>
        <button onClick={() => editor.chain().focus().setTextAlign("right").run()} className={`p-2 rounded transition text-xl flex items-center justify-center ${editor.isActive({ textAlign: "right" }) ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-blue-50"}`} title="Align Right">
          <MdFormatAlignRight />
        </button>
        <button onClick={() => editor.chain().focus().setTextAlign("justify").run()} className={`p-2 rounded transition text-xl flex items-center justify-center ${editor.isActive({ textAlign: "justify" }) ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-blue-50"}`} title="Justify">
          <MdFormatAlignJustify />
        </button>
        <span className="mx-2 border-l border-gray-300 h-6" />
        <button onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} className={`p-2 rounded transition text-xl flex items-center justify-center ${editor.isActive("bold") ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-blue-50"}`} title="Bold">
          <FiBold />
        </button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} className={`p-2 rounded transition text-xl flex items-center justify-center ${editor.isActive("italic") ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-blue-50"}`} title="Italic">
          <FiItalic />
        </button>
        <button onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} className={`p-2 rounded transition text-xl flex items-center justify-center ${editor.isActive("strike") ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-blue-50"}`} title="Strikethrough">
          <MdFormatStrikethrough />
        </button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()} disabled={!editor.can().chain().focus().toggleUnderline().run()} className={`p-2 rounded transition text-xl flex items-center justify-center ${editor.isActive("underline") ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-blue-50"}`} title="Underline">
          <MdFormatUnderlined />
        </button>
        <button
          onClick={() => setShowAskDocInput(v => !v)}
          className="p-2 rounded transition text-xl flex items-center justify-center bg-white text-gray-700 hover:bg-blue-50"
          title="Ask Document"
        >
          <LuCircleHelp />
        </button>
        {showAskDocInput && (
          <div className="absolute left-1/2 transform -translate-x-1/2 mt-16 bg-white border rounded shadow p-2 z-50 flex flex-col gap-2" style={{ minWidth: 320 }}>
            <input
              ref={askDocInputRef}
              type="text"
              className="border rounded px-2 py-1 text-sm w-full"
              placeholder="Ask a question about this document..."
              value={askDocPrompt}
              onChange={e => setAskDocPrompt(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAskDoc();
                if (e.key === 'Escape') setShowAskDocInput(false);
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
            <span className="text-xs text-gray-400">Press <b>Enter</b> to ask, <b>Esc</b> to cancel.</span>
          </div>
        )}
      </div>

      <div className="flex-1 justify-center py-8 bg-gray-100 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-md w-full max-w-4xl px-16 py-10 mx-auto" style={{ minHeight: "80vh" }}>
          <EditorContent editor={editor} className="prose max-w-none text-left tiptap-editor" />
          {editor && <AIBubbleMenu editor={editor} />}
        </div>
      </div>
    </div>
  );
}