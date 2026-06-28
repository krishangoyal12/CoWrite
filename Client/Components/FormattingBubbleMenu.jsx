import React from "react";
import { BubbleMenu } from "@tiptap/react";
import { FiBold, FiItalic, FiMessageSquare } from "react-icons/fi";
import { MdFormatStrikethrough, MdFormatUnderlined } from "react-icons/md";
import { LuSparkles } from "react-icons/lu";

export const FormattingBubbleMenu = ({ editor, onAddComment }) => {
  if (!editor) {
    return null;
  }

  return (
    <BubbleMenu 
      editor={editor} 
      tippyOptions={{ duration: 150, placement: 'top' }}
      shouldShow={({ from, to, editor }) => {
        return from !== to;
      }}
    >
      <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200/60 flex items-center p-1.5 gap-1 transform transition-all">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${
            editor.isActive("bold")
              ? "bg-blue-100 text-blue-700"
              : "hover:bg-gray-100 text-gray-700"
          }`}
          title="Bold"
        >
          <FiBold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${
            editor.isActive("italic")
              ? "bg-blue-100 text-blue-700"
              : "hover:bg-gray-100 text-gray-700"
          }`}
          title="Italic"
        >
          <FiItalic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${
            editor.isActive("underline")
              ? "bg-blue-100 text-blue-700"
              : "hover:bg-gray-100 text-gray-700"
          }`}
          title="Underline"
        >
          <MdFormatUnderlined className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${
            editor.isActive("strike")
              ? "bg-blue-100 text-blue-700"
              : "hover:bg-gray-100 text-gray-700"
          }`}
          title="Strikethrough"
        >
          <MdFormatStrikethrough className="w-4 h-4" />
        </button>
        
        <div className="w-[1px] h-5 bg-gray-200 mx-1"></div>
        
        <button
          onClick={() => onAddComment && onAddComment()}
          className="p-1.5 rounded-lg transition-colors flex items-center justify-center hover:bg-gray-100 text-gray-700"
          title="Add Comment"
        >
          <FiMessageSquare className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-gray-200 mx-1"></div>
        
        <button
          onClick={() => editor.commands.enhanceText()}
          className="px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 hover:bg-blue-50 text-blue-600 font-semibold text-xs border border-transparent hover:border-blue-100"
          title="AI Improve"
        >
          <LuSparkles className="w-3.5 h-3.5" />
          Improve
        </button>
      </div>
    </BubbleMenu>
  );
};
