<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class NewsService
{
    protected $apiKey;

    protected $baseUrl = 'https://newsapi.org/v2';

    /**
     * Default news categories — used to build a broad football feed.
     * Each entry is [label, query].
     */
    public const CATEGORIES = [
        'general'      => ['General Football', 'football OR soccer'],
        'european'     => ['European Football', '"Champions League" OR "Europa League" OR "Premier League" OR "La Liga" OR "Serie A" OR "Bundesliga"'],
        'african'      => ['African Football', 'AFCON OR "African Cup" OR "African football" OR CAF'],
        'south_american' => ['South American Football', '"Copa Libertadores" OR "Copa America" OR Brasileirão OR Argentina OR Brazil'],
        'transfers'    => ['Transfer News', 'transfer OR signing OR "transfer window"'],
    ];

    public function __construct()
    {
        $this->apiKey = config('services.newsapi.key');
    }

    /**
     * Get the latest football news.
     *
     * @param  string  $category  One of the CATEGORIES keys (e.g. 'general', 'african')
     * @param  int     $pageSize  Number of articles (max 100)
     * @return array   List of articles from NewsAPI
     */
    public function getLatestNews($category = 'general', $pageSize = 6)
    {
        if (empty($this->apiKey)) {
            return [];
        }

        $config = self::CATEGORIES[$category] ?? self::CATEGORIES['general'];
        $query = $config[1];

        $cacheKey = "news_feed:{$category}:{$pageSize}";

        return Cache::remember($cacheKey, 1800, function () use ($query, $pageSize) {
            try {
                $response = Http::timeout(5)->get("{$this->baseUrl}/everything", [
                    'q' => $query,
                    'language' => 'en',
                    'sortBy' => 'publishedAt',
                    'pageSize' => $pageSize,
                    'apiKey' => $this->apiKey,
                ]);

                if ($response->successful()) {
                    $articles = $response->json()['articles'] ?? [];

                    return array_values(array_filter($articles, function ($article) {
                        return ! empty($article['title'])
                            && $article['title'] !== '[Removed]'
                            && ! empty($article['url']);
                    }));
                }

                return [];
            } catch (\Exception $e) {
                return [];
            }
        });
    }

    /**
     * Get all available categories (label => key).
     */
    public function getCategories(): array
    {
        return array_map(function ($entry) {
            return $entry[0];
        }, array_combine(array_keys(self::CATEGORIES), array_values(self::CATEGORIES)));
    }
}
