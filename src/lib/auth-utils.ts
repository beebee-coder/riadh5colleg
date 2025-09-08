
'use server';

import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from './constants';
import { initializeFirebaseAdmin } from './firebase-admin';
import type { SafeUser } from '@/types';
import prisma from './prisma';

/**
 * Retrieves the server-side session by verifying the Firebase session cookie.
 * This is the primary method for protecting server-side routes and API endpoints.
 * @returns A promise that resolves to the session payload (containing the user) or null if invalid.
 */
export async function getServerSession(): Promise<{ user: SafeUser } | null> {
  console.log('--- 🍪 [Serveur] Tentative de récupération de la session ---');
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      console.log('🚫 [Serveur] Pas de jeton de session trouvé dans les cookies.');
      return null;
    }
    
    console.log('✅ [Serveur] Jeton trouvé, tentative de vérification...');
    const admin = await initializeFirebaseAdmin();
    
    const decodedToken = await admin.auth().verifySessionCookie(sessionCookie, true);
    console.log('🔍 [Serveur] Jeton décodé:', decodedToken);
    
    console.log(`📦 [Serveur/Session] Recherche de l'utilisateur dans Prisma pour l'UID: ${decodedToken.uid}`);
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.uid },
    });

    if (!user) {
      console.error(`❌ [Serveur/Session] Utilisateur non trouvé dans Prisma pour l'UID: ${decodedToken.uid}`);
      return null;
    }

    console.log(`✅ [Serveur/Session] Utilisateur trouvé: ${user.email}`);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user;
    return { user: safeUser as SafeUser };
  } catch (error) {
    console.error('❌ [Serveur] Jeton de session invalide ou expiré:', error);
    return null;
  }
}
