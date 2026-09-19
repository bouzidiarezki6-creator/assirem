# PROJECT GUIDELINES — React + Supabase

## 1. OBJECTIF DU PROJET

Construire un site web moderne, fluide, responsive et maintenable à partir des captures d'écran fournies comme références visuelles.

Les captures d'écran représentent le résultat visuel attendu.

**Règle principale :**
Ne commence jamais à coder une page importante avant d'avoir analysé sa capture d'écran et compris sa structure.

Le résultat final doit être :

* visuellement proche des références ;
* moderne et naturel ;
* responsive ;
* rapide ;
* accessible ;
* maintenable ;
* sécurisé ;
* prêt à évoluer.

---

# 2. STACK OBLIGATOIRE

## Frontend

* React
* TypeScript
* Vite
* React Router
* Tailwind CSS
* shadcn/ui
* Radix UI
* Lucide React
* Framer Motion

## Data / State

* TanStack Query
* React Hook Form
* Zod

## Backend

Supabase :

* PostgreSQL
* Authentication
* Storage
* Row Level Security (RLS)
* Edge Functions uniquement lorsque nécessaire

## Infrastructure

* Vercel pour le déploiement
* GitHub pour le repository
* Cloudflare pour le DNS si nécessaire

## Monitoring

* Sentry pour les erreurs
* Vercel Analytics lorsque pertinent

---

# 3. AVANT DE CODER

Avant toute implémentation importante, effectuer les étapes suivantes.

### Étape 1 — Analyser toutes les captures

Pour chaque capture :

* identifier la page ;
* identifier les sections ;
* identifier la navigation ;
* identifier les composants réutilisables ;
* identifier les images ;
* identifier les boutons ;
* identifier les formulaires ;
* identifier les cartes ;
* identifier les états possibles ;
* identifier les éléments desktop/mobile si disponibles.

Ne pas simplement regarder les couleurs.

Analyser également :

* spacing ;
* proportions ;
* typographie ;
* hiérarchie visuelle ;
* alignements ;
* tailles ;
* bordures ;
* rayons ;
* ombres ;
* interactions supposées ;
* animations possibles.

### Étape 2 — Créer une architecture

Avant de créer plusieurs pages, déterminer :

```text
Pages
Components
UI Components
Hooks
Services
Types
Supabase
Utilities
Assets
```

Éviter de créer une architecture différente pour chaque page.

---

# 4. DESIGN SYSTEM

Les captures d'écran sont la référence principale du design.

Créer un système de design cohérent avant de multiplier les composants.

Définir notamment :

* couleurs principales ;
* couleurs secondaires ;
* background ;
* texte principal ;
* texte secondaire ;
* border ;
* radius ;
* shadows ;
* spacing ;
* typography ;
* tailles de titres ;
* boutons ;
* inputs ;
* cards.

Ne pas inventer de nouvelles couleurs ou styles sans raison.

Si une valeur exacte peut être déduite de la référence, l'utiliser.

---

# 5. RÈGLE IMPORTANTE SUR LES CAPTURES

Les captures sont des **références visuelles**, pas des images à afficher dans le site.

Ne jamais faire :

```text
Screenshot → image dans la page
```

Faire :

```text
Screenshot
    ↓
Analyse
    ↓
Composants React
    ↓
HTML/CSS/Tailwind
    ↓
Interface réelle
```

Les textes, boutons, images, cartes et interactions doivent être de vrais éléments HTML/React.

---

# 6. ARCHITECTURE DU CODE

Utiliser une architecture claire.

Exemple :

```text
src/
├── assets/
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── navigation/
│   └── shared/
│
├── pages/
│
├── features/
│   ├── auth/
│   ├── users/
│   └── ...
│
├── hooks/
│
├── services/
│
├── lib/
│   ├── supabase.ts
│   └── utils.ts
│
├── types/
│
├── routes/
│
├── App.tsx
└── main.tsx
```

Adapter cette structure au projet réel.

Ne pas créer des dossiers inutiles uniquement pour respecter cet exemple.

---

# 7. COMPOSANTS RÉUTILISABLES

Créer des composants réutilisables lorsqu'un élément apparaît plusieurs fois.

Exemples :

```text
Button
Card
Input
Modal
Navbar
Footer
SearchBar
UserAvatar
LoadingState
EmptyState
ErrorState
```

Éviter de copier-coller le même JSX plusieurs fois.

Si deux composants sont presque identiques, chercher à créer un composant configurable plutôt que deux implémentations séparées.

---

# 8. RESPONSIVE DESIGN

Le site doit fonctionner correctement sur :

* mobile ;
* tablette ;
* laptop ;
* desktop.

Ne pas simplement réduire la version desktop.

Analyser comment le layout doit réellement évoluer.

Exemple :

```text
Desktop
[Sidebar] [Content]

Mobile
[Header]
[Content]
[Bottom navigation si nécessaire]
```

Les éléments doivent rester utilisables avec les doigts.

---

# 9. PERFORMANCE

La fluidité est une priorité.

Toujours chercher à :

* réduire JavaScript inutile ;
* éviter les re-renders inutiles ;
* lazy-loader les pages lourdes ;
* optimiser les images ;
* utiliser WebP/AVIF lorsque possible ;
* utiliser `loading="lazy"` pour les images appropriées ;
* éviter les requêtes inutiles ;
* utiliser TanStack Query pour le cache ;
* éviter les composants inutilement lourds ;
* charger les ressources seulement lorsqu'elles sont nécessaires.

Ne pas optimiser prématurément au point de rendre le code compliqué.

---

# 10. TANSTACK QUERY

Les données venant de Supabase doivent être correctement séparées de l'UI.

Éviter :

```tsx
useEffect(() => {
  supabase.from(...)
}, [])
```

partout dans les composants.

Préférer :

```text
Component
    ↓
Custom Hook
    ↓
TanStack Query
    ↓
Service
    ↓
Supabase
```

Exemple conceptuel :

```text
useProducts()
      ↓
productsService.getProducts()
      ↓
Supabase
```

Cela permet de centraliser :

* loading ;
* error ;
* caching ;
* refetch ;
* invalidation.

---

# 11. SUPABASE

Supabase est le backend principal.

Utiliser :

```text
PostgreSQL
Auth
Storage
RLS
Edge Functions
```

selon les besoins réels du projet.

Ne pas créer de tables ou de fonctionnalités inutiles.

Avant de créer une table, réfléchir à :

* relations ;
* contraintes ;
* indexes ;
* types ;
* données obligatoires ;
* données optionnelles ;
* sécurité.

---

# 12. SÉCURITÉ SUPABASE

La sécurité est obligatoire.

Toutes les tables contenant des données privées ou appartenant à des utilisateurs doivent avoir des politiques RLS appropriées.

Ne jamais mettre la clé Supabase `service_role` dans le frontend.

Le frontend peut utiliser la clé publique prévue pour l'application.

Les opérations sensibles doivent passer par :

```text
React
  ↓
Edge Function
  ↓
Supabase
```

lorsque nécessaire.

Ne jamais faire confiance aux données venant directement du frontend.

Toujours valider les données côté serveur pour les opérations sensibles.

---

# 13. VALIDATION

Utiliser Zod pour valider les données utilisateur.

Exemple :

```text
Form
 ↓
React Hook Form
 ↓
Zod
 ↓
Supabase
```

Ne jamais considérer qu'une validation frontend suffit pour sécuriser une donnée.

---

# 14. IMAGES

Les images fournies par le projet doivent être utilisées intelligemment.

Avant d'ajouter une image :

* vérifier son format ;
* vérifier ses dimensions ;
* optimiser son poids ;
* utiliser un format moderne lorsque possible ;
* utiliser des versions adaptées si nécessaire.

Pour les images provenant de Supabase Storage :

```text
Original
   ↓
Storage
   ↓
URL optimisée
   ↓
Frontend
```

Ne pas charger une image de plusieurs Mo lorsqu'une version plus légère suffit.

---

# 15. ANIMATIONS

Les animations doivent améliorer l'expérience utilisateur.

Utiliser Framer Motion lorsque nécessaire.

Privilégier :

* transitions courtes ;
* micro-interactions ;
* apparition douce ;
* hover subtil ;
* feedback utilisateur.

Éviter :

* animations permanentes ;
* effets excessifs ;
* animations qui ralentissent l'interface ;
* animations inutiles.

Le site doit sembler **naturel et professionnel**, pas comme une démonstration technique.

---

# 16. ACCESSIBILITÉ

Toujours respecter :

* boutons réellement `<button>` ;
* liens réellement `<a>` / React Router ;
* labels pour les inputs ;
* alt text pour les images importantes ;
* navigation clavier ;
* contraste suffisant ;
* focus visible ;
* tailles de clic raisonnables.

Ne pas utiliser un `<div>` comme bouton si un vrai bouton peut être utilisé.

---

# 17. ÉTATS D'INTERFACE

Chaque fonctionnalité importante doit réfléchir aux états suivants :

```text
Normal
Loading
Success
Error
Empty
Disabled
Unauthorized
```

Exemple :

```text
Loading
   ↓
Success → données affichées

Loading
   ↓
Error → message + possibilité de réessayer

Loading
   ↓
Empty → état vide approprié
```

Ne jamais laisser l'utilisateur devant une page blanche sans explication.

---

# 18. GESTION DES ERREURS

Les erreurs doivent être :

* compréhensibles ;
* visibles ;
* utiles ;
* non techniques pour l'utilisateur final.

Éviter d'afficher directement :

```text
PostgrestError 42501
```

Préférer un message utilisateur approprié.

Les erreurs techniques doivent être disponibles dans les logs/monitoring.

---

# 19. ROUTING

Utiliser React Router.

Les routes doivent être organisées clairement.

Exemple :

```text
/
 /about
 /contact
 /login
 /register
 /dashboard
 /profile
```

Les routes protégées doivent être réellement protégées.

Ne jamais considérer qu'une simple redirection frontend constitue une sécurité.

---

# 20. VARIABLES D'ENVIRONNEMENT

Les secrets ne doivent jamais être hardcodés.

Utiliser :

```text
.env
.env.local
```

et les variables d'environnement du système de déploiement.

Ne jamais commit :

```text
.env
.env.local
```

si elles contiennent des secrets.

---

# 21. GIT

Travailler avec Git dès le début.

Faire des commits logiques :

```text
feat: add authentication
feat: add homepage
feat: add dashboard
fix: fix mobile navbar
refactor: improve data fetching
```

Éviter les commits géants du type :

```text
final project
everything
update
```

---

# 22. AVANT CHAQUE GRANDE MODIFICATION

Avant une modification importante :

1. comprendre le code existant ;
2. vérifier les composants réutilisables ;
3. vérifier les dépendances ;
4. vérifier Supabase ;
5. vérifier les routes ;
6. vérifier les captures concernées ;
7. modifier le minimum nécessaire ;
8. tester ;
9. vérifier le responsive.

Ne pas réécrire une partie fonctionnelle sans raison.

---

# 23. TEST VISUEL

Après avoir implémenté une page, comparer le résultat avec sa capture de référence.

Vérifier :

### Layout

* largeur ;
* hauteur ;
* spacing ;
* alignement ;
* positionnement.

### Typography

* taille ;
* poids ;
* line-height ;
* hiérarchie.

### Design

* couleurs ;
* radius ;
* borders ;
* shadows.

### Images

* dimensions ;
* crop ;
* position ;
* qualité.

### Responsive

* mobile ;
* tablette ;
* desktop.

Corriger les différences importantes avant de passer à la page suivante.

---

# 24. TEST FONCTIONNEL

Après chaque fonctionnalité importante :

```text
Build
↓
TypeScript
↓
Lint
↓
Fonctionnalité
↓
Responsive
```

Corriger les erreurs avant de continuer.

Ne pas ignorer les erreurs TypeScript.

Ne pas utiliser `any` simplement pour faire disparaître une erreur.

---

# 25. QUALITÉ DU CODE

Le code doit être :

* simple ;
* lisible ;
* typé ;
* modulaire ;
* réutilisable ;
* documenté uniquement lorsque nécessaire.

Éviter :

* duplication ;
* fichiers énormes ;
* composants de 500+ lignes sans raison ;
* logique métier directement dans le JSX ;
* `any` ;
* hacks CSS ;
* valeurs magiques répétées.

---

# 26. NE PAS SUR-ENGINEER

Ne pas ajouter une technologie simplement parce qu'elle existe.

Avant d'ajouter une dépendance, se demander :

> Est-ce réellement nécessaire pour ce projet ?

Éviter par défaut :

* Kubernetes ;
* microservices ;
* Redis ;
* Docker en production ;
* backend Node séparé ;
* architecture complexe ;
* librairies inutiles.

Le projet doit rester simple tant que sa charge ne justifie pas une architecture plus complexe.

---

# 27. ORDRE DE TRAVAIL

Suivre cet ordre général :

```text
1. Analyse des captures
        ↓
2. Analyse des besoins
        ↓
3. Architecture du projet
        ↓
4. Design system
        ↓
5. Installation de la stack
        ↓
6. Configuration Supabase
        ↓
7. Base de données + RLS
        ↓
8. Layout global
        ↓
9. Composants réutilisables
        ↓
10. Pages principales
        ↓
11. Fonctionnalités
        ↓
12. Responsive
        ↓
13. Performance
        ↓
14. Sécurité
        ↓
15. Tests
        ↓
16. Monitoring
        ↓
17. Production
```

---

# 28. RÈGLE POUR ANTIGRAVITY

Tu dois agir comme un **Senior React Engineer + UI/UX Engineer**.

Ne te contente pas de produire quelque chose qui fonctionne.

Le résultat doit également :

* respecter les références visuelles ;
* avoir une excellente hiérarchie visuelle ;
* être responsive ;
* être performant ;
* être accessible ;
* être sécurisé ;
* être maintenable.

Lorsque plusieurs solutions sont possibles, privilégier celle qui apporte le meilleur équilibre entre :

```text
Simplicité
+
Performance
+
Maintenabilité
+
UX
+
Sécurité
```

---

# 29. IMPORTANT — NE PAS DEVINER

Si une capture d'écran ne permet pas de déterminer clairement un comportement fonctionnel :

Ne pas inventer une fonctionnalité complexe.

Utiliser l'implémentation la plus simple cohérente avec le projet.

Si une décision a un impact important sur l'architecture ou les données, la signaler avant de continuer.

---

# 30. OBJECTIF FINAL

Le projet final doit donner l'impression d'avoir été conçu par une équipe professionnelle.

Il doit être :

**Beautiful**

* **Fast**
* **Responsive**
* **Secure**
* **Accessible**
* **Maintainable**
* **Scalable**

Mais sans complexité inutile.

## PRIORITÉ

En cas de conflit entre plusieurs objectifs :

```text
1. Fonctionnement correct
2. Sécurité
3. UX
4. Fidélité au design
5. Performance
6. Maintenabilité
7. Optimisation avancée
```

Toujours privilégier une solution simple, propre et robuste.
