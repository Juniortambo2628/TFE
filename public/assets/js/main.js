/**
 * Main entry point for TFE Landing Page
 * This file is processed by Vite for bundling and optimization
 */

// Import CSS - Vite will bundle and optimize this
import '../css/tfe-landing-overrides.css';

// Import main landing page JavaScript
// Note: tfe-landing.js uses IIFE pattern, so we just import it
import './tfe-landing.js';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('TFE Landing Page - Assets loaded via Vite');
    
    // Vite will handle all the initialization from tfe-landing.js
    // which is already wrapped in jQuery ready handler
});
