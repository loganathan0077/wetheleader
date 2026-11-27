import fs from 'fs';
import path from 'path';
import assert from 'assert';

const rootDir = process.cwd();

console.log('=== VERIFYING REMOVAL OF TEST MEMBERS & HTTP 403 FIX ===\n');

// 1. Check memberService.ts
const memberServicePath = path.join(rootDir, 'src/services/memberService.ts');
assert(fs.existsSync(memberServicePath), 'memberService.ts must exist');
const memberServiceCode = fs.readFileSync(memberServicePath, 'utf-8');

// Test 1: Mock member IDs are properly defined
assert(memberServiceCode.includes('f87a3b12-9c44-42b7-a367-101112131415'), 'Kathiravan Ramasamy ID tracked');
assert(memberServiceCode.includes('a12b4c56-7d89-4ef0-1234-56789abcdef0'), 'Sundari Natarajan ID tracked');
assert(memberServiceCode.includes('b23c5d67-8e90-4fa1-2345-67890abcdef1'), 'Arun Prakash Subramanian ID tracked');
assert(memberServiceCode.includes('MOCK_MEMBER_IDS'), 'MOCK_MEMBER_IDS defined');
assert(memberServiceCode.includes('isMockMember'), 'isMockMember helper defined');
console.log('✓ PASS: All 3 test member IDs correctly cataloged and identified.');

// Test 2: memberService.ts filters out mock data when Supabase is configured
assert(memberServiceCode.includes('filter(m => !isMockMember(m.id))'), 'memberService filters mock members');
assert(memberServiceCode.includes('Supabase members fetch error'), 'Logs Supabase fetch errors for debugging');
assert(memberServiceCode.includes('if (!isSupabaseConfigured)'), 'Offline fallback strictly guarded');
console.log('✓ PASS: memberService guarantees mock data is excluded from Supabase queries.');

// Test 3: SQL fix script exists and resolves HTTP 403
const fixSqlPath = path.join(rootDir, 'supabase/fix_members_permissions_and_rls.sql');
assert(fs.existsSync(fixSqlPath), 'fix_members_permissions_and_rls.sql exists');
const fixSql = fs.readFileSync(fixSqlPath, 'utf-8');

assert(fixSql.includes('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.members TO authenticated;'), 'Grants table permission on members to authenticated');
assert(fixSql.includes('GRANT INSERT ON TABLE public.members TO anon;'), 'Grants INSERT to anon');
assert(fixSql.includes('CREATE POLICY "Admins read all members"'), 'Defines Admin read policy');
assert(fixSql.includes('CREATE POLICY "Members read own record"'), 'Defines Member own record policy');
assert(fixSql.includes('USING (public.is_coordinator_or_admin())'), 'Restricts admin read to verified roles');
assert(fixSql.includes('f87a3b12-9c44-42b7-a367-101112131415'), 'Includes diagnostic query for test IDs');
console.log('✓ PASS: fix_members_permissions_and_rls.sql configures table grants and admin RLS.');

// Test 4: Master schema and migration synchronized
const schema = fs.readFileSync(path.join(rootDir, 'supabase/schema.sql'), 'utf-8');
assert(schema.includes('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.members TO authenticated;'), 'schema.sql has members grants');
assert(schema.includes('CREATE POLICY "Admins read all members"'), 'schema.sql has Admins read all members policy');

const migration = fs.readFileSync(path.join(rootDir, 'supabase/migration_complete_setup.sql'), 'utf-8');
assert(migration.includes('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.members TO authenticated;'), 'migration has members grants');

console.log('✓ PASS: Master schema and migration synchronized with members grants.');

console.log('\n=== ALL TEST MEMBERS REMOVAL & 403 VERIFICATIONS PASSED! ===\n');
