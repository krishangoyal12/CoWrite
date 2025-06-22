import React, { useState } from 'react';
import { BubbleMenu } from '@tiptap/react';

export const AIBubbleMenu = ({ editor }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!editor) {
    return null;
  }

  const hasSelection = () => {
    return editor.state.selection.content().content.size > 0;
  };

  return (
    <BubbleMenu 
      editor={editor}
      tippyOptions={{ duration: 100 }}
      shouldShow={({ editor }) => hasSelection()}
      updateDelay={0}
    >
      <div className="flex gap-1 bg-white shadow-lg rounded-md p-1 border border-gray-200">
        <button 
          onClick={() => {
            if (!hasSelection()) return;
            editor.commands.generateText({ task: 'generate' });
          }}
          className="text-sm px-2 py-1 rounded hover:bg-blue-100"
        >
          Continue
        </button>
        <button 
          onClick={() => {
            if (!hasSelection()) return;
            editor.commands.summarizeText();
          }}
          className="text-sm px-2 py-1 rounded hover:bg-blue-100"
        >
          Summarize
        </button>
        <button 
          onClick={() => {
            if (!hasSelection()) return;
            editor.commands.enhanceText();
          }}
          className="text-sm px-2 py-1 rounded hover:bg-blue-100"
        >
          Enhance
        </button>
      </div>
    </BubbleMenu>
  );
};