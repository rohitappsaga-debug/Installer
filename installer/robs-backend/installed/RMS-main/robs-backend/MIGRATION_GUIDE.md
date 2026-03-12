# Database Migration Guide

## Important Note

**New Installation?** The [Web Installer](./README.md#quick-start-web-installer) automatically handles the initial database setup and migration. You don't need to run these commands manually unless you are a developer or setting up a custom environment.

Prisma migrations need to be created interactively. Follow these steps to create the initial migration:

## Steps to Create Database Migrations

### 1. Ensure Database is Running
Make sure PostgreSQL is running and accessible.

### 2. Update .env File
Ensure your `.env` file has the correct `DATABASE_URL`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/restaurant_db?schema=public"
```

### 3. Generate Prisma Client
```bash
cd robs-backend
npm run db:generate
```

### 4. Create Initial Migration
```bash
# This will create the migration files
npm run db:migrate
```

If you get an interactive prompt, name it `init` or `initial_schema`.

### 5. Apply Migration to Database
The `db:migrate` command should automatically apply the migration. If not:
```bash
npx prisma migrate deploy
```

### 6. Verify Migration
```bash
# Check migration status
npx prisma migrate status

# View database in Prisma Studio
npm run db:studio
```

## Alternative: Use db:push for Development

For development/testing, you can use `db:push` which doesn't create migration files:

```bash
npm run db:push
```

**Note:** `db:push` is for development only. Use `db:migrate` for production.

## After Migration

1. Seed the database:
```bash
npm run db:seed
```

2. Verify everything works:
```bash
npm run dev
```

## Troubleshooting

### Error: Migration Already Exists
If the database already has tables but no migration files:
1. Use `prisma migrate resolve --applied <migration-name>` to mark as applied
2. Or use `db:push` for development and create proper migrations later

### Error: Database Connection Failed
- Check PostgreSQL is running
- Verify DATABASE_URL in .env is correct
- Ensure database `restaurant_db` exists

### Error: Schema Drift
If your database schema doesn't match Prisma schema:
```bash
npx prisma migrate reset  # WARNING: This deletes all data
npm run db:migrate
npm run db:seed
```

