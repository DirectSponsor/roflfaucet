const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8081, path: '/chat' });

wss.on('connection', function connection(ws) {
  console.log('A new client connected');
  ws.send(JSON.stringify({ type: 'info', message: 'Welcome to the chat server!' }));

  ws.on('message', function incoming(message) {
    console.log('received: %s', message);

    // Parse the message
    let parsedMessage;
    try {
      parsedMessage = JSON.parse(message);
    } catch (e) {
      console.error('Invalid message format:', message);
      return;
    }

    // Broadcast the message to all clients
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: parsedMessage.type || 'message',
          user: parsedMessage.user || 'Anonymous',
          message: parsedMessage.message
        }));
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log('WebSocket server is running on ws://localhost:8081/chat');
