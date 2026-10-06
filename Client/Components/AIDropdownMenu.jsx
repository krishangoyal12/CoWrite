import React, { useState, useRef, useEffect } from "react";
import {
  LuFileText,
  LuPencil,
  LuSparkles,
  LuPlus,
  LuList,
  LuCheck,
  LuWand,
} from "react-icons/lu";

const menuItems = [
  {
    icon: <LuFileText />,
    label: "Summarize Document",
    command: (editor) => editor.commands.summarizeDocument(),
    description: "Create a concise summary of the entire text.",
  },
  {
    icon: <LuList />,
    label: "Bullet Point Summary",
    command: (editor) => editor.commands.bulletSummary(),
    description: "Summarize the document as bullet points.",
  },
  {
    icon: <LuPencil />,
    label: "Improve Writing",
    command: (editor) => editor.commands.improveDocument(),
    description: "Enhance the overall writing of the document.",
  },
  {
    icon: <LuCheck />,
    label: "Improve Grammar",
    command: (editor) => editor.commands.grammarCheck(),
    description: "Check and correct grammar and spelling mistakes.",
  },
  {
    icon: <LuSparkles />,
    label: "Make More Professional",
    command: (editor) => editor.commands.changeTone("professional"),
    description:
      "Rewrite the document in a more formal and business-like tone.",
  },
  {
    icon: <LuWand />,
    label: "Format Document",
    command: (editor) => editor.commands.formatDocument(),
    description:
      "Automatically format the text with headings, lists, and styles.",
  },
];

export const AIDropdownMenu = ({ editor, closeMenu }) => {
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const promptRef = useRef(null);
  const inputWrapperRef = useRef(null);

  if (!editor) return null;

  // Close menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu]);

  // Auto-focus textarea and scroll it into view when shown
  useEffect(() => {
    if (showPromptInput && promptRef.current) {
      promptRef.current.focus();
      if (inputWrapperRef.current) {
        inputWrapperRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [showPromptInput]);

  // Close prompt input if clicking outside
  useEffect(() => {
    if (!showPromptInput) return;
    const handleClick = (e) => {
      if (
        inputWrapperRef.current &&
        !inputWrapperRef.current.contains(e.target)
      ) {
        setShowPromptInput(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPromptInput]);

  const handleItemClick = (command) => {
    command(editor);
    closeMenu();
  };

  const handleGenerateContent = () => {
    if (!customPrompt.trim()) return;
    const promptText = customPrompt;
    
    // Close menu instantly to give immediate feedback
    closeMenu();
    
    // Execute AI command
    editor.commands.generateText({ task: "generate", prompt: promptText });
  };

  return (
    // Main container for positioning, background, and border
    <div
      style={{ width: "340px", minWidth: "320px" }}
      className="absolute left-0 top-full z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden"
    >
      {/* Scrollable list container */}
      <div
        style={{ maxHeight: "calc(100vh - 160px)" }}
        className="overflow-y-auto p-2"
      >
        <ul className="flex flex-col gap-1">
          {menuItems.map((item, index) => (
            <li key={index}>
              <button
                onClick={() => handleItemClick(item.command)}
                className="w-full flex items-center gap-3 text-left p-2.5 rounded-lg hover:bg-blue-50/70 transition-colors group"
              >
                <div className="text-blue-600 text-lg group-hover:scale-110 transition-transform">{item.icon}</div>
                <div>
                  <p className="font-semibold text-sm text-gray-800">
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              </button>
            </li>
          ))}

          {/* Visual Divider separating one-click tools from interactive custom generator */}
          <li className="my-1.5 border-t border-gray-150" />

          {/* Generate Content (Interactive Custom Prompt) */}
          <li className={showPromptInput ? "bg-blue-50/40 rounded-lg p-1.5 border border-blue-100/80" : ""}>
            <button
              onClick={() => setShowPromptInput((v) => !v)}
              className="w-full flex items-center gap-3 text-left p-2 rounded-lg hover:bg-blue-50 transition-colors group"
            >
              <div className="text-blue-600 text-lg group-hover:scale-110 transition-transform">
                <LuPlus />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-800">
                  Generate Content
                </p>
                <p className="text-xs text-gray-500">
                  Write a custom prompt and let AI generate content.
                </p>
              </div>
            </button>
            {showPromptInput && (
              <div
                className="mt-2.5 flex flex-col gap-2.5 px-2 pb-2"
                ref={inputWrapperRef}
              >
                <textarea
                  ref={promptRef}
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none resize-none bg-white placeholder-gray-400 text-gray-800"
                  placeholder="Enter your prompt (e.g. Write an introduction about...)"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerateContent();
                    }
                    if (e.key === "Escape") setShowPromptInput(false);
                  }}
                  disabled={loading}
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateContent}
                    className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-medium px-3.5 py-1.5 rounded-lg text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading || !customPrompt.trim()}
                  >
                    {loading ? "Generating..." : "Generate"}
                  </button>
                  <button
                    onClick={() => setShowPromptInput(false)}
                    className="bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 font-medium px-3.5 py-1.5 rounded-lg text-sm transition-all"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
                <span className="text-[11px] text-gray-400">
                  Press <b>Enter</b> to generate, <b>Shift+Enter</b> for new line.
                </span>
              </div>
            )}
          </li>
        </ul>
      </div>
    </div>
  );
};