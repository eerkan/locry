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
