// src/components/auth/SocialSignInButtons.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useLoginMutation } from '@/lib/redux/api/authApi';
import { initializeFirebaseApp } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const GoogleIcon = () => (
  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.9 2.04-5.08 2.04-4.36 0-7.92-3.57-7.92-7.92s3.56-7.92 7.92-7.92c2.41 0 3.79.96 4.69 1.82l2.31-2.31C18.6 1.91 16.02 0 12.48 0 5.88 0 0 5.88 0 12.48s5.88 12.48 12.48 12.48c6.92 0 12.08-4.79 12.08-12.08 0-.66-.07-1.32-.19-1.98z" fill="currentColor"/>
  </svg>
);

export default function SocialSignInButtons() {
  const { toast } = useToast();
  const router = useRouter();
  const [loginApi] = useLoginMutation();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    let timeoutId: NodeJS.Timeout;
    
    try {
      // Timeout après 30 secondes
      timeoutId = setTimeout(() => {
        throw new Error('Timeout: La connexion Google a pris trop de temps');
      }, 30000);

      const app = initializeFirebaseApp();
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      
      // Demander explicitement l'email et le profil
      provider.addScope('email');
      provider.addScope('profile');
      
      console.log("🔥 Ouverture de la popup Google...");
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      console.log("✅ Authentification Google réussie");
      const idToken = await user.getIdToken();

      console.log("📡 Envoi du token à l'API...");
      await loginApi({ idToken }).unwrap();

      console.log("✅ Session API créée avec succès");
      toast({
        title: "Connexion réussie!",
        description: "Redirection vers le tableau de bord..."
      });

      // Redirection et rafraîchissement
      router.push('/dashboard');
      router.refresh();

    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("❌ Erreur Google Sign-In:", error);
      
      let errorMessage = "Erreur lors de la connexion avec Google";
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Popup fermée. Veuillez réessayer.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "Popup bloquée. Veuillez autoriser les popups pour ce site.";
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = "Un compte existe déjà avec cette adresse email.";
      } else if (error.message.includes('Timeout')) {
        errorMessage = "La connexion a pris trop de temps. Veuillez réessayer.";
      }
      
      toast({
        variant: 'destructive',
        title: 'Échec de la connexion',
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
        disabled={isGoogleLoading}
      >
        {isGoogleLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Google
      </Button>
    </div>
  );
}
