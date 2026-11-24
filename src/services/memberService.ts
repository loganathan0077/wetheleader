import { Member, MemberFormData, DashboardStats } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const LOCAL_STORAGE_KEY = 'wtl_members_data';
const COUNTER_STORAGE_KEY = 'wtl_membership_counters';

// Initial sample seed records for Kinathukadavu area to demonstrate full features
const INITIAL_SAMPLE_MEMBERS: Member[] = [
  {
    id: 'f87a3b12-9c44-42b7-a367-101112131415',
    membership_number: 'WTL-2026-00001',
    full_name: 'கதிரவன் ராமசாமி (Kathiravan Ramasamy)',
    mobile_number: '9842100001',
    date_of_birth: '1988-06-14',
    gender: 'Male',
    address: '14, காந்தி வீதி, கிணத்துக்கடவு',
    district: 'Coimbatore',
    village_name: 'Kinathukadavu',
    ward_number: 'Ward 4',
    occupation: 'Agriculture / Farmer',
    preferred_language: 'ta',
    consent_given: true,
    registration_date: new Date(Date.now() - 3600000 * 48).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: 'a12b4c56-7d89-4ef0-1234-56789abcdef0',
    membership_number: 'WTL-2026-00002',
    full_name: 'சுந்தரி நடராஜன் (Sundari Natarajan)',
    mobile_number: '9842100002',
    date_of_birth: '1994-09-22',
    gender: 'Female',
    address: '28, மெயின் ரோடு, கோடங்கிபாளையம்',
    district: 'Coimbatore',
    village_name: 'Kodangipalayam',
    ward_number: 'Ward 2',
    occupation: 'Teacher',
    preferred_language: 'ta',
    consent_given: true,
    registration_date: new Date(Date.now() - 3600000 * 24).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'b23c5d67-8e90-4fa1-2345-67890abcdef1',
    membership_number: 'WTL-2026-00003',
    full_name: 'Arun Prakash Subramanian',
    mobile_number: '9842100003',
    date_of_birth: '1996-03-10',
    gender: 'Male',
    address: '5/12, Kovai Road, Sokkanur',
    district: 'Coimbatore',
    village_name: 'Sokkanur',
    ward_number: 'Ward 5',
    occupation: 'Small Business Owner',
    preferred_language: 'en',
    consent_given: true,
    registration_date: new Date().toISOString(),
    created_at: new Date().toISOString()
  }
];

// Helper: load local members
function getLocalMembers(): Member[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_MEMBERS));
      return INITIAL_SAMPLE_MEMBERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local members:', e);
    return INITIAL_SAMPLE_MEMBERS;
  }
}

// Helper: save local members
function saveLocalMembers(members: Member[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(members));
  } catch (e) {
    console.error('Error saving local members:', e);
  }
}

// Helper: Generate next local membership number
function generateLocalMembershipNumber(): string {
  const currentYear = new Date().getFullYear();
  let counters: Record<string, number> = {};
  try {
    const raw = localStorage.getItem(COUNTER_STORAGE_KEY);
    if (raw) counters = JSON.parse(raw);
  } catch {}

  const currentSeq = counters[currentYear] || 3; // start after sample records
  const nextSeq = currentSeq + 1;
  counters[currentYear] = nextSeq;
  localStorage.setItem(COUNTER_STORAGE_KEY, JSON.stringify(counters));

  return `WTL-${currentYear}-${String(nextSeq).padStart(5, '0')}`;
}

export const memberService = {
  // Check if mobile number is already registered
  async checkMobileExists(mobile: string, excludeId?: string): Promise<boolean> {
    const cleaned = mobile.trim();
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('members').select('id').eq('mobile_number', cleaned);
        if (excludeId) query = query.neq('id', excludeId);
        const { data, error } = await query;
        if (!error && data && data.length > 0) return true;
        return false;
      } catch {
        // fallback to local check
      }
    }
    const local = getLocalMembers();
    return local.some(m => m.mobile_number === cleaned && m.id !== excludeId);
  },

  // Register a new member
  async registerMember(formData: MemberFormData, preferredLang: 'en' | 'ta'): Promise<Member> {
    // 1. Check duplicate mobile
    const exists = await this.checkMobileExists(formData.mobile_number);
    if (exists) {
      throw new Error('DUPLICATE_MOBILE');
    }

    // Try Supabase first if configured
    if (isSupabaseConfigured && supabase) {
      try {
        // Generate atomic number via Supabase RPC function
        let membershipNumber = '';
        const { data: rpcNum, error: rpcError } = await supabase.rpc('generate_next_membership_number');
        if (!rpcError && rpcNum) {
          membershipNumber = rpcNum;
        } else {
          membershipNumber = generateLocalMembershipNumber();
        }

        const newRecord = {
          membership_number: membershipNumber,
          full_name: formData.full_name.trim(),
          mobile_number: formData.mobile_number.trim(),
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender || null,
          address: formData.address.trim() || null,
          district: 'Coimbatore',
          village_name: formData.village_name.trim() || null,
          ward_number: formData.ward_number.trim() || null,
          occupation: formData.occupation.trim() || null,
          voter_id_number: formData.voter_id_number.trim() || null,
          aadhaar_number: formData.aadhaar_number.trim() || null,
          profile_photo_url: formData.profile_photo_url || null,
          preferred_language: preferredLang,
          consent_given: formData.consent_given,
          registration_date: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('members')
          .insert([newRecord])
          .select()
          .single();

        if (error) {
          console.warn('Supabase insert failed, storing locally:', error);
        } else if (data) {
          // Also sync to local storage for quick offline access
          const local = getLocalMembers();
          saveLocalMembers([data as Member, ...local]);
          return data as Member;
        }
      } catch (err) {
        console.warn('Supabase exception, falling back to local storage:', err);
      }
    }

    // Local Storage flow (guarantees 100% immediate functionality)
    const membershipNumber = generateLocalMembershipNumber();
    const newMember: Member = {
      id: crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      membership_number: membershipNumber,
      full_name: formData.full_name.trim(),
      mobile_number: formData.mobile_number.trim(),
      date_of_birth: formData.date_of_birth || null,
      gender: formData.gender || null,
      address: formData.address.trim() || null,
      district: 'Coimbatore',
      village_name: formData.village_name.trim() || null,
      ward_number: formData.ward_number.trim() || null,
      occupation: formData.occupation.trim() || null,
      voter_id_number: formData.voter_id_number.trim() || null,
      aadhaar_number: formData.aadhaar_number.trim() || null,
      profile_photo_url: formData.profile_photo_url || null,
      preferred_language: preferredLang,
      consent_given: formData.consent_given,
      registration_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const members = getLocalMembers();
    const updated = [newMember, ...members];
    saveLocalMembers(updated);
    return newMember;
  },

  // Get member by ID
  async getMemberById(id: string): Promise<Member | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('members').select('*').eq('id', id).single();
        if (!error && data) return data as Member;
      } catch {}
    }
    const local = getLocalMembers();
    return local.find(m => m.id === id || m.membership_number === id) || null;
  },

  // Get all members for Admin
  async getAllMembers(): Promise<Member[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .order('registration_date', { ascending: false });
        if (!error && data) {
          saveLocalMembers(data as Member[]);
          return data as Member[];
        }
      } catch {}
    }
    return getLocalMembers();
  },

  // Update member details
  async updateMember(id: string, updates: Partial<Member>): Promise<Member> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('members')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (!error && data) {
          const local = getLocalMembers().map(m => m.id === id ? (data as Member) : m);
          saveLocalMembers(local);
          return data as Member;
        }
      } catch {}
    }

    const local = getLocalMembers();
    const index = local.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Member not found');
    const updated: Member = {
      ...local[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    local[index] = updated;
    saveLocalMembers(local);
    return updated;
  },

  // Delete member record
  async deleteMember(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('members').delete().eq('id', id);
        if (error) console.error('Supabase delete error:', error);
      } catch {}
    }

    const local = getLocalMembers();
    const filtered = local.filter(m => m.id !== id);
    saveLocalMembers(filtered);
    return true;
  },

  // Calculate dashboard statistics dynamically from member records
  async getDashboardStats(): Promise<DashboardStats> {
    const members = await this.getAllMembers();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let todayCount = 0;
    let thisMonthCount = 0;
    const villageSet = new Set<string>();
    const wardSet = new Set<string>();

    members.forEach(m => {
      const regDateStr = m.registration_date ? m.registration_date.split('T')[0] : '';
      if (regDateStr === todayStr) todayCount++;
      if (regDateStr.startsWith(currentYearMonth)) thisMonthCount++;

      if (m.village_name && m.village_name.trim()) {
        villageSet.add(m.village_name.trim().toLowerCase());
      }
      if (m.ward_number && m.ward_number.trim()) {
        wardSet.add(m.ward_number.trim().toLowerCase());
      }
    });

    return {
      totalMembers: members.length,
      todayRegistrations: todayCount,
      thisMonthRegistrations: thisMonthCount,
      uniqueVillages: villageSet.size,
      uniqueWards: wardSet.size
    };
  }
};
