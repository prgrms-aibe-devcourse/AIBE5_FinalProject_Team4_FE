import type { UserProfile } from '@/types'

const STORAGE_KEY = 'otjang_user_profile'

export function loadUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as UserProfile
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

export function saveUserProfile(profile: UserProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}

export function clearUserProfile(): void {
  localStorage.removeItem(STORAGE_KEY)
}
