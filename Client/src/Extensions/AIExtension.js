import { Extension } from '@tiptap/core';
import toast from 'react-hot-toast';

async function callGeminiAI(text, task, apiKey, docHTML = "") {
  let basePrompt;

  // Define the core task for the AI
  switch (task) {
    case 'summarize_document':
      basePrompt = `You are an expert summarizer. Review the following document and provide a concise, well-structured summary. The summary should capture the key points and main ideas.\n\nDOCUMENT:\n\n${text}`;
      break;
    case 'improve_document':
      basePrompt = `You are an expert editor. Review the following document and improve it. Fix any spelling and grammar mistakes, enhance clarity, and ensure it has a professional tone. Preserve the original structure (headings, paragraphs, lists, etc.) as much as possible.\n\nDOCUMENT:\n\n${text}`;
      break;
    case 'change_tone_professional':
      basePrompt = `Rewrite the following document in a more formal and professional tone. Preserve the original structure (headings, paragraphs, lists, etc.) as much as possible.\n\nDOCUMENT:\n\n${text}`;
      break;
    case 'bullet_summary':
      basePrompt = `Summarize the following text as a list of concise bullet points.\n\nTEXT:\n\n${text}`;
      break;
    case 'grammar_check':
      basePrompt = `Check the following text for grammar and spelling mistakes. Provide a corrected version, explaining the key changes made.\n\nTEXT:\n\n${text}`;
      break;
    case 'ask_document':
      basePrompt = `Based on the provided document content, answer the following question. Provide the answer as a clear, concise paragraph.\n\nDOCUMENT:\n\n${docHTML}\n\n---\n\nQUESTION: ${text}`;
      break;
    case 'format_document':
      basePrompt = `You are an expert document formatter. Review the following document and apply professional formatting. This includes adding appropriate headings (h1, h2, h3), using bold for emphasis, creating bulleted or numbered lists where appropriate, and structuring the content for readability.\n\nDOCUMENT:\n\n${text}`;
      break;
    default: // 'generate' or custom prompt
      basePrompt = text;
  }

  // Add a strict instruction to every prompt to ensure clean HTML output
  const instruction = "\n\nIMPORTANT: Your response must be only the raw HTML content for the result. Do not include any Markdown formatting (like ```, #, or *). Do not add any explanations, notes, or text outside of the final HTML content.";
  const prompt = basePrompt + instruction;

  const model = 'gemini-1.5-flash-latest';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        topP: 0.8,
        topK: 40
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to get response from AI');
  }

  const data = await response.json();
  let result = data.candidates[0].content.parts[0].text;

  result = result.replace(/^```html\s*([\s\S]*?)```$/im, '$1')
    .replace(/^```\s*([\s\S]*?)```$/im, '$1')
    .trim();

  // As a fallback, still clean any Markdown code blocks just in case
  result = result
    .replace(/(<br\s*\/?>\s*){2,}/gi, '<br>')
    .replace(/<p>\s*<\/p>/gi, '')
    .replace(/^(<br\s*\/?>|<p>\s*<\/p>)+/gi, '') // remove leading
    .replace(/(<br\s*\/?>|<p>\s*<\/p>)+$/gi, '') // remove trailing
    .replace(/\s{2,}/g, ' ')
    .trim();

  return result;
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
        const loadingText = `⏳ Processing... [id:${Date.now()}]`;

        const insertPos = task === 'ask_document' ? editor.state.doc.content.size : from;
        editor.chain().focus().insertContentAt(insertPos, loadingText).run();

        const apiKey = this.options.apiKey;
        const docHTML = task === 'ask_document' ? editor.getHTML() : "";

        callGeminiAI(text, task, apiKey, docHTML)
          .then(result => {
            const { doc } = editor.state;
            let fromPos = -1, toPos = -1;
            doc.descendants((node, pos) => {
              if (node.isText && node.text.includes(loadingText)) {
                fromPos = pos + node.text.indexOf(loadingText);
                toPos = fromPos + loadingText.length;
                return false;
              }
            });
            if (fromPos !== -1) {
              editor.chain().focus().deleteRange({ from: fromPos, to: toPos }).insertContentAt(fromPos, result).run();
            }
          })
          .catch(error => {
            const { doc } = editor.state;
            let fromPos = -1, toPos = -1;
            doc.descendants((node, pos) => {
              if (node.isText && node.text.includes(loadingText)) {
                fromPos = pos + node.text.indexOf(loadingText);
                toPos = fromPos + loadingText.length;
                return false;
              }
            });
            if (fromPos !== -1) {
              editor.chain().focus().deleteRange({ from: fromPos, to: toPos }).insertContentAt(fromPos, `⚠️ Error: ${error.message}`).run();
            }
          });
        return true;
      },

      summarizeDocument: () => ({ editor }) => {
        const originalContent = editor.getHTML();
        toast.loading('AI is summarizing...', { id: 'ai-global' });
        const apiKey = this.options.apiKey;
        callGeminiAI(originalContent, 'summarize_document', apiKey)
          .then(result => {
            toast.success('Summary complete!', { id: 'ai-global' });
            // Insert summary at the end of the document
            editor.chain().focus().insertContentAt(editor.state.doc.content.size, "\n\n" + result).run();
          })
          .catch(error => {
            toast.error(`Summarization failed: ${error.message}`, { id: 'ai-global' });
          });
        return true;
      },

      improveDocument: () => ({ editor }) => {
        const originalContent = editor.getHTML();
        toast.loading('AI is improving the document...', { id: 'ai-global' });
        const apiKey = this.options.apiKey;
        callGeminiAI(originalContent, 'improve_document', apiKey)
          .then(result => {
            toast.success('Document improved!', { id: 'ai-global' });
            editor.commands.setContent(result, true);
          })
          .catch(error => {
            toast.error(`Improvement failed: ${error.message}`, { id: 'ai-global' });
          });
        return true;
      },

      changeTone: (tone) => ({ editor }) => {
        const originalContent = editor.getHTML();
        toast.loading(`AI is changing tone to ${tone}...`, { id: 'ai-global' });
        const apiKey = this.options.apiKey;
        callGeminiAI(originalContent, `change_tone_${tone}`, apiKey)
          .then(result => {
            toast.success('Tone changed!', { id: 'ai-global' });
            editor.commands.setContent(result, true);
          })
          .catch(error => {
            toast.error(`Failed to change tone: ${error.message}`, { id: 'ai-global' });
          });
        return true;
      },

      formatDocument: () => ({ editor }) => {
        const originalContent = editor.getHTML();
        toast.loading('AI is formatting the document...', { id: 'ai-global' });
        const apiKey = this.options.apiKey;
        callGeminiAI(originalContent, 'format_document', apiKey)
          .then(result => {
            toast.success('Document formatted!', { id: 'ai-global' });
            editor.commands.setContent(result, true);
          })
          .catch(error => {
            toast.error(`Formatting failed: ${error.message}`, { id: 'ai-global' });
          });
        return true;
      },

      bulletSummary: () => ({ editor }) => {
        const fullText = editor.state.doc.textContent;
        const loadingText = `\n\n⏳ Creating bullet summary... [id:${Date.now()}]`;
        editor.chain().focus().insertContentAt(editor.state.doc.content.size, loadingText).run();
        const apiKey = this.options.apiKey;
        callGeminiAI(fullText, 'bullet_summary', apiKey)
          .then(result => {
            const { doc } = editor.state;
            let fromPos = -1, toPos = -1;
            doc.descendants((node, pos) => {
              if (node.isText && node.text.includes(loadingText.trim())) {
                fromPos = pos + node.text.indexOf(loadingText.trim());
                toPos = fromPos + loadingText.trim().length;
                return false;
              }
            });
            if (fromPos !== -1) {
              editor.chain().focus().deleteRange({ from: fromPos, to: toPos }).insertContentAt(fromPos, result).run();
            }
          })
          .catch(() => { /* Error handled in generateText */ });
        return true;
      },

      grammarCheck: () => ({ editor }) => {
        const fullText = editor.state.doc.textContent;
        const loadingText = `\n\n⏳ Checking grammar... [id:${Date.now()}]`;
        editor.chain().focus().insertContentAt(editor.state.doc.content.size, loadingText).run();
        const apiKey = this.options.apiKey;
        callGeminiAI(fullText, 'grammar_check', apiKey)
          .then(result => {
            const { doc } = editor.state;
            let fromPos = -1, toPos = -1;
            doc.descendants((node, pos) => {
              if (node.isText && node.text.includes(loadingText.trim())) {
                fromPos = pos + node.text.indexOf(loadingText.trim());
                toPos = fromPos + loadingText.trim().length;
                return false;
              }
            });
            if (fromPos !== -1) {
              editor.chain().focus().deleteRange({ from: fromPos, to: toPos }).insertContentAt(fromPos, result).run();
            }
          })
          .catch(() => { /* Error handled in generateText */ });
        return true;
      },
    };
  },
});