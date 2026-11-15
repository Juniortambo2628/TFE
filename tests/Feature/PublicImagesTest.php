<?php

namespace Tests\Feature;

use App\Support\PublicImages;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Generated public-page photography (Nov 2026): a slot uses its photo only
 * once the file is committed, and keeps its current image until then.
 */
class PublicImagesTest extends TestCase
{
    use RefreshDatabase;

    private string $probe = 'zz-test-probe.webp';

    protected function tearDown(): void
    {
        @unlink(public_path(PublicImages::DIR.$this->probe));
        parent::tearDown();
    }

    public function test_a_missing_photo_keeps_the_fallback(): void
    {
        $this->assertSame('/assets/img/backdrops/x.jpg', PublicImages::photo($this->probe, '/assets/img/backdrops/x.jpg'));
        $this->assertNull(PublicImages::photo($this->probe));
    }

    public function test_a_committed_photo_is_used(): void
    {
        @mkdir(public_path(PublicImages::DIR), 0775, true);
        file_put_contents(public_path(PublicImages::DIR.$this->probe), 'x');

        $this->assertSame('/assets/img/public/'.$this->probe, PublicImages::photo($this->probe, '/fallback.jpg'));
    }

    public function test_every_slot_falls_back_to_a_file_that_exists(): void
    {
        foreach (PublicImages::SLOTS as $slot => [$file, $fallback]) {
            if ($fallback !== null) {
                $this->assertFileExists(public_path(ltrim($fallback, '/')), "{$slot} fallback");
            }
        }
    }

    public function test_public_pages_share_the_slots(): void
    {
        $props = $this->get('/about')->assertOk()->viewData('page')['props'];

        $this->assertArrayHasKey('publicImages', $props);
        $this->assertSame(array_keys(PublicImages::SLOTS), array_keys($props['publicImages']));
    }
}
