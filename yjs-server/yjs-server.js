const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config(); // Load yjs-server/.env if present
require('dotenv').config({ path: path.join(__dirname, '../Server/.env') }); // Fallback to Server/.env
const initYjs = require('../Server/Config/yjs');

const port = parseInt(process.env.PORT || process.env.YJS_PORT || '1234', 10);
const host = '0.0.0.0';

if (!process.env.DB_URI) {
  console.error("Error: DB_URI is not defined in the environment variables!");
  process.exit(1);
}

// Ensure mongoose connection for document role checks
mongoose.connect(process.env.DB_URI)
  .then(() => console.log('[Yjs Server] Connected to MongoDB for auth/role validation'))
  .catch((err) => console.error('[Yjs Server] MongoDB connection error:', err));

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('CoWrite Secured Yjs WebSocket server is running with MongoDB persistence');
});

// Initialize secured Yjs WebSocket server attached to HTTP server
initYjs(server, process.env.DB_URI);

server.listen(port, host, () => {
  console.log(`Secured Yjs WebSocket server running on ${host}:${port} with DB persistence and JWT verification`);
});
