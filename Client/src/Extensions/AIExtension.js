import { Extension } from '@tiptap/core';
import toast from 'react-hot-toast';

async function callAI(text, task, docHTML = "") {
  const url = `${import.meta.env.VITE_URL}/api/ai/generate`;

  const token = localStorage.getItem("token");
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify({
      text,
      task,
      docHTML
    })
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to get response from AI');
  }

  return data.data;
}

export const AIExtension = Extension.create({
  name: 'ai',

  addOptions() {
    return {
      apiKey: '',
    };
  },

  addCommands() {
    return {
      generateText: (attributes) => ({ editor }) => {
        const { state } = editor;
        const { from, to } = state.selection;
        const text = attributes.prompt || state.doc.textBetween(from, to, ' ');
        const task = attributes.task || 'generate';

        const insertPos = task === 'ask_document' ? editor.state.doc.content.size : from;

        const docHTML = task === 'ask_document' ? editor.getHTML() : "";
        
        toast.loading(task === 'ask_document' ? 'AI is answering...' : 'AI is generating content...', { id: 'ai-global' });

        callAI(text, task, docHTML)
          .then(result => {
            toast.success('Done!', { id: 'ai-global' });
            const startPos = insertPos;
            const htmlResult = `<span class="ai-highlight-fade">${result}</span>`;
            
            // Insert content and focus right at the start of the inserted text (top)
            editor
              .chain()
              .insertContentAt(startPos, htmlResult)
              .setTextSelection(startPos)
              .scrollIntoView()
              .run();
            
            setTimeout(() => {
              if (editor.isDestroyed) return;
              const { doc, tr } = editor.state;
              let newTr = tr;
              const markType = editor.schema.marks.aiHighlight;
              if (!markType) return;
              doc.descendants((node, pos) => {
                if (node.marks && node.marks.find(m => m.type === markType)) {
                  newTr = newTr.removeMark(pos, pos + node.nodeSize, markType);
                }
              });
              editor.view.dispatch(newTr);
            }, 3000);
          })
          .catch(error => {
            toast.error(`Error: ${error.message}`, { id: 'ai-global' });
          });
        return true;
      },

      summarizeDocument: () => ({ editor }) => {
        const originalContent = editor.getHTML();
        toast.loading('AI is summarizing...', { id: 'ai-global' });
        callAI(originalContent, 'summarize_document')
          .then(result => {
            toast.success('Summary complete!', { id: 'ai-global' });
            const startPos = editor.state.doc.content.size;
            // Insert summary and scroll/set cursor to the start of the summary
            editor
              .chain()
              .insertContentAt(startPos, result)
              .setTextSelection(startPos)
              .scrollIntoView()
              .run();
          })
          .catch(error => {
            toast.error(`Summarization failed: ${error.message}`, { id: 'ai-global' });
          });
        return true;
      },

      improveDocument: () => ({ editor }) => {
        const originalContent = editor.getHTML();
        toast.loading('AI is improving the document...', { id: 'ai-global' });
        callAI(originalContent, 'improve_document')
          .then(result => {
            toast.success('Document improved!', { id: 'ai-global' });
            editor.chain().setContent(result, true).setTextSelection(0).scrollIntoView().run();
          })
          .catch(error => {
            toast.error(`Improvement failed: ${error.message}`, { id: 'ai-global' });
          });
        return true;
      },

      changeTone: (tone) => ({ editor }) => {
        const originalContent = editor.getHTML();
        toast.loading(`AI is changing tone to ${tone}...`, { id: 'ai-global' });
        callAI(originalContent, `change_tone_${tone}`)
          .then(result => {
            toast.success('Tone changed!', { id: 'ai-global' });
            editor.chain().setContent(result, true).setTextSelection(0).scrollIntoView().run();
          })
          .catch(error => {
            toast.error(`Failed to change tone: ${error.message}`, { id: 'ai-global' });
          });
        return true;
      },

      formatDocument: () => ({ editor }) => {
        const originalContent = editor.getHTML();
        toast.loading('AI is formatting the document...', { id: 'ai-global' });
        callAI(originalContent, 'format_document')
          .then(result => {
            toast.success('Document formatted!', { id: 'ai-global' });
            editor.chain().setContent(result, true).setTextSelection(0).scrollIntoView().run();
          })
          .catch(error => {
            toast.error(`Formatting failed: ${error.message}`, { id: 'ai-global' });
          });
        return true;
      },

      bulletSummary: () => ({ editor }) => {
        const fullText = editor.state.doc.textContent;
        toast.loading('Creating bullet summary...', { id: 'ai-global' });
        
        callAI(fullText, 'bullet_summary')
          .then(result => {
            toast.success('Summary created!', { id: 'ai-global' });
            const startPos = editor.state.doc.content.size;
            const htmlResult = `<span class="ai-highlight-fade">${result}</span>`;
            
            editor
              .chain()
              .insertContentAt(startPos, htmlResult)
              .setTextSelection(startPos)
              .scrollIntoView()
              .run();
            
            setTimeout(() => {
              if (editor.isDestroyed) return;
              const { doc, tr } = editor.state;
              let newTr = tr;
              const markType = editor.schema.marks.aiHighlight;
              if (!markType) return;
              doc.descendants((node, pos) => {
                if (node.marks && node.marks.find(m => m.type === markType)) {
                  newTr = newTr.removeMark(pos, pos + node.nodeSize, markType);
                }
              });
              editor.view.dispatch(newTr);
            }, 3000);
          })
          .catch(() => { /* Error handled in toast */ });
        return true;
      },

      grammarCheck: () => ({ editor }) => {
        const fullText = editor.state.doc.textContent;
        toast.loading('Checking grammar...', { id: 'ai-global' });

        callAI(fullText, 'grammar_check')
          .then(result => {
            toast.success('Grammar checked!', { id: 'ai-global' });
            const startPos = editor.state.doc.content.size;
            const htmlResult = `<span class="ai-highlight-fade">${result}</span>`;
            
            editor
              .chain()
              .insertContentAt(startPos, htmlResult)
              .setTextSelection(startPos)
              .scrollIntoView()
              .run();
            
            setTimeout(() => {
              if (editor.isDestroyed) return;
              const { doc, tr } = editor.state;
              let newTr = tr;
              const markType = editor.schema.marks.aiHighlight;
              if (!markType) return;
              doc.descendants((node, pos) => {
                if (node.marks && node.marks.find(m => m.type === markType)) {
                  newTr = newTr.removeMark(pos, pos + node.nodeSize, markType);
                }
              });
              editor.view.dispatch(newTr);
            }, 3000);
          })
          .catch(() => { /* Error handled in toast */ });
        return true;
      },
    };
  },
});