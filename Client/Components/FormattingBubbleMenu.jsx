import React, { useState } from "react";
import { BubbleMenu } from "@tiptap/react";
import {
  FiBold,
  FiItalic,
  FiCode,
  FiMessageSquare,
  FiLink,
  FiCheck,
  FiTrash2
} from "react-icons/fi";
import {
  MdFormatStrikethrough,
  MdFormatUnderlined
} from "react-icons/md";
import { LuSparkles } from "react-icons/lu";

export const FormattingBubbleMenu = ({ editor, onAddComment }) => {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  if (!editor) {
    return null;
  }

  const handleSetLink = (e) => {
    e.preventDefault();
    if (!linkUrl.trim()) {
      editor.chain().focus().unsetLink?.().run();
      setShowLinkInput(false);
      return;
    }
    let url = linkUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }
    if (editor.commands.setLink) {
      editor.chain().focus().setLink({ href: url }).run();
    }
    setShowLinkInput(false);
    setLinkUrl("");
  };

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 150, placement: "top" }}
      shouldShow={({ from, to, editor }) => {
        // Only show when there is an active selection and editor is focused
        return from !== to && editor.isEditable;
      }}
    >
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/80 flex items-center p-1.5 gap-0.5 transform transition-all select-none">
        {showLinkInput ? (
          <form onSubmit={handleSetLink} className="flex items-center gap-1 px-1">
            <input
              type="url"
              placeholder="Paste link https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg outline-none focus:border-blue-500 w-44"
              autoFocus
            />
            <button
              type="submit"
              className="p-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs"
              title="Apply link"
            >
              <FiCheck className="w-3.5 h-3.5" />
            </button>
            {editor.isActive("link") && (
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetLink?.().unsetMark("link").run();
                  setShowLinkInput(false);
                  setLinkUrl("");
                }}
                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded text-xs transition"
                title="Remove link"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowLinkInput(false)}
              className="p-1 text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          </form>
        ) : (
          <>
            {/* Bold */}
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded-xl transition-colors flex items-center justify-center ${
                editor.isActive("bold")
                  ? "bg-blue-100 text-blue-700 font-bold"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
              title="Bold (Ctrl+B)"
            >
              <FiBold className="w-3.5 h-3.5" />
            </button>

            {/* Italic */}
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded-xl transition-colors flex items-center justify-center ${
                editor.isActive("italic")
                  ? "bg-blue-100 text-blue-700 font-bold"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
              title="Italic (Ctrl+I)"
            >
              <FiItalic className="w-3.5 h-3.5" />
            </button>

            {/* Underline */}
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-1.5 rounded-xl transition-colors flex items-center justify-center ${
                editor.isActive("underline")
                  ? "bg-blue-100 text-blue-700 font-bold"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
              title="Underline (Ctrl+U)"
            >
              <MdFormatUnderlined className="w-4 h-4" />
            </button>

            {/* Strikethrough */}
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`p-1.5 rounded-xl transition-colors flex items-center justify-center ${
                editor.isActive("strike")
                  ? "bg-blue-100 text-blue-700 font-bold"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
              title="Strikethrough"
            >
              <MdFormatStrikethrough className="w-4 h-4" />
            </button>

            {/* Inline Code */}
            <button
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={`p-1.5 rounded-xl transition-colors flex items-center justify-center ${
                editor.isActive("code")
                  ? "bg-blue-100 text-blue-700 font-bold"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
              title="Inline Code (`)"
            >
              <FiCode className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>

            {/* Link */}
            <button
              onClick={() => {
                const previousUrl = editor.getAttributes("link").href;
                setLinkUrl(previousUrl || "");
                setShowLinkInput(true);
              }}
              className={`p-1.5 rounded-xl transition-colors flex items-center justify-center ${
                editor.isActive("link")
                  ? "bg-blue-100 text-blue-700 font-bold"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
              title={editor.isActive("link") ? "Edit Link" : "Insert Link"}
            >
              <FiLink className="w-3.5 h-3.5" />
            </button>

            {/* Remove Link button when active */}
            {editor.isActive("link") && (
              <button
                onClick={() => {
                  editor.chain().focus().unsetLink?.().unsetMark("link").run();
                }}
                className="p-1.5 rounded-xl transition-colors flex items-center justify-center hover:bg-rose-50 text-rose-600"
                title="Remove Link"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Comment */}
            <button
              onClick={() => onAddComment && onAddComment()}
              className="p-1.5 rounded-xl transition-colors flex items-center justify-center hover:bg-gray-100 text-gray-700"
              title="Add Comment"
            >
              <FiMessageSquare className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>

            {/* AI Improve */}
            <button
              onClick={() => {
                if (editor.commands.enhanceText) {
                  editor.commands.enhanceText();
                } else {
                  // Fallback: trigger custom AI slash event or modal
                  const { from, to } = editor.state.selection;
                  const text = editor.state.doc.textBetween(from, to, " ");
                  window.dispatchEvent(
                    new CustomEvent("cowrite:ai-slash-command", {
                      detail: { task: "improve_document", selectedText: text, from, to }
                    })
                  );
                }
              }}
              className="px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 hover:bg-blue-50 text-blue-600 font-semibold text-xs border border-transparent hover:border-blue-100 active:scale-95"
              title="AI Rewrite & Polish"
            >
              <LuSparkles className="w-3.5 h-3.5" />
              <span>Ask AI</span>
            </button>
          </>
        )}
      </div>
    </BubbleMenu>
  );
};
