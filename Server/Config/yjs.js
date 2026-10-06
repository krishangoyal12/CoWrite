const WebSocket = require('ws');
const Y = require('yjs');
const { setupWSConnection, setPersistence } = require('y-websocket/bin/utils');
const { MongoClient } = require('mongodb');
const { MongodbPersistence } = require('y-mongodb-provider');

function initYjs(server, dbUri) {
  if (!dbUri) {
    console.warn('[Yjs] DB_URI not provided; persistence will be disabled.');
    const wss = new WebSocket.Server({ noServer: true });
    attachWebSocketServer(server, wss);
    return;
  }

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
      return new Promise(resolve => resolve());
    }
  });

  const wss = new WebSocket.Server({ noServer: true });
  attachWebSocketServer(server, wss);
  console.log('[Yjs] WebSocket service initialized with MongoDB persistence');
}

function attachWebSocketServer(server, wss) {
  wss.on('connection', (conn, req) => {
    setupWSConnection(conn, req, { docName: req.url.slice(1).split('?')[0] });
  });

  server.on('upgrade', (request, socket, head) => {
    // Handle upgrade for websocket connections
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });
}

module.exports = initYjs;
