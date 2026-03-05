export interface SiteUser {
  id: string
  email: string
  role: string
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
