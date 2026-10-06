import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { LuGripVertical, LuRotateCcw } from 'react-icons/lu';

export const SlashCommandList = forwardRef(({ items, command }, ref) => {
  const [commandList, setCommandList] = useState(items || []);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const itemRefs = useRef([]);

  useEffect(() => {
    setCommandList(items || []);
    setSelectedIndex(0);
  }, [items]);

  useEffect(() => {
    const el = itemRefs.current[selectedIndex];
    if (el) {
      el.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex]);

  const selectItem = (index) => {
    const item = commandList[index];
    if (item) {
      command(item);
    }
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((prev) => (prev + commandList.length - 1) % commandList.length);
        return true;
      }

      if (event.key === 'ArrowDown') {
        setSelectedIndex((prev) => (prev + 1) % commandList.length);
        return true;
      }

      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }

      return false;
    },
  }));

  // Drag and Drop reordering handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...commandList];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);

    setCommandList(updated);
    setSelectedIndex(targetIndex);
    setDraggedIndex(null);
    setDragOverIndex(null);

    // Save updated order IDs to localStorage so user customization persists
    try {
      const orderIds = updated.map((cmd) => cmd.id);
      localStorage.setItem('cowrite:slash-command-order', JSON.stringify(orderIds));
    } catch (err) {
      // Ignore localStorage errors
    }
  };

  const handleResetOrder = (e) => {
    e.stopPropagation();
    try {
      localStorage.removeItem('cowrite:slash-command-order');
      // trigger refresh by resetting to initial items
      setCommandList(items || []);
    } catch (err) {}
  };

  if (!commandList || commandList.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200/90 p-3 w-72 text-center text-xs text-gray-400">
        No matching commands
      </div>
    );
  }

  let lastCategory = null;

  return (
    <div 
      className="bg-white rounded-xl shadow-2xl border border-gray-200/90 overflow-hidden w-84 max-h-[380px] flex flex-col animate-in fade-in zoom-in-95 duration-100 select-none text-left"
    >
      {/* Top Helper Hint */}
      <div className="px-3 py-1.5 bg-gray-50/80 border-b border-gray-150 flex items-center justify-between text-[10px] text-gray-400">
        <span className="flex items-center gap-1">
          <LuGripVertical className="text-xs text-gray-400" />
          <span>Drag ⋮⋮ to reorder menu</span>
        </span>
        <button
          type="button"
          onClick={handleResetOrder}
          className="text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-0.5"
          title="Reset to default order"
        >
          <LuRotateCcw className="text-[9px]" />
          <span>Reset</span>
        </button>
      </div>

      <div className="overflow-y-auto p-1.5 scrollbar-thin">
        {commandList.map((item, index) => {
          const showCategoryHeader = item.category && item.category !== lastCategory;
          lastCategory = item.category;

          const isDragging = draggedIndex === index;
          const isOver = dragOverIndex === index;

          return (
            <React.Fragment key={item.id || index}>
              {showCategoryHeader && (
                <div className="px-2.5 pt-2 pb-1 text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
                  {item.category}
                </div>
              )}
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                className={`relative group flex items-center rounded-lg transition-all ${
                  isDragging ? 'opacity-40 scale-98' : ''
                } ${
                  isOver ? 'border-t-2 border-blue-500' : ''
                }`}
              >
                {/* Drag Reorder Handle (⋮⋮ icon) */}
                <div 
                  className="px-1 py-2 text-gray-300 hover:text-gray-600 cursor-grab active:cursor-grabbing transition-colors flex items-center justify-center shrink-0"
                  title="Drag ⋮⋮ to reorder"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <LuGripVertical className="text-sm opacity-60 group-hover:opacity-100" />
                </div>

                <button
                  type="button"
                  ref={(el) => (itemRefs.current[index] = el)}
                  onClick={() => selectItem(index)}
                  className={`flex-1 flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-colors ${
                    index === selectedIndex
                      ? 'bg-blue-50 text-blue-900'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 transition-colors ${
                      index === selectedIndex
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-semibold truncate leading-tight">
                      {item.title}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-gray-400 truncate leading-tight mt-0.5">
                      {item.description}
                    </div>
                  </div>
                </button>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
});

SlashCommandList.displayName = 'SlashCommandList';
