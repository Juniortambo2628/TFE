<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * The installable website (docs/proposals/mobile-app.md, phase 0): every
 * page points at the manifest and the home-screen icons, and every file the
 * manifest and the service worker name is committed.
 */
class InstallableSiteTest extends TestCase
{
    public function test_every_page_links_the_manifest_and_icons(): void
    {
        $html = $this->get('/')->assertOk()->getContent();

        $this->assertStringContainsString('<link rel="manifest" href="/manifest.webmanifest">', $html);
        $this->assertStringContainsString('<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">', $html);
        $this->assertStringContainsString('viewport-fit=cover', $html);
        $this->assertStringContainsString('name="theme-color"', $html);
    }

    public function test_the_manifest_is_complete_and_its_files_exist(): void
    {
        $manifest = json_decode(file_get_contents(public_path('manifest.webmanifest')), true, flags: JSON_THROW_ON_ERROR);

        foreach (['name', 'short_name', 'start_url', 'scope', 'display', 'icons', 'theme_color', 'background_color'] as $key) {
            $this->assertArrayHasKey($key, $manifest, "manifest lacks {$key}");
        }
        $this->assertSame('standalone', $manifest['display']);

        $sizes = array_column($manifest['icons'], 'sizes');
        $this->assertContains('192x192', $sizes, 'Android needs a 192px icon');
        $this->assertContains('512x512', $sizes, 'and a 512px one');
        $this->assertContains('maskable', array_column($manifest['icons'], 'purpose'));

        foreach ($manifest['icons'] as $icon) {
            $this->assertFileExists(public_path(ltrim($icon['src'], '/')));
        }
        foreach ($manifest['shortcuts'] as $shortcut) {
            $this->assertStringStartsWith('/', $shortcut['url'], 'shortcuts stay on this site');
        }
    }

    public function test_the_service_worker_and_offline_page_are_committed(): void
    {
        $this->assertFileExists(public_path('sw.js'));
        $this->assertFileExists(public_path('offline.html'));

        $sw = file_get_contents(public_path('sw.js'));
        $this->assertStringContainsString("'/offline.html'", $sw);
        // Pages are never cached: they carry a person's own plans and savings.
        $this->assertStringContainsString("req.mode === 'navigate'", $sw);
        $this->assertStringNotContainsString('cache.put(req, res.clone()); // navigate', $sw);
    }
}
