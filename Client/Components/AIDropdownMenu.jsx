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

  // Auto-focus textarea when shown
  useEffect(() => {
    if (showPromptInput && promptRef.current) {
      promptRef.current.focus();
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

  const handleGenerateContent = async () => {
    if (!customPrompt.trim()) return;
    setLoading(true);
    editor.commands.generateText({ task: "generate", prompt: customPrompt });
    setLoading(false);
    setShowPromptInput(false);
    setCustomPrompt("");
    closeMenu();
  };

  return (
    // Main container for positioning, background, and border.
    <div className="absolute z-50 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl">
      {/* This new inner div handles the scrolling and has the padding. */}
      <div className="max-h-[80vh] overflow-y-auto p-2">
        <ul className="flex flex-col gap-1">
          {menuItems.map((item, index) => (
            <li key={index}>
              <button
                onClick={() => handleItemClick(item.command)}
                className="w-full flex items-center gap-3 text-left p-2 rounded-md hover:bg-blue-50 transition-colors"
              >
                <div className="text-blue-600 text-xl">{item.icon}</div>
                <div>
                  <p className="font-semibold text-sm text-gray-800">
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              </button>
            </li>
          ))}
          <li>
            <button
              onClick={() => setShowPromptInput((v) => !v)}
              className="w-full flex items-center gap-3 text-left p-2 rounded-md hover:bg-blue-50 transition-colors"
            >
              <div className="text-blue-600 text-xl">
                <LuPlus />
              </div>
              <div>
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
                className="mt-2 flex flex-col gap-2 px-2"
                ref={inputWrapperRef}
              >
                <textarea
                  ref={promptRef}
                  rows={3}
                  className="border rounded px-2 py-1 text-sm w-full resize-none focus:outline-blue-400"
                  placeholder="Enter your prompt..."
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
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerateContent}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    disabled={loading || !customPrompt.trim()}
                  >
                    {loading ? "Generating..." : "Generate"}
                  </button>
                  <button
                    onClick={() => setShowPromptInput(false)}
                    className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
                <span className="text-xs text-gray-400">
                  Press <b>Enter</b> to generate, <b>Shift+Enter</b> for new
                  line.
                </span>
              </div>
            )}
          </li>
        </ul>
      </div>
    </div>
  );
};