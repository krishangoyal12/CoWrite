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
    description: 'Plain text paragraph.',
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
    description: 'Large heading.',
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
    description: 'Medium sub-heading.',
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
    description: 'Simple bulleted list.',
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
    description: 'Numbered list.',
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
    description: 'Quote callout.',
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
    description: 'Horizontal separator.',
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
    description: 'Monospace code snippet.',
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
    description: 'Summarize text in preview.',
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
    description: 'Polish and rewrite text.',
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
    description: 'Fix grammatical errors.',
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
    description: 'Draft ideas & paragraphs.',
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
                maxWidth: 'none',
                offset: [0, 8],
                popperOptions: {
                  modifiers: [
                    {
                      name: 'preventOverflow',
                      options: {
                        padding: 12,
                        altAxis: true,
                      },
                    },
                  ],
                },
              });

              // Industry Best Practice (Notion / Slack / Linear / Google Docs):
              // Close the transient slash popup immediately when the user scrolls the document.
              // This completely eliminates repainting lag, layout thrashing, and awkward float drifting.
              const handleScrollToClose = (e) => {
                // If the scroll happened inside the slash command items list itself, let it scroll
                if (component.element && component.element.contains(e.target)) {
                  return;
                }
                popup?.[0]?.destroy();
              };

              window.addEventListener('scroll', handleScrollToClose, { capture: true, passive: true });
              component._cleanupScroll = () => {
                window.removeEventListener('scroll', handleScrollToClose, { capture: true, passive: true });
              };
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
              component?._cleanupScroll?.();
              if (popup?.[0] && !popup[0].state?.isDestroyed) {
                popup[0].destroy();
              }
              component?.destroy();
            },
          };
        },
      }),
    ];
  },
});
