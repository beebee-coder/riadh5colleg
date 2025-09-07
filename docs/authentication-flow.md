# Flux d'Authentification de l'Application

Ce document détaille le processus d'authentification de l'application, depuis l'interaction de l'utilisateur avec le formulaire de connexion jusqu'à l'accès aux pages protégées.

## Schéma Général

```
/------------------\      (2) Firebase Auth      /-------------------\
|  Client (React)  | ------------------------> |  Firebase Server  |
\------------------/      <------------------------ \-------------------/
       | (1)              (3) ID Token                   |
       |                                                 |
       | (4) ID Token                                    |
       v                                                 |
/------------------\      (5) Verify Token       /-------------------\
|  Backend (API)   | ------------------------> |  Firebase Admin   |
\------------------/      <------------------------ \-------------------/
       | (6)                                          |
       | Set-Cookie (Session)                         |
       |                                                 |
       v (7)                                             |
/------------------\                                        |
|  Client (React)  |                                       |
\------------------/                                        |
       | (8)                                                 |
       | Cookie                                          |
       v                                                 |
/------------------\                                        |
|  Page Protégée   |                                       |
\------------------/                                        |

```

## Étapes Détaillées

1.  **Étape 1 : Soumission du Formulaire (`LoginForm.tsx`)**
    *   L'utilisateur saisit son adresse e-mail et son mot de passe.
    *   Le composant React utilise le SDK client de Firebase (`firebase/auth`) pour appeler la fonction `signInWithEmailAndPassword`.

2.  **Étape 2 : Authentification Directe avec Firebase**
    *   Le client communique directement avec les serveurs d'authentification de Firebase pour valider les informations d'identification.
    *   Cette étape ne passe pas par notre backend, ce qui décharge le serveur de la gestion des mots de passe.

3.  **Étape 3 : Réception de l'ID Token**
    *   Si la connexion est réussie, Firebase retourne un `UserCredential` qui contient un **ID Token**.
    *   Cet ID Token est un JSON Web Token (JWT) signé par Firebase, prouvant que l'utilisateur a été authentifié avec succès.

4.  **Étape 4 : Envoi du Token à notre Backend**
    *   Le client prend cet ID Token et l'envoie à notre propre endpoint d'API : `POST /api/auth/login`.

5.  **Étape 5 : Vérification du Token Côté Serveur (`/api/auth/login/route.ts`)**
    *   Notre backend reçoit la requête avec l'ID Token.
    *   Il utilise le **Firebase Admin SDK** pour vérifier la signature et la validité du jeton. Cette étape est cruciale pour la sécurité : elle garantit que la requête provient d'un utilisateur authentifié par Firebase et non d'une source malveillante.

6.  **Étape 6 : Création et Envoi du Cookie de Session**
    *   Après une vérification réussie, le backend génère un **cookie de session** sécurisé et `HttpOnly` via la méthode `createSessionCookie` du Firebase Admin SDK.
    *   Ce cookie est ensuite inclus dans la réponse de l'API avec l'en-tête `Set-Cookie`. Le navigateur le stockera automatiquement.
    *   L'API retourne également les informations de l'utilisateur (sans le mot de passe) dans le corps de la réponse.

7.  **Étape 7 : Mise à Jour de l'État Côté Client**
    *   Le client reçoit la réponse de l'API. La slice Redux `authSlice` est mise à jour avec les informations de l'utilisateur, et l'état `isAuthenticated` passe à `true`.
    *   Grâce à la mise à jour de l'état, l'interface utilisateur réagit et redirige l'utilisateur vers la page `/dashboard`.

8.  **Étape 8 : Accès aux Routes Protégées**
    *   Lors de toute nouvelle requête vers le serveur (changement de page, appel API), le navigateur envoie automatiquement le cookie de session.
    *   Les `Server Components` ou les `Route Handlers` qui nécessitent une authentification appellent la fonction `getServerSession()`.
    *   `getServerSession()` lit le cookie, le vérifie à nouveau avec le Firebase Admin SDK et retourne les informations de l'utilisateur si la session est valide. Cela permet de sécuriser les accès aux données et aux pages côté serveur.

Ce flux tire parti de la sécurité et de la simplicité de Firebase Authentication pour l'authentification initiale, tout en maintenant un contrôle total sur la gestion de session au sein de notre propre backend via des cookies sécurisés.