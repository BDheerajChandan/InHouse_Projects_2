// frontend/personal_bot/src/utils/constants.js
export const MODE_LABEL = {
  disabled: "Memory off",
  session: "Session memory",
  long_term: "Long-term memory",
};

export const MODE_INFO = {
  disabled:
    "Past chats are never used. Chats may still be saved so you can read them, but they never shape replies.",
  session: "Remembers the current conversation only. Other conversations are never used.",
  long_term:
    "Also remembers useful preferences, goals and projects across chats. Sensitive details are never saved. You can review, edit and delete everything.",
};

const env = import.meta.env;
export const APP_LABEL = [
  `v${env.VITE_APP_VERSION || "dev"}`,
  [env.VITE_APP_RELEASE_DATE, env.VITE_APP_RELEASE_TIME].filter(Boolean).join(" "),
]
  .filter(Boolean)
  .join(" · ");