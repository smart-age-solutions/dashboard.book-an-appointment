/**
 * Parses a YYYY-MM-DD date string into a local midnight Date object.
 * This avoids the default "new Date('YYYY-MM-DD')" behavior which 
 * interprets the string as UTC and causes timezone shifts.
 */
export const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};
