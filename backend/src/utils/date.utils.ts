// src/utils/dateUtils.ts

/**
 * Get start and end dates for the current ISO week (Monday to Sunday)
 * @returns Object with startDate and endDate
 */
export function getISOWeekDates() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Calculate days to subtract to get to Monday
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    // Calculate start date (Monday)
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - daysToMonday);
    startDate.setHours(0, 0, 0, 0);
    
    // Calculate end date (Sunday)
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    
    return { startDate, endDate };
  }
  
  /**
   * Format a date as "YYYY-MM-DD"
   * @param date Date to format
   * @returns Formatted date string
   */
  export function formatDate(date: Date) {
    return date.toISOString().split('T')[0];
  }
  
  /**
   * Get an array of dates for the last N days
   * @param days Number of days to include
   * @returns Array of date strings
   */
  export function getLastNDays(days: number) {
    const result = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      result.push(formatDate(date));
    }
    
    return result;
  }