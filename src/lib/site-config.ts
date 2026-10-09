/**
 * Site configuration — reads from environment variables with sensible defaults.
 * Deployers customize their instance by setting these in .env.local
 */
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || 'Task Dashboard',
  /** Short name for tight spaces (nav on phones). */
  shortName: process.env.NEXT_PUBLIC_SITE_SHORT_NAME || process.env.NEXT_PUBLIC_SITE_NAME || 'Tasks',
  tagline: process.env.NEXT_PUBLIC_SITE_TAGLINE || 'Pitch in. Make things. Show your work.',
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    'A community workspace where people come together to learn, share, and create.',
  /** Optional image logo. When unset, a typographic mark is used. */
  logoPath: process.env.NEXT_PUBLIC_LOGO_PATH || '',
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
} as const;

export function absoluteUrl(path: string) {
  return `${siteConfig.baseUrl.replace(/\/$/, '')}${path}`;
}
