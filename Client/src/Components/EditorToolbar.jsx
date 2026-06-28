import { FiBold, FiItalic, FiRotateCcw, FiRotateCw } from "react-icons/fi";
import { LuSparkles, LuCircleHelp } from "react-icons/lu";
import { MdColorize, MdFormatStrikethrough, MdFormatUnderlined, MdFormatAlignLeft, MdFormatAlignCenter, MdFormatAlignRight, MdFormatAlignJustify } from "react-icons/md";
import { BiHeading } from "react-icons/bi";
import { FiMessageSquare } from "react-icons/fi";
import { AIDropdownMenu } from "./AIDropdownMenu";
import React, { useRef, useEffect, useState } from 'react';

const COLOR_GRID = [
  "#000000", "#434343", "#666666", "#999999", "#cccccc", "#ffffff",
  "#ff0000", "#ff9900", "#ffff00", "#00ff00", "#00ffff", "#0000ff",
  "#9900ff", "#ff00ff", "#ff99cc"
];

const FONT_FAMILIES = [
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Comic Sans MS", value: "'Comic Sans MS', cursive, sans-serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Default", value: "" },
  { label: "Garamond", value: "Garamond, serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Helvetica", value: "Helvetica, sans-serif" },
  { label: "Impact", value: "Impact, Charcoal, sans-serif" },
  { label: "Lato", value: "Lato, sans-serif" },
  { label: "Lucida Console", value: "'Lucida Console', monospace" },
  { label: "Monospace", value: "monospace" },
  { label: "Montserrat", value: "Montserrat, sans-serif" },
  { label: "Open Sans", value: "'Open Sans', sans-serif" },
  { label: "Palatino", value: "'Palatino Linotype', 'Book Antiqua', Palatino, serif" },
  { label: "Roboto", value: "Roboto, sans-serif" },
  { label: "Sans-serif", value: "sans-serif" },
  { label: "Segoe UI", value: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
  { label: "Serif", value: "serif" },
  { label: "Source Sans Pro", value: "'Source Sans Pro', sans-serif" },
  { label: "System UI", value: "system-ui, sans-serif" },
  { label: "Tahoma", value: "Tahoma, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { label: "Verdana", value: "Verdana, sans-serif" }
];

function ColorIcon({ color }) {
  return (
    <span style={{ display: "inline-block", textAlign: "center" }}>
      <span style={{ fontWeight: "bold", fontSize: 18, lineHeight: 1 }}>A</span>
      <span style={{ display: "block", height: 3, width: 18, background: color, borderRadius: 2, margin: "2px auto 0 auto" }} />
    </span>
  );
}

export function EditorToolbar({ editor, headingLevel, handleHeadingChange, fontSize, handleFontSizeChange, fontFamily, handleFontFamilyChange, textColor, showColorPicker, setShowColorPicker, handleColorSelect, customColor, handleCustomColor, showAiMenu, setShowAiMenu, showAskDocInput, setShowAskDocInput, askDocInputRef, askDocPrompt, setAskDocPrompt, handleAskDoc, showComments, setShowComments }) {
  const aiMenuRef = useRef(null);

  useEffect(() => {
    if (!showAiMenu) return;
    const handleClickOutside = (event) => {
      if (aiMenuRef.current && !aiMenuRef.current.contains(event.target)) {
        setShowAiMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAiMenu, setShowAiMenu]);

  useEffect(() => {
    if (!showColorPicker) return;
    const onClick = (e) => {
      if (!e.target.closest(".color-picker-popover")) setShowColorPicker(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [showColorPicker, setShowColorPicker]);

  useEffect(() => {
    if (showAskDocInput && askDocInputRef.current) {
      askDocInputRef.current.focus();
    }
  }, [showAskDocInput, askDocInputRef]);

  useEffect(() => {
    if (!showAskDocInput) return;
    const handleClick = (e) => {
      if (askDocInputRef.current && !askDocInputRef.current.contains(e.target)) {
        setShowAskDocInput(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showAskDocInput, askDocInputRef, setShowAskDocInput]);

  return (
    <div className="flex gap-2 items-center bg-white/80 backdrop-blur-md px-8 py-2 shadow-sm border-b border-gray-100 relative sticky top-0 z-40">
        <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()} className="p-2 rounded transition text-xl flex items-center justify-center bg-white text-gray-700 hover:bg-blue-50" title="Undo">
          <FiRotateCcw />
        </button>
        <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()} className="p-2 rounded transition text-xl flex items-center justify-center bg-white text-gray-700 hover:bg-blue-50" title="Redo">
          <FiRotateCw />
        </button>

        <span className="mx-2 border-l border-gray-300 h-6" />

        <div className="relative" ref={aiMenuRef}>
          <button onClick={() => setShowAiMenu((v) => !v)} className={`p-2 rounded transition text-xl flex items-center justify-center gap-1.5 ${showAiMenu ? "bg-blue-100 text-blue-700" : "bg-white text-gray-700 hover:bg-blue-50"}`} title="AI Tools">
            <LuSparkles />
            <span className="text-sm font-medium pr-1">AI Tools</span>
          </button>
          {showAiMenu && (
            <AIDropdownMenu editor={editor} closeMenu={() => setShowAiMenu(false)} />
          )}
        </div>

        <span className="mx-2 border-l border-gray-300 h-6" />

        <label className="flex items-center gap-1">
          <BiHeading className="text-xl text-gray-500" />
          <select value={headingLevel} onChange={handleHeadingChange} className="bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all">
            <option value="paragraph">Normal</option>
            <option value="heading1">Heading 1</option>
            <option value="heading2">Heading 2</option>
            <option value="heading3">Heading 3</option>
            <option value="heading4">Heading 4</option>
            <option value="heading5">Heading 5</option>
            <option value="heading6">Heading 6</option>
          </select>
        </label>
        <select value={fontSize} onChange={handleFontSizeChange} className="bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all ml-2" style={{ width: 70 }}>
          <option value="12px">12</option> <option value="14px">14</option> <option value="16px">16</option>
          <option value="18px">18</option> <option value="20px">20</option> <option value="24px">24</option>
          <option value="28px">28</option> <option value="32px">32</option>
        </select>
        <select value={fontFamily} onChange={handleFontFamilyChange} className="bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all ml-2" style={{ width: 140 }}>
          {FONT_FAMILIES.map((f) => (
            <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
          ))}
        </select>
        <div className="relative ml-2">
          <button type="button" className={`p-2 rounded transition text-xl flex items-center justify-center bg-white text-gray-700 hover:bg-blue-50`} title="Text Color" onClick={() => setShowColorPicker((v) => !v)} style={{ minWidth: 28 }}>
            <ColorIcon color={textColor} />
          </button>
          {showColorPicker && (
            <div className="color-picker-popover absolute z-50 mt-2 left-0 bg-white/90 backdrop-blur border border-gray-200 rounded-lg shadow-xl p-4 min-w-[140px] transform origin-top transition-all scale-100">
              <div className="grid grid-cols-5 gap-3 mb-3">
                {COLOR_GRID.map((color) => (
                  <button key={color} type="button" className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition hover:scale-110 ${color.toLowerCase() === textColor.toLowerCase() ? "border-blue-600 ring-2 ring-blue-200" : "border-gray-200 hover:border-blue-400"}`} style={{ background: color }} onClick={() => handleColorSelect(color)} />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                <label className="relative hover:scale-105 transition-transform">
                  <input type="color" value={customColor} onChange={handleCustomColor} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="Custom Color" />
                  <span className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center" style={{ background: customColor }}>
                    <MdColorize className="text-xl text-gray-700" />
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>
        <span className="mx-2 border-l border-gray-300 h-6" />
        <button onClick={() => editor.chain().focus().setTextAlign("left").run()} className={`p-2 rounded transition text-xl flex items-center justify-center ${editor.isActive({ textAlign: "left" }) ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-blue-50"}`} title="Align Left"><MdFormatAlignLeft /></button>
        <button onClick={() => editor.chain().focus().setTextAlign("center").run()} className={`p-2 rounded transition text-xl flex items-center justify-center ${editor.isActive({ textAlign: "center" }) ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-blue-50"}`} title="Align Center"><MdFormatAlignCenter /></button>
        <button onClick={() => editor.chain().focus().setTextAlign("right").run()} className={`p-2 rounded transition text-xl flex items-center justify-center ${editor.isActive({ textAlign: "right" }) ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-blue-50"}`} title="Align Right"><MdFormatAlignRight /></button>
        <button onClick={() => editor.chain().focus().setTextAlign("justify").run()} className={`p-2 rounded transition text-xl flex items-center justify-center ${editor.isActive({ textAlign: "justify" }) ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-blue-50"}`} title="Justify"><MdFormatAlignJustify /></button>
        <span className="mx-2 border-l border-gray-300 h-6" />
        <button onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} className={`p-2 rounded transition text-xl flex items-center justify-center ${editor.isActive("bold") ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-blue-50"}`} title="Bold"><FiBold /></button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} className={`p-2 rounded transition text-xl flex items-center justify-center ${editor.isActive("italic") ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-blue-50"}`} title="Italic"><FiItalic /></button>
        <button onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} className={`p-2 rounded transition text-xl flex items-center justify-center ${editor.isActive("strike") ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-blue-50"}`} title="Strikethrough"><MdFormatStrikethrough /></button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()} disabled={!editor.can().chain().focus().toggleUnderline().run()} className={`p-2 rounded transition text-xl flex items-center justify-center ${editor.isActive("underline") ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-blue-50"}`} title="Underline"><MdFormatUnderlined /></button>
        <button onClick={() => setShowAskDocInput((v) => !v)} className="p-2 rounded transition text-xl flex items-center justify-center bg-white text-gray-700 hover:bg-blue-50" title="Ask Document"><LuCircleHelp /></button>
        {showAskDocInput && (
          <div className="absolute left-1/2 transform -translate-x-1/2 mt-16 bg-white/95 backdrop-blur border rounded-xl shadow-lg p-3 z-50 flex flex-col gap-2 transition-all" style={{ minWidth: 320 }}>
            <input ref={askDocInputRef} type="text" className="border rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" placeholder="Ask a question about this document..." value={askDocPrompt} onChange={(e) => setAskDocPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleAskDoc(); if (e.key === "Escape") setShowAskDocInput(false); }} autoFocus />
            <div className="flex gap-2">
              <button onClick={handleAskDoc} className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm hover:bg-blue-700 transition" disabled={!askDocPrompt.trim()}>Ask</button>
              <button onClick={() => setShowAskDocInput(false)} className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-md text-sm hover:bg-gray-200 transition">Cancel</button>
            </div>
            <span className="text-xs text-gray-400">Press <b>Enter</b> to ask, <b>Esc</b> to cancel.</span>
          </div>
        )}
        <button onClick={() => setShowComments(!showComments)} className={`p-2 rounded transition text-xl flex items-center justify-center ${showComments ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-blue-50"}`} title="Comments"><FiMessageSquare /></button>
      </div>
  );
}
