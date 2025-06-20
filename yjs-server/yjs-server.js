const http = require('http');
const WebSocket = require('ws');
const Y = require('yjs');

const port = process.env.PORT || 1234;
const host = '0.0.0.0';

// Map to store active connections and their documents
const docs = new Map();

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Yjs WebSocket server is running');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (conn, req) => {
  const docName = new URL(req.url, 'http://localhost').searchParams.get('room') || 'default';
  
  console.log(`Connection established to document: ${docName}`);
  
  // Get or create document for this room
  let connections = docs.get(docName);
  if (!connections) {
    connections = new Set();
    docs.set(docName, connections);
  }
  connections.add(conn);
  
  // Connection is ready to receive messages
  conn.on('message', (message) => {
    // Broadcast to all other connections in the same document
    const conns = docs.get(docName);
    if (conns) {
      conns.forEach((c) => {
        if (c !== conn && c.readyState === WebSocket.OPEN) {
          c.send(message);
        }
      });
    }
  });
  
  // Handle connection close
  conn.on('close', () => {
    console.log(`Connection to document ${docName} closed`);
    const conns = docs.get(docName);
    if (conns) {
      conns.delete(conn);
      if (conns.size === 0) {
        docs.delete(docName);
      }
    }
  });
});

server.listen(port, host, () => {
  console.log(`Yjs WebSocket server running on ${host}:${port}`);
});