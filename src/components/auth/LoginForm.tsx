// src/components/auth/LoginForm.tsx
'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import FormError from '@/components/forms/FormError';
import { loginSchema } from '@/lib/formValidationSchemas';
import SocialSignInButtons from './SocialSignInButtons';
import { useLoginMutation } from '@/lib/redux/api/authApi';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeFirebaseApp } from '@/lib/firebase';


type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  console.log("⚛️ [LoginForm] Le composant de connexion est rendu.");
  const router = useRouter();
  const { toast } = useToast();
  const [loginApi, { isLoading }] = useLoginMutation();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    console.log("🔑 [LoginForm] Tentative de connexion soumise pour:", data.email);
    try {
        const app = initializeFirebaseApp();
        const auth = getAuth(app);
        
        console.log("🔥 [LoginForm] Connexion à Firebase avec email et mot de passe...");
        const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
        console.log("✅ [LoginForm] Succès de la connexion Firebase. Obtention du token ID...");
        const idToken = await userCredential.user.getIdToken();

        console.log("📡 [LoginForm] Envoi du token ID à notre API backend via la mutation RTK...");
        await loginApi({ idToken }).unwrap();
      
        console.log("✅ [LoginForm] Notre API a validé la session avec succès.");
        toast({
            title: "Connexion réussie!",
            description: "Vous allez être redirigé vers votre tableau de bord."
        });
      
        router.push('/dashboard');
        router.refresh();

    } catch (error: any) {
      console.error("❌ [LoginForm] Erreur de connexion:", JSON.stringify(error, null, 2));
      let errorMessage = "Une erreur inattendue est survenue. Veuillez réessayer.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          errorMessage = "Email ou mot de passe incorrect.";
      }
      toast({
        variant: "destructive",
        title: "Échec de la connexion",
        description: errorMessage,
      });
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        <div className="neumorphic-container">
          <input
            id="email"
            type="text"
            required
            autoComplete="email"
            placeholder=" " 
            {...register('email')}
            disabled={isLoading}
            className="neumorphic-input"
          />
           <label htmlFor="email" className="neumorphic-label">Email ou nom d'utilisateur</label>
        </div>
        <FormError error={errors.email} className="pl-4" />
        
        <div className="neumorphic-container">
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder=" "
            {...register('password')}
            disabled={isLoading}
            className="neumorphic-input"
          />
          <label htmlFor="password" className="neumorphic-label">Mot de passe</label>
        </div>
        <FormError error={errors.password} className="pl-4"/>
        
        <div className="text-right">
             <Link href="/forgot-password" passHref>
                  <span className="text-xs text-blue-500 hover:underline">Mot de passe oublié ?</span>
              </Link>
        </div>

        <div className="btn">
            <button type="submit" className="button" disabled={isLoading}>
              <span>{isLoading ? 'Chargement...' : 'Se Connecter'}</span>
            </button>
            <Link href="/register" className="button">
                <span>Inscrivez-vous</span>
            </Link>
        </div>
      </form>
      <SocialSignInButtons />
    </div>
  );
}