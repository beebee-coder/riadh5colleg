// src/app/api/auth/social-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { Role } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const { idToken } = await request.json();
        if (!idToken) {
            return NextResponse.json({ message: "Le token ID est manquant." }, { status: 400 });
        }

        const admin = await initializeFirebaseAdmin();
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { uid, email, name } = decodedToken;

        let user = await prisma.user.findUnique({
            where: { email: email! },
        });

        let isNewUser = false;
        if (!user) {
            console.log(`[API/social-login] Nouvel utilisateur via fournisseur social: ${email}. Création du profil...`);
            isNewUser = true;

            const [firstName, ...lastNameParts] = (name || email!).split(' ');
            const lastName = lastNameParts.join(' ') || '';

            // Crée un nouvel utilisateur et un profil parent par défaut.
            user = await prisma.user.create({
                data: {
                    id: uid,
                    email: email!,
                    username: email!,
                    name: name || email!,
                    firstName: firstName,
                    lastName: lastName,
                    role: Role.PARENT, // Rôle par défaut pour les nouvelles inscriptions sociales
                    active: true,
                    img: decodedToken.picture,
                    parent: {
                        create: {
                            name: firstName,
                            surname: lastName,
                            address: '',
                        },
                    },
                },
            });
            
            // Définit le rôle dans les revendications personnalisées de Firebase
            await admin.auth().setCustomUserClaims(uid, { role: Role.PARENT });
        }
        
        const { password, ...safeUser } = user;

        return NextResponse.json({ user: safeUser, isNewUser });

    } catch (error: any) {
        console.error('❌ [API/social-login] Erreur:', error);
        return NextResponse.json({ message: error.message || "Une erreur est survenue lors de la connexion sociale." }, { status: 500 });
    }
}
