import { format, parseISO, formatDistanceToNow } from 'date-fns';

/**
 * Format a date string or Date object.
 * @param {string|Date} date - The date to format.
 * @param {string} formatStr - The format string (default: 'yyyy-MM-dd').
 * @returns {string} The formatted date string.
 */
export const formatDate = (date, formatStr = 'yyyy-MM-dd') => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
};

/**
 * Get the distance to now in words.
 * @param {string|Date} date - The date to compare.
 * @returns {string} The distance string (e.g., "3 days ago").
 */
export const timeAgo = (date) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
};
