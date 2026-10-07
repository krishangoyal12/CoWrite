import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { LuGripVertical, LuRotateCcw, LuSparkles, LuType, LuListFilter } from 'react-icons/lu';

const SECTION_METADATA = {
  'Groq AI Assistant': {
    id: 'Groq AI Assistant',
    label: 'AI Actions',
    badgeColor: 'bg-indigo-50 text-indigo-600 border-indigo-150',
    iconBg: 'bg-indigo-500/10 text-indigo-600',
    icon: <LuSparkles className="text-xs" />,
    accentBorder: 'hover:border-indigo-300 focus-within:border-indigo-400',
    selectedItemBg: 'bg-indigo-600 text-white shadow-sm shadow-indigo-200',
  },
  'Basic Blocks': {
    id: 'Basic Blocks',
    label: 'Basic Blocks',
    badgeColor: 'bg-blue-50 text-blue-600 border-blue-150',
    iconBg: 'bg-blue-500/10 text-blue-600',
    icon: <LuType className="text-xs" />,
    accentBorder: 'hover:border-blue-300 focus-within:border-blue-400',
    selectedItemBg: 'bg-blue-600 text-white shadow-sm shadow-blue-200',
  },
  'Lists & Formatting': {
    id: 'Lists & Formatting',
    label: 'Lists & Formatting',
    badgeColor: 'bg-emerald-50 text-emerald-600 border-emerald-150',
    iconBg: 'bg-emerald-500/10 text-emerald-600',
    icon: <LuListFilter className="text-xs" />,
    accentBorder: 'hover:border-emerald-300 focus-within:border-emerald-400',
    selectedItemBg: 'bg-emerald-600 text-white shadow-sm shadow-emerald-200',
  },
};

const DEFAULT_SECTION_KEYS = [
  'Groq AI Assistant',
  'Basic Blocks',
  'Lists & Formatting',
];

const SECTION_STORAGE_KEY = 'cowrite:slash-section-order';
const ITEM_STORAGE_KEY = 'cowrite:slash-command-order';

export const SlashCommandList = forwardRef(({ items, command }, ref) => {
  // Track section order
  const [sectionOrder, setSectionOrder] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SECTION_STORAGE_KEY));
      if (Array.isArray(saved) && saved.length > 0) {
        const valid = saved.filter((k) => DEFAULT_SECTION_KEYS.includes(k));
        DEFAULT_SECTION_KEYS.forEach((k) => {
          if (!valid.includes(k)) valid.push(k);
        });
        return valid;
      }
    } catch (e) {}
    return DEFAULT_SECTION_KEYS;
  });

  // Active section (column index in sectionOrder) and active item index in that section
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [selectedItemIdx, setSelectedItemIdx] = useState(0);

  // Drag states for Section cards
  const [draggedSecIdx, setDraggedSecIdx] = useState(null);
  const [dragOverSecIdx, setDragOverSecIdx] = useState(null);

  // Drag states for Items within a section
  const [draggedItemInfo, setDraggedItemInfo] = useState(null); // { secKey, itemIndex }
  const [dragOverItemInfo, setDragOverItemInfo] = useState(null); // { secKey, itemIndex }

  // Dynamic grouping of current matching items
  const groupedItems = React.useMemo(() => {
    const groups = {};
    DEFAULT_SECTION_KEYS.forEach((key) => {
      groups[key] = [];
    });

    (items || []).forEach((item) => {
      const cat = item.category || 'Basic Blocks';
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(item);
    });

    return groups;
  }, [items]);

  // Only keep sections that currently have matching items
  const activeSections = React.useMemo(() => {
    const available = sectionOrder.filter((key) => (groupedItems[key] || []).length > 0);
    if (available.length === 0) {
      return Object.keys(groupedItems).filter((key) => groupedItems[key].length > 0);
    }
    return available;
  }, [sectionOrder, groupedItems]);

  // Determine max visible items before scrolling:
  // Cap at minimum number of elements across all active sections (or at most 4 items)
  const maxVisibleItems = React.useMemo(() => {
    if (activeSections.length === 0) return 4;
    const counts = activeSections.map((secKey) => (groupedItems[secKey] || []).length);
    const minCount = Math.min(...counts);
    return Math.max(1, Math.min(4, minCount));
  }, [activeSections, groupedItems]);

  // Keep activeSectionIdx within bounds
  useEffect(() => {
    if (activeSectionIdx >= activeSections.length) {
      setActiveSectionIdx(Math.max(0, activeSections.length - 1));
    }
  }, [activeSections.length, activeSectionIdx]);

  // Keep selectedItemIdx within bounds of active section
  const currentSectionKey = activeSections[activeSectionIdx];
  const currentSectionItems = currentSectionKey ? groupedItems[currentSectionKey] || [] : [];

  useEffect(() => {
    if (selectedItemIdx >= currentSectionItems.length) {
      setSelectedItemIdx(Math.max(0, currentSectionItems.length - 1));
    }
  }, [currentSectionItems.length, selectedItemIdx]);

  const itemRefs = useRef({});

  // Auto-scroll selected item into view inside its section container
  useEffect(() => {
    const key = `${activeSectionIdx}-${selectedItemIdx}`;
    const el = itemRefs.current[key];
    if (el) {
      el.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [activeSectionIdx, selectedItemIdx]);

  const executeActiveItem = () => {
    if (currentSectionItems.length > 0 && currentSectionItems[selectedItemIdx]) {
      command(currentSectionItems[selectedItemIdx]);
    }
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (activeSections.length === 0) return false;

      // Horizontal navigation between modals
      if (event.key === 'ArrowRight') {
        const nextSec = (activeSectionIdx + 1) % activeSections.length;
        setActiveSectionIdx(nextSec);
        setSelectedItemIdx(0);
        return true;
      }

      if (event.key === 'ArrowLeft') {
        const prevSec = (activeSectionIdx + activeSections.length - 1) % activeSections.length;
        setActiveSectionIdx(prevSec);
        setSelectedItemIdx(0);
        return true;
      }

      // Vertical navigation within active modal
      if (event.key === 'ArrowDown') {
        if (currentSectionItems.length > 0) {
          setSelectedItemIdx((prev) => (prev + 1) % currentSectionItems.length);
        }
        return true;
      }

      if (event.key === 'ArrowUp') {
        if (currentSectionItems.length > 0) {
          setSelectedItemIdx(
            (prev) => (prev + currentSectionItems.length - 1) % currentSectionItems.length
          );
        }
        return true;
      }

      if (event.key === 'Enter') {
        executeActiveItem();
        return true;
      }

      return false;
    },
  }));

  // ================= DRAG & DROP: Section Columns =================
  const handleSectionDragStart = (e, index) => {
    setDraggedSecIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `sec:${index}`);
  };

  const handleSectionDragOver = (e, index) => {
    e.preventDefault();
    if (draggedSecIdx === null || draggedSecIdx === index) return;
    setDragOverSecIdx(index);
  };

  const handleSectionDragLeave = () => {
    setDragOverSecIdx(null);
  };

  const handleSectionDrop = (e, targetIdx) => {
    e.preventDefault();
    if (draggedSecIdx === null || draggedSecIdx === targetIdx) {
      setDraggedSecIdx(null);
      setDragOverSecIdx(null);
      return;
    }

    const updated = [...sectionOrder];
    const [moved] = updated.splice(draggedSecIdx, 1);
    updated.splice(targetIdx, 0, moved);

    setSectionOrder(updated);
    setActiveSectionIdx(targetIdx);
    setDraggedSecIdx(null);
    setDragOverSecIdx(null);

    try {
      localStorage.setItem(SECTION_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {}
  };

  // ================= DRAG & DROP: Items within a Section =================
  const handleItemDragStart = (e, secKey, itemIdx) => {
    e.stopPropagation();
    setDraggedItemInfo({ secKey, itemIdx });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `item:${secKey}:${itemIdx}`);
  };

  const handleItemDragOver = (e, secKey, itemIdx) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      !draggedItemInfo ||
      draggedItemInfo.secKey !== secKey ||
      draggedItemInfo.itemIdx === itemIdx
    )
      return;
    setDragOverItemInfo({ secKey, itemIdx });
  };

  const handleItemDragLeave = (e) => {
    e.stopPropagation();
    setDragOverItemInfo(null);
  };

  const handleItemDrop = (e, targetSecKey, targetItemIdx) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      !draggedItemInfo ||
      draggedItemInfo.secKey !== targetSecKey ||
      draggedItemInfo.itemIdx === targetItemIdx
    ) {
      setDraggedItemInfo(null);
      setDragOverItemInfo(null);
      return;
    }

    const secItems = [...groupedItems[targetSecKey]];
    const [moved] = secItems.splice(draggedItemInfo.itemIdx, 1);
    secItems.splice(targetItemIdx, 0, moved);

    try {
      const existingOrder = JSON.parse(localStorage.getItem(ITEM_STORAGE_KEY)) || [];
      const updatedItemIds = secItems.map((it) => it.id);
      const newSavedOrder = [...existingOrder];
      const filtered = newSavedOrder.filter((id) => !updatedItemIds.includes(id));
      filtered.push(...updatedItemIds);
      localStorage.setItem(ITEM_STORAGE_KEY, JSON.stringify(filtered));
      window.dispatchEvent(new Event('cowrite:slash-order-changed'));
    } catch (err) {}

    setSelectedItemIdx(targetItemIdx);
    setDraggedItemInfo(null);
    setDragOverItemInfo(null);
  };

  const handleResetLayout = (e) => {
    e.stopPropagation();
    try {
      localStorage.removeItem(SECTION_STORAGE_KEY);
      localStorage.removeItem(ITEM_STORAGE_KEY);
      setSectionOrder(DEFAULT_SECTION_KEYS);
      setActiveSectionIdx(0);
      setSelectedItemIdx(0);
      window.dispatchEvent(new Event('cowrite:slash-order-changed'));
    } catch (err) {}
  };

  if (activeSections.length === 0) {
    return (
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-150 p-4 w-72 text-center text-xs text-gray-400">
        No matching commands
      </div>
    );
  }

  return (
    <div className="flex flex-col select-none text-left animate-in fade-in zoom-in-95 duration-100 max-w-[94vw] sm:max-w-[890px]">
      {/* 3 Horizontal Section Modals / Columns */}
      <div className="flex flex-row gap-3 items-stretch pb-1">
        {activeSections.map((secKey, secIdx) => {
          const meta = SECTION_METADATA[secKey] || {
            id: secKey,
            label: secKey,
            badgeColor: 'bg-gray-50 text-gray-600 border-gray-200',
            iconBg: 'bg-gray-100 text-gray-600',
            icon: <LuType className="text-xs" />,
            selectedItemBg: 'bg-blue-600 text-white shadow-sm',
          };
          const secItems = groupedItems[secKey] || [];
          const isActiveSection = secIdx === activeSectionIdx;
          const isDraggingThisSec = draggedSecIdx === secIdx;
          const isOverThisSec = dragOverSecIdx === secIdx;

          return (
            <div
              key={secKey}
              draggable
              onDragStart={(e) => handleSectionDragStart(e, secIdx)}
              onDragOver={(e) => handleSectionDragOver(e, secIdx)}
              onDragLeave={handleSectionDragLeave}
              onDrop={(e) => handleSectionDrop(e, secIdx)}
              onClick={() => setActiveSectionIdx(secIdx)}
              className={`flex-1 min-w-[245px] max-w-[285px] bg-white rounded-2xl flex flex-col transition-all duration-200 ${
                isActiveSection
                  ? 'border-2 border-blue-500 shadow-xl shadow-blue-500/10 -translate-y-0.5'
                  : 'border border-gray-200/90 shadow-md hover:border-gray-300 hover:shadow-lg opacity-85 hover:opacity-100'
              } ${isDraggingThisSec ? 'opacity-30 scale-95' : ''} ${
                isOverThisSec ? 'ring-2 ring-blue-400 ring-offset-2' : ''
              }`}
            >
              {/* Modal Card Header */}
              <div
                className={`px-3.5 py-2.5 border-b flex items-center justify-between cursor-grab active:cursor-grabbing rounded-t-2xl transition-colors ${
                  isActiveSection
                    ? 'bg-blue-50/50 border-blue-100/80 text-blue-950'
                    : 'bg-gray-50/60 border-gray-100 text-gray-700'
                }`}
                title="Drag to rearrange section cards"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="p-1 -ml-1 text-gray-500 hover:text-gray-900 transition-colors"
                    title="Drag to reorder card"
                  >
                    <LuGripVertical className="text-sm text-gray-600" />
                  </div>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${meta.iconBg}`}
                  >
                    {meta.icon}
                  </div>
                  <span className="text-xs font-semibold tracking-tight truncate">
                    {meta.label}
                  </span>
                </div>
              </div>

              {/* Items List inside Section Modal (height constrained to maxVisibleItems items, hidden scrollbar) */}
              <div
                className="p-1.5 flex flex-col gap-1 overflow-y-auto overflow-x-hidden no-scrollbar"
                style={{
                  height: `${maxVisibleItems * 52 + 12}px`,
                  maxHeight: `${maxVisibleItems * 52 + 12}px`,
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {secItems.map((item, itemIdx) => {
                  const isItemSelected = isActiveSection && itemIdx === selectedItemIdx;
                  const isItemDragging =
                    draggedItemInfo?.secKey === secKey && draggedItemInfo?.itemIdx === itemIdx;
                  const isItemOver =
                    dragOverItemInfo?.secKey === secKey && dragOverItemInfo?.itemIdx === itemIdx;

                  return (
                    <div
                      key={item.id || itemIdx}
                      draggable
                      onDragStart={(e) => handleItemDragStart(e, secKey, itemIdx)}
                      onDragOver={(e) => handleItemDragOver(e, secKey, itemIdx)}
                      onDragLeave={handleItemDragLeave}
                      onDrop={(e) => handleItemDrop(e, secKey, itemIdx)}
                      className={`relative group flex items-center rounded-xl transition-all duration-150 ${
                        isItemDragging ? 'opacity-30 scale-98' : ''
                      } ${isItemOver ? 'border-t-2 border-blue-500' : ''}`}
                    >
                      {/* Sub-item drag handle */}
                      <div
                        className="px-1 py-2 text-gray-400 hover:text-gray-800 cursor-grab active:cursor-grabbing transition-colors flex items-center justify-center shrink-0"
                        title="Drag to reorder in section"
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <LuGripVertical className="text-xs opacity-70 group-hover:opacity-100 group-hover:text-gray-800" />
                      </div>

                      <button
                        type="button"
                        ref={(el) => {
                          itemRefs.current[`${secIdx}-${itemIdx}`] = el;
                        }}
                        onClick={() => {
                          setActiveSectionIdx(secIdx);
                          setSelectedItemIdx(itemIdx);
                          command(item);
                        }}
                        className={`flex-1 flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all duration-150 ${
                          isItemSelected
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 transition-colors ${
                            isItemSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-gray-100/90 text-gray-600 group-hover:bg-gray-200/80'
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div
                            className={`text-xs font-medium truncate leading-tight ${
                              isItemSelected ? 'text-white' : 'text-gray-800'
                            }`}
                          >
                            {item.title}
                          </div>
                          <div
                            className={`text-[10px] truncate leading-tight mt-0.5 ${
                              isItemSelected ? 'text-blue-100' : 'text-gray-400'
                            }`}
                          >
                            {item.description}
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sleek, Minimal Bottom Footer with keyboard pills & reset */}
      <div className="mt-1 px-2.5 py-1 flex items-center justify-between text-[11px] text-gray-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.2 bg-gray-100 border border-gray-200 rounded text-[9px] font-mono text-gray-600 shadow-2xs">
              ←
            </kbd>
            <kbd className="px-1 py-0.2 bg-gray-100 border border-gray-200 rounded text-[9px] font-mono text-gray-600 shadow-2xs">
              →
            </kbd>
            <span className="text-[10px] text-gray-500">Section</span>
          </span>

          <span className="text-gray-300">•</span>

          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.2 bg-gray-100 border border-gray-200 rounded text-[9px] font-mono text-gray-600 shadow-2xs">
              ↑
            </kbd>
            <kbd className="px-1 py-0.2 bg-gray-100 border border-gray-200 rounded text-[9px] font-mono text-gray-600 shadow-2xs">
              ↓
            </kbd>
            <span className="text-[10px] text-gray-500">Navigate</span>
          </span>

          <span className="text-gray-300">•</span>

          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.2 bg-gray-100 border border-gray-200 rounded text-[9px] font-mono text-gray-600 shadow-2xs">
              ↵
            </kbd>
            <span className="text-[10px] text-gray-500">Select</span>
          </span>
        </div>

        <button
          type="button"
          onClick={handleResetLayout}
          className="hover:text-blue-600 transition-colors flex items-center gap-1 text-[10px] text-gray-400 cursor-pointer"
          title="Reset column & item positions"
        >
          <LuRotateCcw className="text-[9px]" />
          <span>Reset Order</span>
        </button>
      </div>
    </div>
  );
});

SlashCommandList.displayName = 'SlashCommandList';
