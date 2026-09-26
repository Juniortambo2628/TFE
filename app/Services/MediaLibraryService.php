<?php

namespace App\Services;

use App\Models\MediaAsset;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

/**
 * MediaLibraryService — the ONE place uploads are stored platform-wide.
 *
 * Every uploader routes through store(): raster images are compressed and
 * scaled down before they land on disk, and every stored file is recorded as a
 * MediaAsset row so the same photo can be re-picked from the gallery instead of
 * re-uploaded. `Uploadable::uploadFile()` and `ContentController::updateSettings`
 * both delegate here, so optimization + the library are global by construction.
 *
 * Accepted types are declared once here (IMAGE_MIMES / VIDEO_MIMES + the
 * *_EXTENSIONS lists) and surfaced to controllers as validation rules and to the
 * client as an `accept` string, so the server and the file picker can never
 * drift. SVG is deliberately excluded everywhere — a same-origin /storage URL
 * turns an uploaded SVG into a stored-XSS vector.
 */
class MediaLibraryService
{
    /** Longest edge (px) a stored image is scaled down to. Never upscaled. */
    public const MAX_EDGE = 1920;

    /** Re-encode quality for lossy formats. */
    public const QUALITY = 82;

    public const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'];

    public const VIDEO_EXTENSIONS = ['mp4', 'webm'];

    public const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

    public const VIDEO_MIMES = ['video/mp4', 'video/webm'];

    /** Formats we re-encode. Animated GIF is left as-is so it keeps moving. */
    private const OPTIMIZABLE = ['jpg', 'jpeg', 'png', 'webp', 'avif'];

    /**
     * Store an uploaded file (optimizing images) and record it in the library.
     */
    public function store(UploadedFile $file, string $folder = 'assets/uploads', ?int $userId = null): MediaAsset
    {
        $userId ??= auth()->id();
        $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'bin');
        $kind = in_array($extension, self::VIDEO_EXTENSIONS, true) ? 'video' : 'image';
        $path = $folder.'/'.uniqid('m_', true).'.'.$extension;

        [$width, $height] = [null, null];
        $stored = false;

        if ($kind === 'image' && in_array($extension, self::OPTIMIZABLE, true)) {
            try {
                $manager = new ImageManager(new Driver);
                $image = $manager->read($file->getRealPath());
                $image->scaleDown(self::MAX_EDGE, self::MAX_EDGE);
                $width = $image->width();
                $height = $image->height();
                Storage::disk('public')->put($path, (string) $image->encodeByExtension($extension, quality: self::QUALITY));
                $stored = true;
            } catch (\Throwable $e) {
                // GD may lack an encoder (e.g. AVIF on some builds) — never fail
                // the upload over optimization; fall back to the original bytes.
                Log::warning('Image optimization failed, storing original', ['ext' => $extension, 'error' => $e->getMessage()]);
                [$width, $height] = $this->safeDimensions($file);
            }
        }

        if (! $stored) {
            $path = $file->storeAs($folder, basename($path), 'public');
            if ($kind === 'image' && $width === null) {
                [$width, $height] = $this->safeDimensions($file);
            }
        }

        return MediaAsset::create([
            'disk' => 'public',
            'path' => $path,
            'url' => Storage::disk('public')->url($path),
            'name' => $file->getClientOriginalName() ?: basename($path),
            'mime' => $file->getClientMimeType(),
            'kind' => $kind,
            'size' => Storage::disk('public')->size($path),
            'width' => $width,
            'height' => $height,
            'uploaded_by' => $userId,
        ]);
    }

    /**
     * Delete an asset's file from disk and its library row.
     */
    public function delete(MediaAsset $asset): void
    {
        Storage::disk($asset->disk)->delete($asset->path);
        $asset->delete();
    }

    /** Read pixel dimensions without throwing on a non-image. */
    private function safeDimensions(UploadedFile $file): array
    {
        $info = @getimagesize($file->getRealPath());

        return [$info[0] ?? null, $info[1] ?? null];
    }

    // ── Validation + client accept, from the one source of truth ──────────

    /** Laravel rule string for an image-only field (e.g. a hero background). */
    public static function imageRules(int $maxKb = 12288, bool $required = true): array
    {
        return [
            $required ? 'required' : 'nullable',
            'file',
            'mimes:'.implode(',', self::IMAGE_EXTENSIONS),
            'max:'.$maxKb,
        ];
    }

    /** Laravel rule string for a media field that also accepts video. */
    public static function mediaRules(int $maxKb = 51200, bool $required = true): array
    {
        return [
            $required ? 'required' : 'nullable',
            'file',
            'mimes:'.implode(',', array_merge(self::IMAGE_EXTENSIONS, self::VIDEO_EXTENSIONS)),
            'max:'.$maxKb,
        ];
    }

    /** `accept` attribute for an image-only file input. */
    public static function imageAccept(): string
    {
        return implode(',', self::IMAGE_MIMES);
    }

    /** `accept` attribute for an image-or-video file input. */
    public static function mediaAccept(): string
    {
        return implode(',', array_merge(self::IMAGE_MIMES, self::VIDEO_MIMES));
    }
}
