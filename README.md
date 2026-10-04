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
