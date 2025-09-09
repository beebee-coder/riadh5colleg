import {config} from 'dotenv';
config();

import {dev} from 'genkit/dev';
import {next} from '@genkit-ai/next';
import {createAdapter} from '@socket.io/redis-adapter';
import {createClient} from 'redis';

import './flows/suggest-content-changes.ts';
import {NotificationService} from '../services/notification-service';

dev({
  plugins: [
    next({
      port: 9002, // your Next.js port
      configureSocketIO(io) {
        const onlineUsers = new Set<string>();

        io.on('connection', socket => {
          console.log('✅ [Socket.IO] Un client est connecté:', socket.id);

          const userId = socket.handshake.auth.userId as string;
          if (userId) {
            onlineUsers.add(userId);
            console.log(
              `[Socket.IO] Utilisateur connecté: ${userId}. Utilisateurs en ligne: ${onlineUsers.size}`
            );
            io.emit('presence:update', Array.from(onlineUsers));
          }

          socket.on('disconnect', () => {
            console.log(
              '🔌 [Socket.IO] Un client s\'est déconnecté:',
              socket.id
            );
            if (userId) {
              onlineUsers.delete(userId);
              console.log(
                `[Socket.IO] Utilisateur déconnecté: ${userId}. Utilisateurs en ligne: ${onlineUsers.size}`
              );
              io.emit('presence:update', Array.from(onlineUsers));
            }
          });

          socket.on('presence:get', () => {
            socket.emit('presence:update', Array.from(onlineUsers));
          });

          socket.on('student:present', (studentId: string) => {
            console.log(
              `✋ [Socket.IO] L'étudiant ${studentId} signale sa présence.`
            );
            io.emit('student:signaled_presence', studentId);
          });

          socket.on('session:start', sessionData => {
            console.log(
              `[Socket.IO] Diffusion de l'invitation à la session: ${sessionData.id}`
            );
            sessionData.participants.forEach((participant: {id: string}) => {
              // Note: In a real multi-server setup, you'd need a Redis adapter here.
              // For a single server, this direct emit works.
              io.to(participant.id).emit('session:invite', sessionData);
            });
          });

          // Notification-specific events
          socket.on('notification:send', async data => {
            await NotificationService.sendNotification(data);
            // Emit to the specific recipient if they are online
            io.to(data.recipientId).emit('notification:new', data);
          });
        });
      },
    }),
  ],
});
