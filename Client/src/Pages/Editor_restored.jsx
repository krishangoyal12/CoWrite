Created At: 2026-06-28T08:57:30Z
Completed At: 2026-06-28T08:57:31Z
File Path: `file:///c:/Users/krish/Downloads/Projects/CoWrite/CoWrite/Client/src/Pages/Editor.jsx`
Total Lines: 902
Total Bytes: 32586
Showing lines 1 to 800
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
1: import { useEffect, useState, useRef, useMemo } from "react";
2: import { useParams, useNavigate } from "react-router-dom";
3: import { useEditor, EditorContent } from "@tiptap/react";
4: import StarterKit from "@tiptap/starter-kit";
5: import TextStyle from "@tiptap/extension-text-style";
6: import TextAlign from "@tiptap/extension-text-align";
7: import Underline from "@tiptap/extension-underline";
8: import Color from "@tiptap/extension-color";
9: import FontStyle from "../Extensions/FontStyle";
10: import { AiHighlight } from "../Extensions/AiHighlight";
11: import { AIExtension } from "../Extensions/AIExtension";
12: import { AIBubbleMenu } from "../../Components/AIBubbleMenu";
13: import { AIDropdownMenu } from "../../Components/AIDropdownMenu";
14: import toast from "react-hot-toast";
15: import { FiBold, FiItalic, FiRotateCcw, FiRotateCw } from "react-icons/fi";
16: import { LuSparkles, LuCircleHelp } from "react-icons/lu";
17: import { MdColorize } from "react-icons/md";
18: import { MdFormatStrikethrough, MdFormatUnderlined } from "react-icons/md";
19: import { BiHeading } from "react-icons/bi";
20: import {
21:   MdFormatAlignLeft,
22:   MdFormatAlignCenter,
23:   MdFormatAlignRight,
24:   MdFormatAlignJustify,
25: } from "react-icons/md";
26: import * as Y from "yjs";
27: import { WebsocketProvider } from "y-websocket";
28: import { FormattingBubbleMenu } from "../../Components/FormattingBubbleMenu";
29: import Collaboration from "@tiptap/extension-collaboration";
30: import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
31: import { useAuth } from "../../Context/useAuth";
32: import { CommentExtension } from "../Extensions/CommentExtension";
33: import { CommentThread, NewCommentBox } from "../../Components/CommentPanel";
34: import { CollaboratorBar } from "../Components/CollaboratorBar";
35: 
36: const COLOR_GRID = [
37:   "#000000",
38:   "#434343",
39:   "#666666",
40:   "#999999",
41:   "#cccccc",
42:   "#ffffff",
43:   "#ff0000",
44:   "#ff9900",
45:   "#ffff00",
46:   "#00ff00",
47:   "#00ffff",
48:   "#0000ff",
49:   "#9900ff",
50:   "#ff00ff",
51:   "#ff99cc",
52: ];
53: 
54: function ColorIcon({ color }) {
55:   return (
56:     <span style={{ display: "inline-block", textAlign: "center" }}>
57:       <span style={{ fontWeight: "bold", fontSize: 18, lineHeight: 1 }}>A</span>
58:       <span
59:         style={{
60:           display: "block",
61:           height: 3,
62:           width: 18,
63:           background: color,
64:           borderRadius: 2,
65:           margin: "2px auto 0 auto",
66:         }}
67:       />
68:     </span>
69:   );
70: }
71: 
72: const baseURL = import.meta.env.VITE_URL;
73: 
74: const FONT_FAMILIES = [
75:   { label: "Arial", value: "Arial, sans-serif" },
76:   { label: "Comic Sans MS", value: "'Comic Sans MS', cursive, sans-serif" },
77:   { label: "Courier New", value: "'Courier New', monospace" },
78:   { label: "Default", value: "" },
79:   { label: "Garamond", value: "Garamond, serif" },
80:   { label: "Georgia", value: "Georgia, serif" },
81:   { label: "Helvetica", value: "Helvetica, sans-serif" },
82:   { label: "Impact", value: "Impact, Charcoal, sans-serif" },
83:   { label: "Lato", value: "Lato, sans-serif" },
84:   { label: "Lucida Console", value: "'Lucida Console', monospace" },
85:   { label: "Monospace", value: "monospace" },
86:   { label: "Montserrat", value: "Montserrat, sans-serif" },
87:   { label: "Open Sans", value: "'Open Sans', sans-serif" },
88:   {
89:     label: "Palatino",
90:     value: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
91:   },
92:   { label: "Roboto", value: "Roboto, sans-serif" },
93:   { label: "Sans-serif", value: "sans-serif" },
94:   {
95:     label: "Segoe UI",
96:     value: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
97:   },
98:   { label: "Serif", value: "serif" },
99:   { label: "Source Sans Pro", value: "'Source Sans Pro', sans-serif" },
100:   { label: "System UI", value: "system-ui, sans-serif" },
101:   { label: "Tahoma", value: "Tahoma, sans-serif" },
102:   { label: "Times New Roman", value: "'Times New Roman', serif" },
103:   { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
104:   { label: "Verdana", value: "Verdana, sans-serif" },
105: ];
106: 
107: const COLLAB_COLORS = [
108:   "#007bff",
109:   "#e83e8c",
110:   "#fd7e14",
111:   "#28a745",
112:   "#20c997",
113:   "#6f42c1",
114:   "#17a2b8",
115:   "#ffc107",
116:   "#dc3545",
117:   "#343a40",
118: ];
119: 
120: function getUserColor(userIdOrEmail) {
121:   if (!userIdOrEmail) return COLLAB_COLORS[0];
122:   let hash = 0;
123:   for (let i = 0; i < userIdOrEmail.length; i++) {
124:     hash = userIdOrEmail.charCodeAt(i) + ((hash << 5) - hash);
125:   }
126:   return COLLAB_COLORS[Math.abs(hash) % COLLAB_COLORS.length];
127: }
128: 
129: export default function Editor() {
130:   const { id } = useParams();
131:   const navigate = useNavigate();
132:   const [docTitle, setDocTitle] = useState("");
133:   const [docOwnerId, setDocOwnerId] = useState(null);
134:   const [loading, setLoading] = useState(true);
135:   const [headingLevel, setHeadingLevel] = useState("paragraph");
136:   const [fontSize, setFontSize] = useState("16px");
137:   const [fontFamily, setFontFamily] = useState("");
138:   const [textColor, setTextColor] = useState("#000000");
139:   const [showColorPicker, setShowColorPicker] = useState(false);
140:   const [customColor, setCustomColor] = useState("#000000");
141:   const [showAiMenu, setShowAiMenu] = useState(false);
142:   const [showAskDocInput, setShowAskDocInput] = useState(false);
143:   const [askDocPrompt, setAskDocPrompt] = useState("");
144:   const askDocInputRef = useRef(null);
145:   const saveTimeout = useRef(null);
146:   const aiMenuRef = useRef(null);
147:   const { auth: user } = useAuth();
148: 
149:   const [collaboratorEmail, setCollaboratorEmail] = useState("");
150:   const [collaborators, setCollaborators] = useState([]);
151:   const [adding, setAdding] = useState(false);
152: 
153:   const [ydoc] = useState(() => new Y.Doc());
154:   const [provider] = useState(
155:     () => new WebsocketProvider(import.meta.env.VITE_WEBSOCKET_URL, id, ydoc)
156:   );
157: 
158:   useEffect(() => {
159:     return () => {
160:       provider.destroy();
161:       ydoc.destroy();
162:     };
163:   }, [provider, ydoc]);
164:   
165:   const [awarenessUsers, setAwarenessUsers] = useState([]);
166:   useEffect(() => {
167:     if (!provider) return;
168:     const updateAwareness = () => {
169:       const users = [];
170:       const seenNames = new Set();
171:       provider.awareness.getStates().forEach((state, clientID) => {
172:         if (clientID !== provider.awareness.clientID && state.user) {
173:           if (!seenNames.has(state.user.name)) {
174:             seenNames.add(state.user.name);
175:             users.push(state.user);
176:           }
177:         }
178:       });
179:       setAwarenessUsers(users);
180:     };
181:     provider.awareness.on("change", updateAwareness);
182:     updateAwareness();
183: 
184:     // Restart the CSS animation on the cursor label when it moves (inline style changes)
185:     const observer = new MutationObserver((mutations) => {
186:       mutations.forEach((mutation) => {
187:         if (
188:           mutation.type === "attributes" &&
189:           mutation.attributeName === "style" &&
190:           mutation.target.classList &&
191:           mutation.target.classList.contains("collaboration-cursor__caret")
192:         ) {
193:           const label = mutation.target.querySelector(".collaboration-cursor__label");
194:           if (label) {
195:             label.style.animation = "none";
196:             void label.offsetWidth; // trigger reflow
197:             label.style.animation = "fadeOutLabel 2.5s ease forwards";
198:           }
199:         }
200:       });
201:     });
202: 
203:     // Observe the entire body so we don't miss it if the editor isn't mounted yet
204:     observer.observe(document.body, {
205:       attributes: true,
206:       subtree: true,
207:       attributeFilter: ["style"],
208:     });
209: 
210:     return () => {
211:       provider.awareness.off("change", updateAwareness);
212:       observer.disconnect();
213:     };
214:   }, [provider]);
215: 
216:   const [activeComment, setActiveComment] = useState(null);
217:   const [draftComment, setDraftComment] = useState(null);
218:   const [commentTop, setCommentTop] = useState(0);
219: 
220:   useEffect(() => {
221:     if (!editor) return;
222:     const handleClick = (e) => {
223:       // Find the closest comment-mark if we clicked inside one
224:       const commentMark = e.target.closest('.comment-mark');
225:       
226:       if (commentMark) {
227:         const id = commentMark.getAttribute('data-comment-id');
228:         const comment = editor.storage.comment.comments[id];
229:         if (comment && !comment.resolved) {
230:           setActiveComment(comment);
231:           setDraftComment(null);
232:           // calculate position
233:           try {
234:             const coords = editor.view.coordsAtPos(comment.from);
235:             setCommentTop(coords.top);
236:           } catch (err) {}
237:         }
238:       } else {
239:         // Only close if we click outside the comment thread container
240:         if (!e.target.closest('.comment-thread-container')) {
241:           setActiveComment(null);
242:         }
243:       }
244:     };
245:     
246:     editor.view.dom.addEventListener('click', handleClick);
247:     return () => editor.view.dom.removeEventListener('click', handleClick);
248:   }, [editor]);
249: 
250:   // Update position of draft comment
251:   useEffect(() => {
252:     if (draftComment && editor) {
253:       try {
254:         const coords = editor.view.coordsAtPos(draftComment.from);
255:         setCommentTop(coords.top);
256:       } catch (err) {}
257:     }
258:   }, [draftComment, editor]);
259: 
260:   const editor = useEditor({
261:     extensions: [
262:       StarterKit.configure({ history: false }),
263:       TextStyle,
264:       FontStyle,
265:       Underline,
266:       Color,
267:       TextAlign.configure({ types: ["heading", "paragraph"] }),
268:       Collaboration.configure({ document: ydoc }),
269:       CollaborationCursor.configure({
270:         provider,
271:         user: {
272:           name: user?.name || "Guest",
273:           color: getUserColor(user?.id || user?.email || "guest"),
274:         },
275:       }),
276:       AIExtension.configure({ apiKey: import.meta.env.VITE_GEMINI_API_KEY }),
277:       AiHighlight,
278:       CommentExtension,
279:     ],
280:     autofocus: true,
281:     editable: !loading,
282:     onUpdate: ({ editor }) => {
283:       const { $from } = editor.state.selection;
284:       const node = $from.node();
285:       if (node.type.name === "heading") {
286:         setHeadingLevel(`heading${node.attrs.level}`);
287:       } else {
288:         setHeadingLevel("paragraph");
289:       }
290:       const marks = editor.getAttributes("fontStyle");
291:       setFontSize(marks.fontSize || "16px");
292:       setFontFamily(marks.fontFamily || "");
293:       setTextColor(editor.getAttributes("color").color || "#000000");
294:     },
295:   });
296: 
297:   const fetchCollaborators = async () => {
298:     try {
299:       const res = await fetch(`${baseURL}/api/documents/${id}`, {
300:         credentials: "include",
301:       });
302:       const data = await res.json();
303:       if (res.ok && data.data) {
304:         const owner = data.data.owner;
305:         const collabs = data.data.collaborators || [];
306:         const allParticipants = [owner, ...collabs].filter(Boolean);
307:         setCollaborators(allParticipants);
308:       }
309:     } catch {
310:       // empty
311:     }
312:   };
313: 
314:   useEffect(() => {
315:     fetchCollaborators();
316:   }, [id]);
317: 
318:   const handleAddCollaborator = async () => {
319:     setAdding(true);
320:     try {
321:       const res = await fetch(`${baseURL}/api/documents/${id}/collaborators`, {
322:         method: "POST",
323:         credentials: "include",
324:         headers: { "Content-Type": "application/json" },
325:         body: JSON.stringify({ email: collaboratorEmail }),
326:       });
327:       const data = await res.json();
328:       if (res.ok) {
329:         toast.success("Collaborator added!");
330:         setCollaboratorEmail("");
331:         fetchCollaborators();
332:       } else {
333:         toast.error(data.message || "Failed to add collaborator");
334:       }
335:     } catch {
336:       toast.error("Failed to add collaborator");
337:     }
338:     setAdding(false);
339:   };
340: 
341:   useEffect(() => {
342:     if (!editor) return;
343:     const loadDocument = async () => {
344:       if (id === "new") {
345:         setDocTitle("Untitled Document");
346:         setDocOwnerId(user?.id);
347:         editor.commands.setContent("<p></p>");
348:         editor.setEditable(true);
349:         setLoading(false);
350:         return;
351:       }
352:       try {
353:         const res = await fetch(`${baseURL}/api/documents/${id}`, {
354:           credentials: "include",
355:         });
356:         const data = await res.json();
357:         if (!res.ok) throw new Error();
358:         const title = data.data?.title || "Untitled Document";
359:         setDocTitle(title);
360:         setDocOwnerId(data.data?.owner?._id || data.data?.owner);
361:         editor.setEditable(true);
362:         setLoading(false);
363:       } catch {
364:         toast.error("Failed to load document");
365:         setDocTitle("Untitled Document");
366:         setDocOwnerId(null);
367:         editor.commands.setContent("<p></p>");
368:         editor.setEditable(true);
369:         setLoading(false);
370:       }
371:     };
372:     loadDocument();
373:   }, [id, editor, user]);
374: 
375: 
376: 
377:   const saveDocument = async () => {
378:     try {
379:       await fetch(`${baseURL}/api/documents/${id}`, {
380:         method: "PUT",
381:         credentials: "include",
382:         headers: { "Content-Type": "application/json" },
383:         body: JSON.stringify({ title: docTitle, content: editor.getHTML() }),
384:       });
385:     } catch {
386:       // empty
387:     }
388:   };
389: 
390:   const handleSave = async () => {
391:     await saveDocument();
392:     toast.success("Document saved!");
393:     navigate("/dashboard");
394:   };
395: 
396:   const handleHeadingChange = (e) => {
397:     const value = e.target.value;
398:     setHeadingLevel(value);
399:     if (value === "paragraph") {
400:       editor.chain().focus().setParagraph().run();
401:     } else {
402:       const level = Number(value.replace("heading", ""));
403:       editor.chain().focus().toggleHeading({ level }).run();
404:     }
405:   };
406: 
407:   const handleFontSizeChange = (e) => {
408:     const value = e.target.value;
409:     setFontSize(value);
410:     editor
411:       .chain()
412:       .focus()
413:       .setMark("fontStyle", { fontSize: value, fontFamily })
414:       .run();
415:   };
416: 
417:   const handleFontFamilyChange = (e) => {
418:     const value = e.target.value;
419:     setFontFamily(value);
420:     editor
421:       .chain()
422:       .focus()
423:       .setMark("fontStyle", { fontFamily: value, fontSize })
424:       .run();
425:   };
426: 
427:   const handleColorSelect = (color) => {
428:     setTextColor(color);
429:     setCustomColor(color);
430:     editor.chain().focus().setColor(color).run();
431:     setShowColorPicker(false);
432:   };
433: 
434:   const handleCustomColor = (e) => {
435:     const value = e.target.value;
436:     setCustomColor(value);
437:     setTextColor(value);
438:     editor.chain().focus().setColor(value).run();
439:   };
440: 
441:   useEffect(() => {
442:     if (!showColorPicker) return;
443:     const onClick = (e) => {
444:       if (!e.target.closest(".color-picker-popover")) setShowColorPicker(false);
445:     };
446:     window.addEventListener("mousedown", onClick);
447:     return () => window.removeEventListener("mousedown", onClick);
448:   }, [showColorPicker]);
449: 
450:   useEffect(() => {
451:     if (!showAiMenu) return;
452:     const handleClickOutside = (event) => {
453:       if (aiMenuRef.current && !aiMenuRef.current.contains(event.target)) {
454:         setShowAiMenu(false);
455:       }
456:     };
457:     document.addEventListener("mousedown", handleClickOutside);
458:     return () => document.removeEventListener("mousedown", handleClickOutside);
459:   }, [showAiMenu]);
460: 
461:   // Auto-focus Ask Document input when shown
462:   useEffect(() => {
463:     if (showAskDocInput && askDocInputRef.current) {
464:       askDocInputRef.current.focus();
465:     }
466:   }, [showAskDocInput]);
467: 
468:   // Close Ask Document input on outside click
469:   useEffect(() => {
470:     if (!showAskDocInput) return;
471:     const handleClick = (e) => {
472:       if (
473:         askDocInputRef.current &&
474:         !askDocInputRef.current.contains(e.target)
475:       ) {
476:         setShowAskDocInput(false);
477:       }
478:     };
479:     document.addEventListener("mousedown", handleClick);
480:     return () => document.removeEventListener("mousedown", handleClick);
481:   }, [showAskDocInput]);
482: 
483:   const handleAskDoc = () => {
484:     if (!askDocPrompt.trim()) return;
485:     editor.commands.generateText({
486:       task: "ask_document",
487:       prompt: askDocPrompt,
488:     });
489:     setShowAskDocInput(false);
490:     setAskDocPrompt("");
491:   };
492: 
493:   if (loading || !editor) {
494:     return (
495:       <div className="fixed inset-0 flex items-center justify-center bg-gray-100 z-50">
496:         <div className="text-lg text-blue-700">Loading...</div>
497:       </div>
498:     );
499:   }
500: 
501:   return (
502:     <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
503:       <CollaboratorBar 
504:         collaboratorEmail={collaboratorEmail}
505:         setCollaboratorEmail={setCollaboratorEmail}
506:         adding={adding}
507:         handleAddCollaborator={handleAddCollaborator}
508:         collaborators={collaborators}
509:         currentUser={user}
510:       />
511: 
512:       <div className="flex items-center bg-white px-8 py-3 shadow h-16 border-b border-gray-200">
513:         <div 
514:           className="flex items-center gap-3 select-none cursor-pointer"
515:           onClick={() => navigate("/dashboard")}
516:         >
517:           <img src="/logo.png" alt="CoWrite Logo" className="w-10 h-10" />
518:           <span className="text-2xl font-extrabold text-blue-700 tracking-wide hover:opacity-80 transition-opacity">
519:             CoWrite
520:           </span>
521:         </div>
522:         <div className="ml-8 flex-1">
523:           {user?.id === docOwnerId ? (
524:             <input
525:               type="text"
526:               value={docTitle}
527:               onChange={(e) => setDocTitle(e.target.value)}
528:               className="bg-transparent text-xl font-semibold text-gray-800 border-b border-gray-200 focus:border-blue-500 outline-none px-2 py-1 w-full max-w-lg"
529:               placeholder="Document Title"
530:             />
531:           ) : (
532:             <input
533:               type="text"
534:               value={docTitle}
535:               disabled
536:               className="bg-transparent text-xl font-semibold text-gray-800 border-b border-gray-200 px-2 py-1 w-full max-w-lg opacity-70 cursor-not-allowed"
537:               readOnly
538:               tabIndex={-1}
539:               aria-label="Document Title (read only)"
540:             />
541:           )}
542:         </div>
543: 
544:         {awarenessUsers.length > 0 && (
545:           <div className="flex -space-x-2 mr-4" title="Currently viewing this document">
546:             {awarenessUsers.map((u, idx) => (
547:               <div 
548:                 key={idx}
549:                 className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm relative group cursor-pointer hover:z-10 transition-transform hover:scale-110"
550:                 style={{ backgroundColor: u.color }}
551:               >
552:                 {u.name.charAt(0).toUpperCase()}
553:                 <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
554:                   {u.name}
555:                 </div>
556:               </div>
557:             ))}
558:           </div>
559:         )}
560: 
561:         <button
562:           onClick={handleSave}
563:           className="ml-4 bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition"
564:         >
565:           Save
566:         </button>
567:       </div>
568: 
569:       <div className="flex gap-2 items-center bg-gray-50 px-8 py-2 shadow-sm border-b border-gray-100 relative">
570:         <button
571:           onClick={() => editor.chain().focus().undo().run()}
572:           disabled={!editor.can().chain().focus().undo().run()}
573:           className="p-2 rounded transition text-xl flex items-center justify-center bg-white text-gray-700 hover:bg-blue-50"
574:           title="Undo"
575:         >
576:           <FiRotateCcw />
577:         </button>
578:         <button
579:           onClick={() => editor.chain().focus().redo().run()}
580:           disabled={!editor.can().chain().focus().redo().run()}
581:           className="p-2 rounded transition text-xl flex items-center justify-center bg-white text-gray-700 hover:bg-blue-50"
582:           title="Redo"
583:         >
584:           <FiRotateCw />
585:         </button>
586: 
587:         <span className="mx-2 border-l border-gray-300 h-6" />
588: 
589:         <div className="relative" ref={aiMenuRef}>
590:           <button
591:             onClick={() => setShowAiMenu((v) => !v)}
592:             className={`p-2 rounded transition text-xl flex items-center justify-center gap-1.5 ${
593:               showAiMenu
594:                 ? "bg-blue-100 text-blue-700"
595:                 : "bg-white text-gray-700 hover:bg-blue-50"
596:             }`}
597:             title="AI Tools"
598:           >
599:             <LuSparkles />
600:             <span className="text-sm font-medium pr-1">AI Tools</span>
601:           </button>
602:           {showAiMenu && (
603:             <AIDropdownMenu
604:               editor={editor}
605:               closeMenu={() => setShowAiMenu(false)}
606:             />
607:           )}
608:         </div>
609: 
610:         <span className="mx-2 border-l border-gray-300 h-6" />
611: 
612:         <label className="flex items-center gap-1">
613:           <BiHeading className="text-xl text-gray-500" />
614:           <select
615:             value={headingLevel}
616:             onChange={handleHeadingChange}
617:             className="bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none"
618:           >
619:             <option value="paragraph">Normal</option>
620:             <option value="heading1">Heading 1</option>
621:             <option value="heading2">Heading 2</option>
622:             <option value="heading3">Heading 3</option>
623:             <option value="heading4">Heading 4</option>
624:             <option value="heading5">Heading 5</option>
625:             <option value="heading6">Heading 6</option>
626:           </select>
627:         </label>
628:         <select
629:           value={fontSize}
630:           onChange={handleFontSizeChange}
631:           className="bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none ml-2"
632:           style={{ width: 70 }}
633:         >
634:           <option value="12px">12</option> <option value="14px">14</option>{" "}
635:           <option value="16px">16</option>
636:           <option value="18px">18</option> <option value="20px">20</option>{" "}
637:           <option value="24px">24</option>
638:           <option value="28px">28</option> <option value="32px">32</option>
639:         </select>
640:         <select
641:           value={fontFamily}
642:           onChange={handleFontFamilyChange}
643:           className="bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none ml-2"
644:           style={{ width: 140 }}
645:         >
646:           {FONT_FAMILIES.map((f) => (
647:             <option
648:               key={f.value}
649:               value={f.value}
650:               style={{ fontFamily: f.value }}
651:             >
652:               {f.label}
653:             </option>
654:           ))}
655:         </select>
656:         <div className="relative ml-2">
657:           <button
658:             type="button"
659:             className={`p-2 rounded transition text-xl flex items-center justify-center bg-white text-gray-700 hover:bg-blue-50`}
660:             title="Text Color"
661:             onClick={() => setShowColorPicker((v) => !v)}
662:             style={{ minWidth: 28 }}
663:           >
664:             <ColorIcon color={textColor} />
665:           </button>
666:           {showColorPicker && (
667:             <div className="color-picker-popover absolute z-50 mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-xl p-4 min-w-[140px]">
668:               <div className="grid grid-cols-5 gap-3 mb-3">
669:                 {COLOR_GRID.map((color) => (
670:                   <button
671:                     key={color}
672:                     type="button"
673:                     className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition ${
674:                       color.toLowerCase() === textColor.toLowerCase()
675:                         ? "border-blue-600 ring-2 ring-blue-200"
676:                         : "border-gray-200 hover:border-blue-400"
677:                     }`}
678:                     style={{ background: color }}
679:                     onClick={() => handleColorSelect(color)}
680:                   />
681:                 ))}
682:               </div>
683:               <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
684:                 <label className="relative">
685:                   <input
686:                     type="color"
687:                     value={customColor}
688:                     onChange={handleCustomColor}
689:                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
690:                     title="Custom Color"
691:                   />
692:                   <span
693:                     className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center"
694:                     style={{ background: customColor }}
695:                   >
696:                     <MdColorize className="text-xl text-gray-700" />
697:                   </span>
698:                 </label>
699:               </div>
700:             </div>
701:           )}
702:         </div>
703:         <span className="mx-2 border-l border-gray-300 h-6" />
704:         <button
705:           onClick={() => editor.chain().focus().setTextAlign("left").run()}
706:           className={`p-2 rounded transition text-xl flex items-center justify-center ${
707:             editor.isActive({ textAlign: "left" })
708:               ? "bg-blue-600 text-white"
709:               : "bg-white text-gray-700 hover:bg-blue-50"
710:           }`}
711:           title="Align Left"
712:         >
713:           <MdFormatAlignLeft />
714:         </button>
715:         <button
716:           onClick={() => editor.chain().focus().setTextAlign("center").run()}
717:           className={`p-2 rounded transition text-xl flex items-center justify-center ${
718:             editor.isActive({ textAlign: "center" })
719:               ? "bg-blue-600 text-white"
720:               : "bg-white text-gray-700 hover:bg-blue-50"
721:           }`}
722:           title="Align Center"
723:         >
724:           <MdFormatAlignCenter />
725:         </button>
726:         <button
727:           onClick={() => editor.chain().focus().setTextAlign("right").run()}
728:           className={`p-2 rounded transition text-xl flex items-center justify-center ${
729:             editor.isActive({ textAlign: "right" })
730:               ? "bg-blue-600 text-white"
731:               : "bg-white text-gray-700 hover:bg-blue-50"
732:           }`}
733:           title="Align Right"
734:         >
735:           <MdFormatAlignRight />
736:         </button>
737:         <button
738:           onClick={() => editor.chain().focus().setTextAlign("justify").run()}
739:           className={`p-2 rounded transition text-xl flex items-center justify-center ${
740:             editor.isActive({ textAlign: "justify" })
741:               ? "bg-blue-600 text-white"
742:               : "bg-white text-gray-700 hover:bg-blue-50"
743:           }`}
744:           title="Justify"
745:         >
746:           <MdFormatAlignJustify />
747:         </button>
748:         <span className="mx-2 border-l border-gray-300 h-6" />
749:         <button
750:           onClick={() => editor.chain().focus().toggleBold().run()}
751:           disabled={!editor.can().chain().focus().toggleBold().run()}
752:           className={`p-2 rounded transition text-xl flex items-center justify-center ${
753:             editor.isActive("bold")
754:               ? "bg-blue-600 text-white"
755:               : "bg-white text-gray-700 hover:bg-blue-50"
756:           }`}
757:           title="Bold"
758:         >
759:           <FiBold />
760:         </button>
761:         <button
762:           onClick={() => editor.chain().focus().toggleItalic().run()}
763:           disabled={!editor.can().chain().focus().toggleItalic().run()}
764:           className={`p-2 rounded transition text-xl flex items-center justify-center ${
765:             editor.isActive("italic")
766:               ? "bg-blue-600 text-white"
767:               : "bg-white text-gray-700 hover:bg-blue-50"
768:           }`}
769:           title="Italic"
770:         >
771:           <FiItalic />
772:         </button>
773:         <button
774:           onClick={() => editor.chain().focus().toggleStrike().run()}
775:           disabled={!editor.can().chain().focus().toggleStrike().run()}
776:           className={`p-2 rounded transition text-xl flex items-center justify-center ${
777:             editor.isActive("strike")
778:               ? "bg-blue-600 text-white"
779:               : "bg-white text-gray-700 hover:bg-blue-50"
780:           }`}
781:           title="Strikethrough"
782:         >
783:           <MdFormatStrikethrough />
784:         </button>
785:         <button
786:           onClick={() => editor.chain().focus().toggleUnderline().run()}
787:           disabled={!editor.can().chain().focus().toggleUnderline().run()}
788:           className={`p-2 rounded transition text-xl flex items-center justify-center ${
789:             editor.isActive("underline")
790:               ? "bg-blue-600 text-white"
791:               : "bg-white text-gray-700 hover:bg-blue-50"
792:           }`}
793:           title="Underline"
794:         >
795:           <MdFormatUnderlined />
796:         </button>
797:         <button
798:           onClick={() => setShowAskDocInput((v) => !v)}
799:           className="p-2 rounded transition text-xl flex items-center justify-center bg-white text-gray-700 hover:bg-blue-50"
800:           title="Ask Document"
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.
