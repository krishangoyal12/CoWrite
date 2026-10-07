import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { DocumentTrie } from '../Utils/textTrie';
import { findPhraseCompletion } from '../Utils/phraseDictionary';

export const textPredictionPluginKey = new PluginKey('textPrediction');

export const TextPredictionExtension = Extension.create({
  name: 'textPrediction',

  addOptions() {
    return {
      enabled: true,
      localDebounceMs: 60,  // Non-LLM (Trie + N-Gram phrases) triggers near-instantly (0-100ms)
      llmDebounceMs: 250,   // LLM deep continuation triggers at 250ms
      minPrefixLength: 2,
      getDocTitle: () => '',
    };
  },

  addStorage() {
    return {
      activeSuggestion: '',
      suggestionPos: null,
      isLoading: false,
      abortController: null,
      trie: new DocumentTrie(),
    };
  },

  addCommands() {
    return {
      acceptPrediction: () => ({ tr, dispatch, state }) => {
        const pluginState = textPredictionPluginKey.getState(state);
        if (pluginState && pluginState.suggestion && pluginState.pos !== null) {
          const { suggestion, pos } = pluginState;
          
          if (dispatch) {
            // 1. Insert text cleanly at the suggestion anchor
            tr.insertText(suggestion, pos);
            // 2. Set cursor right after the newly inserted text
            const endPos = pos + suggestion.length;
            tr.setSelection(state.selection.constructor.near(tr.doc.resolve(endPos)));
            // 3. Clear decoration in the same atomic transaction
            tr.setMeta(textPredictionPluginKey, { clear: true });
            dispatch(tr.scrollIntoView());
          }
          return true;
        }
        return false;
      },
      dismissPrediction: () => ({ tr, dispatch, state }) => {
        const pluginState = textPredictionPluginKey.getState(state);
        if (pluginState && pluginState.suggestion) {
          if (dispatch) {
            tr.setMeta(textPredictionPluginKey, { clear: true });
            dispatch(tr);
          }
          return true;
        }
        return false;
      },
      triggerPrediction: () => ({ state, view }) => {
        const { selection } = state;
        if (!selection.empty) return false;
        
        // Manual shortcut forces instant LLM completion without waiting 3s
        this.options.fetchLLMPrediction?.(view, true);
        return true;
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        const state = editor.state;
        const pluginState = textPredictionPluginKey.getState(state);
        if (pluginState && pluginState.suggestion && pluginState.pos !== null) {
          return editor.commands.acceptPrediction();
        }
        return false; // let normal Tab behave (indent, lists, etc.)
      },
      ArrowRight: ({ editor }) => {
        const state = editor.state;
        const pluginState = textPredictionPluginKey.getState(state);
        if (pluginState && pluginState.suggestion && state.selection.from === pluginState.pos) {
          return editor.commands.acceptPrediction();
        }
        return false;
      },
      Escape: ({ editor }) => {
        const state = editor.state;
        const pluginState = textPredictionPluginKey.getState(state);
        if (pluginState && pluginState.suggestion) {
          return editor.commands.dismissPrediction();
        }
        return false;
      },
      // Manual trigger shortcut: Ctrl+Space or Cmd+Space
      'Mod-Space': ({ editor }) => {
        return editor.commands.triggerPrediction();
      },
    };
  },

  addProseMirrorPlugins() {
    const extension = this;
    const docTrie = new DocumentTrie();
    let localTimer = null;
    let llmTimer = null;
    let abortCtrl = null;
    let trieRebuildTimeout = null;

    // Helper: Display ghost text suggestion in editor
    const showSuggestion = (view, suggestion, pos) => {
      if (!suggestion || typeof suggestion !== 'string') return;
      if (!view.state.selection.empty || view.state.selection.from !== pos) return;

      view.dispatch(
        view.state.tr.setMeta(textPredictionPluginKey, {
          suggestion,
          pos,
        })
      );
    };

    // Tier 1 & Tier 2: Non-LLM local matching (Trie + N-Gram) after 1.5 seconds
    const requestLocalPrediction = (view) => {
      if (!extension.options.enabled) return false;
      const { state } = view;
      const { selection } = state;
      if (!selection.empty) return false;

      const pos = selection.from;
      const $pos = selection.$from;
      if ($pos.parent.type.name === 'codeBlock') return false;

      const blockStart = $pos.start();
      const prefixInBlock = state.doc.textBetween(blockStart, pos, '\n');
      if (prefixInBlock.trim().length < 2) return false;

      // 1. Check Tier 2: N-Gram Phrase Dictionary (e.g. "in order to" -> "achieve our goals")
      const phraseMatch = findPhraseCompletion(prefixInBlock);
      if (phraseMatch) {
        showSuggestion(view, phraseMatch, pos);
        return true;
      }

      // 2. Check Tier 1: In-Document Trie for current word completion (e.g. "or" -> "der", "collab" -> "orators")
      const lastWordMatch = prefixInBlock.match(/([a-zA-Z]{2,})$/);
      if (lastWordMatch) {
        const currentPrefix = lastWordMatch[1];
        const trieSuffix = docTrie.findCompletion(currentPrefix);
        if (trieSuffix) {
          showSuggestion(view, trieSuffix, pos);
          return true;
        }
      }

      return false;
    };

    // Tier 4: Cloud LLM completion after 3.0 seconds (if local tier didn't match)
    const requestLLMPrediction = async (view, force = false) => {
      if (!extension.options.enabled) return;

      const { state } = view;
      const { selection } = state;
      if (!selection.empty) return;

      // If a local suggestion is already actively visible, don't overwrite it
      const currentPluginState = textPredictionPluginKey.getState(state);
      if (currentPluginState && currentPluginState.suggestion && !force) {
        return;
      }

      const pos = selection.from;
      const $pos = selection.$from;
      if ($pos.parent.type.name === 'codeBlock') return;

      const blockStart = $pos.start();
      const prefixInBlock = state.doc.textBetween(blockStart, pos, '\n');
      if (!force && prefixInBlock.trim().length < extension.options.minPrefixLength) {
        return;
      }

      const contextStart = Math.max(0, pos - 150);
      const prefix = state.doc.textBetween(contextStart, pos, '\n');
      const suffix = '';

      if (abortCtrl) {
        abortCtrl.abort();
      }
      abortCtrl = new AbortController();

      try {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const docTitle = extension.options.getDocTitle?.() || '';

        const res = await fetch(`${import.meta.env.VITE_URL}/api/ai/predict`, {
          method: 'POST',
          credentials: 'include',
          headers,
          signal: abortCtrl.signal,
          body: JSON.stringify({
            prefix,
            suffix,
            docTitle,
          }),
        });

        if (!res.ok) return;
        const data = await res.json();
        const suggestion = data.data;

        if (
          suggestion &&
          typeof suggestion === 'string' &&
          view.state.selection.empty &&
          view.state.selection.from === pos
        ) {
          showSuggestion(view, suggestion, pos);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          // network error ignored
        }
      }
    };

    extension.options.fetchLLMPrediction = requestLLMPrediction;

    return [
      new Plugin({
        key: textPredictionPluginKey,
        state: {
          init() {
            return {
              suggestion: '',
              pos: null,
              decos: DecorationSet.empty,
            };
          },
          apply(tr, pluginState, oldState, newState) {
            const meta = tr.getMeta(textPredictionPluginKey);

            if (meta?.clear) {
              return { suggestion: '', pos: null, decos: DecorationSet.empty };
            }

            if (meta?.suggestion) {
              const widgetEl = document.createElement('span');
              widgetEl.className = 'cowrite-ghost-text select-none pointer-events-none';
              widgetEl.setAttribute('aria-hidden', 'true');
              
              const textSpan = document.createElement('span');
              textSpan.textContent = meta.suggestion;
              widgetEl.appendChild(textSpan);

              // Small shortcut badge (Tab)
              const badge = document.createElement('span');
              badge.className = 'cowrite-ghost-badge ml-1.5 px-1 py-0.2 rounded text-[10px] uppercase font-semibold tracking-wider bg-gray-200/70 text-gray-500 border border-gray-300/60 inline-flex items-center';
              badge.textContent = 'Tab ⇥';
              widgetEl.appendChild(badge);

              const deco = Decoration.widget(meta.pos, widgetEl, {
                side: 1, // display directly after cursor
                stopEvent: () => false,
              });

              return {
                suggestion: meta.suggestion,
                pos: meta.pos,
                decos: DecorationSet.create(newState.doc, [deco]),
              };
            }

            // If document changed or selection moved, dismiss suggestion
            if (tr.docChanged || tr.selectionSet) {
              return { suggestion: '', pos: null, decos: DecorationSet.empty };
            }

            return pluginState;
          },
        },
        props: {
          decorations(state) {
            return textPredictionPluginKey.getState(state)?.decos || DecorationSet.empty;
          },
          handleKeyDown(view, event) {
            // Allow Tab, Esc, shortcuts to pass through
            if (event.key === 'Tab' || event.key === 'Escape' || event.ctrlKey || event.metaKey || event.altKey) {
              return false;
            }

            // Dismiss active ghost text immediately on typing
            const pState = textPredictionPluginKey.getState(view.state);
            if (pState && pState.suggestion) {
              view.dispatch(view.state.tr.setMeta(textPredictionPluginKey, { clear: true }));
            }

            // Clear previous timers
            if (localTimer) clearTimeout(localTimer);
            if (llmTimer) clearTimeout(llmTimer);
            if (abortCtrl) abortCtrl.abort();

            // Rebuild Trie in background periodically (debounced 2s)
            if (trieRebuildTimeout) clearTimeout(trieRebuildTimeout);
            trieRebuildTimeout = setTimeout(() => {
              docTrie.buildFromText(view.state.doc.textBetween(0, view.state.doc.content.size, ' '));
            }, 2000);

            // Timer 1: Non-LLM suggestions (Trie + N-Gram) after 1.5 seconds (1500ms)
            localTimer = setTimeout(() => {
              const matched = requestLocalPrediction(view);
              // If local matched, do not query LLM
              if (matched) return;
            }, extension.options.localDebounceMs);

            // Timer 2: LLM suggestion after 3.0 seconds (3000ms)
            llmTimer = setTimeout(() => {
              requestLLMPrediction(view);
            }, extension.options.llmDebounceMs);

            return false;
          },
        },
      }),
    ];
  },
});
