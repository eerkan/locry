import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Passkeys (WebAuthn) do not accept IP addresses as relying-party IDs, and browser data is
// kept per origin, so always use http://localhost:<port>. The production server already
// redirects; this covers the dev server and anything else that serves the app on an IP.
if (/^(127(\.\d{1,3}){3}|\[::1\])$/.test(location.hostname)) {
  const url = new URL(location.href);
  url.hostname = 'localhost';
  location.replace(url);
} else {
  bootstrapApplication(App, appConfig).catch((err) => console.error(err));
}
