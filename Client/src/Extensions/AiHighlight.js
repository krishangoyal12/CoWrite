import { Mark, mergeAttributes } from '@tiptap/core';

export const AiHighlight = Mark.create({
  name: 'aiHighlight',

  parseHTML() {
    return [
      {
        tag: 'span.ai-highlight-fade',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { class: 'ai-highlight-fade' }), 0];
  },
});
