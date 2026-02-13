# Database Migrations

## How to Apply Migrations

To apply the community notice table migration, run the following SQL in your Supabase SQL editor:

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `20240101000000_create_community_notices_table.sql`
4. Click "Run" to execute the migration

## Migration Files

- `20240101000000_create_community_notices_table.sql` - Creates the community_notices table with necessary indexes and RLS policies

## Important Notes

After running the migration, the notices feature should work properly in the admin dashboard.