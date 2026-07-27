import { usePage } from '@inertiajs/react';

/**
 * Get the full asset URL for a given path.
 * This handles the base URL correctly whether the app is at / or /TFE/public/
 * 
 * @param {string} path - The asset path (e.g., 'assets/img/logo.png' or '/assets/img/logo.png')
 * @returns {string} The full asset URL
 */
export function useAssetUrl(path) {
    const { assetUrl } = usePage().props;
    
    // Remove leading slash if present since assetUrl already ends with /
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    return `${assetUrl}${cleanPath}`;
}

/**
 * For use outside React components, get asset URL from global props
 * This uses a simple approach that works when assetUrl is available
 * 
 * @param {string} path - The asset path
 * @param {string} baseUrl - The base URL (from props.assetUrl)
 * @returns {string} The full asset URL
 */
export function getAssetUrl(path, baseUrl = '') {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${baseUrl}${cleanPath}`;
}

export default useAssetUrl;
