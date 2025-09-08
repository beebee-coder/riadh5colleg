
'use server';

import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from './constants';
import type { SafeUser } from '@/types';


/**
 * Retrieves the server-side session by reading the session cookie.
 * @returns A promise that resolves to the session payload (containing the user) or null if invalid.
 */
export async function getServerSession(): Promise<{ user: SafeUser } | null> {
  console.log('--- 🍪 [Serveur] Tentative de récupération de la session (DB-first) ---');
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      console.log('🚫 [Serveur] Pas de cookie de session trouvé.');
      return null;
    }
    
    console.log('✅ [Serveur] Cookie de session trouvé, tentative de parsing...');
    const user = JSON.parse(sessionCookie) as SafeUser;
    
    if (!user || !user.id) {
        console.error('❌ [Serveur/Session] Le cookie de session est malformé ou ne contient pas d\'utilisateur.');
        return null;
    }

    console.log(`✅ [Serveur/Session] Session valide trouvée pour: ${user.email}`);

    return { user };
  } catch (error) {
    console.error('❌ [Serveur] Le cookie de session est invalide ou corrompu:', error);
    return null;
  }
}
