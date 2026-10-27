import type { LandingContent } from '../landing-content';

export const de: LandingContent = {
  lang: 'de',
  meta: {
    title: 'Locry — Ende-zu-Ende-verschlüsselte Notizen und Aufgaben mit Passkey',
    description:
      'Locry ist eine quelloffene Notiz- und Aufgaben-App ohne Server, die im Browser läuft. Markdown-Notizen, Aufgaben, Passkey-Anmeldung, AES-256, verschlüsselte Synchronisierung und private KI-Suche.',
    ogImageAlt: 'Der Notizeditor von Locry: eine Markdown-Notiz mit Live-Vorschau, Notizen und Aufgaben in der Seitenleiste',
  },
  nav: {
    features: 'Funktionen',
    security: 'Sicherheit',
    sync: 'Synchronisierung',
    selfHost: 'Selbst hosten',
    faq: 'FAQ',
    support: 'Unterstützen',
    open: 'Locry öffnen',
    skip: 'Zum Inhalt springen',
  },
  sections: {
    overview: 'Überblick',
    features: 'Funktionen',
    tasks: 'Aufgaben',
    security: 'Sicherheit',
    vaults: 'Tresore',
    sync: 'Synchronisierung',
    search: 'Intelligente Suche',
    compare: 'Vergleich',
    selfHost: 'Selbst hosten',
    faq: 'FAQ',
  },
  ui: {
    theme: 'Design',
    light: 'Hell',
    dark: 'Dunkel',
    system: 'System',
    language: 'Sprache',
    flow: 'Ablauf beim Entsperren',
    terminal: 'Terminal',
  },
  hero: {
    eyebrow: 'Open Source · Ohne Server · Funktioniert offline',
    title: 'Deine Notizen und Aufgaben,',
    accent: 'nur mit deinem Schlüssel.',
    lead:
      'Locry ist eine Ende-zu-Ende-verschlüsselte Notiz- und Aufgaben-App, die in deinem Browser läuft. Kein Konto, kein Passwort, kein Server: Dein Tresor öffnet sich mit Fingerabdruck, Gesicht oder Geräte-PIN — mit einem Passkey.',
    start: 'Kostenlos starten',
    resume: 'Tresor öffnen',
    github: 'Auf GitHub ansehen',
    badges: ['AES-256-GCM', 'Passkeys (WebAuthn PRF)', 'Markdown', 'PWA', '11 Sprachen'],
    screenshotAlt: 'Der Markdown-Editor in Locry: links die Notizliste, rechts Editor und Live-Vorschau',
    phoneAlt: 'Locry auf dem Smartphone: die Notizliste',
  },
  summary: {
    title: 'Locry auf einen Blick',
    text:
      'Locry ist eine kostenlose, quelloffene Web-App, die deine Notizen und Aufgaben auf deinem Gerät speichert, verschlüsselt mit einem Schlüssel, den nur du entsperren kannst. Nichts wird an einen Server gesendet; auf Wunsch sichert und synchronisiert sie über Google Drive mit deinen anderen Geräten, weiterhin verschlüsselt.',
    facts: [
      { term: 'Was es ist', detail: 'Markdown-Notizen und Aufgabenlisten in einer App' },
      { term: 'Preis', detail: 'Kostenlos und Open Source' },
      { term: 'Konto', detail: 'Keins; du meldest dich mit einem Passkey an' },
      { term: 'Verschlüsselung', detail: 'AES-256-GCM pro Eintrag; der Schlüssel wird aus deinem Passkey abgeleitet' },
      { term: 'Wo die Daten liegen', detail: 'Auf deinem Gerät, im verschlüsselten Speicher des Browsers' },
      { term: 'Synchronisierung', detail: 'Optional, Ende-zu-Ende-verschlüsselt über Google Drive' },
      { term: 'Plattformen', detail: 'Moderne Browser; installierbar auf macOS, Windows, Linux, iOS und Android (PWA)' },
      { term: 'Sprachen', detail: 'Englisch, Türkisch, Chinesisch, Spanisch, Arabisch, Portugiesisch, Indonesisch, Französisch, Japanisch, Russisch und Deutsch' },
    ],
  },
  features: {
    title: 'Alles, was du zum Notieren brauchst, ohne deine Privatsphäre aufzugeben',
    lead: 'Locry wirkt schlicht, ist aber für den Alltag vollständig. Jede Funktion arbeitet in deinem verschlüsselten Tresor.',
    items: [
      {
        icon: 'lucideNotebookPen',
        title: 'Markdown-Notizen',
        text: 'Bearbeiten, geteilte Ansicht und Vorschau; Werkzeugleiste und Tastenkürzel, Tags, Anheften, Archiv und abhakbare Aufgabenlisten.',
      },
      {
        icon: 'lucideListTodo',
        title: 'Aufgaben',
        text: 'Ansichten Eingang, Heute, Demnächst und Erledigt; farbige Listen, Unteraufgaben, Prioritäten, Fälligkeitsdaten und Drag-and-drop.',
      },
      {
        icon: 'lucideFingerprint',
        title: 'Anmeldung mit Passkey',
        text: 'Kein Passwort. Der Tresor wird mit einem Passkey entschlüsselt, den du per Fingerabdruck, Gesicht oder Geräte-PIN freigibst; ein Wiederherstellungsschlüssel ist dein Notfallplan.',
      },
      {
        icon: 'lucideLayers',
        title: 'Mehrere Tresore',
        text: 'Vollständig getrennte Tresore wie Privat und Arbeit, jeder mit eigenen Passkeys, Wiederherstellungsschlüssel, Backups und Einstellungen.',
      },
      {
        icon: 'lucideRefreshCw',
        title: 'Smartphone und Computer',
        text: 'Ende-zu-Ende-verschlüsselte Synchronisierung über Google Drive. Löschungen werden übernommen, widersprüchliche Änderungen gehen nie verloren.',
      },
      {
        icon: 'lucideSparkles',
        title: 'Intelligente Suche',
        text: 'Suche nach Bedeutung, nicht nur nach Wörtern. Das KI-Modell läuft in deinem Browser; deine Notizen werden nie an einen KI-Dienst gesendet.',
      },
      {
        icon: 'lucideArchive',
        title: 'Verschlüsselte Backups',
        text: 'Komprimierte und verschlüsselte .locry-Backups in einer einzigen Datei, als Datei oder in Google Drive, auf Wunsch automatisch.',
      },
      {
        icon: 'lucideWifiOff',
        title: 'Offline und installierbar',
        text: 'Öffnet sich auch ohne Internet. Installiere es wie eine App auf dem Desktop oder Startbildschirm.',
      },
      {
        icon: 'lucideCommand',
        title: 'Tastaturfreundlich',
        text: '⌘K-Befehlspalette, „/“ zum Suchen, N für eine neue Notiz, T für eine neue Aufgabe und G-Kürzel zur Navigation.',
      },
    ],
  },
  security: {
    title: 'Wie funktioniert die Verschlüsselung?',
    lead:
      'Bei Locry beruht Vertrauen auf Mathematik, nicht auf einem Server. Der Schlüssel existiert nur auf deinem Gerät und nur im Arbeitsspeicher, solange der Tresor offen ist.',
    steps: [
      {
        title: '1. Passkey',
        text: 'Beim Entsperren erzeugt dein Gerät mit der WebAuthn-PRF-Erweiterung ein Geheimnis, das nur zu deinem Passkey gehört. Es verlässt das Gerät nie.',
      },
      {
        title: '2. Schlüssel',
        text: 'HKDF-SHA-256 leitet daraus einen Schlüssel ab, der den zufälligen 256-Bit-Schlüssel deines Tresors entsperrt.',
      },
      {
        title: '3. Einträge',
        text: 'Jede Notiz und jede Aufgabe wird einzeln mit AES-256-GCM verschlüsselt und an ihren Typ und ihre ID gebunden.',
      },
    ],
    tableTitle: 'Sicherheitsmodell',
    rows: [
      ['Tresorschlüssel', 'Zufällige 256 Bit; nur im Arbeitsspeicher, nicht exportierbar'],
      ['Anmeldung', 'Passkey (WebAuthn PRF) → HKDF-SHA-256'],
      ['Wiederherstellung', '256-Bit-Wiederherstellungsschlüssel in einem eigenen Schlüsselplatz'],
      ['Daten', 'AES-256-GCM pro Eintrag, mit authentifiziertem Kontext (AAD)'],
      ['Backups und Synchronisierung', 'gzip + AES-256-GCM; authentifizierter Header'],
      ['Vorschau', 'Bereinigt mit DOMPurify, externe Bilder blockiert, Content Security Policy'],
      ['Automatische Sperre', 'Der Schlüssel wird nach der gewählten Leerlaufzeit aus dem Speicher gelöscht'],
    ],
    note: 'Wenn du deine Passkeys und deinen Wiederherstellungsschlüssel verlierst, kann niemand — auch Locry nicht — auf deine Daten zugreifen. Das ist kein Fehler, sondern das Konzept.',
  },
  vaults: {
    title: 'Privat und Arbeit, in getrennten Tresoren',
    text:
      'Jeder Tresor ist unabhängig: eigener Verschlüsselungsschlüssel, eigene Passkeys, Wiederherstellungsschlüssel, Backups und Einstellungen. Ein Wechsel sperrt den offenen Tresor; die Daten eines Tresors sind aus einem anderen nie sichtbar.',
    bullets: [
      'Wähle den Tresor auf dem Sperrbildschirm; der zuletzt genutzte wird gemerkt',
      'Gib Tresoren Namen und Farbe; wechsle mit einem Klick in der Seitenleiste',
      'Ein wiederhergestelltes Backup wird in denselben Tresor zusammengeführt oder als neuer Tresor hinzugefügt',
    ],
    alt: 'Der Sperrbildschirm von Locry: Tresor auswählen und mit Passkey entsperren',
  },
  sync: {
    title: 'Derselbe Tresor auf Smartphone und Computer',
    lead:
      'Für die Synchronisierung gibt es keinen Locry-Server. Jedes Gerät schreibt seine eigene verschlüsselte Kopie des Tresors in einen versteckten App-Ordner in deinem Google Drive und führt die Kopien deiner anderen Geräte zusammen.',
    bullets: [
      'Google sieht nur verschlüsselte Dateien, nie Inhalte, Titel oder Tags',
      'Gelöschte Notizen und Aufgaben werden auch auf deinen anderen Geräten gelöscht',
      'Wurde eine Notiz auf zwei Geräten geändert, bleibt die ältere Fassung als „(Konflikt)“-Notiz erhalten',
      'Hinzugefügte Passkeys sowie Name und Farbe des Tresors werden ebenfalls synchronisiert',
      'Läuft, solange die App offen ist: beim Entsperren, bei der Rückkehr zum Tab und nach Änderungen',
    ],
    stepsTitle: 'So richtest du es ein',
    steps: [
      'Am Computer: Einstellungen → Synchronisierung zwischen Geräten → Synchronisierung aktivieren.',
      'Öffne Locry auf dem Smartphone unter derselben Adresse und füge es dem Startbildschirm hinzu.',
      'Aus Backup wiederherstellen → Google Drive → wähle deinen Tresor unter Synchronisierte Tresore.',
      'Entsperre mit deinem synchronisierten Passkey oder dem Wiederherstellungsschlüssel; die Synchronisierung startet von selbst.',
    ],
    alt: 'Synchronisierung zwischen Geräten in den Locry-Einstellungen, mit den synchronisierenden Geräten',
  },
  search: {
    title: 'KI, die nach Bedeutung sucht und deine Privatsphäre wahrt',
    text:
      'Suche nach „Urlaubspläne“ und finde auch deine Notiz „Hotelbuchung in Lissabon“. Standardmodell ist Googles EmbeddingGemma; in den Einstellungen stehen fünf mehrsprachige Modelle zur Wahl. Das Modell wird einmal heruntergeladen und läuft vollständig in deinem Browser.',
    bullets: [
      'Stichwort- und semantische Suche zusammen, in jeder Sprache der App',
      'Vektoren werden verschlüsselt gespeichert und bleiben außerhalb von Backups und Synchronisierung',
      'Vorschläge für „ähnliche Notizen“; ⌘K sucht von überall',
      'Freiwillig: Ohne Aktivierung wird nichts heruntergeladen',
    ],
    alt: 'Die Suchseite von Locry: semantische Treffer in Notizen und Aufgaben',
  },
  tasks: {
    title: 'Aufgaben, direkt neben deinen Notizen',
    text: 'Sieh in der Ansicht Heute, was ansteht, verpasse keine überfälligen Aufgaben und verknüpfe Aufgaben mit den passenden Notizen.',
    bullets: [
      'Intelligente Ansichten: Eingang, Heute, Demnächst, Erledigt',
      'Farbige Listen, Unteraufgaben, Prioritäten und Fälligkeitsdaten',
      'Sortieren per Drag-and-drop, schnelles Hinzufügen mit T',
    ],
    alt: 'Aufgaben in Locry: die Ansicht Heute mit Prioritäten und Fälligkeitsdaten',
  },
  selfHost: {
    title: 'Auf deinem eigenen Server betreiben',
    lead:
      'Locry ist Open Source und besteht nur aus statischen Dateien. Es läuft mit einem Befehl in Docker und kann deine eigene Domain mit automatischem HTTPS bedienen.',
    code: 'git clone https://github.com/eerkan/locry.git\ncd locry\ncp .env.example .env\ndocker compose up -d --build',
    notes: [
      'Der Container enthält keine Daten: Notizen bleiben verschlüsselt im Browser, das Entfernen des Containers ändert nichts.',
      'Nicht-Root-Benutzer, schreibgeschütztes Dateisystem, entzogene Berechtigungen.',
      'Mit COMPOSE_PROFILES=https und LOCRY_DOMAIN holt Caddy das Zertifikat automatisch.',
    ],
    github: 'Quellcode und Installationsanleitung',
  },
  compare: {
    title: 'Locry im Vergleich mit typischen Cloud-Notiz-Apps',
    lead: 'Die meisten Notiz-Apps speichern deine Daten auf ihren Servern und können sie lesen. Locry macht das von vornherein unmöglich.',
    headers: ['', 'Typische Cloud-Notiz-App', 'Locry'],
    rows: [
      ['Wo deine Daten liegen', 'Auf den Servern des Anbieters', 'Auf deinem Gerät, verschlüsselt'],
      ['Wer sie lesen kann', 'Der Dienstanbieter', 'Nur du'],
      ['Anmeldung', 'E-Mail und Passwort', 'Passkey, kein Passwort'],
      ['Konto', 'Erforderlich', 'Nicht nötig'],
      ['Offline', 'Eingeschränkt', 'Vollständig'],
      ['KI-Suche', 'Notizen gehen an einen Server', 'Läuft in deinem Browser'],
      ['Quellcode', 'Geschlossen', 'Offen'],
    ],
  },
  faq: {
    title: 'Häufig gestellte Fragen',
    items: [
      {
        q: 'Was ist Locry?',
        a: 'Locry ist eine kostenlose, quelloffene App, die in deinem Browser läuft und Markdown-Notizen und Aufgaben Ende-zu-Ende-verschlüsselt speichert. Sie braucht weder Konto noch Passwort; der Tresor öffnet sich mit einem Passkey.',
      },
      {
        q: 'Wo werden meine Daten gespeichert?',
        a: 'Auf deinem Gerät, verschlüsselt, im IndexedDB-Speicher des Browsers. Locry hat keinen Server, der deine Daten aufbewahrt. Wenn du Google-Drive-Backups oder die Synchronisierung aktivierst, gehen nur verschlüsselte Dateien an Drive.',
      },
      {
        q: 'Ist Locry kostenlos?',
        a: 'Ja. Locry ist kostenlos und Open Source; der Quellcode liegt auf GitHub. Du kannst es auch mit Docker auf deinem eigenen Server betreiben.',
      },
      {
        q: 'Was ist ein Passkey, und warum gibt es kein Passwort?',
        a: 'Ein Passkey ist eine phishing-resistente Anmeldung mit Fingerabdruck, Gesicht oder Geräte-PIN. Locry leitet seinen Verschlüsselungsschlüssel über die WebAuthn-PRF-Erweiterung aus dem Passkey ab, daher gibt es kein Passwort, das erraten werden oder durchsickern könnte.',
      },
      {
        q: 'Was passiert, wenn ich meinen Passkey verliere?',
        a: 'Du öffnest den Tresor mit dem 256-Bit-Wiederherstellungsschlüssel, den du bei der Einrichtung gespeichert hast, und fügst einen neuen Passkey hinzu. Verlierst du Passkeys und Wiederherstellungsschlüssel, kann niemand auf die Daten zugreifen.',
      },
      {
        q: 'Wie synchronisiere ich zwischen Smartphone und Computer?',
        a: 'Aktiviere in den Einstellungen die Synchronisierung zwischen Geräten; öffne Locry auf dem Smartphone unter derselben Adresse und wähle Aus Backup wiederherstellen → Google Drive → deinen Tresor unter Synchronisierte Tresore. Jedes Gerät schreibt seine eigene verschlüsselte Kopie in Drive und führt die anderen zusammen.',
      },
      {
        q: 'Kann Google meine Notizen lesen?',
        a: 'Nein. Backup- und Synchronisierungsdateien werden auf deinem Gerät mit AES-256-GCM verschlüsselt, bevor sie Drive erreichen. Locry greift nur auf seinen eigenen versteckten App-Ordner (drive.appdata) zu und sieht deine anderen Drive-Dateien nicht.',
      },
      {
        q: 'Sendet die KI-Suche meine Notizen irgendwohin?',
        a: 'Nein. Das mehrsprachige Sprachmodell wird einmal heruntergeladen und läuft in einem Web Worker in deinem Browser. Deine Notizen werden nie an einen KI-Dienst gesendet.',
      },
      {
        q: 'Funktioniert es offline?',
        a: 'Ja. Locry ist eine installierbare Web-App (PWA) und funktioniert nach dem ersten Besuch offline. Nur die Drive-Synchronisierung und der erste Modell-Download brauchen Internet.',
      },
      {
        q: 'Welche Browser und Geräte werden unterstützt?',
        a: 'Browser, die Passkeys mit der PRF-Erweiterung unterstützen: Chrome und Edge 118+, Safari 18+. iCloud-Schlüsselbund, Google Passwortmanager, 1Password oder ein Hardware-Sicherheitsschlüssel funktionieren.',
      },
      {
        q: 'Kann ich meine Daten exportieren?',
        a: 'Ja. Lade in den Einstellungen ein verschlüsseltes .locry-Backup als einzelne Datei herunter; es lässt sich auf einem anderen Gerät oder unter einer anderen Adresse mit Passkey oder Wiederherstellungsschlüssel öffnen.',
      },
    ],
  },
  cta: {
    title: 'Deine Notizen bleiben deine.',
    text: 'Die Einrichtung dauert eine Minute: Tresor benennen, Passkey erstellen, Wiederherstellungsschlüssel sichern.',
    start: 'Locry kostenlos nutzen',
    github: 'Quellcode ansehen',
  },
  footer: {
    tagline: 'Ende-zu-Ende-verschlüsselte Notizen und Aufgaben.',
    openSource: 'Open Source',
    madeWith: 'Gebaut mit Angular, Web Crypto und WebAuthn, ohne Server.',
    links: 'Links',
    privacy: 'Datenschutz',
    terms: 'Nutzungsbedingungen',
  },
  support: {
    title: 'Locry unterstützen',
    text: 'Locry ist kostenlos, Open Source und ohne Werbung oder Tracking. Wenn es dir hilft, kannst du die Entwicklung unterstützen.',
    crypto: 'Krypto',
    copy: 'Kopieren',
    copied: 'Kopiert',
  },
  howTo: {
    name: 'Einen verschlüsselten Tresor in Locry erstellen',
    description: 'Schritte zum Erstellen eines Ende-zu-Ende-verschlüsselten Tresors für Notizen und Aufgaben in Locry, der sich mit einem Passkey öffnet.',
    steps: [
      { name: 'Locry öffnen', text: 'Öffne Locry im Browser und klicke auf „Kostenlos starten“.' },
      { name: 'Tresor benennen', text: 'Wähle einen Namen und eine Farbe für den Tresor, zum Beispiel „Privat“.' },
      { name: 'Passkey erstellen', text: 'Erstelle einen Passkey mit Fingerabdruck, Gesicht oder Geräte-PIN.' },
      { name: 'Wiederherstellungsschlüssel sichern', text: 'Speichere den Wiederherstellungsschlüssel im Passwortmanager und bestätige eine seiner Gruppen.' },
    ],
  },
};
