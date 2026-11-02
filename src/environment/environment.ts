/**
 * Menu cycle configuration. Set anchorWeek to the week index (0–3) that was
 * served during the Monday beginning anchorDate. The cycle then advances one
 * index every Monday, independently of ISO week numbers and year boundaries.
 *
 * Replace these defaults once you know which menu week is currently active.
 */
export const menuCycle = {
  anchorDate: '2026-10-26', // Monday; provisional reference date
  anchorWeek: 0
} as const;

/**
 * Appwrite client configuration.
 *
 * Kept here instead of importing appwrite.config.json so the CLI/site
 * configuration (auth settings, table schemas, site vars) is not bundled into
 * the browser build. These values must stay in sync with appwrite.config.json.
 */
export const appwriteConfig = {
  projectId: '68fc98fb001d33ecc5b5',
  endpoint: 'https://fra.cloud.appwrite.io/v1',
  databaseId: '68fc9c4a00261282e43d',
  menuTableId: '6ae59c51000b37262e9d'
} as const;
