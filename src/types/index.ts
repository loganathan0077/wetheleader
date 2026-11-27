export interface Member {
  id: string;
  membership_number: string;
  membership_id?: string;
  auth_user_id?: string | null;
  full_name: string;
  tamil_name?: string | null;
  mobile_number: string;
  phone?: string;
  email?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  address?: string | null;
  residential_address?: string | null;
  district: string;
  village_name?: string | null;
  village?: string | null;
  street_name?: string | null;
  street?: string | null;
  ward_number?: string | null;
  occupation?: string | null;
  blood_group?: string | null;
  volunteer_willingness?: string | null;
  willing_to_volunteer?: string | null;
  blood_donation_willingness?: string | null;
  willing_to_donate_blood?: string | null;
  skills?: string[] | null;
  other_skills?: string | null;
  hobbies?: string | null;
  voter_id_number?: string | null;
  voter_id?: string | null;
  aadhaar_number?: string | null;
  profile_photo_url?: string | null;
  photo_path?: string | null;
  approval_status?: 'pending' | 'approved' | 'rejected';
  preferred_language: 'en' | 'ta';
  consent_given: boolean;
  registration_date: string;
  created_at?: string;
  updated_at?: string;
}

export interface Activity {
  id: string;
  title_tamil: string;
  title_english: string;
  description_tamil?: string | null;
  description_english?: string | null;
  image_path?: string | null;
  activity_date: string;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  role: 'admin' | 'coordinator' | 'member';
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MembershipIdLog {
  id: string;
  member_id: string;
  action: string;
  performed_by: string;
  created_at: string;
}

export interface MemberFormData {
  full_name: string;
  mobile_number: string;
  date_of_birth: string;
  gender: string;
  address: string;
  district: string;
  village_name: string;
  street_name: string;
  ward_number: string;
  occupation: string;
  blood_group: string;
  volunteer_willingness: string;
  blood_donation_willingness: string;
  skills: string[];
  other_skills: string;
  voter_id_number: string;
  aadhaar_number: string;
  profile_photo_url: string;
  consent_given: boolean;
}

export interface DashboardStats {
  totalMembers: number;
  todayRegistrations: number;
  thisMonthRegistrations: number;
  uniqueVillages: number;
  uniqueWards: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role?: string;
}
