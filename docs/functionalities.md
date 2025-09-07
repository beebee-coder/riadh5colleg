# Fonctionnalités et Architecture de l'Application

Ce document décrit les principales fonctionnalités de l'application de gestion scolaire ainsi que son architecture technique.

## I. Fonctionnalités Clés

L'application est conçue pour répondre aux besoins des différents acteurs d'un établissement scolaire : administrateurs, enseignants, élèves et parents.

### 1. Gestion Administrative (Rôle : Administrateur)
- **Tableau de bord centralisé** : Vue d'ensemble des statistiques de l'école (nombre d'élèves, d'enseignants, etc.).
- **Planificateur d'Emploi du Temps** : Un assistant intelligent (wizard) pour configurer et générer automatiquement les emplois du temps de toutes les classes.
- **Gestion des Entités** : Création, lecture, mise à jour et suppression (CRUD) des :
    - Niveaux (grades)
    - Classes
    - Salles de cours
    - Matières
    - Enseignants
    - Élèves
    - Parents
- **Gestion des Contraintes** : Définition des indisponibilités des enseignants et des exigences spécifiques aux matières (salles, horaires).
- **Annonces Publiques** : Publication d'annonces visibles par tous les visiteurs du site.

### 2. Espace Enseignant (Rôle : Enseignant)
- **Tableau de bord personnalisé** : Accès rapide à ses classes, cours et raccourcis.
- **Gestion des Évaluations** : Création et suivi des devoirs et examens pour ses classes.
- **Chatroom Interactive** : Lancement de sessions de cours en direct avec des outils de gamification (sondages, quiz, récompenses) et de visioconférence.
- **Messagerie** : Communication directe avec les parents d'élèves.
- **Suivi des Présences**.

### 3. Espace Élève (Rôle : Élève)
- **Tableau de bord simple** : Consultation des invitations aux sessions de cours en direct.
- **Participation Active** : Interaction en temps réel pendant les sessions de la chatroom.
- **Consultation** : Accès à ses notes, devoirs, examens et annonces.

### 4. Espace Parent (Rôle : Parent)
- **Suivi de la Scolarité** : Consultation des informations de ses enfants (notes, devoirs, annonces).
- **Communication** : Messagerie directe avec les enseignants.

## II. Architecture Technique

L'application est une **Single Page Application (SPA)** moderne construite avec une stack technique performante et éprouvée.

- **Framework Frontend** : **Next.js** avec le **App Router**, favorisant les **Server Components** pour des performances optimales et un meilleur SEO.
- **Langage** : **TypeScript** pour la robustesse et la maintenabilité du code.
- **Styling** : **Tailwind CSS** pour l'utilitaire-first et **ShadCN/UI** pour une bibliothèque de composants accessibles, réutilisables et esthétiques.
- **Gestion de l'État** : **Redux Toolkit** (avec RTK Query) pour une gestion centralisée, prévisible et efficace de l'état de l'application, notamment pour les données serveur et l'état de l'interface utilisateur.
- **Base de Données** : **PostgreSQL** géré via **Prisma ORM** pour des interactions sécurisées et typées avec la base de données.
- **Authentification** : **Firebase Authentication** pour une gestion sécurisée et flexible des utilisateurs (connexion par email/mot de passe, fournisseurs sociaux).
- **Communication en Temps Réel** : **Socket.IO** pour les fonctionnalités interactives de la chatroom (présence, notifications instantanées).
- **Déploiement** : Prévu pour un déploiement sur des plateformes modernes comme **Vercel** ou **Netlify**.

Cette architecture modulaire et découplée permet une grande évolutivité et facilite la maintenance à long terme.