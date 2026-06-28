import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Color from "@tiptap/extension-color";
import FontStyle from "../Extensions/FontStyle";
import toast from "react-hot-toast";
import html2pdf from "html2pdf.js";

const baseURL = import.meta.env.VITE_URL;

export default function PublicEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [docTitle, setDocTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      TextStyle,
      FontStyle,
      Underline,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    editable: false,
    content: "<p></p>"
  });

  useEffect(() => {
    if (!editor) return;
    const loadDocument = async () => {
      try {
        const res = await fetch(`${baseURL}/api/documents/public/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load document");
        
        const title = data.data?.title || "Untitled Document";
        setDocTitle(title);
        
        editor.commands.setContent(data.data?.content || "<p></p>");
        setLoading(false);
      } catch (err) {
        setErrorMsg(err.message);
        toast.error(err.message);
        setLoading(false);
      }
    };
    loadDocument();
  }, [id, editor]);

  const handleDownloadPDF = () => {
    const element = document.createElement("div");
    element.innerHTML = editor.getHTML();
    element.style.padding = "40px";
    element.style.fontFamily = "sans-serif";
    
    const style = document.createElement("style");
    style.innerHTML = `
      h1, h2, h3 { color: #111; }
      p { color: #333; line-height: 1.5; }
    `;
    element.appendChild(style);

    const opt = {
      margin:       0.5,
      filename:     `${docTitle || 'document'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    toast.promise(
      html2pdf().set(opt).from(element).save(),
      {
        loading: 'Generating PDF...',
        success: 'PDF downloaded!',
        error: 'Failed to generate PDF'
      }
    );
  };

  if (loading || !editor) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-100 z-50">
        <div className="text-lg text-blue-700">Loading...</div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-100 z-50">
        <div className="text-2xl font-bold text-red-600 mb-4">Access Denied</div>
        <div className="text-gray-700 mb-8">{errorMsg}</div>
        <button
          onClick={() => navigate("/")}
          className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition"
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      <div className="flex items-center bg-white px-8 py-3 shadow h-16 border-b border-gray-200 justify-between">
        <div 
          className="flex items-center gap-3 select-none cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img src="/logo.png" alt="CoWrite Logo" className="w-10 h-10" />
          <span className="text-2xl font-extrabold text-blue-700 tracking-wide hover:opacity-80 transition-opacity">
            CoWrite
          </span>
          <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-widest ml-2 border border-green-200">Public View</span>
        </div>
        
        <div className="text-lg font-bold text-gray-800 text-center flex-1">
          {docTitle}
        </div>

        <button
          onClick={handleDownloadPDF}
          className="bg-gray-100 text-gray-700 px-5 py-2 rounded hover:bg-gray-200 transition font-medium flex items-center gap-2 border border-gray-200 shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download PDF
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-gray-100 p-8 flex justify-center pb-32">
        <div className="bg-white shadow-md w-full max-w-[800px] min-h-[1056px] relative flex flex-col mt-4 border border-gray-200 print-container">
          <div className="flex-1 p-[40px] pt-[60px] pb-[80px] outline-none">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
}
