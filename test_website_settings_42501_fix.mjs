import fs from 'fs';
import path from 'path';
import assert from 'assert';

const rootDir = process.cwd();

console.log('=== VERIFYING WEBSITE_SETTINGS 42501 PERMISSION DENIED FIX ===\n');

// 1. Check fix_website_settings_permissions.sql
const fixSqlPath = path.join(rootDir, 'supabase/fix_website_settings_permissions.sql');
assert(fs.existsSync(fixSqlPath), 'fix_website_settings_permissions.sql must exist');
const fixSql = fs.readFileSync(fixSqlPath, 'utf-8');

// Table Grants Check
assert(fixSql.includes('GRANT USAGE ON SCHEMA public TO anon, authenticated;'), 'Grants schema usage');
assert(fixSql.includes('GRANT SELECT ON TABLE public.website_settings TO anon, authenticated;'), 'Grants SELECT to anon & authenticated');
assert(fixSql.includes('GRANT INSERT, UPDATE, DELETE ON TABLE public.website_settings TO authenticated;'), 'Grants INSERT, UPDATE, DELETE to authenticated');
console.log('✓ PASS: Table-level privileges granted to prevent PostgreSQL error 42501.');

// Discrete RLS Policies Check
assert(fixSql.includes('CREATE POLICY "Public read website_settings"'), 'Defines Public read policy');
assert(fixSql.includes('CREATE POLICY "Admins insert website_settings"'), 'Defines Admins insert policy');
assert(fixSql.includes('CREATE POLICY "Admins update website_settings"'), 'Defines Admins update policy');
assert(fixSql.includes('CREATE POLICY "Admins delete website_settings"'), 'Defines Admins delete policy');
assert(fixSql.includes('WITH CHECK (public.is_admin())'), 'Enforces is_admin() on INSERT/UPDATE');
assert(fixSql.includes('USING (public.is_admin())'), 'Enforces is_admin() on UPDATE/DELETE');
assert(!fixSql.includes('CREATE POLICY "Admins update website_settings"\nON public.website_settings FOR UPDATE\nTO authenticated\nUSING (true)'), 'No open write policy');
console.log('✓ PASS: Discrete, secure admin-only RLS policies configured.');

// Admin Role & Self-healing Check
assert(fixSql.includes('CREATE OR REPLACE FUNCTION public.is_admin()'), 'Defines is_admin()');
assert(fixSql.includes('public.setup_initial_admin'), 'Provides setup_initial_admin() procedure');
assert(fixSql.includes("INSERT INTO public.profiles"), 'Auto-syncs auth.users into profiles');
console.log('✓ PASS: Authoritative admin role verification & auto-elevation configured.');

// 2. Check settingsService.ts
const settingsServicePath = path.join(rootDir, 'src/services/settingsService.ts');
const settingsServiceCode = fs.readFileSync(settingsServicePath, 'utf-8');
assert(settingsServiceCode.includes('supabase.auth.getSession()'), 'settingsService checks active session before saving');
assert(settingsServiceCode.includes('.from(\'profiles\')'), 'settingsService verifies profile role in database');
assert(settingsServiceCode.includes('.update(payload)'), 'settingsService uses update on singleton key');
console.log('✓ PASS: settingsService checks auth session and verifies database admin role.');

// 3. Check schema.sql and migration_complete_setup.sql
const schemaPath = path.join(rootDir, 'supabase/schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');
assert(schema.includes('GRANT SELECT ON TABLE public.website_settings TO anon, authenticated;'), 'schema.sql has website_settings grant');
assert(schema.includes('GRANT INSERT, UPDATE, DELETE ON TABLE public.website_settings TO authenticated;'), 'schema.sql has authenticated write grant');
assert(schema.includes('CREATE POLICY "Admins update website_settings"'), 'schema.sql has discrete Admins update policy');

const migrationPath = path.join(rootDir, 'supabase/migration_complete_setup.sql');
const migration = fs.readFileSync(migrationPath, 'utf-8');
assert(migration.includes('GRANT SELECT ON TABLE public.website_settings TO anon, authenticated;'), 'migration has website_settings grant');
assert(migration.includes('GRANT INSERT, UPDATE, DELETE ON TABLE public.website_settings TO authenticated;'), 'migration has authenticated write grant');

console.log('✓ PASS: Master schema and migration files synchronized with 42501 fix.');

console.log('\n=== ALL 42501 FIX VERIFICATIONS PASSED SUCCESSFULLY! ===\n');
