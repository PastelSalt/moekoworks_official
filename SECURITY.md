# Security

Moeko Works has a public site, a contact form and a private admin panel, so security reports are very welcome.

## Reporting a problem

Please **don't open a public issue** for a vulnerability. Instead:

- use GitHub's [private vulnerability reporting](https://github.com/PastelSalt/moekoworks_official/security/advisories/new), or
- write through the contact form: <https://moekoworks.vercel.app/contact>.

Include what you found, how to reproduce it, and what it could affect. You'll get a reply within a few days.

## Scope

In scope: the site at <https://moekoworks.vercel.app> and this repository — the contact form, the visit-tracking
endpoint (`/api/track`), and the admin panel (`/admin`).

Out of scope: denial-of-service and volume testing, social engineering, and the third-party services the site uses
(Vercel, Neon, Cloudinary), which have their own programs.

## How the site protects people

- No accounts and no cookies for visitors; visitor counting uses a hash that changes every day, and IP addresses are
  never stored.
- The contact form uses a honeypot, a signed minimum fill time and per-visitor rate limits.
- The admin password is hashed with Argon2id, must be changed at first sign-in, and repeated failures lock sign-in for
  15 minutes.
- Nothing is hard-deleted from the admin panel: deleted items are archived and can be restored.
