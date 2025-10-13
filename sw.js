// Tyhjä skeleton (ei välimuistia). Jätä paikalleen tulevaa offline/push-laajennusta varten.
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => self.clients.claim());
