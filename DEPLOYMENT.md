# Deployment Guide

## Render Deployment Setup

### Environment Variables

Make sure to set these environment variables in your Render dashboard:

```
NODE_ENV=production
DATABASE_URL=<your-postgres-connection-string>
PORT=3000
```

### Build Command

In Render, set your build command to:

```bash
npm install && npm run migrate
```

### Start Command

```bash
npm start
```

### Important Notes

1. **Never use `sequelize.sync()` in production** - it can cause data loss and schema conflicts
2. Always use migrations to manage database schema changes
3. Run migrations before starting the server

### Running Migrations Manually

If you need to run migrations manually:

```bash
npm run migrate
```

To rollback the last migration:

```bash
npm run migrate:undo
```

### Troubleshooting

If you see errors like "column contains null values" when adding a NOT NULL column:

1. The table already has data
2. You need to either:
   - Add a default value in the migration
   - Make the column nullable first, populate data, then make it NOT NULL
   - Or clear the table data (only in development!)

### Current Migration Status

Your current migrations handle:
- User table creation
- URL table creation with foreign keys
- Adding expiryDate column
- Adding password column
- Adding soft delete (deletedAt)
- Adding plan to users

All migrations are properly structured to work with existing data.
