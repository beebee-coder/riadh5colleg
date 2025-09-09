// src/app/api/socket/route.ts
import { Server } from 'socket.io';
import { type NextRequest } from 'next/server';
import { type Server as HttpServer } from 'http';
import type { Socket as NetSocket } from 'net';
import type { Server as IoServer } from 'socket.io';
import { NotificationService } from '@/services/notification-service';

// --- TYPE ENHANCEMENTS FOR NEXT.JS RESPONSE ---
interface NextResponseWithSocket extends NextResponse {
  socket: NetSocket & {
    server: HttpServer & {
      io?: IoServer;
    };
  };
}

// Store online users in a simple Set on the server
const onlineUsers = new Set<string>();

export async function GET(req: NextRequest, res: NextResponseWithSocket) {
    if (res.socket.server.io) {
        console.log('🔌 [Socket.IO] Le serveur est déjà en cours d\'exécution.');
    } else {
        console.log('🚀 [Socket.IO] Initialisation du serveur Socket.IO...');
        const io = new Server(res.socket.server, {
            path: '/api/socket',
            addTrailingSlash: false,
            cors: { origin: '*', methods: ['GET', 'POST'] },
        });

        io.on('connection', (socket) => {
            const userId = socket.handshake.auth.userId as string;
            if (userId) {
              onlineUsers.add(userId);
              console.log(`✅ [Socket.IO] Utilisateur connecté: ${userId}. Utilisateurs en ligne: ${onlineUsers.size}`);
              // Notify all clients about the new presence update
              io.emit('presence:update', Array.from(onlineUsers));
            }

            socket.on('disconnect', () => {
              if (userId) {
                onlineUsers.delete(userId);
                console.log(`🔌 [Socket.IO] Utilisateur déconnecté: ${userId}. Utilisateurs en ligne: ${onlineUsers.size}`);
                // Notify all clients about the user leaving
                io.emit('presence:update', Array.from(onlineUsers));
              }
            });

            socket.on('presence:get', () => {
              socket.emit('presence:update', Array.from(onlineUsers));
            });
            
            socket.on('student:present', (studentId: string) => {
                console.log(`✋ [Socket.IO] L'étudiant ${studentId} signale sa présence.`);
                // Broadcast to all clients (specifically for teachers/admins)
                io.emit('student:signaled_presence', studentId);
            });

            socket.on('session:start', (sessionData) => {
                console.log(`[Socket.IO] Diffusion de l'invitation à la session: ${sessionData.id}`);
                // Send invite to each participant of the session
                sessionData.participants.forEach((participant: { id: string, name: string }) => {
                    io.to(participant.id).emit('session:invite', sessionData);
                });
            });

            // Notification-specific events
            socket.on('notification:send', async (data) => {
                await NotificationService.sendNotification(data);
                // Emit to the specific recipient if they are online
                io.to(data.recipientId).emit('notification:new', data);
            });
        });

        res.socket.server.io = io;
    }
    // End the response to complete the HTTP request
    // res.end();
}