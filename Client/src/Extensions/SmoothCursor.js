import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export const SmoothCursor = Extension.create({
  name: 'smoothCursor',

  addProseMirrorPlugins() {
    let cursorEl = null;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let animId = null;
    let isTyping = false;
    let hideTimeout = null;

    const renderLoop = () => {
      if (!cursorEl) return;
      // Linear interpolation (lerp) for buttery smooth motion
      const ease = 0.35;
      const dx = targetX - currentX;
      const dy = targetY - currentY;

      currentX += dx * ease;
      currentY += dy * ease;

      cursorEl.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;

      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        animId = requestAnimationFrame(renderLoop);
      } else {
        animId = null;
      }
    };

    const updateCaretPosition = (view) => {
      if (!view || !view.hasFocus()) {
        if (cursorEl) cursorEl.style.opacity = '0';
        return;
      }

      const { state } = view;
      const { selection } = state;
      if (!selection.empty) {
        // Hide smooth cursor during text range selection so native selection is crisp
        if (cursorEl) cursorEl.style.opacity = '0';
        return;
      }

      try {
        const coords = view.coordsAtPos(selection.from);
        const domRect = view.dom.getBoundingClientRect();

        if (!cursorEl) {
          cursorEl = document.createElement('div');
          cursorEl.className = 'cowrite-smooth-caret';
          document.body.appendChild(cursorEl);
        }

        targetX = coords.left;
        targetY = coords.top;
        const height = coords.bottom - coords.top;

        cursorEl.style.height = `${Math.max(18, height)}px`;
        cursorEl.style.opacity = '1';

        // Keep cursor illuminated while actively typing
        cursorEl.classList.add('typing');
        clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => {
          if (cursorEl) cursorEl.classList.remove('typing');
        }, 300);

        if (!animId) {
          animId = requestAnimationFrame(renderLoop);
        }
      } catch (err) {
        // Fallback silently if position calculation is momentary
      }
    };

    return [
      new Plugin({
        key: new PluginKey('smoothCursorPlugin'),
        view(editorView) {
          updateCaretPosition(editorView);

          const onScrollOrResize = () => updateCaretPosition(editorView);
          window.addEventListener('resize', onScrollOrResize);
          window.addEventListener('scroll', onScrollOrResize, true);

          return {
            update(view) {
              updateCaretPosition(view);
            },
            destroy() {
              window.removeEventListener('resize', onScrollOrResize);
              window.removeEventListener('scroll', onScrollOrResize, true);
              if (animId) cancelAnimationFrame(animId);
              if (cursorEl && cursorEl.parentNode) {
                cursorEl.parentNode.removeChild(cursorEl);
                cursorEl = null;
              }
            },
          };
        },
      }),
    ];
  },
});
