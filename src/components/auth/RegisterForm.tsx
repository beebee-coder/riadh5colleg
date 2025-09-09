// src/components/auth/RegisterForm.tsx
'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterSchema } from '@/lib/formValidationSchemas';
import { useRegisterMutation } from '@/lib/redux/api/authApi';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import FormError from '@/components/forms/FormError';
import { Role } from '@/types';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeFirebaseApp } from '@/lib/firebase';

type RegisterFormValues = RegisterSchema;

export default function RegisterForm() {
  console.log("⚛️ [RegisterForm] Le composant d'inscription est rendu.");
  const router = useRouter();
  const { toast } = useToast();
  const [registerApi, { isLoading }] = useRegisterMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: Role.PARENT },
  });

  const onSubmit: SubmitHandler<RegisterFormValues> = async (data) => {
    console.log("📝 [RegisterForm] Tentative d'inscription soumise pour:", data.email);
    try {
      // Étape 1: Créer l'utilisateur dans Firebase Authentication
      console.log("🔥 [RegisterForm] Création de l'utilisateur dans Firebase Auth...");
      const app = initializeFirebaseApp();
      const auth = getAuth(app);
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = userCredential.user;
      console.log(`✅ [RegisterForm] Utilisateur créé dans Firebase avec l'UID: ${firebaseUser.uid}`);

      // Étape 2: Créer le profil utilisateur dans notre base de données via notre API
      console.log("📡 [RegisterForm] Envoi des données à notre API backend pour la création du profil...");
      await registerApi({
        uid: firebaseUser.uid, // Utiliser l'UID de Firebase comme ID
        email: data.email,
        name: data.name,
        role: data.role,
      }).unwrap();
      
      console.log("✅ [RegisterForm] Profil utilisateur créé avec succès dans notre base de données.");
      toast({
        title: 'Compte créé !',
        description: "Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.",
      });
      router.push('/login');

    } catch (error: any) {
      console.error("❌ [RegisterForm] Erreur lors de l'inscription:", error);
      
      let errorMessage = "Une erreur inattendue s'est produite.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Cette adresse e-mail est déjà utilisée par un autre compte.';
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      }
      
      toast({
        variant: 'destructive',
        title: 'Erreur lors de l\'inscription',
        description: errorMessage,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
       <div className="neumorphic-container">
        <input id="name" type="text" required placeholder=" " {...register('name')} disabled={isLoading} className="neumorphic-input" />
        <label htmlFor="name" className="neumorphic-label">Nom et Prénom</label>
      </div>
      <FormError error={errors.name} />

      <div className="neumorphic-container">
        <input id="email" type="email" required placeholder=" " {...register('email')} disabled={isLoading} className="neumorphic-input" />
        <label htmlFor="email" className="neumorphic-label">Adresse e-mail</label>
      </div>
      <FormError error={errors.email} />

      <div className="neumorphic-container">
        <input id="password" type="password" required placeholder=" " {...register('password')} disabled={isLoading} className="neumorphic-input" />
        <label htmlFor="password" className="neumorphic-label">Mot de passe</label>
      </div>
      <FormError error={errors.password} />

      <div className="neumorphic-container">
        <input id="confirmPassword" type="password" required placeholder=" " {...register('confirmPassword')} disabled={isLoading} className="neumorphic-input" />
        <label htmlFor="confirmPassword" className="neumorphic-label">Confirmer le mot de passe</label>
      </div>
      <FormError error={errors.confirmPassword} />

      <div className="space-y-4">
        <label className="text-sm text-white">Je suis un...</label>
        <div className="flex justify-center gap-8 items-center">
            <div className="text-center">
                <label className="custom-radio-container">
                    <input type="radio" value={Role.PARENT} {...register('role')} disabled={isLoading} />
                    <div className="checkmark">
                        <svg xmlns="http://www.w3.org/2000/svg" className="ionicon" viewBox="0 0 512 512">
                            <title>Checkmark</title>
                            <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" d="M416 128L192 384l-96-96"></path>
                        </svg>
                    </div>
                </label>
                <span className="mt-2 text-white text-sm">Parent</span>
            </div>
            <div className="text-center">
                <label className="custom-radio-container">
                    <input type="radio" value={Role.TEACHER} {...register('role')} disabled={isLoading} />
                     <div className="checkmark">
                        <svg xmlns="http://www.w3.org/2000/svg" className="ionicon" viewBox="0 0 512 512">
                            <title>Checkmark</title>
                            <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" d="M416 128L192 384l-96-96"></path>
                        </svg>
                    </div>
                </label>
                <span className="mt-2 text-white text-sm">Enseignant</span>
            </div>
        </div>
        <FormError error={errors.role} />
      </div>
      
       <div className="btn">
            <button type="submit" className="button" disabled={isLoading}>
                <span>
                    {isLoading ? 'Inscription...' : 'S\'inscrire'}
                </span>
            </button>
      </div>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Vous avez déjà un compte ? </span>
        <Link href="/login" className="text-primary hover:underline">
          Se connecter
        </Link>
      </div>
    </form>
  );
}
