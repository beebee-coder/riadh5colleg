// src/components/auth/SocialSignInButtons.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useLoginMutation } from '@/lib/redux/api/authApi';
import { initializeFirebaseApp } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const GoogleIcon = (props: React.ComponentProps<'svg'>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
        <title>Google</title>
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.9 2.04-5.08 2.04-4.36 0-7.92-3.57-7.92-7.92s3.56-7.92 7.92-7.92c2.41 0 3.79.96 4.69 1.82l2.31-2.31C18.6 1.91 16.02 0 12.48 0 5.88 0 0 5.88 0 12.48s5.88 12.48 12.48 12.48c6.92 0 12.08-4.79 12.08-12.08 0-.66-.07-1.32-.19-1.98z" />
    </svg>
);


export default function SocialSignInButtons() {
    const { toast } = useToast();
    const router = useRouter();
    const [loginApi, { isLoading }] = useLoginMutation();
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true);
        try {
            const app = initializeFirebaseApp();
            const auth = getAuth(app);
            const provider = new GoogleAuthProvider();
            
            console.log("🔥 [GoogleSignIn] Ouverture de la popup de connexion Google...");
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            console.log("✅ [GoogleSignIn] Succès de l'authentification Google. Obtention du token ID...");
            const idToken = await user.getIdToken();

            console.log("📡 [GoogleSignIn] Envoi du token ID à notre API backend...");
            await loginApi({ idToken }).unwrap();

            console.log("✅ [GoogleSignIn] Notre API a validé la session avec succès.");
            toast({
                title: "Connexion réussie!",
                description: "Vous allez être redirigé vers votre tableau de bord."
            });

            router.push('/dashboard');
            router.refresh();

        } catch (error: any) {
            console.error("❌ [GoogleSignIn] Erreur lors de la connexion Google:", error);
            const errorMessage = error.code === 'auth/account-exists-with-different-credential'
                ? "Un compte avec cette adresse e-mail existe déjà avec une autre méthode de connexion."
                : "Une erreur est survenue lors de la connexion avec Google.";
            
            toast({
                variant: 'destructive',
                title: 'Échec de la connexion Google',
                description: errorMessage,
            });
        } finally {
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Ou continuez avec
                    </span>
                </div>
            </div>

            <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={isLoading || isGoogleLoading}
            >
                {isGoogleLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <GoogleIcon className="mr-2 h-4 w-4" />
                )}
                Google
            </Button>
        </div>
    );
}
