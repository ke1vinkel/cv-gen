# CV Gen

Internal CV builder for students and lecturers. Students can create, score,
preview, duplicate, and export CVs; lecturers can review student CVs.

## Requirements

- Node.js 20.9 or newer
- npm
- Two libSQL databases: one for this application and one for existing users

## Environment variables

Copy `.env.example` to `.env.local` and provide all four values:

```bash
APP_DATABASE_URL=
APP_DATABASE_TOKEN=
AUTH_DATABASE_URL=
AUTH_DATABASE_TOKEN=
```

The application database stores CVs, sessions, password hashes, and login-rate
limits. The auth database must contain these existing tables and relationships:

- `users`: `id`, `name`, `email`, and the legacy `nim` credential column
- `roles`: `id`, `name`
- `user_roles`: `user_id`, `role_id`

Only users assigned the `student` or `lecturer` role can sign in. On a user's
first successful legacy login, the application migrates the credential to a
bcrypt hash in the application database.

## Local setup

```bash
npm ci
npm run db:init
npm run dev
```

Open `http://localhost:3000`.

## Verification

Run the complete release checks before deployment:

```bash
npm run lint
npm run typecheck
npm run test
npm audit --omit=dev
npm run build
```

## Deployment

Deploy as a Node.js Next.js application; static export is not supported because
the application uses authentication, route handlers, cookies, and databases.

1. Configure the four environment variables from `.env.example` on the host.
2. Ensure the build environment can download the configured Geist fonts.
3. Run `npm ci` and `npm run build` during the build phase.
4. Run `npm run start` during the runtime phase.
5. Verify sign-in, CV autosave, duplication, deletion, scoring, and printing in
   a staging environment before directing production traffic.

The application creates and upgrades its application-database schema at
runtime. Database backups and retention remain the deployment operator's
responsibility.
