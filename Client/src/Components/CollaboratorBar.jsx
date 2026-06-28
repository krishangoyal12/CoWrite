import React from 'react';

export function CollaboratorBar({ collaboratorEmail, setCollaboratorEmail, adding, handleAddCollaborator, collaborators, currentUser }) {
  const otherCollaborators = collaborators.filter((c) => {
    const cId = typeof c === "object" && c._id ? c._id : c;
    const cEmail = typeof c === "object" ? c.email : c;
    return cId !== currentUser?.id && cEmail !== currentUser?.email;
  });

  return (
    <div className="flex items-center gap-4 px-8 py-3 bg-white/50 backdrop-blur-md border-b border-blue-100 shadow-sm transition-all">
      <input
        type="email"
        value={collaboratorEmail}
        onChange={(e) => setCollaboratorEmail(e.target.value)}
        placeholder="Invite collaborator by email"
        className="border border-gray-200 px-4 py-1.5 rounded-full w-72 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all shadow-sm"
        disabled={adding}
      />
      <button
        onClick={handleAddCollaborator}
        className="bg-blue-600 text-white px-5 py-1.5 rounded-full hover:bg-blue-700 shadow-sm hover:shadow-md transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={adding || !collaboratorEmail}
      >
        {adding ? "Adding..." : "Add"}
      </button>
      <div className="ml-6 text-sm text-gray-700 flex items-center">
        <span className="font-semibold text-gray-800">Collaborators:</span>
        {otherCollaborators.length === 0 && (
          <span className="ml-3 text-gray-400 italic">None</span>
        )}
        <div className="flex gap-2 ml-3">
          {otherCollaborators.map((c) => (
            <span
              key={typeof c === "object" && c._id ? c._id : c}
              className="bg-white border border-gray-200 shadow-sm px-3 py-1 rounded-full text-gray-600 font-medium text-xs tracking-wide"
            >
              {typeof c === "object" ? c.name || c.username || c.email || c._id : c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
