import type { PrivacyContent } from '../privacy-content';

export const fr: PrivacyContent = {
  lang: 'fr',
  meta: {
    title: 'Politique de confidentialité — Locry',
    description:
      'Locry garde vos notes et tâches chiffrées sur votre appareil. Pas de serveur, pas de compte, pas de pistage. Ce que Locry stocke, ce qu’impliquent Google Drive et les modèles d’IA, et comment vous gardez le contrôle.',
  },
  title: 'Politique de confidentialité',
  updated: 'Dernière mise à jour',
  intro:
    'Locry est une app de notes et de tâches gratuite et open source qui fonctionne entièrement dans votre navigateur. Cette politique explique quelles données elle traite. En bref : vos notes n’arrivent jamais chez le développeur, aucun serveur ne les stocke, et il n’y a ni compte ni pistage.',
  sections: [
    {
      heading: 'Ce que Locry stocke, et où',
      body: [
        'Vos notes, tâches, listes et réglages sont stockés uniquement sur votre appareil, dans le stockage de votre navigateur (IndexedDB), chiffrés avec AES-256-GCM. La clé est dérivée de votre passkey (ou de votre clé de récupération) et n’existe que dans la mémoire de votre appareil tant que le coffre est ouvert. Le développeur n’a aucun accès à vos données et n’en détient aucune copie.',
        'Pour que l’écran de verrouillage puisse s’afficher avant le déverrouillage, quelques éléments sont stockés non chiffrés sur l’appareil : les noms et couleurs des coffres, et les préférences de l’app comme la langue et le thème.',
      ],
    },
    {
      heading: 'Ni compte, ni publicité, ni pistage',
      body: [
        'Locry n’a ni inscription ni comptes utilisateurs. Il n’utilise aucune publicité, aucun cookie de pistage et aucun traceur tiers. L’application elle-même (vos coffres, notes, tâches et questions) n’est jamais comptée ni mesurée.',
        'Seules les pages publiques de ce site (l’accueil, cette politique et les conditions) comptent les visites avec [GoatCounter](https://www.goatcounter.com), un outil de statistiques open source respectueux de la vie privée : pas de cookies, rien d’enregistré sur votre appareil et aucune donnée personnelle. Il enregistre l’adresse de la page, le site d’où vous venez, la taille de l’écran, ainsi que le navigateur, le système d’exploitation et le pays déduits de la requête ; votre adresse IP n’est pas conservée. Les visites ne sont pas comptées si votre navigateur envoie Do Not Track ou Global Privacy Control.',
      ],
    },
    {
      heading: 'Google Drive (facultatif)',
      body: [
        'Si vous connectez Google Drive pour les sauvegardes ou la synchronisation, Locry ne demande que l’autorisation drive.appdata : un dossier caché de votre Drive auquel seul Locry a accès. Il ne peut ni voir, ni lire, ni modifier vos autres fichiers Drive.',
        'Tout est chiffré sur votre appareil avant l’envoi : Google ne stocke donc que des données chiffrées, avec les noms, tailles et dates des fichiers et une étiquette d’appareil (par exemple « iPhone · Safari »). Le jeton d’accès délivré par Google (valable une heure) et l’adresse e-mail de votre compte Google sont conservés dans le coffre, chiffrés comme vos notes et uniquement sur cet appareil, pour que Drive continue de fonctionner après le verrouillage du coffre ; ils ne sont jamais synchronisés ni inclus dans les sauvegardes, et la déconnexion les supprime. Vous pouvez vous déconnecter à tout moment dans les Réglages ou dans les [autorisations de votre compte Google](https://myaccount.google.com/permissions).',
        'L’utilisation et le transfert par Locry des informations reçues des API Google respectent le [Règlement sur les données utilisateur des services d’API Google](https://developers.google.com/terms/api-services-user-data-policy), y compris les exigences d’utilisation limitée (Limited Use). Ces informations servent uniquement à stocker et lire vos propres sauvegardes et copies de synchronisation chiffrées ; elles ne sont partagées avec personne, ne servent pas à la publicité et ne sont pas lues par des humains.',
      ],
    },
    {
      heading: 'Fonctions d’IA (facultatives)',
      body: [
        'Si vous activez la recherche intelligente ou « Interrogez vos notes », les fichiers du modèle d’IA sont téléchargés une fois depuis Hugging Face (huggingface.co). Comme pour tout téléchargement, Hugging Face peut voir votre adresse IP et les fichiers demandés. Vos notes et vos questions sont traitées uniquement sur votre appareil et ne sont jamais envoyées à un service d’IA.',
        'Si vous utilisez la dictée, le micro n’enregistre que pendant que vous dictez ; l’enregistrement est converti en texte sur votre appareil par un modèle vocal (Whisper, téléchargé une fois depuis Hugging Face), puis supprimé : il n’est jamais conservé ni envoyé. La lecture à voix haute n’utilise que les voix installées sur votre appareil : le texte de vos notes n’est envoyé à aucun service vocal.',
      ],
    },
    {
      heading: 'Hébergement',
      body: [
        'Ce site est servi par GitHub Pages. Comme tout hébergeur, GitHub peut journaliser des données techniques telles que les adresses IP à des fins de sécurité ; voir la [déclaration de confidentialité de GitHub](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement). Si vous utilisez Locry sur le serveur de quelqu’un d’autre, les règles de son exploitant s’appliquent à ce serveur.',
      ],
    },
    {
      heading: 'Dons',
      body: [
        'Les liens de don mènent à des plateformes externes (comme GitHub Sponsors ou Ko-fi), soumises à leurs propres politiques de confidentialité. Locry ne reçoit aucune donnée de leur part.',
      ],
    },
    {
      heading: 'Vous gardez le contrôle',
      body: [
        'Vous pouvez supprimer vos données à tout moment : supprimez un coffre dans les Réglages, ou effacez les données de ce site dans votre navigateur. Les sauvegardes dans Google Drive peuvent être supprimées dans les Réglages, et l’accès de Locry peut être révoqué dans votre compte Google. Comme le développeur ne détient aucune donnée vous concernant, il n’y a rien à demander ni à supprimer de notre côté.',
      ],
    },
    {
      heading: 'Modifications',
      body: ['Si cette politique change, la nouvelle version sera publiée sur cette page avec une nouvelle date.'],
    },
    {
      heading: 'Contact',
      body: ['Questions sur cette politique : ouvrez une issue sur [github.com/eerkan/locry](https://github.com/eerkan/locry/issues).'],
    },
  ],
  back: 'Retour à Locry',
};
