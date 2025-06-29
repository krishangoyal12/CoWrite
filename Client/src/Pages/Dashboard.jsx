import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiPlus } from "react-icons/fi";
import { useAuth } from "../../Context/useAuth";

const baseURL = import.meta.env.VITE_URL;

function stripHtml(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

export default function Dashboard() {
  const { auth: user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [renameId, setRenameId] = useState(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Extract fetchDocuments outside of useEffects so it can be reused
  async function fetchDocuments(showErrors = true) {
    try {
      if (!loading) {
        setRefreshing(true);
      }
      
      const res = await fetch(`${baseURL}/api/documents`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      
      if (res.ok) {
        setDocuments(data.data || []);
      } else if (showErrors) {
        toast.error(data.message || "Failed to fetch documents");
      } else {
        console.error("Silent refresh failed:", data.message);
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
  }

  useEffect(() => {
    fetchDocuments(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchDocuments(false);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

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
    try {
      const res = await fetch(`${baseURL}/api/documents/${deleteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setDocuments((docs) => docs.filter((doc) => doc._id !== deleteId));
        toast.success("Document deleted");
      } else {
        toast.error(data.message || "Delete failed");
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
    try {
      const res = await fetch(`${baseURL}/api/documents/${renameId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: renameTitle }),
      });
      const data = await res.json();
      if (res.ok) {
        setDocuments((docs) =>
          docs.map((doc) =>
            doc._id === renameId ? { ...doc, title: renameTitle } : doc
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

  // Create new document and navigate to its editor
  const handleCreateNewDocument = async () => {
    try {
      const res = await fetch(`${baseURL}/api/documents`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled Document",
          content: "<p></p>",
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
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <svg
          className="animate-spin h-8 w-8 text-blue-600 mb-3"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          ></path>
        </svg>
        <span className="text-lg text-gray-500">Loading documents...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 relative">
      <h1 className="text-3xl font-bold mb-6 text-blue-700 flex items-center">
        Your Documents
        {refreshing && (
          <span className="ml-3 text-sm font-normal text-blue-500 flex items-center">
            <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Syncing...
          </span>
        )}
      </h1>
      {documents.length === 0 ? (
        <div className="text-gray-500 text-center mt-12">
          Nothing to show, create your first document!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <div
              key={doc._id}
              className="relative flex flex-col group cursor-pointer rounded-2xl shadow-lg hover:shadow-2xl transition-transform duration-200 bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:scale-[1.025] hover:-rotate-1"
              style={{ minHeight: 240 }}
              onClick={() => {
                // Prevent navigation if a modal is open for this doc
                if (renameId !== doc._id && deleteId !== doc._id) {
                  navigate(`/editor/${doc._id}`);
                }
              }}
            >
              {/* Badge for owned/shared */}
              {user &&
                doc.owner &&
                (doc.owner._id === user.id ? (
                  <span className="absolute top-3 left-3 bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-semibold z-10">
                    You own this
                  </span>
                ) : (
                  <span className="absolute top-3 left-3 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-semibold z-10">
                    Shared with you
                  </span>
                ))}
              {/* Paper-like preview */}
              <div className="flex-1 px-7 pt-7 pb-5 bg-[#fcfcfc] rounded-t-2xl border-b border-gray-100 font-serif relative overflow-hidden">
                {/* Optional watermark icon */}
                <svg
                  className="absolute right-4 bottom-4 opacity-10 w-12 h-12 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  viewBox="0 0 24 24"
                >
                  <rect
                    x="4"
                    y="4"
                    width="16"
                    height="16"
                    rx="2"
                    stroke="currentColor"
                  />
                  <line x1="8" y1="8" x2="16" y2="8" stroke="currentColor" />
                  <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" />
                  <line x1="8" y1="16" x2="12" y2="16" stroke="currentColor" />
                </svg>
                <div className="text-gray-700 text-[15px] whitespace-pre-line line-clamp-5 min-h-[90px]">
                  {doc.content ? (
                    stripHtml(doc.content).slice(0, 200) +
                    (stripHtml(doc.content).length > 200 ? "..." : "")
                  ) : (
                    <span className="text-gray-400 italic">
                      No content yet.
                    </span>
                  )}
                </div>
              </div>
              {/* Footer with title */}
              <div className="bg-blue-50 border-t border-blue-100 px-7 py-3 flex items-center rounded-b-2xl">
                <span className="text-base font-semibold text-blue-700 truncate">
                  {doc.title || "Untitled Document"}
                </span>
              </div>
              {/* Menu button */}
              <button
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 transition z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenId(menuOpenId === doc._id ? null : doc._id);
                }}
              >
                <svg
                  className="w-6 h-6 text-gray-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <circle cx="4" cy="10" r="2" />
                  <circle cx="10" cy="10" r="2" />
                  <circle cx="16" cy="10" r="2" />
                </svg>
              </button>
              {menuOpenId === doc._id && (
                <div
                  ref={menuRef}
                  className="absolute z-20 top-10 right-3 bg-white border border-gray-200 rounded shadow-lg py-1 w-28"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-blue-50 hover:text-blue-700"
                    onClick={() => handleRename(doc._id, doc.title)}
                  >
                    Rename
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-red-50 hover:text-red-600"
                    onClick={() => {
                      setDeleteId(doc._id);
                      setMenuOpenId(null);
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Rename Modal rendered ONCE outside the map */}
      {renameId && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50"
          onClick={() => setRenameId(null)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleRenameSubmit}
            className="bg-white rounded-lg shadow-lg p-6 flex flex-col gap-4 w-80"
          >
            <h2 className="text-lg font-semibold text-blue-700">
              Rename Document
            </h2>
            <input
              type="text"
              value={renameTitle}
              onChange={(e) => setRenameTitle(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-1 rounded bg-gray-200 hover:bg-gray-300"
                onClick={() => setRenameId(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Modal rendered ONCE outside the map */}
      {deleteId && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50"
          onClick={() => setDeleteId(null)}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 w-80 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-red-600">
              Delete Document
            </h2>
            <p className="text-gray-700">
              Are you sure you want to delete{" "}
              <span className="font-bold">
                {documents.find((doc) => doc._id === deleteId)?.title ||
                  "Untitled Document"}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-1 rounded bg-gray-200 hover:bg-gray-300"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating + icon button */}
      <button
        className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center text-4xl transition z-50"
        title="Add New Document"
        onClick={handleCreateNewDocument}
        aria-label="Add new document"
      >
        <FiPlus />
      </button>
    </div>
  );
}