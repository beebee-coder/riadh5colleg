
// server.ts
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import type { Socket } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const onlineUsers = new Map<string, string>(); // Maps socket.id to userId

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      if (!req.url) return;
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Correctly configure Socket.IO CORS
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // Allow all origins
      methods: ["GET", "POST"]
    }
  });

  const broadcastPresence = () => {
    const userIds = Array.from(onlineUsers.values());
    console.log(`Broadcasting presence. Online users: ${userIds.length}`);
    io.emit('presence:update', userIds);
  };
  
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);
    const userId = socket.handshake.auth.userId;
    if (userId) {
      onlineUsers.set(socket.id, userId);
      broadcastPresence();
      console.log(`User ${userId} associated with socket ${socket.id}. Total online: ${onlineUsers.size}`);
    }

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
      if (onlineUsers.has(socket.id)) {
        onlineUsers.delete(socket.id);
        broadcastPresence();
        console.log(`User disconnected. Total online: ${onlineUsers.size}`);
      }
    });

    socket.on('presence:get', () => {
      socket.emit('presence:update', Array.from(onlineUsers.values()));
    });
    
    // Server-side event listeners
    socket.on('session:start', (sessionData) => {
        // Broadcast the invite to specific users
        if (sessionData.participants && Array.isArray(sessionData.participants)) {
            sessionData.participants.forEach((participant: { userId: string; }) => {
                const socketId = Array.from(onlineUsers.entries())
                                  .find(([sid, uid]) => uid === participant.userId)?.[0];
                if (socketId) {
                    io.to(socketId).emit('session:invite', sessionData);
                }
            });
        }
    });
    
    socket.on('student:present', (studentUserId) => {
       io.emit('student:signaled_presence', studentUserId);
    });

  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
