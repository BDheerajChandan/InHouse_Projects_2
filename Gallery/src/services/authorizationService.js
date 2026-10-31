import { AUTH_PASSKEY } from '../config/authConfig'
import { GALLERY_CONFIG } from '../config/galleryConfig'

const KEY = GALLERY_CONFIG.authSessionKey

export function isSessionAuthorized() {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export async function verifyPasskey(input) {
  await new Promise((r) => setTimeout(r, 350))
  const ok = typeof input === 'string' && input === AUTH_PASSKEY
  if (ok) {
    try {
      sessionStorage.setItem(KEY, '1')
    } catch {
      /* storage unavailable */
    }
  }
  return ok
}

export function clearAuthorization() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* storage unavailable */
  }
}