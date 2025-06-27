import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

export const CommentExtension = Extension.create({
  name: 'comment',
  
  addOptions() {
    return {
      HTMLAttributes: {
        class: 'comment-mark',
      },
    };
  },
  
  addStorage() {
    return {
      comments: {},
      selectedCommentId: null,
    };
  },
  
  addCommands() {
    return {
      addComment: (commentData) => ({ tr, dispatch }) => {
        const { from, to } = tr.selection;
        if (from === to) return false;
        
        const commentId = `comment-${Date.now()}`;
        const comment = {
          id: commentId,
          from,
          to,
          text: commentData.text,
          userId: commentData.userId,
          userName: commentData.userName,
          timestamp: Date.now(),
          resolved: false,
          replies: [],
        };
        
        if (dispatch) {
          // Store comment data
          const comments = {...this.storage.comments};
          comments[commentId] = comment;
          this.storage.comments = comments;
          
          // Mark the transaction as needing to add comment decorations
          tr.setMeta('addComment', comment);
        }
        
        return true;
      },
      
      resolveComment: (commentId) => ({ tr, dispatch }) => {
        if (dispatch) {
          const comments = {...this.storage.comments};
          if (comments[commentId]) {
            comments[commentId].resolved = true;
            this.storage.comments = comments;
            tr.setMeta('updateComment', comments[commentId]);
          }
        }
        
        return true;
      },
      
      addReply: (commentId, replyData) => ({ tr, dispatch }) => {
        if (dispatch) {
          const comments = {...this.storage.comments};
          if (comments[commentId]) {
            const reply = {
              id: `reply-${Date.now()}`,
              text: replyData.text,
              userId: replyData.userId,
              userName: replyData.userName,
              timestamp: Date.now(),
            };
            
            comments[commentId].replies.push(reply);
            this.storage.comments = comments;
            tr.setMeta('updateComment', comments[commentId]);
          }
        }
        
        return true;
      },
      
      selectComment: (commentId) => () => {
        this.storage.selectedCommentId = commentId;
        return true;
      },
    };
  },
  
  addProseMirrorPlugins() {
    const commentPluginKey = new PluginKey('comment');
    const commentPlugin = new Plugin({
      key: commentPluginKey,
      state: {
        init() {
          return DecorationSet.empty;
        },
        apply(tr, oldState) {
          let decorations = oldState;
          
          // Handle adding a new comment
          const addComment = tr.getMeta('addComment');
          if (addComment) {
            const { id, from, to } = addComment;
            const decoration = Decoration.inline(from, to, {
              class: 'comment-mark',
              'data-comment-id': id,
            });
            decorations = decorations.add(tr.doc, [decoration]);
          }
          
          // Map decorations through document changes
          decorations = decorations.map(tr.mapping, tr.doc);
          
          return decorations;
        },
      },
      props: {
        decorations(state) {
          return this.getState(state);
        },
      },
    });
    
    return [commentPlugin];
  },
});