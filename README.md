# Next.js template

This is a Next.js template with shadcn/ui.

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button";
```

## Database

Local development uses Postgres from Docker:

```bash
bun run db:up
bun run db:migrate
```

Set `LOCAL_DATABASE_URL` in `.env.local` for local CLI/runtime use:

```bash
LOCAL_DATABASE_URL="postgresql://prisma:prisma@127.0.0.1:5433/forest_soccer_tourney?schema=public&sslmode=disable"
```

For staging and production on Neon:

- `DATABASE_URL` should be the pooled Neon URL, usually with `-pooler` in the host.
- `DATABASE_URL_UNPOOLED` or `DIRECT_URL` should be the direct Neon URL for Prisma CLI commands.
