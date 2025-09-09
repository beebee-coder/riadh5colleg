// server.ts
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
// The 'hostname' and 'port' options should be removed from the Next.js app instance.
// Next.js will automatically handle this when using a custom server.
// The port should be handled by the httpServer.listen() call.
const app = next({ dev });
const handle = app.getRequestHandler();

// Use the port from the environment, defaulting to 3000
const port = parseInt(process.env.PORT || '3000', 10);

// Map to store online user IDs
const onlineUsers = new Map<string, string>(); // socket.id -> userId

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new SocketIOServer(httpServer, {
    transports: ['websocket', 'polling'],
  });

  // Centralized connection handler
  io.on('connection', (socket) => {
    console.log(`🔌 [Socket Server] New client connected: ${socket.id}`);
    const userId = socket.handshake.auth.userId;

    if (userId) {
        onlineUsers.set(socket.id, userId);
        console.log(`👤 [Socket Server] User ${userId} connected.`);
        // Broadcast the updated list of online users
        io.emit('presence:update', Array.from(onlineUsers.values()));
    }
    
    // --- Specific Event Listeners ---
    socket.on('disconnect', () => {
        const disconnectedUserId = onlineUsers.get(socket.id);
        if (disconnectedUserId) {
            onlineUsers.delete(socket.id);
            console.log(`👤 [Socket Server] User ${disconnectedUserId} disconnected.`);
            // Broadcast the updated list of online users
            io.emit('presence:update', Array.from(onlineUsers.values()));
        }
        console.log(`🔌 [Socket Server] Client disconnected: ${socket.id}`);
    });

    socket.on('presence:get', () => {
        socket.emit('presence:update', Array.from(onlineUsers.values()));
    });
    
    socket.on('student:present', (studentId: string) => {
        console.log(`✋ [Socket Server] Student ${studentId} signaled presence. Broadcasting...`);
        // Broadcast to all clients (specifically for the teacher)
        io.emit('student:signaled_presence', studentId);
    });

     socket.on('session:start', (sessionData) => {
        console.log(`🚀 [Socket Server] Broadcasting session start for: ${sessionData.title}`);
        const participantIds = sessionData.participants.map((p: any) => p.userId);
        
        // Broadcast to all sockets, the client will filter if it's for them.
        // A better approach would be to broadcast to a room.
        io.emit('session:invite', sessionData);
    });

  });

  httpServer
    .listen(port, () => {
      console.log(`> Ready on http://localhost:${port}`);
    })
    .on('error', (err) => {
      console.error(err);
    });
});
