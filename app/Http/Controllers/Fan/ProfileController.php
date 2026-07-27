<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\HasSocialStats;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class ProfileController extends Controller
{
    use HasSocialStats;

    public function index()
    {
        $currentUser = Auth::user();
        $viewingUser = $currentUser;
        $isOwnProfile = true;
        
        return $this->renderProfile($currentUser, $viewingUser, $isOwnProfile);
    }

    public function show(User $user)
    {
        $currentUser = Auth::user();
        $viewingUser = $user;
        $isOwnProfile = $currentUser->id === $viewingUser->id;
        
        return $this->renderProfile($currentUser, $viewingUser, $isOwnProfile);
    }

    private function renderProfile($currentUser, $viewingUser, $isOwnProfile)
    {
        
        // Get social stats using trait
        $socialMetrics = $this->getSocialStats($viewingUser->id);
        
        $stats = array_merge($socialMetrics, [
            'tribes' => \Illuminate\Support\Facades\DB::table('tribe_members')->where('user_id', $viewingUser->id)->count(),
        ]);
        
        // Check if current user is following the viewed user
        $isFollowing = \App\Models\Follow::where('follower_id', $currentUser->id)
            ->where('following_id', $viewingUser->id)
            ->exists();
        
        $countryMap = [
            'argentina' => 'ar',
            'brazil' => 'br',
            'england' => 'gb-eng',
            'france' => 'fr',
            'germany' => 'de',
            'italy' => 'it',
            'netherlands' => 'nl',
            'portugal' => 'pt',
            'spain' => 'es',
            'kenya' => 'ke',
            'nigeria' => 'ng',
            'south africa' => 'za',
            'ghana' => 'gh',
            'morocco' => 'ma',
            'egypt' => 'eg',
            'senegal' => 'sn',
            'usa' => 'us',
            'united states' => 'us',
        ];

        $teamLower = strtolower(trim($viewingUser->team_support ?? ''));
        $flagCode = $countryMap[$teamLower] ?? null;
        
        // If not found in team_support, try country
        if (!$flagCode && $viewingUser->country) {
            $countryLower = strtolower(trim($viewingUser->country));
            $flagCode = $countryMap[$countryLower] ?? null;
            // Catch-all mapping could be added here or just use the code directly if it's already 2-letter
            if (!$flagCode && strlen($countryLower) === 2) {
                $flagCode = $countryLower;
            }
        }

        $profile = [
            'id' => $viewingUser->id,
            'name' => $viewingUser->name,
            'email' => $viewingUser->email,
            'avatar' => $viewingUser->profile?->avatar_path ?? $viewingUser->avatar ?? asset('assets/img/avatars/default-avatar.png'),
            'country' => $viewingUser->country ?? 'Kenya',
            'team_support' => $viewingUser->team_support ?? '',
            'marketing_consent' => (bool)$viewingUser->marketing_consent,
            'community_consent' => (bool)$viewingUser->community_consent,
            'terms_agreed' => (bool)$viewingUser->terms_agreed,
            'date_of_birth' => $viewingUser->date_of_birth?->format('Y-m-d'),
            'phone' => $viewingUser->phone,
            'bio' => $viewingUser->bio,
            'cover_image' => $viewingUser->cover_image ?? ($flagCode ? asset('assets/Flags/' . $flagCode . '.png') : null),
        ];

        // Get followers and following detailed lists using trait
        $followers = $this->getFollowers($viewingUser->id);
        $following = $this->getFollowing($viewingUser->id);

        // Get user's tribes
        $userTribes = $viewingUser->tribes()
            ->select('tribes.id', 'tribes.name', 'tribes.avatar', 'tribes.slug')
            ->get();

        // Get user's recent posts
        $userPosts = \App\Models\Post::where('user_id', $viewingUser->id)
            ->whereNull('parent_post_id') // Only main posts
            ->latest()
            ->take(5)
            ->get()
            ->map(function($post) {
                return [
                    'id' => $post->id,
                    'content' => $post->content,
                    'image_url' => $post->image_url,
                    'created_at' => $post->created_at->diffForHumans(),
                    'likes_count' => $post->likes_count,
                    'comment_count' => $post->comment_count,
                ];
            });

        return Inertia::render('Fan/Profile', [
            'socialStats' => $stats,
            'profile' => $profile,
            'isOwnProfile' => $isOwnProfile,
            'isFollowing' => $isFollowing,
            'userTribes' => $userTribes,
            'userPosts' => $userPosts,
            'followers' => $followers,
            'followingList' => $following,
            'auth' => [
                'user' => $currentUser
            ]
        ]);
    }
    
    public function update(Request $request)
    {
        $user = Auth::user();
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'country' => 'nullable|string|max:255',
            'country_code' => 'nullable|string|max:10',
            'team_support' => 'nullable|string|max:255',
            'date_of_birth' => 'nullable|date',
            'phone' => 'nullable|string|max:20',
            'bio' => 'nullable|string|max:1000',
            'cover_image' => 'nullable',
            'marketing_consent' => 'boolean',
            'community_consent' => 'boolean',
            'newsletter_consent' => 'boolean', // Alias for community or separate if needed
        ]);

        // Mapping newsletter to community or marketing if not separate in DB
        // Based on model, we have marketing_consent and community_consent.
        
        // Handle cover_image — could be a file upload or a URL string
        if ($request->hasFile('cover_image')) {
            $request->validate(['cover_image' => 'image|max:2048']);
            $path = $request->file('cover_image')->store('profiles', 'public');
            $validated['cover_image'] = '/storage/' . $path;
        } elseif ($request->filled('cover_image')) {
            $validated['cover_image'] = $request->input('cover_image');
        } else {
            unset($validated['cover_image']); // Keep existing
        }

        $user->update($validated);

        return back()->with('success', 'Profile updated successfully!');
    }

    public function updateAvatar(Request $request)
    {
        $request->validate([
            'avatar_url' => 'required|url'
        ]);

        $user = Auth::user();
        
        // Update or create profile
        $profile = \App\Models\Profile::firstOrCreate(
            ['user_id' => $user->id],
            ['settings' => []]
        );
        
        $profile->avatar_path = $request->avatar_url;
        $profile->save();

        return back()->with('success', 'Avatar updated successfully!');
    }
}
