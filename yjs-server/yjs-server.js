const { setupWSConnection } = require('y-websocket/bin/utils.js');
const http = require('http');
const WebSocket = require('ws');

const port = process.env.PORT || 1234;
const host = '0.0.0.0';

const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', (conn, req) => {
  setupWSConnection(conn, req);
});

server.listen(port, host, () => {
  console.log(`Yjs WebSocket server running on ${host}:${port}`);
});