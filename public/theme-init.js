// Applies the saved light/dark theme before the first paint, so prerendered pages do not flash.
(function () {
  try {
    var prefs = JSON.parse(localStorage.getItem('locry.preferences') || '{}');
    var theme = prefs.theme || 'system';
    var dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  } catch (e) {}
})();

// Installed as an app (home screen, desktop), Locry opens on the app: its lock screen, setup or
// notes. The landing pages are for the web; an install can still land on one (iOS adds the page
// it was on, older installs keep their old start address). Runs before the first paint, so the
// landing page never flashes. Keep the codes in line with LANGS in src/app/core/languages.ts.
(function () {
  try {
    var installed =
      navigator.standalone === true ||
      matchMedia('(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui), (display-mode: window-controls-overlay)').matches;
    if (!installed) return;
    var base = new URL(document.baseURI).pathname;
    var path = location.pathname.slice(base.length).replace(/(\/|\.html)$/, '');
    var landing = ['', 'en', 'tr', 'zh', 'es', 'ar', 'pt', 'id', 'fr', 'ja', 'ru', 'de'];
    if (location.pathname.indexOf(base) === 0 && landing.indexOf(path) >= 0) location.replace(base + 'app');
  } catch (e) {}
})();
