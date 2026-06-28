const http = require('http');
const WebSocket = require('ws');
const Y = require('yjs');
const { setupWSConnection, setPersistence } = require('y-websocket/bin/utils');
const { MongoClient } = require('mongodb');
const { MongodbPersistence } = require('y-mongodb-provider');
require('dotenv').config({ path: '../Server/.env' });

const port = process.env.PORT || 1234;
const host = '0.0.0.0'
const port = process.env.YJS_PORT || 1234;
const host = '0.0.0.0';

const client = new MongoClient(process.env.DB_URI);
const db = client.db('cowrite_yjs'); // Specify a database name explicitly

const mdb = new MongodbPersistence({ client, db }, {
  collectionName: 'ytransactions',
  flushSize: 100,
  multipleCollections: false
});

setPersistence({
  bindState: async (docName, ydoc) => {
    console.log(`[Yjs] bindState called for doc: ${docName}`);
    try {
      const persistedYdoc = await mdb.getYDoc(docName);
      console.log(`[Yjs] loaded doc ${docName} from DB successfully`);
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

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Yjs WebSocket server is running with MongoDB persistence');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (conn, req) => {
  setupWSConnection(conn, req, { docName: req.url.slice(1).split('?')[0] });
});

server.listen(port, host, () => {
  console.log(`Yjs WebSocket server running on ${host}:${port} with DB persistence`);
});
