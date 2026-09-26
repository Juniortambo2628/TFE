<?php

namespace Tests\Feature\Admin;

use App\Models\Story;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StoriesManagementTest extends TestCase
{
    use RefreshDatabase;

    private function makeStory(User $author): Story
    {
        return Story::create([
            'user_id' => $author->id,
            'media_url' => 'https://example.test/storage/stories/demo.jpg',
            'media_type' => 'image',
            'caption' => 'A day at the stadium',
        ]);
    }

    public function test_index_exposes_engagement_counts(): void
    {
        $admin = User::factory()->admin()->create();
        $fan = User::factory()->create(['is_admin' => false, 'is_partner' => false]);
        $story = $this->makeStory($fan);

        $response = $this->actingAs($admin)->get(route('admin.stories.index'));

        $response->assertStatus(200);
        $rows = $response->viewData('page')['props']['stories']['data'];

        $this->assertCount(1, $rows);
        $this->assertSame($story->id, $rows[0]['id']);
        $this->assertSame(0, $rows[0]['views_count']);
        $this->assertSame(0, $rows[0]['replies_count']);
        // media_url stays the absolute URL the fan uploader stored — no double prefix.
        $this->assertSame('https://example.test/storage/stories/demo.jpg', $rows[0]['media_url']);
    }

    public function test_admin_can_delete_a_story(): void
    {
        $admin = User::factory()->admin()->create();
        $fan = User::factory()->create(['is_admin' => false, 'is_partner' => false]);
        $story = $this->makeStory($fan);

        $this->actingAs($admin)
            ->delete(route('admin.stories.destroy', $story))
            ->assertRedirect();

        $this->assertDatabaseMissing('stories', ['id' => $story->id]);
    }

    public function test_non_admin_cannot_delete_a_story(): void
    {
        $fan = User::factory()->create(['is_admin' => false, 'is_partner' => false]);
        $story = $this->makeStory($fan);

        $this->actingAs($fan)
            ->delete(route('admin.stories.destroy', $story))
            ->assertStatus(403);

        $this->assertDatabaseHas('stories', ['id' => $story->id]);
    }
}
