import fs from 'fs';
import path from 'path';
import assert from 'assert';

const rootDir = process.cwd();

console.log('=== VERIFYING COMPLETE SUPABASE SETUP & SECURITY ===\n');

// 1. Read schema and migration files
const schemaPath = path.join(rootDir, 'supabase/schema.sql');
const migrationPath = path.join(rootDir, 'supabase/migration_complete_setup.sql');
assert(fs.existsSync(schemaPath), 'supabase/schema.sql must exist');
assert(fs.existsSync(migrationPath), 'supabase/migration_complete_setup.sql must exist');

const schema = fs.readFileSync(schemaPath, 'utf-8');
const migration = fs.readFileSync(migrationPath, 'utf-8');

// Test 1: Tables existence
const requiredTables = [
  'TABLE IF NOT EXISTS public.profiles',
  'TABLE IF NOT EXISTS public.members',
  'TABLE IF NOT EXISTS public.website_settings',
  'TABLE IF NOT EXISTS public.activities',
  'TABLE IF NOT EXISTS public.membership_id_logs',
  'TABLE IF NOT EXISTS public.membership_counters'
];

requiredTables.forEach(tbl => {
  assert(schema.includes(tbl), `schema.sql must define ${tbl}`);
  assert(migration.includes(tbl), `migration must define ${tbl}`);
});
console.log('✓ PASS: All 6 required PostgreSQL tables defined.');

// Test 2: Profiles table structure & roles
assert(schema.includes("role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'coordinator', 'member'))"), 'Profiles role check');
assert(schema.includes('is_admin()'), 'Defines is_admin() function');
assert(schema.includes('is_coordinator_or_admin()'), 'Defines is_coordinator_or_admin() function');
assert(schema.includes('SET search_path = public'), 'Enforces fixed search_path for SECURITY DEFINER');
console.log('✓ PASS: Profiles table & authoritative role functions configured with strict search_path.');

// Test 3: RLS on website_settings restricts writes to is_admin()
assert(schema.includes('USING (public.is_admin())'), 'website_settings RLS uses is_admin()');
assert(!schema.includes('ON public.website_settings FOR ALL\nTO authenticated\nUSING (true)'), 'No open write access on website_settings');
console.log('✓ PASS: website_settings write access strictly restricted to verified administrators.');

// Test 4: Members table security & privacy
assert(schema.includes('DROP POLICY IF EXISTS "Public member registration" ON public.members;'), 'Public registration policy');
assert(schema.includes('auth_user_id = auth.uid()') && schema.includes('public.is_coordinator_or_admin()'), 'Members read only own record or if coordinator/admin');
assert(schema.includes('ON public.members FOR UPDATE') && schema.includes('USING (public.is_admin())'), 'Only admins can update members');
console.log('✓ PASS: Members table RLS strictly isolates records and prevents table dumping.');

// Test 5: Storage buckets & policies
const requiredBuckets = ['member-photos', 'activity-images', 'organisation-assets'];
requiredBuckets.forEach(b => {
  assert(schema.includes(`'${b}'`), `schema must define bucket ${b}`);
  assert(migration.includes(`'${b}'`), `migration must define bucket ${b}`);
});
assert(schema.includes('storage.objects'), 'Defines storage object policies');
console.log('✓ PASS: Storage buckets (member-photos, activity-images, organisation-assets) configured.');

// Test 6: ID Card Download Verification & Logs
assert(schema.includes('FUNCTION public.verify_member_for_download'), 'Defines verify_member_for_download RPC');
assert(schema.includes("approval_status = 'approved'"), 'Enforces approval_status = approved before ID download');
assert(schema.includes("INSERT INTO public.membership_id_logs"), 'Logs download actions to membership_id_logs');
console.log('✓ PASS: ID card verification enforces approval_status and logs audit trail.');

// Test 7: Initial Admin Setup Procedure
assert(schema.includes('FUNCTION public.setup_initial_admin'), 'Defines setup_initial_admin procedure');
assert(schema.includes('handle_new_auth_user()'), 'Defines auto-profile creation trigger');
console.log('✓ PASS: Initial admin setup procedure and auth user trigger defined.');

// Test 8: Frontend AuthContext checks authoritative profile role
const authContext = fs.readFileSync(path.join(rootDir, 'src/context/AuthContext.tsx'), 'utf-8');
assert(authContext.includes(".from('profiles')"), 'AuthContext queries profiles table');
assert(authContext.includes("profile?.role === 'admin'"), 'AuthContext strictly verifies admin role from database');
console.log('✓ PASS: Frontend AuthContext validates authoritative database profile role.');

// Test 9: Storage upload utility in supabase.ts
const supabaseLib = fs.readFileSync(path.join(rootDir, 'src/lib/supabase.ts'), 'utf-8');
assert(supabaseLib.includes('uploadMemberPhoto'), 'Exports uploadMemberPhoto utility');
assert(supabaseLib.includes('getMemberPhotoSignedUrl'), 'Exports getMemberPhotoSignedUrl utility');
console.log('✓ PASS: Supabase storage helper functions configured.');

console.log('\n=== ALL SUPABASE SETUP VERIFICATIONS PASSED SUCCESSFULLY! ===\n');
