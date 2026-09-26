<?php

namespace Tests\Feature\Admin;

use App\Models\MediaAsset;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MediaLibraryTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->admin()->create();
    }

    public function test_admin_can_access_media_library(): void
    {
        $this->actingAs($this->admin())
            ->get(route('admin.media.index'))
            ->assertStatus(200);
    }

    public function test_non_admin_cannot_access_media(): void
    {
        $fan = User::factory()->create(['is_admin' => false, 'is_partner' => false]);

        $this->actingAs($fan)->get(route('admin.media.index'))->assertStatus(403);
        $this->actingAs($fan)->get(route('admin.media.list'))->assertStatus(403);
    }

    public function test_uploaded_image_is_optimized_and_recorded(): void
    {
        Storage::fake('public');

        // A 4000×3000 image is larger than MAX_EDGE (1920) on its long side.
        $file = UploadedFile::fake()->image('huge.jpg', 4000, 3000);

        $this->actingAs($this->admin())
            ->post(route('admin.media.store'), ['files' => [$file]])
            ->assertRedirect();

        $asset = MediaAsset::first();
        $this->assertNotNull($asset);
        $this->assertSame('image', $asset->kind);
        $this->assertLessThanOrEqual(1920, $asset->width, 'Image should have been scaled down to the max edge.');
        Storage::disk('public')->assertExists($asset->path);
    }

    public function test_video_uploads_are_accepted(): void
    {
        Storage::fake('public');

        $video = UploadedFile::fake()->create('clip.mp4', 200, 'video/mp4');

        $this->actingAs($this->admin())
            ->post(route('admin.media.store'), ['files' => [$video]])
            ->assertRedirect();

        $this->assertDatabaseHas('media_assets', ['kind' => 'video']);
    }

    public function test_svg_is_rejected(): void
    {
        Storage::fake('public');

        $svg = UploadedFile::fake()->create('x.svg', 5, 'image/svg+xml');

        $this->actingAs($this->admin())
            ->post(route('admin.media.store'), ['files' => [$svg]])
            ->assertSessionHasErrors('files.0');

        $this->assertSame(0, MediaAsset::count());
    }

    public function test_list_returns_json_assets(): void
    {
        Storage::fake('public');
        MediaAsset::create([
            'disk' => 'public', 'path' => 'assets/library/a.webp', 'url' => '/storage/assets/library/a.webp',
            'name' => 'a.webp', 'mime' => 'image/webp', 'kind' => 'image', 'size' => 1234,
        ]);

        $this->actingAs($this->admin())
            ->getJson(route('admin.media.list', ['kind' => 'image']))
            ->assertStatus(200)
            ->assertJsonPath('assets.0.name', 'a.webp');
    }

    public function test_admin_can_delete_media(): void
    {
        Storage::fake('public');
        $file = UploadedFile::fake()->image('del.png', 800, 600);
        $this->actingAs($this->admin())->post(route('admin.media.store'), ['files' => [$file]]);

        $asset = MediaAsset::firstOrFail();
        $this->actingAs($this->admin())
            ->delete(route('admin.media.destroy', $asset))
            ->assertRedirect();

        $this->assertDatabaseMissing('media_assets', ['id' => $asset->id]);
        Storage::disk('public')->assertMissing($asset->path);
    }
}
