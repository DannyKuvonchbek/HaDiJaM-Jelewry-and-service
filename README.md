# Hadijam Backend

NestJS + GraphQL + MongoDB backend for the Hadijam jewelry marketplace and service platform.

## Setup

1. Install Node.js 20 or newer and MongoDB.
2. Copy `.env.example` to `.env` and set a private `JWT_SECRET`.
3. Run `npm install`, then `npm run start:dev`.
4. GraphQL Playground is available at `/graphql` in development.

The implementation follows the supplied ER model. Each domain has its own Nest module and schema folder; database configuration is isolated under `src/database`.

The ER document labels several fields as `enum` without listing their allowed values. Those values are intentionally left open until the product rules are confirmed.

The ER diagram shows `mobilemessages` without any fields. It is not registered as a feature schema until its intended fields and behavior are specified.

## Admin and seller approval

Run `npm run admin:create` in an interactive terminal to provision a separate administrator. Seller signup requires private ID/business documents and administrator approval. See [setup, private storage, MongoDB replica-set requirements and SMS gateway configuration](docs/ADMIN_SELLER_SETUP.md).

## Authentication and security

Session setup: [docs/AUTH_SESSIONS.md](docs/AUTH_SESSIONS.md).
Verified findings and remaining checks: [docs/SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md).

## Production deployment

Use Node.js 20 or newer. Configure a MongoDB Atlas or replica-set `MONGODB_URI`, a cryptographically random `JWT_SECRET` of at least 32 characters, `NODE_ENV=production`, and `PORT=2002`. Production CORS and browser-session checks currently allow only `https://hadijam.com` and `https://www.hadijam.com`; update `src/components/auth/sessions/auth-security.ts` before using a different frontend domain. Put the API behind an HTTPS reverse proxy and forward to `127.0.0.1:2002`.

Run `npm ci`, `npm run build`, then `npm run start:prod`. Keep `PRIVATE_DOCUMENT_DIR` on a persistent private volume outside `uploads/`; back up that volume and MongoDB. Public uploads also need persistent storage or a durable object store. The authentication rate limiter is process-local, so run one API process unless the limiter is moved to shared storage. SMS is optional and remains disabled without its gateway configuration. `AI_API_KEY` is only needed for provider-backed admin product analysis; the public catalog concierge works from site data without an AI provider.
