const WebSocket = require('ws');
const Y = require('yjs');
const { setPersistence, getPersistence, getYDoc, docs } = require('y-websocket/bin/utils');
const syncProtocol = require('y-protocols/dist/sync.cjs');
const awarenessProtocol = require('y-protocols/dist/awareness.cjs');
const authProtocol = require('y-protocols/dist/auth.cjs');
const encoding = require('lib0/dist/encoding.cjs');
const decoding = require('lib0/dist/decoding.cjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const { MongodbPersistence } = require('y-mongodb-provider');
const Document = require('../Models/documentSchema');

const messageSync = 0;
const messageAwareness = 1;
const messageAuth = 2;

const messageYjsSyncStep1 = 0;
const messageYjsSyncStep2 = 1;
const messageYjsUpdate = 2;

const wsReadyStateConnecting = 0;
const wsReadyStateOpen = 1;

/**
 * Determine a user's role on a given document.
 * Returns 'owner', 'editor', 'viewer', or null if unauthorized.
 */
function getUserDocumentRole(doc, userId) {
  if (!doc || !userId) return null;
  const uid = userId.toString();

  // 1. Owner check
  const ownerId = doc.owner?._id ? doc.owner._id.toString() : doc.owner?.toString();
  if (ownerId === uid) {
    return 'owner';
  }

  // 2. Collaborators check
  if (Array.isArray(doc.collaborators)) {
    for (const collab of doc.collaborators) {
      if (!collab) continue;
      const cId = collab._id
        ? collab._id.toString()
        : (collab.user ? (collab.user._id || collab.user).toString() : collab.toString());
      if (cId === uid) {
        if (collab.role === 'viewer') return 'viewer';
        return 'editor';
      }
    }
  }

  // 3. Viewers check
  if (Array.isArray(doc.viewers)) {
    for (const viewer of doc.viewers) {
      if (!viewer) continue;
      const vId = viewer._id
        ? viewer._id.toString()
        : (viewer.user ? (viewer.user._id || viewer.user).toString() : viewer.toString());
      if (vId === uid) {
        return 'viewer';
      }
    }
  }

  // 4. Public document check (view only for users without edit access)
  if (doc.isPublic) {
    return 'viewer';
  }

  return null;
}

/**
 * Verify document existence and check user's role.
 */
async function verifyDocumentAccess(docName, userId, getDocument = null) {
  try {
    let doc = null;
    if (typeof getDocument === 'function') {
      doc = await getDocument(docName);
    } else if (mongoose.Types.ObjectId.isValid(docName)) {
      doc = await Document.findById(docName).lean();
    } else {
      // In case docName is stored as custom ID
      doc = await Document.findOne({ _id: docName }).lean();
    }

    if (!doc) {
      return { error: 'Document not found', status: 404 };
    }

    const role = getUserDocumentRole(doc, userId);
    if (!role) {
      return { error: 'Forbidden: You do not have access to this document', status: 403 };
    }

    return { role, doc };
  } catch (err) {
    console.error('[Yjs Security] Error verifying document access:', err);
    return { error: 'Internal server error checking permissions', status: 500 };
  }
}

/**
 * Extract JWT from WebSocket upgrade request (query param, auth header, or cookie).
 */
function extractToken(request, urlObj) {
  let token = urlObj.searchParams.get('token');
  if (!token && request.headers.authorization) {
    const parts = request.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }
  if (!token && request.headers.cookie) {
    const match = request.headers.cookie.match(/(?:^|;\s*)token=([^;]+)/);
    if (match) {
      token = decodeURIComponent(match[1]);
    }
  }
  return token;
}

/**
 * Send binary buffer to a connection.
 */
function send(doc, conn, m) {
  if (conn.readyState !== wsReadyStateConnecting && conn.readyState !== wsReadyStateOpen) {
    closeConn(doc, conn);
    return;
  }
  try {
    conn.send(m, (err) => {
      if (err != null) closeConn(doc, conn);
    });
  } catch (e) {
    closeConn(doc, conn);
  }
}

/**
 * Close connection and clean up awareness/persistence.
 */
function closeConn(doc, conn) {
  if (doc.conns && doc.conns.has(conn)) {
    const controlledIds = doc.conns.get(conn);
    doc.conns.delete(conn);
    awarenessProtocol.removeAwarenessStates(doc.awareness, Array.from(controlledIds || []), null);
    const persistence = getPersistence();
    if (doc.conns.size === 0 && persistence !== null) {
      persistence.writeState(doc.name, doc).then(() => {
        doc.destroy();
      });
      docs.delete(doc.name);
    }
  }
  try {
    conn.close();
  } catch (e) {}
}

/**
 * Set up a secured WebSocket connection with role enforcement and write blocking.
 */
function setupSecureWSConnection(conn, req, { docName, userRole = 'editor', userId = null, gc = true } = {}) {
  conn.binaryType = 'arraybuffer';
  conn.userRole = userRole;
  conn.userId = userId;

  const doc = getYDoc(docName, gc);
  doc.conns.set(conn, new Set());

  conn.on('message', (message) => {
    try {
      const u8Message = new Uint8Array(message);
      const decoder = decoding.createDecoder(u8Message);
      const encoder = encoding.createEncoder();
      const messageType = decoding.readVarUint(decoder);

      switch (messageType) {
        case messageSync: {
          const syncMessageType = decoding.readVarUint(decoder);
          const isWrite = (syncMessageType === messageYjsSyncStep2 || syncMessageType === messageYjsUpdate);

          // BLOCK WRITES FROM VIEWERS
          if (isWrite && conn.userRole === 'viewer') {
            console.warn(`[Yjs Security] Blocked write attempt from viewer ${conn.userId} on document ${doc.name}`);
            const authEncoder = encoding.createEncoder();
            encoding.writeVarUint(authEncoder, messageAuth);
            authProtocol.writePermissionDenied(authEncoder, 'Permission denied: viewers cannot write to this document.');
            send(doc, conn, encoding.toUint8Array(authEncoder));
            return;
          }

          // Process allowed sync messages
          encoding.writeVarUint(encoder, messageSync);
          if (syncMessageType === messageYjsSyncStep1) {
            syncProtocol.readSyncStep1(decoder, encoder, doc);
          } else if (syncMessageType === messageYjsSyncStep2) {
            syncProtocol.readSyncStep2(decoder, doc, conn);
          } else if (syncMessageType === messageYjsUpdate) {
            syncProtocol.readUpdate(decoder, doc, conn);
          }

          if (encoding.length(encoder) > 1) {
            send(doc, conn, encoding.toUint8Array(encoder));
          }
          break;
        }

        case messageAwareness: {
          awarenessProtocol.applyAwarenessUpdate(doc.awareness, decoding.readVarUint8Array(decoder), conn);
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('[Yjs Security] Error handling message:', err);
      doc.emit('error', [err]);
    }
  });

  // Heartbeat ping/pong
  let pongReceived = true;
  const pingInterval = setInterval(() => {
    if (!pongReceived) {
      if (doc.conns.has(conn)) {
        closeConn(doc, conn);
      }
      clearInterval(pingInterval);
    } else if (doc.conns.has(conn)) {
      pongReceived = false;
      try {
        conn.ping();
      } catch (e) {
        closeConn(doc, conn);
        clearInterval(pingInterval);
      }
    }
  }, 30000);
  pingInterval.unref();

  conn.on('close', () => {
    closeConn(doc, conn);
    clearInterval(pingInterval);
  });

  conn.on('pong', () => {
    pongReceived = true;
  });

  // Initial Sync Step 1: Send server state to client
  {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeSyncStep1(encoder, doc);
    send(doc, conn, encoding.toUint8Array(encoder));

    const awarenessStates = doc.awareness.getStates();
    if (awarenessStates.size > 0) {
      const awarenessEncoder = encoding.createEncoder();
      encoding.writeVarUint(awarenessEncoder, messageAwareness);
      encoding.writeVarUint8Array(awarenessEncoder, awarenessProtocol.encodeAwarenessUpdate(doc.awareness, Array.from(awarenessStates.keys())));
      send(doc, conn, encoding.toUint8Array(awarenessEncoder));
    }
  }
}

function abortHandshake(socket, statusCode, statusText, message) {
  try {
    const body = message || statusText;
    socket.end(
      `HTTP/1.1 ${statusCode} ${statusText}\r\n` +
      'Connection: close\r\n' +
      'Content-Type: text/plain\r\n' +
      `Content-Length: ${Buffer.byteLength(body)}\r\n` +
      '\r\n' +
      body
    );
  } catch (e) {
    try { socket.destroy(); } catch (_) {}
  }
}

/**
 * Attach secured upgrade and connection listeners to the HTTP and WebSocket servers.
 */
function attachWebSocketServer(server, wss, options = {}) {
  const getDocument = options.getDocument || null;

  server.on('upgrade', async (request, socket, head) => {
    try {
      const urlObj = new URL(request.url, 'http://localhost');
      const docName = urlObj.pathname.slice(1);

      if (!docName) {
        abortHandshake(socket, 400, 'Bad Request', 'Missing document ID');
        return;
      }

      // 1. Authentication: Extract and verify JWT
      const token = extractToken(request, urlObj);
      if (!token) {
        abortHandshake(socket, 401, 'Unauthorized', 'Authentication required: No token provided');
        return;
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      } catch (err) {
        abortHandshake(socket, 401, 'Unauthorized', 'Authentication failed: Invalid or expired token');
        return;
      }

      const userId = decoded.id;
      if (!userId) {
        abortHandshake(socket, 401, 'Unauthorized', 'Authentication failed: Invalid token payload');
        return;
      }

      // 2. Authorization: Check document access and user role
      const access = await verifyDocumentAccess(docName, userId, getDocument);
      if (access.error || !access.role) {
        const httpStatus = access.status || 403;
        const statusText = httpStatus === 404 ? 'Not Found' : 'Forbidden';
        abortHandshake(socket, httpStatus, statusText, access.error || 'Forbidden: Access denied');
        return;
      }

      // User is authenticated & authorized! Pass context to ws instance
      request.user = { id: userId };
      request.userRole = access.role; // 'owner' | 'editor' | 'viewer'
      request.docName = docName;

      wss.handleUpgrade(request, socket, head, (ws) => {
        ws.user = request.user;
        ws.userRole = request.userRole;
        ws.docName = request.docName;
        wss.emit('connection', ws, request);
      });
    } catch (err) {
      console.error('[Yjs Security] Error during WebSocket upgrade handshake:', err);
      abortHandshake(socket, 500, 'Internal Server Error', 'Internal server error');
    }
  });

  wss.on('connection', (conn, req) => {
    const docName = conn.docName || req.docName || req.url.slice(1).split('?')[0];
    const userRole = conn.userRole || req.userRole || 'editor';
    const userId = conn.user?.id || req.user?.id || null;

    setupSecureWSConnection(conn, req, {
      docName,
      userRole,
      userId
    });
  });
}

/**
 * Initialize Yjs WebSocket server.
 */
function initYjs(server, dbUri, options = {}) {
  const wss = new WebSocket.Server({ noServer: true });

  if (dbUri) {
    const client = new MongoClient(dbUri);
    const db = client.db('cowrite_yjs');

    const mdb = new MongodbPersistence({ client, db }, {
      collectionName: 'ytransactions',
      flushSize: 100,
      multipleCollections: false
    });

    setPersistence({
      bindState: async (docName, ydoc) => {
        try {
          const persistedYdoc = await mdb.getYDoc(docName);
          const newUpdates = Y.encodeStateAsUpdate(ydoc);
          await mdb.storeUpdate(docName, newUpdates);
          Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc));
          ydoc.on('update', async (update) => {
            try {
              await mdb.storeUpdate(docName, update);
            } catch (err) {
              console.error(`[Yjs] Error storing update for ${docName}:`, err);
            }
          });
        } catch (err) {
          console.error(`[Yjs] Error in bindState for doc ${docName}:`, err);
        }
      },
      writeState: async (docName, ydoc) => {
        return Promise.resolve();
      }
    });
    console.log('[Yjs] Secured WebSocket service initialized with MongoDB persistence');
  } else {
    console.warn('[Yjs] DB_URI not provided; persistence disabled.');
  }

  attachWebSocketServer(server, wss, options);
  return wss;
}

module.exports = initYjs;
module.exports.getUserDocumentRole = getUserDocumentRole;
module.exports.verifyDocumentAccess = verifyDocumentAccess;
module.exports.setupSecureWSConnection = setupSecureWSConnection;
module.exports.attachWebSocketServer = attachWebSocketServer;
