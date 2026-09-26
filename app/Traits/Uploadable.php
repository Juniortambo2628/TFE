<?php

namespace App\Traits;

use App\Services\MediaLibraryService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

trait Uploadable
{
    /**
     * Store an uploaded file and optionally delete the old one.
     *
     * Routes through MediaLibraryService, so images are compressed + scaled
     * down and every upload is recorded in the media library — for free, for
     * every controller that already used this trait. Returns the storage
     * path (no /storage prefix), which is what the callers persist.
     */
    protected function uploadFile(
        UploadedFile $file,
        string $directory,
        ?string $existingPath = null,
        bool $deleteOld = true,
    ): string {
        if ($deleteOld && $existingPath) {
            Storage::disk('public')->delete($existingPath);
        }

        return app(MediaLibraryService::class)->store($file, $directory)->path;
    }

    /**
     * Delete a file from storage.
     */
    protected function deleteFile(?string $path): bool
    {
        if ($path && Storage::disk('public')->exists($path)) {
            return Storage::disk('public')->delete($path);
        }

        return false;
    }

    /**
     * Handle a file-or-URL field: returns the new path/URL, or null to keep existing.
     */
    protected function handleImageField(
        $request,
        string $field,
        string $directory,
        ?string $existingPath = null,
    ): ?string {
        if ($request->hasFile($field)) {
            return $this->uploadFile($request->file($field), $directory, $existingPath);
        }

        if ($request->filled($field)) {
            return $request->input($field);
        }

        return null; // Keep existing
    }
}
