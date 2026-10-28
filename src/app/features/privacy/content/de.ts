import type { PrivacyContent } from '../privacy-content';

export const de: PrivacyContent = {
  lang: 'de',
  meta: {
    title: 'Datenschutzerklärung — Locry',
    description:
      'Locry speichert deine Notizen und Aufgaben verschlüsselt auf deinem Gerät. Kein Server, kein Konto, kein Tracking. Was Locry speichert, was Google Drive und KI-Modelle betrifft und wie du die Kontrolle behältst.',
  },
  title: 'Datenschutzerklärung',
  updated: 'Zuletzt aktualisiert',
  intro:
    'Locry ist eine kostenlose, quelloffene Notiz- und Aufgaben-App, die vollständig in deinem Browser läuft. Diese Erklärung beschreibt, mit welchen Daten sie umgeht. Kurz gesagt: Deine Notizen erreichen den Entwickler nie, es gibt keinen Server, der sie speichert, kein Konto und kein Tracking.',
  sections: [
    {
      heading: 'Was Locry speichert und wo',
      body: [
        'Deine Notizen, Aufgaben, Listen und Einstellungen werden nur auf deinem Gerät gespeichert, im Speicher deines Browsers (IndexedDB), verschlüsselt mit AES-256-GCM. Der Schlüssel wird aus deinem Passkey (oder deinem Wiederherstellungsschlüssel) abgeleitet und existiert nur im Arbeitsspeicher deines Geräts, solange der Tresor offen ist. Der Entwickler hat keinen Zugriff auf deine Daten und keine Kopie davon.',
        'Damit der Sperrbildschirm vor dem Entsperren angezeigt werden kann, werden einige Angaben unverschlüsselt auf dem Gerät gespeichert: Namen und Farben der Tresore sowie App-Einstellungen wie Sprache und Design.',
      ],
    },
    {
      heading: 'Kein Konto, keine Werbung, kein Tracking',
      body: [
        'Locry hat keine Registrierung und keine Benutzerkonten. Es nutzt keine Werbung, keine Tracking-Cookies und keine Tracker von Dritten. Die App selbst (deine Tresore, Notizen, Aufgaben und Fragen) wird nie gezählt oder gemessen.',
        'Nur die öffentlichen Seiten dieser Website (Startseite, diese Richtlinie und die Nutzungsbedingungen) zählen Besuche mit [GoatCounter](https://www.goatcounter.com), einer datenschutzfreundlichen Open-Source-Analyse: keine Cookies, nichts wird auf deinem Gerät gespeichert, keine personenbezogenen Daten. Erfasst werden die Seitenadresse, die Website, von der du kommst, die Bildschirmgröße sowie Browser, Betriebssystem und Land, die aus der Anfrage abgeleitet werden; deine IP-Adresse wird nicht gespeichert. Besuche werden nicht gezählt, wenn dein Browser Do Not Track oder Global Privacy Control sendet.',
      ],
    },
    {
      heading: 'Google Drive (optional)',
      body: [
        'Wenn du Google Drive für Backups oder die Synchronisierung verbindest, fragt Locry nur nach der Berechtigung drive.appdata: einem versteckten Ordner in deinem Drive, auf den nur Locry zugreifen kann. Deine anderen Drive-Dateien kann es weder sehen noch lesen oder ändern.',
        'Alles wird auf deinem Gerät verschlüsselt, bevor es hochgeladen wird; Google speichert also nur verschlüsselte Daten sowie Dateinamen, Größen, Zeiten und eine Gerätebezeichnung (zum Beispiel „iPhone · Safari“). Das Zugriffstoken von Google (eine Stunde gültig) und die E-Mail-Adresse deines Google-Kontos werden im Tresor gespeichert, verschlüsselt wie deine Notizen und nur auf diesem Gerät, damit Drive auch nach dem Sperren des Tresors weiter funktioniert; sie werden nie synchronisiert oder in Backups aufgenommen, und Trennen der Verbindung löscht sie. Du kannst die Verbindung jederzeit in den Einstellungen oder in den [Berechtigungen deines Google-Kontos](https://myaccount.google.com/permissions) trennen.',
        'Die Nutzung und Weitergabe von Informationen, die Locry über Google-APIs erhält, entspricht der [Nutzerdatenrichtlinie für Google API-Dienste](https://developers.google.com/terms/api-services-user-data-policy), einschließlich der Anforderungen zur eingeschränkten Nutzung (Limited Use). Diese Informationen dienen nur dazu, deine eigenen verschlüsselten Backups und Synchronisierungskopien zu speichern und zu lesen; sie werden mit niemandem geteilt, nicht für Werbung verwendet und nicht von Menschen gelesen.',
      ],
    },
    {
      heading: 'KI-Funktionen (optional)',
      body: [
        'Wenn du die intelligente Suche oder „Frag deine Notizen“ aktivierst, werden die Dateien des KI-Modells einmalig von Hugging Face (huggingface.co) heruntergeladen. Wie bei jedem Download kann Hugging Face deine IP-Adresse und die angeforderten Dateien sehen. Deine Notizen und Fragen werden nur auf deinem Gerät verarbeitet und nie an einen KI-Dienst gesendet.',
        'Wenn du das Diktieren nutzt, nimmt das Mikrofon nur auf, während du diktierst; die Aufnahme wird auf deinem Gerät von einem Sprachmodell (Whisper, einmal von Hugging Face geladen) in Text umgewandelt und danach verworfen: Sie wird nie gespeichert oder gesendet. Das Vorlesen nutzt nur auf deinem Gerät installierte Stimmen, der Text deiner Notizen geht also an keinen Sprachdienst.',
      ],
    },
    {
      heading: 'Hosting',
      body: [
        'Diese Website wird über GitHub Pages bereitgestellt. Wie jeder Webhoster kann GitHub aus Sicherheitsgründen technische Daten wie IP-Adressen protokollieren; siehe die [Datenschutzerklärung von GitHub](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement). Wenn du Locry auf dem Server einer anderen Person nutzt, gelten für diesen Server deren Richtlinien.',
      ],
    },
    {
      heading: 'Spenden',
      body: [
        'Spendenlinks führen zu externen Plattformen (etwa GitHub Sponsors oder Ko-fi), für die deren eigene Datenschutzerklärungen gelten. Locry erhält von ihnen keine Daten.',
      ],
    },
    {
      heading: 'Deine Kontrolle',
      body: [
        'Du kannst deine Daten jederzeit löschen: Lösche einen Tresor in den Einstellungen oder lösche die Daten dieser Website in deinem Browser. Backups in Google Drive lassen sich in den Einstellungen löschen, und der Zugriff von Locry lässt sich in deinem Google-Konto entziehen. Da der Entwickler keine Daten über dich hat, gibt es bei uns nichts anzufordern oder zu löschen.',
      ],
    },
    {
      heading: 'Änderungen',
      body: ['Wenn sich diese Erklärung ändert, wird die neue Fassung mit neuem Datum auf dieser Seite veröffentlicht.'],
    },
    {
      heading: 'Kontakt',
      body: ['Fragen zu dieser Erklärung: Erstelle ein Issue unter [github.com/eerkan/locry](https://github.com/eerkan/locry/issues).'],
    },
  ],
  back: 'Zurück zu Locry',
};
