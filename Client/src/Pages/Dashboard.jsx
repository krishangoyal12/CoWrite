import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiPlus,
  FiSearch,
  FiGrid,
  FiList,
  FiFileText,
  FiClock,
  FiUsers,
  FiUser,
  FiMoreVertical,
  FiTrash2,
  FiEdit2,
  FiCheck,
  FiFolder,
  FiShare2,
  FiCompass,
  FiFilePlus
} from "react-icons/fi";
import { useAuth } from "../../Context/useAuth";

const baseURL = import.meta.env.VITE_URL;

function stripHtml(html) {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

function formatDate(dateString) {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const diffHours = (now - date) / (1000 * 60 * 60);

  if (diffHours < 1) {
    const diffMinutes = Math.max(1, Math.floor((now - date) / (1000 * 60)));
    return `${diffMinutes}m ago`;
  }
  if (diffHours < 24) {
    return `${Math.floor(diffHours)}h ago`;
  }
  if (diffHours < 48) {
    return "Yesterday";
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const TEMPLATES = [
  {
    id: "blank",
    title: "Blank Document",
    subtitle: "Start fresh with a clean slate",
    icon: "📄",
    gradient: "from-blue-500/10 to-indigo-500/10",
    initialContent: "<p></p>"
  },
  {
    id: "meeting-notes",
    title: "Meeting Notes",
    subtitle: "Agenda, discussions & action items",
    icon: "📋",
    gradient: "from-emerald-500/10 to-teal-500/10",
    initialContent: `<h1>📋 Meeting Notes</h1>
<p><strong>📅 Date:</strong> ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} &nbsp;|&nbsp; <strong>⏱️ Duration:</strong> 45 min &nbsp;|&nbsp; <strong>🎯 Facilitator:</strong> [Facilitator Name]</p>
<p><strong>👥 Attendees:</strong> [Name 1], [Name 2], [Name 3]</p>
<hr />
<h2>🎯 Meeting Objective</h2>
<p>Brief summary of why we're meeting and what decisions or alignments need to be reached today.</p>
<h2>📋 Agenda &amp; Discussion Topics</h2>
<ul>
  <li><strong>Sprint Progress &amp; Key Wins:</strong> Review recent achievements, demos, and metrics.</li>
  <li><strong>Technical Dependencies &amp; Blockers:</strong> Discuss cross-team bottlenecks and architecture decisions.</li>
  <li><strong>Next Milestone Timeline:</strong> Align on deliverables, dates, and ownership.</li>
</ul>
<h2>💬 Discussion &amp; Notes</h2>
<blockquote>
  <p><em>“Capture major viewpoints, debate points, or important quotes from the discussion here.”</em></p>
</blockquote>
<p>Record additional context, alternative approaches considered, and technical trade-offs discussed during the conversation.</p>
<h2>🏆 Decisions Made</h2>
<ol>
  <li><strong>Decision 1:</strong> Architecture approved for real-time collaboration pipeline.</li>
  <li><strong>Decision 2:</strong> Agreed on technical specifications and design system tokens.</li>
</ol>
<h2>✅ Action Items</h2>
<ul>
  <li>[ ] <strong>@Engineering:</strong> Implement API integration and finalize schemas</li>
  <li>[ ] <strong>@Design:</strong> Conduct user feedback sessions on prototype</li>
  <li>[ ] <strong>@Product:</strong> Update milestone timeline and share summary with stakeholders</li>
</ul>`
  },
  {
    id: "project-spec",
    title: "Project Proposal",
    subtitle: "Goals, roadmap & timeline",
    icon: "🚀",
    gradient: "from-purple-500/10 to-pink-500/10",
    initialContent: `<h1>🚀 Project Proposal</h1>
<p><strong>👤 Project Lead:</strong> [Your Name] &nbsp;|&nbsp; <strong>🏷️ Status:</strong> Draft / In Review &nbsp;|&nbsp; <strong>🎯 Target Timeline:</strong> Q3 2026</p>
<hr />
<h2>1. Executive Summary</h2>
<p>A concise explanation of the vision, core opportunity, and expected business and user impact of this project.</p>
<h2>2. Problem Statement &amp; Opportunity</h2>
<blockquote>
  <p><strong>The Core Challenge:</strong> What specific pain point or inefficiency does this proposal solve? Why is solving it critical right now?</p>
</blockquote>
<p>Provide qualitative user feedback, quantitative metrics, or competitive landscape observations supporting this initiative.</p>
<h2>3. Proposed Solution &amp; Scope</h2>
<p>Outline the approach, user workflow, and high-level architectural design:</p>
<ul>
  <li><strong>Core Capability 1:</strong> Primary functionality and seamless user interaction flow.</li>
  <li><strong>Core Capability 2:</strong> Real-time synchronization, state management, and backend reliability.</li>
  <li><strong>Core Capability 3:</strong> Performance optimization, accessibility, and intuitive keyboard shortcuts.</li>
</ul>
<h2>4. Out of Scope (Non-Goals)</h2>
<p>Explicitly define what this project will <em>not</em> address in this initial version to keep delivery focused:</p>
<ul>
  <li>Non-goal 1: Third-party integrations beyond direct API access</li>
  <li>Non-goal 2: Custom offline-only database sync</li>
</ul>
<h2>5. Success Metrics (KPIs)</h2>
<ol>
  <li><strong>Engagement:</strong> 40% increase in weekly active collaborative editing sessions.</li>
  <li><strong>Performance:</strong> Sub-50ms typing and synchronization latency under high concurrency.</li>
  <li><strong>Reliability:</strong> 99.9% uptime with zero document state divergence.</li>
</ol>
<h2>6. Implementation Milestones</h2>
<ul>
  <li><strong>Milestone 1 (Weeks 1–2):</strong> Architectural design, schema review &amp; proof-of-concept</li>
  <li><strong>Milestone 2 (Weeks 3–4):</strong> Core feature development &amp; internal dogfooding</li>
  <li><strong>Milestone 3 (Weeks 5–6):</strong> Performance hardening, user testing &amp; release rollout</li>
</ul>
<h2>7. Risks &amp; Open Questions</h2>
<ul>
  <li><em>Risk:</em> Third-party API rate limits &rarr; <strong>Mitigation:</strong> Implement robust caching and client-side debounce.</li>
  <li><em>Open Question:</em> What are the security compliance requirements for multi-tenant data storage?</li>
</ul>`
  },
  {
    id: "blog-post",
    title: "Blog Post",
    subtitle: "Catchy hook, body & takeaways",
    icon: "✍️",
    gradient: "from-amber-500/10 to-orange-500/10",
    initialContent: `<h1>✍️ Catchy Article Title</h1>
<p><em>By [Author Name] &nbsp;&bull;&nbsp; 5 min read &nbsp;&bull;&nbsp; Topic: Technology &amp; Engineering</em></p>
<hr />
<h2>Introduction: The Hook</h2>
<p>Hook your reader with a compelling story, a surprising statistic, or a counter-intuitive observation. Draw the audience in by articulating a shared challenge or question.</p>
<blockquote>
  <p>“A great pull-quote captures the central insight and keeps readers engaged through the core narrative.”</p>
</blockquote>
<h2>The Core Challenge</h2>
<p>Break down the underlying complexity. Why do most traditional approaches fall short? Use clear paragraphs, real-world examples, or code snippets to illustrate the problem.</p>
<pre><code>// Example code snippet or architecture pattern
function synchronizeState(localState, incomingPatch) {
  const merged = localState.applyUpdate(incomingPatch);
  return merged.getSnapshot();
}</code></pre>
<h2>The Solution &amp; Insights</h2>
<p>Explain your key findings, lessons learned, or the paradigm shift that resolved the challenge. Highlight practical advice that readers can apply immediately in their own work.</p>
<h2>Key Takeaways</h2>
<ul>
  <li><strong>First Principle:</strong> Always prioritize user feedback and fast iteration loops.</li>
  <li><strong>Architecture Matters:</strong> Pick simple, robust data structures before premature optimization.</li>
  <li><strong>Polish Counts:</strong> Micro-interactions and typography turn good software into great software.</li>
</ul>
<h2>Conclusion &amp; What's Next</h2>
<p>Summarize the overarching moral or future outlook. End with an inspiring closing thought or a prompt inviting readers to share their perspective.</p>`
  }
];

export default function Dashboard() {
  const { auth: user, setAuth } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [renameId, setRenameId] = useState(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  // New UX state: search, filter tab, view mode, sort order
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'mine' | 'shared'
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'
  const [sortBy, setSortBy] = useState("updatedAt"); // 'updatedAt' | 'title'
  const [creatingFromTemplate, setCreatingFromTemplate] = useState(false);

  const menuRef = useRef(null);
  const navigate = useNavigate();

  const authFetch = (url, options = {}) => {
    const token = localStorage.getItem("token");
    const headers = { ...options.headers };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return fetch(url, { ...options, headers });
  };

  const fetchDocuments = useCallback(async (showErrors = true) => {
    try {
      if (!loading) {
        setRefreshing(true);
      }

      const res = await authFetch(`${baseURL}/api/documents`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();

      if (res.ok) {
        setDocuments(data.data || []);
      } else {
        if (res.status === 401) {
          setAuth(false);
        }
        if (showErrors) {
          toast.error(data.message || "Failed to fetch documents");
        } else {
          console.error("Silent refresh failed:", data.message);
        }
      }
    } catch (error) {
      if (showErrors) {
        toast.error("Network error");
      } else {
        console.error("Silent refresh network error:", error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading, setAuth]);

  useEffect(() => {
    fetchDocuments(true);
  }, [fetchDocuments]);

  // Soft refresh on window focus rather than aggressive 5s interval polling
  useEffect(() => {
    const onFocus = () => {
      fetchDocuments(false);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchDocuments]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpenId(null);
      }
    }
    if (menuOpenId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpenId]);

  const handleDelete = async () => {
    const docToDelete = documents.find((doc) => doc._id === deleteId);
    const isOwner =
      user &&
      docToDelete &&
      (docToDelete.owner?._id === user.id || docToDelete.owner === user.id);

    try {
      let res;
      if (isOwner) {
        res = await authFetch(`${baseURL}/api/documents/${deleteId}`, {
          method: "DELETE",
          credentials: "include",
        });
      } else {
        res = await authFetch(`${baseURL}/api/documents/${deleteId}/leave`, {
          method: "DELETE",
          credentials: "include",
        });
      }
      const data = await res.json();
      if (res.ok) {
        setDocuments((docs) => docs.filter((doc) => doc._id !== deleteId));
        toast.success(isOwner ? "Document deleted" : "You've left the document");
      } else {
        toast.error(data.message || "Failed");
      }
    } catch {
      toast.error("Network error");
    }
    setDeleteId(null);
    setMenuOpenId(null);
  };

  const handleRename = (id, currentTitle) => {
    setRenameId(id);
    setRenameTitle(currentTitle);
    setMenuOpenId(null);
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (!renameTitle.trim()) {
      toast.error("Title cannot be empty");
      return;
    }
    try {
      const res = await authFetch(`${baseURL}/api/documents/${renameId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: renameTitle.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setDocuments((docs) =>
          docs.map((doc) =>
            doc._id === renameId ? { ...doc, title: renameTitle.trim() } : doc
          )
        );
        toast.success("Document renamed");
      } else {
        toast.error(data.message || "Rename failed");
      }
    } catch {
      toast.error("Network error");
    }
    setRenameId(null);
    setRenameTitle("");
  };

  const handleCreateNewDocument = async (template) => {
    if (creatingFromTemplate) return;
    setCreatingFromTemplate(true);
    const title = template?.title && template.id !== "blank" ? template.title : "Untitled Document";
    const content = template?.initialContent || "<p></p>";

    try {
      const res = await authFetch(`${baseURL}/api/documents`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
        }),
      });
      const data = await res.json();
      if (res.ok && data.data && data.data._id) {
        navigate(`/editor/${data.data._id}`);
      } else {
        toast.error(data.message || "Failed to create document");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setCreatingFromTemplate(false);
    }
  };

  // Counts per category tab
  const tabCounts = useMemo(() => {
    let mine = 0;
    let shared = 0;
    documents.forEach((doc) => {
      const isOwner = user && (doc.owner?._id === user.id || doc.owner === user.id);
      if (isOwner) mine++;
      else shared++;
    });
    return { all: documents.length, mine, shared };
  }, [documents, user]);

  // Filtered & sorted documents
  const filteredDocuments = useMemo(() => {
    return documents
      .filter((doc) => {
        const isOwner =
          user &&
          (doc.owner?._id === user.id || doc.owner === user.id);

        if (activeTab === "mine" && !isOwner) return false;
        if (activeTab === "shared" && isOwner) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = (doc.title || "").toLowerCase().includes(q);
          const matchContent = stripHtml(doc.content || "").toLowerCase().includes(q);
          if (!matchTitle && !matchContent) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "title") {
          return (a.title || "").localeCompare(b.title || "");
        }
        // Default: most recently updated/created first
        const dateA = new Date(a.updatedAt || a.createdAt || 0);
        const dateB = new Date(b.updatedAt || b.createdAt || 0);
        return dateB - dateA;
      });
  }, [documents, activeTab, searchQuery, sortBy, user]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-80">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-base font-medium text-gray-500">Loading your workspace...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 relative">
      {/* Main Container */}
      <div className="mb-6">
        {/* Quick Starter Templates - Only shown in All & Created by me */}
        {activeTab !== "shared" && (
          <div className="bg-gray-50/80 rounded-2xl border border-gray-200/70 p-4 mb-6">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <FiCompass className="text-blue-600" /> Start from a Template
              </span>
              {refreshing && (
                <span className="text-[11px] font-medium text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  Syncing
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => handleCreateNewDocument(tmpl)}
                  disabled={creatingFromTemplate}
                  className="group flex flex-col items-start p-3.5 bg-white hover:bg-blue-50/50 rounded-xl border border-gray-200/80 hover:border-blue-300 text-left transition-all hover:shadow-sm"
                >
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{tmpl.icon}</div>
                  <div className="text-sm font-bold text-gray-800 group-hover:text-blue-700 leading-tight">
                    {tmpl.title}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                    {tmpl.subtitle}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search, Filter Tabs & View Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 pb-4 border-b border-gray-200/80">
          {/* Tabs: All / Mine / Shared */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === "all"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                All Docs ({tabCounts.all})
              </button>
              <button
                onClick={() => setActiveTab("mine")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === "mine"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Created by me ({tabCounts.mine})
              </button>
              <button
                onClick={() => setActiveTab("shared")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === "shared"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Shared with me ({tabCounts.shared})
              </button>
            </div>
            {refreshing && activeTab === "shared" && (
              <span className="text-[11px] font-medium text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                Syncing
              </span>
            )}
          </div>

          {/* Search bar & Sort/View switches */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="updatedAt">Last modified</option>
              <option value="title">Title (A-Z)</option>
            </select>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md text-sm transition-all ${
                  viewMode === "grid"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
                title="Grid view"
              >
                <FiGrid />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md text-sm transition-all ${
                  viewMode === "list"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
                title="List view"
              >
                <FiList />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Document Listing */}
      {filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-12 p-12 bg-white rounded-3xl border border-gray-200/80 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 text-2xl">
            {searchQuery ? "🔍" : activeTab === "shared" ? "👥" : "📄"}
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-1.5">
            {searchQuery
              ? "No matching documents"
              : activeTab === "shared"
              ? "No shared documents"
              : "No documents found"}
          </h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm">
            {searchQuery
              ? `No document matching "${searchQuery}". Try a different keyword.`
              : activeTab === "shared"
              ? "Documents shared with you by other collaborators will appear here."
              : "Capture notes, create ideas, and collaborate in real-time."}
          </p>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              Clear search filter
            </button>
          ) : activeTab === "shared" ? (
            <button
              onClick={() => setActiveTab("all")}
              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all border border-blue-200"
            >
              <FiFileText className="text-base" />
              View All Documents
            </button>
          ) : (
            <button
              onClick={() => handleCreateNewDocument()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-blue-500/20"
            >
              <FiPlus className="text-lg" />
              Create Document
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {filteredDocuments.map((doc) => {
            const isOwner =
              user &&
              doc.owner &&
              (doc.owner._id === user.id || doc.owner === user.id);

            return (
              <div
                key={doc._id}
                className="relative flex flex-col group cursor-pointer rounded-2xl bg-white border border-gray-200/90 hover:border-blue-300 hover:shadow-xl transition-all duration-200 overflow-hidden"
                style={{ minHeight: 230 }}
                onClick={() => {
                  if (renameId !== doc._id && deleteId !== doc._id) {
                    navigate(`/editor/${doc._id}`);
                  }
                }}
              >
                {/* Header row in card */}
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isOwner
                        ? "bg-blue-50 text-blue-700 border border-blue-100"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {isOwner ? <FiUser className="text-[10px]" /> : <FiUsers className="text-[10px]" />}
                    {isOwner ? "Owner" : "Shared"}
                  </span>

                  {/* Menu button */}
                  <button
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(menuOpenId === doc._id ? null : doc._id);
                    }}
                    title="Document actions"
                  >
                    <FiMoreVertical className="w-4 h-4" />
                  </button>

                  {/* Menu dropdown */}
                  {menuOpenId === doc._id && (
                    <div
                      ref={menuRef}
                      className="absolute z-30 top-11 right-3 bg-white border border-gray-200 rounded-xl shadow-xl py-1 w-32 animate-in fade-in zoom-in-95 duration-150"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="flex items-center gap-2 w-full text-left px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition"
                        onClick={() => handleRename(doc._id, doc.title)}
                      >
                        <FiEdit2 className="text-xs" /> Rename
                      </button>
                      <button
                        className="flex items-center gap-2 w-full text-left px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                        onClick={() => {
                          setDeleteId(doc._id);
                          setMenuOpenId(null);
                        }}
                      >
                        <FiTrash2 className="text-xs" /> {isOwner ? "Delete" : "Leave"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Document preview snippet */}
                <div className="flex-1 px-5 py-2.5 font-serif text-gray-600 text-xs sm:text-sm leading-relaxed overflow-hidden relative">
                  <div className="line-clamp-4 select-none">
                    {doc.content && stripHtml(doc.content).trim() ? (
                      stripHtml(doc.content).slice(0, 220)
                    ) : (
                      <span className="text-gray-400 italic font-sans text-xs">
                        Empty document — click to start writing...
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer with Title and Timestamp */}
                <div className="bg-gray-50/80 border-t border-gray-100 px-4 py-3 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <FiFileText className="text-blue-600 flex-shrink-0 text-sm" />
                    <span className="text-xs sm:text-sm font-bold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                      {doc.title || "Untitled Document"}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 flex items-center gap-1 flex-shrink-0">
                    <FiClock className="text-[10px]" />
                    <span>{formatDate(doc.updatedAt || doc.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="grid grid-cols-12 px-5 py-3 bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            <div className="col-span-6 sm:col-span-5">Name</div>
            <div className="hidden sm:block col-span-3">Role</div>
            <div className="col-span-4 sm:col-span-3">Last Modified</div>
            <div className="col-span-2 sm:col-span-1 text-right">Actions</div>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredDocuments.map((doc) => {
              const isOwner =
                user &&
                doc.owner &&
                (doc.owner._id === user.id || doc.owner === user.id);

              return (
                <div
                  key={doc._id}
                  onClick={() => {
                    if (renameId !== doc._id && deleteId !== doc._id) {
                      navigate(`/editor/${doc._id}`);
                    }
                  }}
                  className="grid grid-cols-12 items-center px-5 py-3 hover:bg-blue-50/40 cursor-pointer transition-colors group"
                >
                  <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <FiFileText className="text-sm" />
                    </div>
                    <span className="text-sm font-bold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                      {doc.title || "Untitled Document"}
                    </span>
                  </div>

                  <div className="hidden sm:block col-span-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isOwner
                          ? "bg-blue-50 text-blue-700 border border-blue-100"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {isOwner ? "Owner" : "Collaborator"}
                    </span>
                  </div>

                  <div className="col-span-4 sm:col-span-3 text-xs text-gray-500 flex items-center gap-1">
                    <FiClock className="text-gray-400 text-[11px]" />
                    <span>{formatDate(doc.updatedAt || doc.createdAt)}</span>
                  </div>

                  <div className="col-span-2 sm:col-span-1 text-right relative">
                    <button
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === doc._id ? null : doc._id);
                      }}
                    >
                      <FiMoreVertical className="w-4 h-4 ml-auto" />
                    </button>

                    {menuOpenId === doc._id && (
                      <div
                        ref={menuRef}
                        className="absolute z-30 top-9 right-0 bg-white border border-gray-200 rounded-xl shadow-xl py-1 w-32 animate-in fade-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="flex items-center gap-2 w-full text-left px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                          onClick={() => handleRename(doc._id, doc.title)}
                        >
                          <FiEdit2 className="text-xs" /> Rename
                        </button>
                        <button
                          className="flex items-center gap-2 w-full text-left px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                          onClick={() => {
                            setDeleteId(doc._id);
                            setMenuOpenId(null);
                          }}
                        >
                          <FiTrash2 className="text-xs" /> {isOwner ? "Delete" : "Leave"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renameId && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs z-50 p-4 animate-in fade-in duration-150"
          onClick={() => setRenameId(null)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleRenameSubmit}
            className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-4 w-full max-w-sm border border-gray-100"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <FiEdit2 className="text-sm" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 leading-tight">
                  Rename Document
                </h2>
                <p className="text-xs text-gray-500">Enter a descriptive title</p>
              </div>
            </div>

            <input
              type="text"
              value={renameTitle}
              onChange={(e) => setRenameTitle(e.target.value)}
              className="border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              autoFocus
            />

            <div className="flex justify-end gap-2 mt-1">
              <button
                type="button"
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                onClick={() => setRenameId(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete / Leave Access Modal */}
      {deleteId && (() => {
        const docToDelete = documents.find((doc) => doc._id === deleteId);
        const isOwner =
          user &&
          docToDelete &&
          (docToDelete.owner?._id === user.id || docToDelete.owner === user.id);

        return (
          <div
            className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs z-50 p-4 animate-in fade-in duration-150"
            onClick={() => setDeleteId(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4 border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <FiTrash2 className="text-sm" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 leading-tight">
                    {isOwner ? "Delete Document" : "Leave Document"}
                  </h2>
                  <p className="text-xs text-gray-500">Action confirmation</p>
                </div>
              </div>

              <div className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                <p className="mb-2">
                  Are you sure you want to {isOwner ? "delete" : "remove yourself from"}{" "}
                  <span className="font-bold text-gray-900">"{docToDelete?.title || "Untitled Document"}"</span>?
                </p>
                {isOwner ? (
                  <p className="text-rose-700 bg-rose-50/80 p-2.5 rounded-xl text-xs border border-rose-200/60 leading-normal">
                    <strong>Warning:</strong> You are the owner. This will permanently delete the document and all collaborators will lose access.
                  </p>
                ) : (
                  <p className="text-amber-800 bg-amber-50 p-2.5 rounded-xl text-xs border border-amber-200/60 leading-normal">
                    <strong>Note:</strong> Deleting will revoke your editor access. The owner will keep their copy.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-1">
                <button
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold text-xs text-gray-700 transition"
                  onClick={() => setDeleteId(null)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 transition shadow-sm"
                  onClick={handleDelete}
                >
                  {isOwner ? "Delete Document" : "Leave Document"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}