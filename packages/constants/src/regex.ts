export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_ID: /^(?:\+62|62|0)8[1-9][0-9]{6,10}$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/,
} as const;
