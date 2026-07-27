/**
 * Dashboard Utilities
 * Utility functions for the dashboard
 */

import { debounce, throttle, cloneDeep } from 'lodash-es';
import { formatDate, timeAgo } from './shared/date-utils.js';
import { showToast } from './shared/ui-utils.js';

/**
 * Dashboard Utilities
 * Utility functions for the dashboard
 */

const DashboardUtils = {
  /**
   * Format a number with commas
   * @param {number} num - The number to format
   * @param {number} decimals - Number of decimal places
   * @returns {string} Formatted number
   */
  formatNumber: function (num, decimals = 0) {
    if (isNaN(num)) {
      return '0';
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  },

  /**
   * Format a percentage
   * @param {number} value - The value to format
   * @param {number} decimals - Number of decimal places
   * @returns {string} Formatted percentage
   */
  formatPercentage: function (value, decimals = 1) {
    if (isNaN(value)) {
      return '0%';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100);
  },

  /**
   * Format a currency value
   * @param {number} amount - The amount to format
   * @param {string} currency - Currency code
   * @returns {string} Formatted currency
   */
  formatCurrency: function (amount, currency = 'USD') {
    if (isNaN(amount)) {
      return '$0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  },

  /**
   * Format a date
   * @param {Date|string} date - The date to format
   * @param {string} format - Format type ('short', 'long', 'time')
   * @returns {string} Formatted date
   */
  formatDate: function (date, format = 'short') {
      // Map legacy format strings to date-fns patterns if needed, 
      // or just use the shared utility which expects a pattern.
      // For now, we'll stick to the shared utility's default or simple mapping
      // The shared utility uses 'yyyy-MM-dd' by default.
      // We can expand this mapping as needed.
      let pattern = 'yyyy-MM-dd';
      if (format === 'long') pattern = 'MMMM do, yyyy';
      if (format === 'time') pattern = 'HH:mm';
      if (format === 'datetime') pattern = 'MMM d, yyyy HH:mm';
      
      return formatDate(date, pattern);
  },

  /**
   * Get relative time (e.g., "2 hours ago")
   * @param {Date|string} date - The date to format
   * @returns {string} Relative time string
   */
  getRelativeTime: function (date) {
    return timeAgo(date);
  },

  /**
   * Debounce a function
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  debounce: function (func, wait) {
    return debounce(func, wait);
  },

  /**
   * Throttle a function
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {Function} Throttled function
   */
  throttle: function (func, limit) {
    return throttle(func, limit);
  },

  /**
   * Generate a random ID
   * @param {number} length - Length of the ID
   * @returns {string} Random ID
   */
  generateId: function (length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * Deep clone an object
   * @param {*} obj - Object to clone
   * @returns {*} Cloned object
   */
  deepClone: function (obj) {
    return cloneDeep(obj);
  },

  /**
   * Check if an element is in viewport
   * @param {Element} element - Element to check
   * @returns {boolean} True if element is in viewport
   */
  isInViewport: function (element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  /**
   * Scroll to element smoothly
   * @param {Element|string} element - Element or selector
   * @param {number} offset - Offset from top
   */
  scrollToElement: function (element, offset = 0) {
    const target = typeof element === 'string' ? document.querySelector(element) : element;
    if (!target) {
      return;
    }

    const targetPosition = target.offsetTop - offset;
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth',
    });
  },

  /**
   * Show loading state
   * @param {Element|string} element - Element or selector
   * @param {boolean} show - Show or hide loading
   */
  showLoading: function (element, show = true) {
    const target = typeof element === 'string' ? document.querySelector(element) : element;
    if (!target) {
      return;
    }

    if (show) {
      target.classList.add('loading');
    } else {
      target.classList.remove('loading');
    }
  },

  /**
   * Show notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type ('success', 'error', 'warning', 'info')
   * @param {number} duration - Duration in milliseconds
   */
  showNotification: function (message, type = 'info', duration = 5000) {
      // Map types to sweetalert icons
      const icon = type === 'error' ? 'error' : (type === 'warning' ? 'warning' : (type === 'success' ? 'success' : 'info'));
      showToast(message, icon);
  },

  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} Success status
   */
  copyToClipboard: async function (text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const result = document.execCommand('copy');
        textArea.remove();
        return result;
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
      return false;
    }
  },

  /**
   * Download data as file
   * @param {string} data - Data to download
   * @param {string} filename - Filename
   * @param {string} type - MIME type
   */
  downloadFile: function (data, filename, type = 'text/plain') {
    const blob = new Blob([data], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Get URL parameters
   * @returns {Object} URL parameters
   */
  getUrlParams: function () {
    const params = {};
    const urlSearchParams = new URLSearchParams(window.location.search);
    for (const [key, value] of urlSearchParams) {
      params[key] = value;
    }
    return params;
  },

  /**
   * Set URL parameter
   * @param {string} key - Parameter key
   * @param {string} value - Parameter value
   */
  setUrlParam: function (key, value) {
    const url = new URL(window.location);
    url.searchParams.set(key, value);
    window.history.replaceState({}, '', url);
  },

  /**
   * Remove URL parameter
   * @param {string} key - Parameter key
   */
  removeUrlParam: function (key) {
    const url = new URL(window.location);
    url.searchParams.delete(key);
    window.history.replaceState({}, '', url);
  },
};

// Make utilities globally available
window.DashboardUtils = DashboardUtils;
export default DashboardUtils;
