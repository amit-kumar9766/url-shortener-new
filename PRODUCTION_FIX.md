# Production Database Fix

## Issue
The error `column "shortUrl" of relation "Urls" contains null values` occurred because:

1. The `utils/index.js` file was referencing `shortUrl` instead of `shortCode`
2. This caused Sequelize to try to add a `shortUrl` column during sync
3. The column was defined as NOT NULL but existing rows would have NULL values

## What Was Fixed

1. ✅ Fixed `models/index.js` to use `NODE_ENV` instead of hardcoded "production"
2. ✅ Fixed `utils/index.js` to use `shortCode` instead of `shortUrl`
3. ✅ Added `.sequelizerc` for proper Sequelize CLI configuration
4. ✅ Added migration scripts to `package.json`

## How to Fix Production

### Option 1: Redeploy (Recommended)

Simply redeploy your application on Render. The fixes will prevent the error from occurring.

**In Render Dashboard:**
1. Go to your service
2. Click "Manual Deploy" → "Deploy latest commit"
3. Make sure your Build Command is: `npm install && npm run migrate`
4. Make sure your Start Command is: `npm start`

### Option 2: Manual Database Fix (If needed)

If the `shortUrl` column was already created in your database, you need to remove it:

```sql
-- Connect to your database and run:
ALTER TABLE "Urls" DROP COLUMN IF EXISTS "shortUrl";
```

You can do this via:
- Render's PostgreSQL dashboard
- Or using `psql` command line

### Verify Environment Variables

Make sure these are set in Render:

```
NODE_ENV=production
DATABASE_URL=<your-neon-db-url>
```

## Prevention

- ✅ Never use `sequelize.sync()` in production
- ✅ Always use migrations for schema changes
- ✅ Keep model field names consistent across the codebase
- ✅ Use proper environment configuration

## Testing Locally

Before deploying, test locally:

```bash
# Set environment
export NODE_ENV=development

# Run migrations
npm run migrate

# Start server
npm start
```
