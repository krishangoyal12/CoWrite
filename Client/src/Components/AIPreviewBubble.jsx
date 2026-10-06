import React, { useState, useMemo } from 'react';
import { LuSparkles, LuCheck, LuX, LuRotateCcw, LuCopy, LuEye, LuGitCompare } from 'react-icons/lu';
import toast from 'react-hot-toast';
import * as Diff from 'diff';

// Helper to convert HTML string to plain text for diffing
function extractPlainText(htmlOrText) {
  if (!htmlOrText) return '';
  const div = document.createElement('div');
  div.innerHTML = htmlOrText;
  return div.innerText || div.textContent || '';
}

export const AIPreviewBubble = ({
  task,
  originalText = '',
  result,
  loading,
  targetScope,
  onAccept,
  onDiscard,
  onRegenerate,
}) => {
  const [copied, setCopied] = useState(false);
  const isComparisonTask = task === 'improve_document' || task === 'grammar_check';
  const [activeTab, setActiveTab] = useState(isComparisonTask ? 'diff' : 'clean');

  const getTaskTitle = () => {
    switch (task) {
      case 'summarize_document':
        return 'Document Summary';
      case 'improve_document':
        return 'Writing Improvements';
      case 'grammar_check':
        return 'Grammar & Polish Check';
      case 'generate':
        return 'AI Generated Content';
      default:
        return 'AI Result';
    }
  };

  const handleCopy = () => {
    const text = extractPlainText(result);
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // Compute word/token-level diff between original text and AI result
  const diffChunks = useMemo(() => {
    if (!isComparisonTask || !originalText || !result) {
      return null;
    }
    const cleanOrig = extractPlainText(originalText).trim();
    const cleanResult = extractPlainText(result).trim();

    if (!cleanOrig || !cleanResult) {
      return null;
    }

    return Diff.diffWordsWithSpace(cleanOrig, cleanResult);
  }, [isComparisonTask, originalText, result]);

  // Count changes
  const changeStats = useMemo(() => {
    if (!diffChunks) return { additions: 0, deletions: 0 };
    let additions = 0;
    let deletions = 0;
    diffChunks.forEach((part) => {
      if (part.added) additions++;
      if (part.removed) deletions++;
    });
    return { additions, deletions };
  }, [diffChunks]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-[680px] max-h-[88vh] bg-white rounded-2xl shadow-2xl border border-gray-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white border-b border-gray-150">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <LuSparkles className="text-base" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900 leading-tight">
                  {getTaskTitle()}
                </h3>
                {isComparisonTask && diffChunks && (
                  <div className="flex items-center gap-1.5 text-[11px] font-medium">
                    {changeStats.additions > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
                        +{changeStats.additions} added
                      </span>
                    )}
                    {changeStats.deletions > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px]">
                        -{changeStats.deletions} removed
                      </span>
                    )}
                  </div>
                )}
              </div>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                {targetScope === 'selection' ? 'Context: Selected text' : 'Context: Document up to cursor'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Diff / Clean Preview Mode Switcher */}
            {isComparisonTask && !loading && diffChunks && (
              <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('diff')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${
                    activeTab === 'diff'
                      ? 'bg-white text-gray-800 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                  title="Show highlighted diff (red removed, green added)"
                >
                  <LuGitCompare className="text-xs" />
                  <span>Changes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('clean')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${
                    activeTab === 'clean'
                      ? 'bg-white text-gray-800 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                  title="Show final clean text"
                >
                  <LuEye className="text-xs" />
                  <span>Final</span>
                </button>
              </div>
            )}

            {result && !loading && (
              <button
                onClick={handleCopy}
                className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-xs flex items-center gap-1 px-2.5"
                title="Copy to clipboard"
              >
                <LuCopy className="text-sm" />
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}

            <button
              onClick={onDiscard}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close preview (Esc)"
            >
              <LuX className="text-lg" />
            </button>
          </div>
        </div>

        {/* Preview Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 text-left">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-gray-600 animate-pulse">
                Groq AI is reviewing and improving your text...
              </p>
            </div>
          ) : isComparisonTask && activeTab === 'diff' && diffChunks ? (
            /* Diff Highlighting Mode (Red removed, Green added) */
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs text-sm leading-relaxed whitespace-pre-wrap font-sans text-gray-800 select-text">
              <div className="mb-3 pb-2 border-b border-gray-100 flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                  <span className="text-rose-700 font-medium">Red strikethrough</span> = original text removed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                  <span className="text-emerald-700 font-medium">Green highlight</span> = improved correction
                </span>
              </div>
              <div className="leading-relaxed">
                {diffChunks.map((part, index) => {
                  if (part.added) {
                    return (
                      <span
                        key={index}
                        className="bg-emerald-100 text-emerald-900 px-0.5 rounded-xs font-medium border-b-2 border-emerald-400 shadow-2xs"
                      >
                        {part.value}
                      </span>
                    );
                  }
                  if (part.removed) {
                    return (
                      <span
                        key={index}
                        className="bg-rose-100 text-rose-800 line-through decoration-rose-600 decoration-1 px-0.5 rounded-xs opacity-75"
                      >
                        {part.value}
                      </span>
                    );
                  }
                  return <span key={index}>{part.value}</span>;
                })}
              </div>
            </div>
          ) : (
            /* Clean Document Mode (HTML prose formatted exactly as rendered in the document) */
            <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-sm leading-relaxed text-black">
              {task === 'summarize_document' && (
                <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-2 text-[11px] text-gray-400 font-medium tracking-wide uppercase">
                  <span>Document Append Preview</span>
                  <span className="text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md">Formatted Output</span>
                </div>
              )}
              <div 
                className="prose max-w-none text-left text-black tiptap-editor"
                dangerouslySetInnerHTML={{ __html: result }}
              />
            </div>
          )}
        </div>

        {/* Action Controls Footer */}
        <div className="px-5 py-3.5 bg-white border-t border-gray-150 flex items-center justify-between gap-3">
          <div className="text-[11px] text-gray-400">
            {isComparisonTask
              ? 'Accepting will replace the text with the improved version'
              : 'Read-only preview • Changes apply only when you accept'}
          </div>

          <div className="flex items-center gap-2">
            {!loading && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 active:scale-95 rounded-lg transition-all"
              >
                <LuRotateCcw className="text-xs" />
                <span>Retry</span>
              </button>
            )}
            
            <button
              onClick={onDiscard}
              className="px-3.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 active:scale-95 rounded-lg transition-all"
            >
              Discard
            </button>

            <button
              onClick={onAccept}
              disabled={loading || !result}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LuCheck className="text-sm" />
              <span>{isComparisonTask ? 'Accept & Replace' : 'Insert into Document'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
