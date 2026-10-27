import type { LegalContent } from '../privacy-content';

export const de: LegalContent = {
  lang: 'de',
  meta: {
    title: 'Nutzungsbedingungen — Locry',
    description:
      'Die Bedingungen für Locry, die kostenlose, quelloffene App für verschlüsselte Notizen und Aufgaben: deine Daten und Schlüssel, zulässige Nutzung, Drittanbieter, KI-Antworten und keine Gewährleistung.',
  },
  title: 'Nutzungsbedingungen',
  updated: 'Zuletzt aktualisiert',
  intro:
    'Diese Bedingungen gelten, wenn du Locry unter dieser Adresse nutzt. Locry ist eine kostenlose, quelloffene Notiz- und Aufgaben-App, die vollständig in deinem Browser läuft; es gibt kein Konto und nichts zu kaufen.',
  sections: [
    {
      heading: 'Nutzung von Locry',
      body: ['Mit der Nutzung von Locry stimmst du diesen Bedingungen zu. Wenn du nicht zustimmst, nutze Locry bitte nicht.'],
    },
    {
      heading: 'Open Source',
      body: [
        'Der Quellcode von Locry steht unter der [MIT-Lizenz](https://github.com/eerkan/locry/blob/main/LICENSE). Du darfst ihn im Rahmen dieser Lizenz nutzen, kopieren, ändern und weitergeben; diese Bedingungen betreffen die Website unter dieser Adresse.',
      ],
    },
    {
      heading: 'Deine Daten und deine Schlüssel',
      body: [
        'Deine Notizen und Aufgaben werden auf deinem Gerät verschlüsselt, und nur deine Passkeys und dein Wiederherstellungsschlüssel können sie öffnen. Du bist dafür verantwortlich, sie sicher aufzubewahren: Verlierst du beide, kann niemand, auch nicht der Entwickler, deine Daten wiederherstellen.',
        'Erstelle regelmäßig Backups. Browser können Website-Daten löschen, zum Beispiel bei knappem Speicher oder wenn du deine Browserdaten löschst.',
      ],
    },
    {
      heading: 'Zulässige Nutzung',
      body: [
        'Nutze Locry nur auf rechtmäßige Weise. Versuche nicht, die Website zu stören, und missbrauche über sie keine Drittanbieterdienste, mit denen sie verbunden ist.',
      ],
    },
    {
      heading: 'Dienste von Drittanbietern',
      body: [
        'Optionale Funktionen nutzen Google Drive, Hugging Face und GitHub Pages, für die bei der Nutzung deren eigene Bedingungen gelten, etwa die [Google-Nutzungsbedingungen](https://policies.google.com/terms) und die [GitHub-Nutzungsbedingungen](https://docs.github.com/site-policy/github-terms/github-terms-of-service).',
      ],
    },
    {
      heading: 'KI-Antworten',
      body: [
        'Ergebnisse der intelligenten Suche und Antworten von „Frag deine Notizen“ stammen von kleinen KI-Modellen auf deinem Gerät. Sie können unvollständig oder falsch sein; prüfe die Quellen, bevor du dich darauf verlässt.',
      ],
    },
    {
      heading: 'Keine Gewährleistung',
      body: [
        'Locry wird „wie besehen“ bereitgestellt, ohne ausdrückliche oder stillschweigende Gewährleistung jeglicher Art, einschließlich der Eignung für einen bestimmten Zweck und der ununterbrochenen Verfügbarkeit.',
        'Soweit gesetzlich zulässig, haftet der Entwickler nicht für Datenverluste oder sonstige Schäden, die aus der Nutzung von Locry entstehen.',
      ],
    },
    {
      heading: 'Änderungen',
      body: [
        'Diese Bedingungen können sich ändern. Die neue Fassung wird mit neuem Datum auf dieser Seite veröffentlicht; wenn du Locry danach weiter nutzt, akzeptierst du sie.',
      ],
    },
    {
      heading: 'Kontakt',
      body: ['Fragen zu diesen Bedingungen: Erstelle ein Issue unter [github.com/eerkan/locry](https://github.com/eerkan/locry/issues).'],
    },
  ],
  back: 'Zurück zu Locry',
};
