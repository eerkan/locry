import type { LandingContent } from '../landing-content';

export const fr: LandingContent = {
  lang: 'fr',
  meta: {
    title: 'Locry — Notes et tâches chiffrées de bout en bout, avec une passkey',
    description:
      'Locry est une app open source de notes et de tâches, sans serveur, qui tourne dans le navigateur : Markdown, tâches, connexion par passkey, AES-256, synchronisation chiffrée et recherche IA privée.',
    ogImageAlt: 'L’éditeur de notes de Locry : une note Markdown avec aperçu en direct, notes et tâches dans la barre latérale',
  },
  nav: {
    features: 'Fonctionnalités',
    security: 'Sécurité',
    sync: 'Synchronisation',
    selfHost: 'Auto-hébergement',
    faq: 'FAQ',
    open: 'Ouvrir Locry',
    skip: 'Aller au contenu',
  },
  sections: {
    overview: 'Aperçu',
    features: 'Fonctionnalités',
    tasks: 'Tâches',
    security: 'Sécurité',
    vaults: 'Coffres',
    sync: 'Synchronisation',
    search: 'Recherche intelligente',
    compare: 'Comparaison',
    selfHost: 'Auto-hébergement',
    faq: 'FAQ',
  },
  ui: {
    theme: 'Thème',
    light: 'Clair',
    dark: 'Sombre',
    system: 'Système',
    language: 'Langue',
    flow: 'Étapes du déverrouillage',
    terminal: 'Terminal',
  },
  hero: {
    eyebrow: 'Open source · Sans serveur · Fonctionne hors ligne',
    title: 'Vos notes et vos tâches,',
    accent: 'verrouillées par votre seule clé.',
    lead:
      'Locry est une app de notes et de tâches chiffrée de bout en bout qui tourne dans votre navigateur. Pas de compte, pas de mot de passe, pas de serveur : votre coffre s’ouvre avec votre empreinte, votre visage ou le code PIN de l’appareil — avec une passkey.',
    start: 'Commencer gratuitement',
    resume: 'Ouvrir votre coffre',
    github: 'Voir sur GitHub',
    badges: ['AES-256-GCM', 'Passkeys (WebAuthn PRF)', 'Markdown', 'PWA', '11 langues'],
    screenshotAlt: 'L’éditeur Markdown de Locry : la liste des notes à gauche, l’éditeur et l’aperçu en direct à droite',
    phoneAlt: 'Locry sur un téléphone : la liste des notes',
  },
  summary: {
    title: 'Locry en bref',
    text:
      'Locry est une app web gratuite et open source qui conserve vos notes et vos tâches sur votre appareil, chiffrées avec une clé que vous seul pouvez déverrouiller. Rien n’est envoyé à un serveur ; si vous le souhaitez, elle sauvegarde et synchronise vos autres appareils via Google Drive, toujours chiffrée.',
    facts: [
      { term: 'Ce que c’est', detail: 'Notes Markdown et listes de tâches dans une seule app' },
      { term: 'Prix', detail: 'Gratuit et open source' },
      { term: 'Compte', detail: 'Aucun ; vous vous connectez avec une passkey' },
      { term: 'Chiffrement', detail: 'AES-256-GCM par élément ; la clé est dérivée de votre passkey' },
      { term: 'Où sont les données', detail: 'Sur votre appareil, dans le stockage chiffré du navigateur' },
      { term: 'Synchronisation', detail: 'Facultative, chiffrée de bout en bout via Google Drive' },
      { term: 'Plateformes', detail: 'Navigateurs récents ; installable sur macOS, Windows, Linux, iOS et Android (PWA)' },
      { term: 'Langues', detail: 'Anglais, turc, chinois, espagnol, arabe, portugais, indonésien, français, japonais, russe et allemand' },
    ],
  },
  features: {
    title: 'Tout ce qu’il faut pour prendre des notes, sans renoncer à votre vie privée',
    lead: 'Locry a l’air simple mais il est complet au quotidien. Chaque fonctionnalité travaille dans votre coffre chiffré.',
    items: [
      {
        icon: 'lucideNotebookPen',
        title: 'Notes Markdown',
        text: 'Modes édition, partagé et aperçu ; barre d’outils et raccourcis, étiquettes, épinglage, archives et listes de tâches à cocher.',
      },
      {
        icon: 'lucideListTodo',
        title: 'Tâches',
        text: 'Vues Boîte de réception, Aujourd’hui, À venir et Terminées ; listes colorées, sous-tâches, priorités, échéances et glisser-déposer.',
      },
      {
        icon: 'lucideFingerprint',
        title: 'Connexion par passkey',
        text: 'Pas de mot de passe. Le coffre est déchiffré avec une passkey que vous déverrouillez par empreinte, visage ou code PIN ; une clé de récupération sert de secours.',
      },
      {
        icon: 'lucideLayers',
        title: 'Plusieurs coffres',
        text: 'Des coffres totalement séparés, comme Perso et Travail, chacun avec ses passkeys, sa clé de récupération, ses sauvegardes et ses réglages.',
      },
      {
        icon: 'lucideRefreshCw',
        title: 'Téléphone et ordinateur',
        text: 'Synchronisation chiffrée de bout en bout via Google Drive. Les suppressions suivent et les modifications concurrentes ne se perdent jamais.',
      },
      {
        icon: 'lucideSparkles',
        title: 'Recherche intelligente',
        text: 'Cherchez par le sens, pas seulement par les mots. Le modèle d’IA tourne dans votre navigateur ; vos notes ne sont jamais envoyées à un service d’IA.',
      },
      {
        icon: 'lucideArchive',
        title: 'Sauvegardes chiffrées',
        text: 'Des sauvegardes .locry en un seul fichier, compressées et chiffrées, vers un fichier ou Google Drive, automatiquement si vous le voulez.',
      },
      {
        icon: 'lucideWifiOff',
        title: 'Hors ligne et installable',
        text: 'S’ouvre sans internet. Installez-le sur votre bureau ou votre écran d’accueil comme une app.',
      },
      {
        icon: 'lucideCommand',
        title: 'Pensé pour le clavier',
        text: 'Palette de commandes ⌘K, « / » pour chercher, N pour une nouvelle note, T pour une nouvelle tâche et raccourcis G pour naviguer.',
      },
    ],
  },
  security: {
    title: 'Comment fonctionne le chiffrement ?',
    lead:
      'Avec Locry, la confiance repose sur les mathématiques, pas sur un serveur. La clé n’existe que sur votre appareil, et seulement en mémoire tant que le coffre est ouvert.',
    steps: [
      {
        title: '1. Passkey',
        text: 'Au déverrouillage, votre appareil utilise l’extension WebAuthn PRF pour produire un secret propre à votre passkey. Il ne quitte jamais l’appareil.',
      },
      {
        title: '2. Clé',
        text: 'HKDF-SHA-256 en dérive une clé qui déverrouille la clé aléatoire de 256 bits de votre coffre.',
      },
      {
        title: '3. Éléments',
        text: 'Chaque note et chaque tâche est chiffrée séparément avec AES-256-GCM, liée à son type et à son identifiant.',
      },
    ],
    tableTitle: 'Modèle de sécurité',
    rows: [
      ['Clé du coffre', '256 bits aléatoires ; en mémoire uniquement, non exportable'],
      ['Connexion', 'Passkey (WebAuthn PRF) → HKDF-SHA-256'],
      ['Récupération', 'Clé de récupération de 256 bits dans un emplacement de clé distinct'],
      ['Données', 'AES-256-GCM par élément, avec contexte authentifié (AAD)'],
      ['Sauvegardes et synchronisation', 'gzip + AES-256-GCM ; en-tête authentifié'],
      ['Aperçu', 'Nettoyé avec DOMPurify, images distantes bloquées, Content Security Policy'],
      ['Verrouillage auto', 'La clé est effacée de la mémoire après le délai d’inactivité choisi'],
    ],
    note: 'Si vous perdez à la fois vos passkeys et votre clé de récupération, personne — pas même Locry — ne peut accéder à vos données. Ce n’est pas un défaut : c’est le principe.',
  },
  vaults: {
    title: 'Perso et travail, dans des coffres séparés',
    text:
      'Chaque coffre est indépendant : sa propre clé de chiffrement, ses passkeys, sa clé de récupération, ses sauvegardes et ses réglages. Changer de coffre verrouille celui qui est ouvert ; les données d’un coffre ne sont jamais visibles depuis un autre.',
    bullets: [
      'Choisissez un coffre sur l’écran de verrouillage ; le dernier utilisé est mémorisé',
      'Donnez un nom et une couleur aux coffres ; passez de l’un à l’autre en un clic',
      'Une sauvegarde restaurée fusionne dans le même coffre, ou s’ajoute comme nouveau coffre',
    ],
    alt: 'L’écran de verrouillage de Locry : choix du coffre et déverrouillage par passkey',
  },
  sync: {
    title: 'Le même coffre sur votre téléphone et votre ordinateur',
    lead:
      'Il n’y a pas de serveur Locry pour la synchronisation. Chaque appareil écrit sa propre copie chiffrée du coffre dans un dossier d’app caché de votre Google Drive et fusionne les copies de vos autres appareils.',
    bullets: [
      'Google ne voit que des fichiers chiffrés, jamais le contenu, les titres ou les étiquettes',
      'Les notes et tâches supprimées le sont aussi sur vos autres appareils',
      'Si une note a changé sur deux appareils, l’ancienne version est conservée comme note « (conflit) »',
      'Les passkeys ajoutées ainsi que le nom et la couleur du coffre se synchronisent aussi',
      'Fonctionne tant que l’app est ouverte : au déverrouillage, au retour sur l’onglet et après les modifications',
    ],
    stepsTitle: 'Comment la configurer',
    steps: [
      'Sur l’ordinateur : Réglages → Synchronisation entre appareils → Activer la synchronisation.',
      'Sur le téléphone, ouvrez Locry à la même adresse et ajoutez-le à l’écran d’accueil.',
      'Restaurer une sauvegarde → Google Drive → choisissez votre coffre dans Coffres synchronisés.',
      'Déverrouillez avec votre passkey synchronisée ou votre clé de récupération ; la synchronisation démarre seule.',
    ],
    alt: 'La synchronisation entre appareils dans les réglages de Locry, avec les appareils qui synchronisent le coffre',
  },
  search: {
    title: 'Une IA qui cherche par le sens et respecte votre vie privée',
    text:
      'Cherchez « projets de vacances » et retrouvez aussi votre note « Réservation d’hôtel à Lisbonne ». Le modèle par défaut est EmbeddingGemma de Google, et les réglages proposent cinq modèles multilingues. Le modèle est téléchargé une fois et tourne entièrement dans votre navigateur.',
    bullets: [
      'Recherche par mots-clés et sémantique réunies, dans toutes les langues de l’app',
      'Les vecteurs sont stockés chiffrés et restent hors des sauvegardes et de la synchronisation',
      'Suggestions de « notes similaires » ; ⌘K pour chercher partout',
      'Facultatif : rien n’est téléchargé tant que vous ne l’activez pas',
    ],
    alt: 'La page de recherche de Locry : résultats sémantiques dans les notes et les tâches',
  },
  tasks: {
    title: 'Les tâches, juste à côté de vos notes',
    text: 'Voyez quoi faire dans la vue Aujourd’hui, ne ratez aucune tâche en retard et reliez les tâches aux notes qui les concernent.',
    bullets: [
      'Vues intelligentes : Boîte de réception, Aujourd’hui, À venir, Terminées',
      'Listes colorées, sous-tâches, priorités et échéances',
      'Tri par glisser-déposer, ajout rapide avec T',
    ],
    alt: 'Les tâches dans Locry : la vue Aujourd’hui avec priorités et échéances',
  },
  selfHost: {
    title: 'Hébergez-le sur votre propre serveur',
    lead:
      'Locry est open source et se compose uniquement de fichiers statiques. Il tourne dans Docker en une commande et peut servir votre propre domaine avec HTTPS automatique.',
    code: 'git clone https://github.com/emreerkangames/locry.git\ncd locry\ncp .env.example .env\ndocker compose up -d --build',
    notes: [
      'Le conteneur ne contient aucune donnée : les notes restent chiffrées dans le navigateur, supprimer le conteneur ne change rien.',
      'Utilisateur non root, système de fichiers en lecture seule, privilèges retirés.',
      'Avec COMPOSE_PROFILES=https et LOCRY_DOMAIN, Caddy obtient le certificat automatiquement.',
    ],
    github: 'Code source et documentation d’installation',
  },
  compare: {
    title: 'Locry comparé aux apps de notes cloud classiques',
    lead: 'La plupart des apps de notes gardent vos données sur leurs serveurs et peuvent les lire. Locry rend cela impossible dès le départ.',
    headers: ['', 'App de notes cloud classique', 'Locry'],
    rows: [
      ['Où sont vos données', 'Sur les serveurs de l’entreprise', 'Sur votre appareil, chiffrées'],
      ['Qui peut les lire', 'Le fournisseur du service', 'Vous seul'],
      ['Connexion', 'E-mail et mot de passe', 'Passkey, sans mot de passe'],
      ['Compte', 'Obligatoire', 'Inutile'],
      ['Hors ligne', 'Limité', 'Complet'],
      ['Recherche IA', 'Les notes partent sur un serveur', 'Tourne dans votre navigateur'],
      ['Code source', 'Fermé', 'Ouvert'],
    ],
  },
  faq: {
    title: 'Questions fréquentes',
    items: [
      {
        q: 'Qu’est-ce que Locry ?',
        a: 'Locry est une app gratuite et open source qui tourne dans votre navigateur et stocke des notes Markdown et des tâches chiffrées de bout en bout. Elle ne demande ni compte ni mot de passe ; le coffre s’ouvre avec une passkey.',
      },
      {
        q: 'Où sont stockées mes données ?',
        a: 'Sur votre appareil, chiffrées, dans le stockage IndexedDB du navigateur. Locry n’a pas de serveur qui conserve vos données. Si vous activez les sauvegardes Google Drive ou la synchronisation, seuls des fichiers chiffrés partent vers Drive.',
      },
      {
        q: 'Locry est-il gratuit ?',
        a: 'Oui. Locry est gratuit et open source ; le code source est sur GitHub. Vous pouvez aussi l’héberger sur votre propre serveur avec Docker.',
      },
      {
        q: 'Qu’est-ce qu’une passkey, et pourquoi pas de mot de passe ?',
        a: 'Une passkey est une méthode de connexion résistante à l’hameçonnage, avec votre empreinte, votre visage ou le code PIN de l’appareil. Locry dérive sa clé de chiffrement de la passkey via l’extension WebAuthn PRF : il n’y a donc aucun mot de passe à deviner ou à divulguer.',
      },
      {
        q: 'Que se passe-t-il si je perds ma passkey ?',
        a: 'Vous ouvrez le coffre avec la clé de récupération de 256 bits enregistrée lors de la configuration, puis vous ajoutez une nouvelle passkey. Si vous perdez vos passkeys et la clé de récupération, personne ne peut accéder aux données.',
      },
      {
        q: 'Comment synchroniser mon téléphone et mon ordinateur ?',
        a: 'Activez la Synchronisation entre appareils dans les réglages ; sur le téléphone, ouvrez Locry à la même adresse puis choisissez Restaurer une sauvegarde → Google Drive → votre coffre dans Coffres synchronisés. Chaque appareil écrit sa propre copie chiffrée dans Drive et fusionne les autres.',
      },
      {
        q: 'Google peut-il lire mes notes ?',
        a: 'Non. Les fichiers de sauvegarde et de synchronisation sont chiffrés avec AES-256-GCM sur votre appareil avant d’arriver sur Drive. Locry n’accède qu’à son propre dossier d’app caché (drive.appdata) et ne voit pas vos autres fichiers Drive.',
      },
      {
        q: 'La recherche IA envoie-t-elle mes notes quelque part ?',
        a: 'Non. Le modèle de langue multilingue est téléchargé une fois et tourne dans un Web Worker de votre navigateur. Vos notes ne sont jamais envoyées à un service d’IA.',
      },
      {
        q: 'Fonctionne-t-il hors ligne ?',
        a: 'Oui. Locry est une app web installable (PWA) qui fonctionne hors ligne après la première visite. Seules la synchronisation Drive et le premier téléchargement du modèle demandent internet.',
      },
      {
        q: 'Quels navigateurs et appareils sont pris en charge ?',
        a: 'Les navigateurs qui gèrent les passkeys avec l’extension PRF : Chrome et Edge 118+, Safari 18+. Le trousseau iCloud, le Gestionnaire de mots de passe de Google, 1Password ou une clé de sécurité matérielle conviennent.',
      },
      {
        q: 'Puis-je exporter mes données ?',
        a: 'Oui. Téléchargez depuis les réglages une sauvegarde .locry chiffrée en un seul fichier ; elle s’ouvre sur un autre appareil ou à une autre adresse avec une passkey ou la clé de récupération.',
      },
    ],
  },
  cta: {
    title: 'Vos notes restent à vous.',
    text: 'La configuration prend une minute : nommez votre coffre, créez une passkey, enregistrez votre clé de récupération.',
    start: 'Utiliser Locry gratuitement',
    github: 'Voir le code source',
  },
  footer: {
    tagline: 'Notes et tâches chiffrées de bout en bout.',
    openSource: 'Open source',
    madeWith: 'Construit avec Angular, Web Crypto et WebAuthn, sans serveur.',
    links: 'Liens',
  },
  howTo: {
    name: 'Créer un coffre chiffré dans Locry',
    description: 'Les étapes pour créer dans Locry un coffre de notes et de tâches chiffré de bout en bout, qui s’ouvre avec une passkey.',
    steps: [
      { name: 'Ouvrir Locry', text: 'Ouvrez Locry dans votre navigateur et cliquez sur « Commencer gratuitement ».' },
      { name: 'Nommer le coffre', text: 'Choisissez un nom et une couleur pour le coffre, par exemple « Perso ».' },
      { name: 'Créer une passkey', text: 'Créez une passkey avec votre empreinte, votre visage ou le code PIN de l’appareil.' },
      { name: 'Enregistrer la clé de récupération', text: 'Enregistrez la clé de récupération dans votre gestionnaire de mots de passe et confirmez l’un de ses groupes.' },
    ],
  },
};
