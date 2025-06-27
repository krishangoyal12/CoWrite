import React, { useState, useEffect } from 'react';
import { useAuth } from '../Context/useAuth';
import toast from 'react-hot-toast';
import { FiX, FiCheck, FiMessageSquare } from 'react-icons/fi';

export const CommentThread = ({ comment, editor, onClose }) => {
  const [replyText, setReplyText] = useState('');
  const { auth: user } = useAuth();
  
  const handleAddReply = () => {
    if (!replyText.trim()) return;
    
    editor.commands.addReply(comment.id, {
      text: replyText,
      userId: user?.id,
      userName: user?.name || 'Anonymous',
    });
    
    setReplyText('');
  };
  
  const handleResolve = () => {
    editor.commands.resolveComment(comment.id);
    onClose();
  };
  
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };
  
  return (
    <div className="bg-white border rounded-lg shadow-lg p-4 w-80 max-h-[500px] overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-sm">{comment.userName}</h3>
        <div className="flex space-x-2">
          <button 
            onClick={handleResolve}
            className="p-1 hover:bg-gray-100 rounded"
            title="Resolve comment"
          >
            <FiCheck className="text-green-600" />
          </button>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
            title="Close"
          >
            <FiX />
          </button>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-sm">{comment.text}</p>
        <span className="text-xs text-gray-500">{formatDate(comment.timestamp)}</span>
      </div>
      
      {comment.replies.length > 0 && (
        <div className="border-t pt-2 mb-3">
          {comment.replies.map(reply => (
            <div key={reply.id} className="mb-3">
              <div className="flex items-center">
                <span className="font-semibold text-xs">{reply.userName}</span>
              </div>
              <p className="text-sm">{reply.text}</p>
              <span className="text-xs text-gray-500">{formatDate(reply.timestamp)}</span>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-2">
        <textarea
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Reply to comment..."
          className="w-full border rounded p-2 text-sm mb-2"
          rows={2}
        />
        <button
          onClick={handleAddReply}
          disabled={!replyText.trim()}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:bg-blue-300"
        >
          Reply
        </button>
      </div>
    </div>
  );
};

export const CommentPanel = ({ editor }) => {
  const [comments, setComments] = useState([]);
  const [activeComment, setActiveComment] = useState(null);
  const { auth: user } = useAuth();
  
  useEffect(() => {
    if (!editor) return;
    
    // Update comment list when comments change
    const updateComments = () => {
      const commentList = Object.values(editor.storage.comment.comments || {})
        .filter(comment => !comment.resolved)
        .sort((a, b) => a.from - b.from);
      setComments(commentList);
    };
    
    // Initial load
    updateComments();
    
    // Subscribe to storage changes
    editor.on('update', updateComments);
    return () => {
      editor.off('update', updateComments);
    };
  }, [editor]);
  
  const scrollToComment = (comment) => {
    editor.commands.selectComment(comment.id);
    // Scroll to the comment's position in the document
    const domElement = document.querySelector(`[data-comment-id="${comment.id}"]`);
    if (domElement) {
      domElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };
  
  return (
    <div className="border-l border-gray-200 p-3 overflow-y-auto" style={{ maxHeight: '80vh', width: '250px' }}>
      <h3 className="font-bold mb-3 flex items-center">
        <FiMessageSquare className="mr-2" /> Comments
      </h3>
      
      {comments.length === 0 ? (
        <p className="text-sm text-gray-500">No comments yet</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div 
              key={comment.id}
              className="p-2 border rounded hover:bg-blue-50 cursor-pointer"
              onClick={() => {
                setActiveComment(comment);
                scrollToComment(comment);
              }}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-xs">{comment.userName}</span>
                <span className="text-xs text-gray-500">
                  {new Date(comment.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs truncate">{comment.text}</p>
              {comment.replies.length > 0 && (
                <div className="text-xs text-blue-600 mt-1">
                  {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {activeComment && (
        <div className="fixed right-64 top-1/3 z-50">
          <CommentThread 
            comment={activeComment} 
            editor={editor} 
            onClose={() => setActiveComment(null)} 
          />
        </div>
      )}
    </div>
  );
};

export const CommentBubble = ({ editor }) => {
  const { auth: user } = useAuth();
  const [showBubble, setShowBubble] = useState(false);
  const [commentText, setCommentText] = useState('');
  
  useEffect(() => {
    const checkSelection = () => {
      const { state } = editor;
      const { from, to } = state.selection;
      // Only show bubble for non-empty text selections
      setShowBubble(from !== to);
    };
    
    editor.on('selectionUpdate', checkSelection);
    return () => {
      editor.off('selectionUpdate', checkSelection);
    };
  }, [editor]);
  
  const handleAddComment = () => {
    if (!commentText.trim()) return;
    
    editor.commands.addComment({
      text: commentText,
      userId: user?.id,
      userName: user?.name || 'Anonymous',
    });
    
    setCommentText('');
    setShowBubble(false);
    toast.success('Comment added');
  };
  
  if (!showBubble) return null;
  
  return (
    <div className="absolute z-50 bg-white border rounded-lg shadow-lg p-3" style={{ top: '-45px', right: '0px' }}>
      <textarea
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        placeholder="Add a comment..."
        className="w-64 border rounded p-2 text-sm mb-2"
        rows={2}
        autoFocus
      />
      <div className="flex justify-end space-x-2">
        <button 
          onClick={() => setShowBubble(false)}
          className="px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          onClick={handleAddComment}
          disabled={!commentText.trim()}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:bg-blue-300"
        >
          Comment
        </button>
      </div>
    </div>
  );
};