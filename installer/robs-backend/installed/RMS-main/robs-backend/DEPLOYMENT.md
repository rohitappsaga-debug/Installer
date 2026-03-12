# Deployment Guide

## Production Flow

The standard production deployment sequence is:

1.  **Build**: Compile the TypeScript code.
2.  **Migrate**: Apply pending database migrations.
3.  **Start**: Launch the application.

Command:
```bash
npm run start:prod
```

This command runs: `npm run build && npm run migrate:prod && npm run start`

## Database Setup

We use Prisma for database management.

### Migration Commands

-   **`npm run db:migrate`**: For development. Creates new migrations based on schema changes.
-   **`npm run migrate:prod`**: For production. Applies existing migrations. **NEVER** use `db:migrate` in production as it may reset the database.

### Fresh Server Setup (Recommended)

1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Start the application: `npm run start:prod` (or `npm run dev`)
4.  Navigate to `http://localhost:3002` (Installer Port).
5.  Follow the Web Installer Wizard to configure the database, environment, and initial admin user.

**Note:** The installer will automatically create the `.env` file and initialize the database.

### Manual Setup (Legacy)


### Existing Server Deployment

**⚠️ CRITICAL WARNING for First-Time Setup on Existing Data:**

If you are deploying this codebase to a server that **already has a database with data**, but has **never run Prisma migrations before**:

1.  **DO NOT** run `npm run migrate:prod` immediately. It might fail or try to reset the DB if it sees a drift.
2.  You must first "baseline" the database to tell Prisma that the initial migration is already applied.
3.  Run this command **once**:
    ```bash
    npx prisma migrate resolve --applied 000_init
    ```
4.  After baselining, you can safely run:
    ```bash
    npm run migrate:prod
    ```
    (This will say "No pending migrations" or apply only *new* migrations).
