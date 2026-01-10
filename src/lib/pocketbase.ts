import PocketBase from 'pocketbase';

// PocketBase client instance
const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

// Disable auto cancellation (useful for SSR)
pb.autoCancellation(false);

export default pb;

// Type definitions for our collections
export interface Volunteer {
  id: string;
  username: string;
  email: string;
  discord_id?: string;
  discord_username?: string;
  profile_photo?: string;
  total_minutes: number;
  board?: 'main' | 'makerradio'; // Board/tenant identifier
}

export interface Task {
  id: string;
  task_number: number;
  title: string;
  description: string;
  zone: 'Woodshop' | '3D Printing' | 'Electronics' | 'Laser Cutting' | 'CNC' | 'General' | 'Admin';
  estimated_minutes: number;
  status: 'open' | 'in_progress' | 'completed';
  assigned_to?: string | string[]; // volunteer ID(s) - can be single or array for backwards compatibility
  discord_thread_id?: string;
  created_by: string;
  image?: string; // image filename
  board?: 'main' | 'makerradio'; // Board/tenant identifier
  created: string; // timestamp
  updated: string; // timestamp
}

export interface Completion {
  id: string;
  task: string; // task ID
  volunteer: string; // volunteer ID
  actual_minutes: number;
  completion_note?: string;
  photos?: string[];
  board?: 'main' | 'makerradio'; // Board/tenant identifier
}

export interface Badge {
  id: string;
  volunteer: string; // volunteer ID
  badge_type: '100_hours_club' | 'monthly_top' | 'new_contributor' | 'consistency_award' | 'zone_specialist';
  badge_details?: string;
}

export interface Creation {
  id: string;
  volunteer: string; // volunteer ID
  title: string;
  description: string;
  photos: string[]; // array of photo filenames
  board?: 'main' | 'makerradio'; // Board/tenant identifier
  created: string; // timestamp
  updated: string; // timestamp
}

export interface CourseStep {
  number: number;
  title: string;
  description: string;
  type: 'video' | 'text' | 'task' | 'quiz';
  content: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: '3D Printing' | 'Laser' | 'Electronics' | 'Woodshop' | 'CNC' | 'Vinyl' | 'Custom';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimated_minutes: number;
  icon: string;
  zone_leader?: string;
  sbu_schedule?: string;
  is_sbu: boolean; // true for protected SBU goals
  steps: CourseStep[];
  prerequisites?: string[]; // array of goal IDs
  created_by?: string; // volunteer ID
  board?: 'main' | 'makerradio'; // Board/tenant identifier
  created: string;
  updated: string;
}

export interface GoalProgress {
  id: string;
  volunteer: string; // volunteer ID
  goal: string; // goal ID
  completed_steps: number[]; // array of step numbers
  is_completed: boolean;
  completed_at?: string;
  created: string;
  updated: string;
}

export interface VolunteerHours {
  id: string;
  volunteer: string; // volunteer ID
  task?: string; // task ID (optional)
  description: string; // description of work done
  hours: number; // hours worked
  date: string; // date of work (YYYY-MM-DD format)
  board?: 'main' | 'makerradio'; // Board/tenant identifier
  created_by: string; // volunteer ID who created this entry
  created: string;
  updated: string;
}
