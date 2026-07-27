/**
 * Time Utilities
 * Shared time formatting and calculation functions
 */

import { formatDate, timeAgo } from '../shared/date-utils.js';

window.timeAgo = (dateString, options = {}) => {
    // Adapter to match existing signature if needed, or just pass through
    return timeAgo(dateString);
};

window.formatDate = (dateString, options = {}) => {
    // Adapter to match existing signature
    // Note: date-fns format string is different from Intl.DateTimeFormat options
    // For now, we'll use a default format if options are passed, or try to map them
    // But for simplicity in this migration step, we'll use the default from shared util
    return formatDate(dateString);
};


