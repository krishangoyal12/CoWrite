import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  LuSparkles, 
  LuX, 
  LuSend, 
  LuBot, 
  LuCopy, 
  LuCheck, 
  LuTrash2, 
  LuArrowDownToLine,
  LuWand,
  LuGripVertical
} from 'react-icons/lu';
import toast from 'react-hot-toast';

export const AskDocSidebar = ({
  isOpen,
  onClose,
  editor,
}) => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your AI document assistant. Ask me questions about this document, request summaries of specific sections, or brainstorm ideas.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [applyingFixId, setApplyingFixId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [width, setWidth] = useState(380); // adjustable width in px
  const [isResizing, setIsResizing] = useState(false);
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-resize textarea as user types (like Antigravity / modern chat interfaces)
  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const nextHeight = Math.min(el.scrollHeight, 160); // max height 160px
    el.style.height = `${Math.max(nextHeight, 42)}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [messages, isOpen]);

  // Resizable drag handle logic
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      // Clamp sidebar width between 300px and 700px (or max 75% screen)
      const clampedWidth = Math.min(Math.max(newWidth, 300), Math.min(760, window.innerWidth * 0.75));
      setWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) setIsResizing(false);
    };

    if (isResizing) {
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleCopy = (id, text) => {
    const temp = document.createElement('div');
    temp.innerHTML = text;
    const cleanText = temp.innerText || temp.textContent || '';
    navigator.clipboard.writeText(cleanText);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsertRaw = (htmlOrText) => {
    if (!editor) return;
    const pos = editor.state.selection.from;
    editor.chain().focus().insertContentAt(pos, htmlOrText).run();
    toast.success('Inserted into document');
  };

  // Smart Insert / Apply Corrections:
  // If the message is a critique/suggestions response, apply the fixes directly to the document text!
  const handleApplyCorrections = async (msgId, critiqueText) => {
    if (!editor || applyingFixId) return;
    setApplyingFixId(msgId);
    toast.loading('Applying suggested corrections to document...', { id: 'critique-apply' });

    try {
      const url = `${import.meta.env.VITE_URL}/api/ai/generate`;
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const docHTML = editor.getHTML();

      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          text: critiqueText,
          task: 'apply_critique',
          docHTML,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to apply corrections');
      }

      // Update the document with the revised content
      editor.chain().focus().setContent(data.data, true).run();
      toast.success('Corrections successfully applied to document!', { id: 'critique-apply' });
    } catch (err) {
      toast.error(err.message || 'Failed to apply corrections', { id: 'critique-apply' });
    } finally {
      setApplyingFixId(null);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Conversation cleared. How can I help you with this document?',
        timestamp: new Date(),
      },
    ]);
  };

  const executeQuery = async (queryText) => {
    const promptText = (queryText || input).trim();
    if (!promptText || loading) return;

    const userMessageId = Date.now().toString();
    const newUserMsg = {
      id: userMessageId,
      role: 'user',
      content: promptText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '42px';
    }
    setLoading(true);

    try {
      const url = `${import.meta.env.VITE_URL}/api/ai/generate`;
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const docHTML = editor ? editor.getHTML() : '';

      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          text: promptText,
          task: 'ask_document',
          docHTML,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to get answer from AI');
      }

      const botMessageId = (Date.now() + 1).toString();
      const newBotMsg = {
        id: botMessageId,
        role: 'assistant',
        content: data.data || '',
        isCritique: /critique|improve|feedback|suggestions|weakness|strengthen/i.test(promptText),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newBotMsg]);
    } catch (err) {
      toast.error(err.message || 'Failed to answer question');
      const errorMessageId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        {
          id: errorMessageId,
          role: 'assistant',
          content: `<p class="text-rose-600 font-medium">Sorry, I encountered an error: ${err.message}. Please try again.</p>`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeQuery();
    }
  };

  if (!isOpen) return null;

  return (
    <aside 
      style={{ width: `${width}px` }}
      className="relative bg-white border-l border-gray-200/90 shadow-2xl flex flex-col z-30 h-full animate-in slide-in-from-right duration-200 shrink-0 text-left select-text"
    >
      {/* Draggable Resizer Gutter Handle on Left Border */}
      <div
        onMouseDown={handleMouseDown}
        className={`absolute top-0 bottom-0 left-0 w-2 -ml-1 cursor-ew-resize z-40 transition-colors flex items-center justify-center group ${
          isResizing ? 'bg-blue-500/20' : 'hover:bg-blue-400/20'
        }`}
        title="Drag to resize sidebar width"
      >
        <div className="w-1 h-8 rounded-full bg-gray-300 group-hover:bg-blue-500 transition-colors" />
      </div>

      {/* Sidebar Header */}
      <div className="px-4 py-3.5 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-white border-b border-gray-200 flex items-center justify-between text-left">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <LuSparkles className="text-sm" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-900 leading-none">
                Doc Copilot
              </h2>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 tracking-wider">
                Groq AI
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium leading-none mt-1">
              Ask anything about this document
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleClearHistory}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Clear Chat History"
          >
            <LuTrash2 className="text-sm" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close Copilot (Esc)"
          >
            <LuX className="text-base" />
          </button>
        </div>
      </div>

      {/* Quick Prompts Suggestions Bar (Submits Immediately on Click) */}
      <div className="px-4 py-2 bg-gray-50/80 border-b border-gray-150 flex items-center gap-2 overflow-x-auto text-[11px] scrollbar-none text-left">
        <span className="text-gray-400 font-medium shrink-0">Try:</span>
        <button
          onClick={() => executeQuery('What are the main key points of this document?')}
          disabled={loading}
          className="shrink-0 px-2.5 py-1 bg-white border border-gray-200 rounded-full text-gray-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 transition-colors disabled:opacity-50"
        >
          Key points
        </button>
        <button
          onClick={() => executeQuery('Critique this document draft and suggest specific improvements.')}
          disabled={loading}
          className="shrink-0 px-2.5 py-1 bg-white border border-gray-200 rounded-full text-gray-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 transition-colors disabled:opacity-50"
        >
          Critique draft
        </button>
        <button
          onClick={() => executeQuery('Write a concise executive summary of this document.')}
          disabled={loading}
          className="shrink-0 px-2.5 py-1 bg-white border border-gray-200 rounded-full text-gray-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 transition-colors disabled:opacity-50"
        >
          Executive summary
        </button>
      </div>

      {/* Messages Thread Container (Clean Left-Aligned Text) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 text-left">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group text-left`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  {isUser ? 'You' : 'Doc Copilot'}
                </span>
              </div>

              <div
                className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-2xs text-left ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-xs'
                    : 'bg-white text-gray-800 border border-gray-200/90 rounded-tl-xs'
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap text-left break-words">{msg.content}</p>
                ) : (
                  <div
                    className="prose prose-sm max-w-none text-gray-800 leading-relaxed text-left break-words"
                    dangerouslySetInnerHTML={{ __html: msg.content }}
                  />
                )}
              </div>

              {/* Message Action Utilities for Assistant Responses */}
              {!isUser && msg.id !== 'welcome' && (
                <div className="flex items-center gap-2 mt-1.5 px-1 opacity-75 group-hover:opacity-100 transition-opacity flex-wrap text-left">
                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-800 py-0.5 px-1.5 rounded hover:bg-gray-100 transition-colors"
                    title="Copy response"
                  >
                    {copiedId === msg.id ? (
                      <LuCheck className="text-emerald-600 text-xs" />
                    ) : (
                      <LuCopy className="text-xs" />
                    )}
                    <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                  </button>

                  {/* Apply Fixes / Corrections Button — ONLY shown when asked for critique / improvements */}
                  {msg.isCritique && (
                    <button
                      onClick={() => handleApplyCorrections(msg.id, msg.content)}
                      disabled={applyingFixId === msg.id}
                      className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 py-0.5 px-1.5 rounded bg-blue-50/70 hover:bg-blue-100/70 transition-colors font-medium disabled:opacity-50"
                      title="Automatically apply recommended improvements and corrections to the document"
                    >
                      <LuWand className="text-xs" />
                      <span>{applyingFixId === msg.id ? 'Applying corrections...' : 'Apply corrections to doc'}</span>
                    </button>
                  )}

                  {/* Plain Insert Option */}
                  <button
                    onClick={() => handleInsertRaw(msg.content)}
                    className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-800 py-0.5 px-1.5 rounded hover:bg-gray-100 transition-colors"
                    title="Insert text at cursor in document"
                  >
                    <LuArrowDownToLine className="text-xs" />
                    <span>Insert into doc</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-2.5 text-left">
            <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <LuBot className="text-xs" />
            </div>
            <div className="bg-white border border-gray-200/90 rounded-2xl rounded-tl-xs px-4 py-3 shadow-2xs flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-gray-400 font-medium ml-1">Analyzing document...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Multi-Line Expanding Input Footer (Antigravity Style) */}
      <div className="p-3 bg-white border-t border-gray-200/90 text-left">
        <div className="relative flex items-end border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-600 transition-all bg-white shadow-2xs p-1.5">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this document... (Shift+Enter for new line)"
            disabled={loading}
            rows={1}
            className="w-full py-1.5 pl-2.5 pr-9 text-xs sm:text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400 disabled:opacity-50 resize-none max-h-40 overflow-y-auto leading-relaxed text-left"
          />
          <button
            type="button"
            onClick={() => executeQuery()}
            disabled={!input.trim() || loading}
            className="absolute right-2.5 bottom-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs shrink-0"
            title="Send question (Enter)"
          >
            <LuSend className="text-xs" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-gray-400">
          <span>Real-time document context enabled</span>
          <span>Enter ↵ to send • Shift+Enter for newline</span>
        </div>
      </div>
    </aside>
  );
};
