import type { LegalContent } from '../privacy-content';

export const fr: LegalContent = {
  lang: 'fr',
  meta: {
    title: 'Conditions d’utilisation — Locry',
    description:
      'Les conditions d’utilisation de Locry, l’app gratuite et open source de notes et tâches chiffrées : vos données et vos clés, usage acceptable, services tiers, réponses de l’IA et absence de garantie.',
  },
  title: 'Conditions d’utilisation',
  updated: 'Dernière mise à jour',
  intro:
    'Ces conditions s’appliquent lorsque vous utilisez Locry à cette adresse. Locry est une app de notes et de tâches gratuite et open source qui fonctionne entièrement dans votre navigateur ; il n’y a ni compte ni rien à acheter.',
  sections: [
    {
      heading: 'Utilisation de Locry',
      body: ['En utilisant Locry, vous acceptez ces conditions. Si vous ne les acceptez pas, merci de ne pas l’utiliser.'],
    },
    {
      heading: 'Open source',
      body: [
        'Le code source de Locry est disponible sous [licence MIT](https://github.com/eerkan/locry/blob/main/LICENSE). Vous pouvez l’utiliser, le copier, le modifier et le distribuer dans le cadre de cette licence ; ces conditions concernent le site à cette adresse.',
      ],
    },
    {
      heading: 'Vos données et vos clés',
      body: [
        'Vos notes et tâches sont chiffrées sur votre appareil, et seules vos passkeys et votre clé de récupération peuvent les ouvrir. Il vous appartient de les conserver en lieu sûr : si vous perdez les deux, personne, pas même le développeur, ne pourra récupérer vos données.',
        'Faites régulièrement des sauvegardes. Les navigateurs peuvent supprimer les données d’un site, par exemple quand l’espace manque ou quand vous effacez vos données de navigation.',
      ],
    },
    {
      heading: 'Usage acceptable',
      body: [
        'Utilisez Locry uniquement de manière licite. N’essayez pas de perturber le site et ne l’utilisez pas pour détourner les services tiers auxquels il se connecte.',
      ],
    },
    {
      heading: 'Services tiers',
      body: [
        'Les fonctions facultatives reposent sur Google Drive, Hugging Face et GitHub Pages, dont les propres conditions s’appliquent lorsque vous les utilisez, comme les [Conditions d’utilisation de Google](https://policies.google.com/terms) et les [Conditions d’utilisation de GitHub](https://docs.github.com/site-policy/github-terms/github-terms-of-service).',
      ],
    },
    {
      heading: 'Réponses de l’IA',
      body: [
        'Les résultats de la recherche intelligente et les réponses d’« Interrogez vos notes » proviennent de petits modèles d’IA exécutés sur votre appareil. Ils peuvent être incomplets ou erronés ; vérifiez les sources avant de vous y fier.',
      ],
    },
    {
      heading: 'Absence de garantie',
      body: [
        'Locry est fourni « en l’état », sans garantie d’aucune sorte, expresse ou implicite, y compris d’adéquation à un usage particulier ou de disponibilité ininterrompue.',
        'Dans la mesure permise par la loi, le développeur n’est pas responsable des pertes de données ni de tout autre dommage résultant de l’utilisation de Locry.',
      ],
    },
    {
      heading: 'Modifications',
      body: [
        'Ces conditions peuvent changer. La nouvelle version sera publiée sur cette page avec une nouvelle date ; continuer à utiliser Locry ensuite vaut acceptation.',
      ],
    },
    {
      heading: 'Contact',
      body: ['Questions sur ces conditions : ouvrez une issue sur [github.com/eerkan/locry](https://github.com/eerkan/locry/issues).'],
    },
  ],
  back: 'Retour à Locry',
};
