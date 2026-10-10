# HaDiJaM social sign-in setup

Google and Facebook sign-in use an authorization-code callback on the backend. Provider secrets must stay in the backend environment; never put them in the frontend `.env` file or send them in chat.

## Authorized callback URLs

Register these exact URLs in each provider console:

- Google: `https://hadijam.com/auth/oauth/google/callback`
- Facebook: `https://hadijam.com/auth/oauth/facebook/callback`

For local development with the backend on port 2002, use `http://localhost:2002/auth/oauth/google/callback` and `http://localhost:2002/auth/oauth/facebook/callback` in a separate development OAuth app.

## Backend environment

Set `PUBLIC_API_ORIGIN`, `PUBLIC_WEB_ORIGIN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `FACEBOOK_GRAPH_VERSION`, and `FACEBOOK_REDIRECT_URI` on the backend host. `PUBLIC_WEB_ORIGIN` should match the website origin exactly. Restart and rebuild the backend after changing these values.

The backend verifies the provider profile, checks the OAuth state cookie, creates or finds the member by provider ID, and issues a single-use 90-second sign-in ticket. The browser exchanges that ticket for the normal HaDiJaM session. No provider access token is stored. Social accounts start as regular users; they can add a phone number and other profile details later.
