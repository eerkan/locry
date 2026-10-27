import type { Route, Routes } from '@angular/router';
import { DEFAULT_LANG, LANGS } from './core/languages';
import { loadLandingContent } from './features/landing/landing-content';
import { LEGAL_DOCS, legalPath, loadLegalContent } from './features/privacy/privacy-content';
import { vaultStatusGuard } from './core/vault/vault.guard';

export const routes: Routes = [
  // Public, prerendered landing pages: English at /, every other language at /<code>.
  ...LANGS.map(
    (lang): Route => ({
      path: lang === DEFAULT_LANG ? '' : lang,
      pathMatch: 'full',
      data: { lang, ownTitle: true },
      resolve: { content: () => loadLandingContent(lang) },
      loadComponent: () => import('./features/landing/landing-page').then((m) => m.LandingPage),
    }),
  ),
  // Privacy policy and terms of service, prerendered too: /privacy and /terms in English,
  // /<code>/privacy and /<code>/terms in the others.
  ...LEGAL_DOCS.flatMap((doc) =>
    LANGS.map(
      (lang): Route => ({
        path: legalPath(doc, lang).slice(1),
        pathMatch: 'full',
        data: { lang, doc, ownTitle: true },
        resolve: { content: () => loadLegalContent(doc, lang) },
        loadComponent: () => import('./features/privacy/privacy-page').then((m) => m.PrivacyPage),
      }),
    ),
  ),
  // English used to live at /en.
  { path: 'en', pathMatch: 'full', redirectTo: '' },
  {
    path: '',
    loadComponent: () => import('./layout/auth-layout').then((m) => m.AuthLayout),
    children: [
      // /app always redirects to the current vault state's home (setup, unlock or notes).
      { path: 'app', pathMatch: 'full', canMatch: [vaultStatusGuard()], children: [] },
      {
        path: 'setup',
        title: 'setup.title',
        canMatch: [vaultStatusGuard('empty', 'locked')],
        loadComponent: () => import('./features/auth/setup-page').then((m) => m.SetupPage),
      },
      {
        path: 'restore',
        title: 'restore.title',
        canMatch: [vaultStatusGuard('empty', 'locked')],
        loadComponent: () => import('./features/auth/restore-page').then((m) => m.RestorePage),
      },
      {
        path: 'unlock',
        title: 'unlock.title',
        canMatch: [vaultStatusGuard('locked')],
        loadComponent: () => import('./features/auth/unlock-page').then((m) => m.UnlockPage),
      },
      {
        path: 'recover',
        title: 'recover.title',
        canMatch: [vaultStatusGuard('locked')],
        loadComponent: () => import('./features/auth/recover-page').then((m) => m.RecoverPage),
      },
    ],
  },
  {
    path: '',
    canMatch: [vaultStatusGuard('unlocked')],
    loadComponent: () => import('./layout/app-shell').then((m) => m.AppShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'notes' },
      {
        path: 'notes',
        title: 'nav.notes',
        loadComponent: () => import('./features/notes/notes-page').then((m) => m.NotesPage),
        children: [
          {
            path: '',
            loadComponent: () => import('./features/notes/notes-placeholder').then((m) => m.NotesPlaceholder),
          },
          {
            path: ':id',
            loadComponent: () => import('./features/notes/note-editor').then((m) => m.NoteEditor),
          },
        ],
      },
      { path: 'tasks', pathMatch: 'full', redirectTo: 'tasks/inbox' },
      {
        path: 'tasks/:view',
        title: 'nav.tasks',
        loadComponent: () => import('./features/tasks/tasks-page').then((m) => m.TasksPage),
      },
      {
        path: 'search',
        title: 'nav.search',
        loadComponent: () => import('./features/search/search-page').then((m) => m.SearchPage),
      },
      {
        path: 'ask',
        title: 'nav.ask',
        loadComponent: () => import('./features/ask/ask-page').then((m) => m.AskPage),
      },
      {
        path: 'settings',
        title: 'nav.settings',
        loadComponent: () => import('./features/settings/settings-page').then((m) => m.SettingsPage),
      },
    ],
  },
  // Anything else (including '' while locked or empty) is sent to the vault's current home.
  { path: '**', canMatch: [vaultStatusGuard()], children: [] },
];
