export interface Member {
  id: string;
  membership_number: string;
  full_name: string;
  mobile_number: string;
  date_of_birth?: string | null;
  gender?: string | null;
  address?: string | null;
  district: string;
  village_name?: string | null;
  street_name?: string | null;
  ward_number?: string | null;
  occupation?: string | null;
  blood_group?: string | null;
  volunteer_willingness?: string | null;
  blood_donation_willingness?: string | null;
  skills?: string[] | null;
  other_skills?: string | null;
  voter_id_number?: string | null;
  aadhaar_number?: string | null;
  profile_photo_url?: string | null;
  preferred_language: 'en' | 'ta';
  consent_given: boolean;
  registration_date: string;
  created_at?: string;
  updated_at?: string;
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
