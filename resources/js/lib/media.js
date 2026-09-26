/**
 * media.js — the client mirror of App\Services\MediaLibraryService's accepted
 * types. Kept in step with that class so a file input never offers a type the
 * server will reject. SVG is intentionally absent (stored-XSS via same-origin
 * storage); do not add it.
 */
export const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
export const VIDEO_MIMES = ['video/mp4', 'video/webm'];

export const MEDIA_ACCEPT = {
    image: IMAGE_MIMES.join(','),
    media: [...IMAGE_MIMES, ...VIDEO_MIMES].join(','),
};

export default MEDIA_ACCEPT;
