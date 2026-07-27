/**
 * Stadium Image Preloader
 * 
 * Preloads stadium images for better performance.
 * Expects window.STADIUM_IMAGES array to be defined by PHP.
 */

(function() {
    'use strict';

    /**
     * Preload stadium images
     */
    function preloadStadiumImages() {
        if (!window.STADIUM_IMAGES || !Array.isArray(window.STADIUM_IMAGES)) {
            return; // No stadium images to preload
        }

        window.STADIUM_IMAGES.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', preloadStadiumImages);
    } else {
        preloadStadiumImages();
    }
})();

