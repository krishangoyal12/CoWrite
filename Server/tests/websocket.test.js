const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const Y = require('yjs');
const authProtocol = require('y-protocols/dist/auth.cjs');
const encoding = require('lib0/dist/encoding.cjs');
const decoding = require('lib0/dist/decoding.cjs');
const { getYDoc, docs } = require('y-websocket/bin/utils');
const { attachWebSocketServer, getUserDocumentRole } = require('../Config/yjs');

const JWT_SECRET = 'test_jwt_secret_cowrite_2026';
process.env.JWT_SECRET = JWT_SECRET;

describe('CoWrite WebSocket Authentication & Authorization Tests', () => {
  let server;
  let wss;
  let port;

  // In-memory document store for test isolation
  const mockDocuments = new Map();

  // Test identities
  const ownerId = 'user_owner_101';
  const editorId = 'user_editor_202';
  const viewerId = 'user_viewer_303';
  const unauthorizedUserId = 'user_intruder_404';

  const docId = 'doc_test_abc123';

  // Generate test JWTs
  const ownerToken = jwt.sign({ id: ownerId }, JWT_SECRET);
  const editorToken = jwt.sign({ id: editorId }, JWT_SECRET);
  const viewerToken = jwt.sign({ id: viewerId }, JWT_SECRET);
  const unauthorizedToken = jwt.sign({ id: unauthorizedUserId }, JWT_SECRET);

  before(async () => {
    // Populate test document
    mockDocuments.set(docId, {
      _id: docId,
      title: 'Confidential Architecture Doc',
      content: 'Initial secure text content',
      owner: ownerId,
      collaborators: [editorId],
      viewers: [viewerId],
      isPublic: false,
    });

    server = http.createServer((req, res) => {
      res.writeHead(200);
      res.end('OK');
    });

    wss = new WebSocket.Server({ noServer: true });

    // Attach secured upgrade and connection logic with mock document resolver
    attachWebSocketServer(server, wss, {
      getDocument: async (id) => mockDocuments.get(id) || null,
    });

    await new Promise((resolve) => {
      server.listen(0, () => {
        port = server.address().port;
        resolve();
      });
    });
  });

  after(async () => {
    wss.clients.forEach((client) => client.terminate());
    wss.close();
    if (typeof server.closeAllConnections === 'function') {
      server.closeAllConnections();
    }
    await new Promise((resolve) => {
      server.close(() => resolve());
    });
    setTimeout(() => process.exit(0), 50);
  });

  beforeEach(() => {
    // Clean up Yjs in-memory document state between tests
    if (docs.has(docId)) {
      const doc = docs.get(docId);
      doc.destroy();
      docs.delete(docId);
    }
  });

  test('Unit: Role determination logic in CoWrite', () => {
    const doc = mockDocuments.get(docId);

    assert.strictEqual(getUserDocumentRole(doc, ownerId), 'owner', 'Owner should have role "owner"');
    assert.strictEqual(getUserDocumentRole(doc, editorId), 'editor', 'Collaborator should have role "editor"');
    assert.strictEqual(getUserDocumentRole(doc, viewerId), 'viewer', 'Viewer should have role "viewer"');
    assert.strictEqual(getUserDocumentRole(doc, unauthorizedUserId), null, 'Uninvited user should have null (no access)');

    // Test public document fallback
    const publicDoc = { ...doc, isPublic: true };
    assert.strictEqual(getUserDocumentRole(publicDoc, unauthorizedUserId), 'viewer', 'Public document should grant "viewer" role to other users');
  });

  test('Case 1: No token (rejected during handshake with 401)', async () => {
    await new Promise((resolve, reject) => {
      const wsUrl = `ws://localhost:${port}/${docId}`;
      const client = new WebSocket(wsUrl);

      let settled = false;
      let statusCode = null;

      const settle = (err) => {
        if (settled) return;
        settled = true;
        if (err) {
          reject(err);
        } else {
          assert.strictEqual(statusCode, 401, 'Response must be 401 Unauthorized');
          resolve();
        }
      };

      client.on('unexpected-response', (req, res) => {
        statusCode = res.statusCode;
        settle();
      });

      client.on('open', () => {
        client.close();
        settle(new Error('Connection should NOT have opened without a token'));
      });

      client.on('error', (err) => {
        if (statusCode === 401 || err.message.includes('401')) {
          statusCode = 401;
          settle();
        } else {
          settle(err);
        }
      });

      client.on('close', () => {
        settle();
      });
    });
  });

  test('Case 2: Valid token for a document user cannot access (rejected during handshake with 403)', async () => {
    await new Promise((resolve, reject) => {
      const wsUrl = `ws://localhost:${port}/${docId}?token=${unauthorizedToken}`;
      const client = new WebSocket(wsUrl);

      let settled = false;
      let statusCode = null;

      const settle = (err) => {
        if (settled) return;
        settled = true;
        if (err) {
          reject(err);
        } else {
          assert.strictEqual(statusCode, 403, 'Response must be 403 Forbidden');
          resolve();
        }
      };

      client.on('unexpected-response', (req, res) => {
        statusCode = res.statusCode;
        settle();
      });

      client.on('open', () => {
        client.close();
        settle(new Error('Connection should NOT have opened for an unauthorized user'));
      });

      client.on('error', (err) => {
        if (statusCode === 403 || err.message.includes('403')) {
          statusCode = 403;
          settle();
        } else {
          settle(err);
        }
      });

      client.on('close', () => {
        settle();
      });
    });
  });

  test('Case 3: Viewer can join and read, but trying to write is blocked', async () => {
    // 1. Initialize server document state with initial content
    const serverDoc = getYDoc(docId);
    const serverText = serverDoc.getText('content');
    serverText.insert(0, 'Initial base document text.');

    // 2. Connect as Viewer (user has viewer role for docId)
    const viewerWs = await new Promise((resolve, reject) => {
      const wsUrl = `ws://localhost:${port}/${docId}?token=${viewerToken}`;
      const ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';

      ws.on('open', () => resolve(ws));
      ws.on('error', (err) => reject(err));
    });

    assert.ok(viewerWs.readyState === WebSocket.OPEN, 'Viewer successfully connected (allowed to join)');

    let permissionDeniedReceived = false;

    // Listen for server auth permission denied message
    viewerWs.on('message', (data) => {
      try {
        const u8 = new Uint8Array(data);
        const decoder = decoding.createDecoder(u8);
        const messageType = decoding.readVarUint(decoder);
        if (messageType === 2) { // messageAuth
          authProtocol.readAuthMessage(decoder, new Y.Doc(), (ydoc, reason) => {
            if (reason && reason.includes('viewers cannot write')) {
              permissionDeniedReceived = true;
            }
          });
        }
      } catch (e) {}
    });

    // 3. Viewer attempts to WRITE to the document
    const viewerYDoc = new Y.Doc();
    const viewerText = viewerYDoc.getText('content');
    viewerText.insert(0, 'MALICIOUS_VIEWER_OVERWRITE');

    const update = Y.encodeStateAsUpdate(viewerYDoc);

    // Send the write update over the WebSocket (messageSync + messageYjsUpdate)
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, 0); // messageSync
    encoding.writeVarUint(encoder, 2); // messageYjsUpdate
    encoding.writeVarUint8Array(encoder, update);

    viewerWs.send(encoding.toUint8Array(encoder));

    // Wait 200ms for message processing
    await new Promise((r) => setTimeout(r, 200));

    // 4. Assertions:
    // A) The write MUST NOT be applied to the server document
    const currentDocContent = serverText.toString();
    assert.strictEqual(
      currentDocContent,
      'Initial base document text.',
      'Server document content must remain unchanged'
    );
    assert.doesNotMatch(
      currentDocContent,
      /MALICIOUS_VIEWER_OVERWRITE/,
      'Viewer write MUST be blocked from mutating the document'
    );

    // B) Permission denied message should have been received by the client
    assert.strictEqual(
      permissionDeniedReceived,
      true,
      'Viewer client should have received permission-denied auth notification'
    );

    viewerWs.close();
  });

  test('Contrast Verification: Owner/Editor CAN successfully write to the document', async () => {
    const serverDoc = getYDoc(docId);
    const serverText = serverDoc.getText('content');

    // Connect as Owner
    const ownerWs = await new Promise((resolve, reject) => {
      const wsUrl = `ws://localhost:${port}/${docId}?token=${ownerToken}`;
      const ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';

      ws.on('open', () => resolve(ws));
      ws.on('error', (err) => reject(err));
    });

    // Owner performs an authorized edit
    const ownerYDoc = new Y.Doc();
    const ownerText = ownerYDoc.getText('content');
    ownerText.insert(0, 'Authorized Owner Edit! ');

    const update = Y.encodeStateAsUpdate(ownerYDoc);

    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, 0); // messageSync
    encoding.writeVarUint(encoder, 2); // messageYjsUpdate
    encoding.writeVarUint8Array(encoder, update);

    ownerWs.send(encoding.toUint8Array(encoder));

    // Wait 200ms
    await new Promise((r) => setTimeout(r, 200));

    // Assert Owner's edit WAS accepted
    assert.ok(
      serverText.toString().includes('Authorized Owner Edit!'),
      'Owner edit must be accepted and reflected on server document'
    );

    ownerWs.close();
  });
});
