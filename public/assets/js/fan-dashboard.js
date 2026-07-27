/**
 * Fan Dashboard Entry Point
 * Bundles all common fan dashboard scripts and styles
 */

// Import Dashboard Header Logic
import './fan/dashboard-header.js';

// Import Dashboard Charts
import './fan/dashboard-charts.js';

// Import other common scripts if needed
// import './fan/dashboard-init.js'; // This is page specific, maybe keep separate or bundle?
// For now, let's just bundle the header logic which is used on all pages.

console.log('Fan Dashboard assets loaded via Vite');
