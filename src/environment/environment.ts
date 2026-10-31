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
