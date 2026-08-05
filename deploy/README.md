# Production deployment

The studio is served as a static Vite application from
`/var/www/uiforma-mockup-studio` on the UIForma droplet.

Build with `corepack pnpm build`, deploy the contents of `dist/` atomically, and
install `nginx-studio.uiforma.com.conf` as the Nginx site configuration. The TLS
certificate is managed by Certbot for `studio.uiforma.com`.
