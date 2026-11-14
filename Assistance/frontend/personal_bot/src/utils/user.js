// frontend/personal_bot/src/utils/user.js
const KEY = "companion_uid";

export function userId() {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}