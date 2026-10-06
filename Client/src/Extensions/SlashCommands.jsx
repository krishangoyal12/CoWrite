import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import React from 'react';
import {
  LuHeading1,
  LuHeading2,
  LuHeading3,
  LuList,
  LuListOrdered,
  LuQuote,
  LuMinus,
  LuSparkles,
  LuFileText,
  LuPencil,
  LuCheck,
  LuType,
  LuCode,
} from 'react-icons/lu';
import { SlashCommandList } from '../Components/SlashCommandList';

export const DEFAULT_SLASH_COMMANDS = [
  // Text blocks
  {
    id: 'text',
    title: 'Text',
    description: 'Just start typing with plain text.',
    category: 'Basic Blocks',
    icon: <LuType />,
    aliases: ['p', 'paragraph', 'text'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    id: 'h1',
    title: 'Heading 1',
    description: 'Large section heading.',
    category: 'Basic Blocks',
    icon: <LuHeading1 />,
    aliases: ['h1', 'heading1', 'title'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
    },
  },
  {
    id: 'h2',
    title: 'Heading 2',
    description: 'Medium section sub-heading.',
    category: 'Basic Blocks',
    icon: <LuHeading2 />,
    aliases: ['h2', 'heading2', 'subtitle'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
    },
  },
  {
    id: 'h3',
    title: 'Heading 3',
    description: 'Small section heading.',
    category: 'Basic Blocks',
    icon: <LuHeading3 />,
    aliases: ['h3', 'heading3'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
    },
  },

  // Lists & Formatting
  {
    id: 'bullet_list',
    title: 'Bullet List',
    description: 'Create a simple bulleted list.',
    category: 'Lists & Formatting',
    icon: <LuList />,
    aliases: ['ul', 'bullet', 'list'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    id: 'numbered_list',
    title: 'Numbered List',
    description: 'Create a list with numbering.',
    category: 'Lists & Formatting',
    icon: <LuListOrdered />,
    aliases: ['ol', 'number', 'numbered'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    id: 'blockquote',
    title: 'Blockquote',
    description: 'Capture a quote or key takeaway.',
    category: 'Lists & Formatting',
    icon: <LuQuote />,
    aliases: ['quote', 'blockquote'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    id: 'divider',
    title: 'Divider',
    description: 'Visually separate sections with a horizontal line.',
    category: 'Lists & Formatting',
    icon: <LuMinus />,
    aliases: ['hr', 'line', 'divider', 'separator'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    id: 'code_block',
    title: 'Code Block',
    description: 'Display code with monospace styling.',
    category: 'Lists & Formatting',
    icon: <LuCode />,
    aliases: ['code', 'codeblock', 'snippet', 'pre'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },

  // Groq AI Commands with Preview Bubble
  {
    id: 'ai_summarize',
    title: 'Summarize Document',
    description: 'Summarize all text written above in a preview bubble.',
    category: 'Groq AI Assistant',
    icon: <LuFileText />,
    aliases: ['ai summary', 'summarize', 'summary', 'tldr'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      window.dispatchEvent(
        new CustomEvent('cowrite:ai-slash-command', {
          detail: { task: 'summarize_document', range },
        })
      );
    },
  },
  {
    id: 'ai_improve',
    title: 'Improve Writing',
    description: 'Polish and enhance the document text above in preview.',
    category: 'Groq AI Assistant',
    icon: <LuPencil />,
    aliases: ['ai improve', 'improve', 'rewrite', 'enhance'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      window.dispatchEvent(
        new CustomEvent('cowrite:ai-slash-command', {
          detail: { task: 'improve_document', range },
        })
      );
    },
  },
  {
    id: 'ai_grammar',
    title: 'Check Grammar',
    description: 'Detect and correct grammatical errors in preview.',
    category: 'Groq AI Assistant',
    icon: <LuCheck />,
    aliases: ['ai grammar', 'grammar', 'spellcheck'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      window.dispatchEvent(
        new CustomEvent('cowrite:ai-slash-command', {
          detail: { task: 'grammar_check', range },
        })
      );
    },
  },
  {
    id: 'ai_generate',
    title: 'Ask AI / Generate',
    description: 'Prompt AI to write new paragraphs or ideas.',
    category: 'Groq AI Assistant',
    icon: <LuSparkles />,
    aliases: ['ai', 'generate', 'ask', 'write'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      window.dispatchEvent(
        new CustomEvent('cowrite:ai-slash-command', {
          detail: { task: 'prompt_generate', range },
        })
      );
    },
  },
];

export const getSuggestionItems = ({ query }) => {
  // Load user custom order from localStorage if available
  let orderedCommands = [...DEFAULT_SLASH_COMMANDS];
  try {
    const savedOrder = JSON.parse(localStorage.getItem('cowrite:slash-command-order'));
    if (Array.isArray(savedOrder) && savedOrder.length > 0) {
      const map = new Map(DEFAULT_SLASH_COMMANDS.map((item) => [item.id, item]));
      const reordered = [];
      savedOrder.forEach((id) => {
        if (map.has(id)) {
          reordered.push(map.get(id));
          map.delete(id);
        }
      });
      // Append any new commands that weren't in saved order
      map.forEach((item) => reordered.push(item));
      orderedCommands = reordered;
    }
  } catch (err) {
    // Fall back to default order
  }

  if (!query) {
    return orderedCommands;
  }

  const q = query.toLowerCase().trim();
  return orderedCommands.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      (item.aliases && item.aliases.some((alias) => alias.includes(q)))
  );
};

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: getSuggestionItems,
        render: () => {
          let component;
          let popup;

          return {
            onStart: (props) => {
              component = new ReactRenderer(SlashCommandList, {
                props,
                editor: props.editor,
              });

              if (!props.clientRect) {
                return;
              }

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              });
            },

            onUpdate(props) {
              component?.updateProps(props);

              if (!props.clientRect) {
                return;
              }

              popup?.[0]?.setProps({
                getReferenceClientRect: props.clientRect,
              });
            },

            onKeyDown(props) {
              if (props.event.key === 'Escape') {
                popup?.[0]?.hide();
                return true;
              }

              return component?.ref?.onKeyDown(props);
            },

            onExit() {
              popup?.[0]?.destroy();
              component?.destroy();
            },
          };
        },
      }),
    ];
  },
});
