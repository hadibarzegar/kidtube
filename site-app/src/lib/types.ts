export interface ChildProfile {
  id: string
  name: string
  avatar: string
  age: number
  maturity_level: string
  screen_time_limit_min: number
  search_disabled: boolean
  autoplay_disabled: boolean
  watch_history_paused: boolean
  search_history_paused: boolean
  has_passcode: boolean
  created_at: string
}

export interface SiteUser {
  id: string
  email: string
  role: string
  child_profiles?: ChildProfile[]
  active_child_id?: string | null
  created_at: string
  updated_at: string
}

export interface Channel {
  id: string
  name: string
  description: string
  thumbnail: string
  category_ids: string[]
  age_group_ids: string[]
  created_at: string
  updated_at: string
}

export interface Episode {
  id: string
  channel_id: string
  title: string
  description: string
  order: number
  thumbnail: string
  subtitle_url: string
  status: string
  view_count: number
  like_count: number
  maturity_rating: string
  intro_end_sec?: number
  recap_end_sec?: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  thumbnail: string
  created_at: string
  updated_at: string
}

export interface AgeGroup {
  id: string
  name: string
  min_age: number
  max_age: number
  created_at: string
  updated_at: string
}

export interface WatchProgress {
  id: string
  user_id: string
  child_id?: string
  episode_id: string
  progress_sec: number
  duration_sec: number
  progress_pct: number
  completed: boolean
  last_watched_at: string
  created_at: string
}

export interface Playlist {
  id: string
  user_id: string
  child_id?: string
  title: string
  description?: string
  episode_ids: string[]
  is_public: boolean
  is_featured: boolean
  thumbnail?: string
  created_at: string
  updated_at: string
}

export interface ContentReport {
  id: string
  episode_id: string
  reporter_id: string
  reason: string
  details?: string
  status: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
}

export interface AppNotification {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  episode_id?: string
  channel_id?: string
  read: boolean
  created_at: string
}

export interface ScreenTimeInfo {
  used_minutes: number
  limit_minutes: number
}

export interface BedtimeRule {
  enabled: boolean
  start_time: string
  end_time: string
  timezone: string
  is_bedtime: boolean
}

export interface ChannelRule {
  id: string
  user_id: string
  child_id: string
  channel_id: string
  action: string
  created_at: string
}
