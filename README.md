# NEURO-OS 🧠

[![License: GPL v3](https://img.shields.io/badge/License-GPL_v3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-green?logo=nodedotjs)](https://nodejs.org/)

**NEURO-OS** (Neural Engine Operating System) est un OS virtuel distribué piloté par l'Intelligence Artificielle. Conçu comme une architecture "cerveau", il agrège de multiples nœuds de modèles de langages (LLM) et capteurs pour former une intelligence décentralisée, tolérante aux pannes et hyper-sécurisée.

---

## 🚀 Vision du Projet

NEURO-OS n'est pas qu'un chatbot. C'est un *cerveau décentralisé* capable :
1. De fusionner algorithmiquement les réponses de plusieurs IA (Gemini, Ollama local, etc.).
2. De gérer des modèles de sécurité Zero Trust ("ZTA").
3. De s'exécuter dans des environnements air-gapped pour garantir la confidentialité absolue.
4. De scaler de manière prédictible grâce à l'implémentation de Workers Threads et de queues de requêtes (P-Queue, Workerpools).

---

## 🔒 Infrastructures "FBI Level" & Optimisations (v1.1)

Le projet a été audité et patché pour viser une intégration au niveau production :

### 1. Sécurité Avancée
- **Chiffrement Authentifié** : Les clés API (`Vault`) sont chiffrées en AES-256-GCM via `crypto`, protégeant le système des attaques *Padding Oracle*. Sans la clé d'environnement principale, le coffre reste hermétique.
- **Rate-Limiting & Anti-Brute-Force** : Filtrage IP via `express-rate-limit` couplé au Trust Proxy (Cloud Run).
- **Filtrage XSS en Edge** : Nettoyage drastique des payloads entrants avec le package open source `xss`. L'injection est proscrite avant même de toucher aux logiques métier.
- **Audit Logging Immuable** : Intégration de `pino` pour journalisation ultra-rapide au format JSON. Prêt pour les aggrégateurs logs industriels (Splunk, ELK).

### 2. Scalabilité Horizontale & Multi-Threading
- **Piscina Worker Threads** : Le moteur de fusion heuristique calcule l'indice de similarité Dice des textes de manière O(n²), opéré par un pool de threads CPU indépendants (`piscina`), pour dégager l'Event Loop principal.
- **File d'Attente & Backpressure** : `p-queue` prévient le dépassement mémoire en régulant les soumissions simultanées. Si le système sature, il applique un rejet strict explicite pour éviter l'explosion RAM.
- **Asynchronisme Parallèle** : La vérification de santé (Heartbeat) interroge tous les connecteurs (Cloud LLM / Hardware locaux) via du `Promise.allSettled`, sans qu'une IA défaillante ne ralentisse le processus (Health check dynamique).

### 3. Architecture Événementielle (WebSockets)
- Communication fluide du cerveau vers le Front `react-use-websocket` limitant les memory leaks UI.
- Le bus événementiel du serveur a été extrait en classe `EventBus`, injecté dans les dépendances de `taskQueue` pour faciliter les **tests unitaires modulaires (Mocks / DI)**.

---

## 🛠 Prérequis

- **Node.js** (v18.x ou supérieur recommandé)
- **Ollama** (optionnel, pour l'intégration des cerveaux locaux air-gapped)
- Clés API **Google Gemini** (Optionnel, si vous intégrez le réseau cloud de base)

---

## 💻 Installation & Lancement Rapide

1. Clonez ce dépôt :
   ```bash
   git clone https://github.com/votre-org/neuro-os.git
   cd neuro-os
   ```

2. Installez les dépendances :
   ```bash
   npm install
   ```

3. Configurez votre environnement cryptographique. Vous pouvez créer un fichier `.env` ou les passer process :
   ```env
   # CLÉ REQUISE EN PRODUCTION (AES-256-GCM) - 32 Bytes Hex
   ENCRYPTION_KEY=votre_cle_magique_treslongue_en_hex_256bit
   ```

4. Lancez le serveur :
   ```bash
   npm run dev
   ```
   > Par défaut, le serveur démarre sur le port 3000 avec Vite en Hot-Module-Replacement.

---

## 🏗 Structure du Dépôt

```
neuro-os/
├── src/
│   ├── client/       # Code source de l'interface utilisateur React & TailwindCSS
│   │   ├── components/ # Composants web avancés (Métriques, Tableau de Bord, 3D Canvas)
│   │   ├── hooks/      # Logique de gestion du WebSocket unifié
│   │   └── pages/      # Vues de l'OS (Marketplace, Mode Lab, Paramètres Vault)
│   ├── server/       # Architecture backend Express
│   │   ├── api/        # Contrôleurs & validation (Zod)
│   │   ├── connectors/ # Prises réseau (Ollama local, Gemini, Modules open-source)
│   │   ├── core/       # Worker threads, Fusion Engine, Queueing
│   │   └── middleware/ # Rate limiters, Protection injection XSS
│   └── lib/          # Outils Front partagés (cn, utilitaires API AxioS/fetch)
├── docker/           # Fichiers prénium de déploiements Docker (Front/Back/Mesh)
├── server.ts         # Point d'entrée de l'application (Trust Proxy configuré)
└── Makefile          # Outils DevOps
```

---

## ⚖️ Licence

Ce projet est sous licence **GNU Général Public License v3.0 (GPLv3)**.

Tout travail dérivé de ce logiciel, dès qu'il est distribué, doit être publié sous cette même licence et garder l'aspect Open Source du Cerveau. Voir le fichier [`LICENSE`](LICENSE) pour obtenir tous les termes et conditions associés.

---

*L'intelligence gagne à être partagée. NEURO-OS, l'Open-Source Cyberpunk.*
