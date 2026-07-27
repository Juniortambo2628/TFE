<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class NewsService
{
    protected $apiKey;

    protected $baseUrl = 'https://newsapi.org/v2';

    public function __construct()
    {
        $this->apiKey = config('services.newsapi.key');
    }

    public function getLatestNews($query = 'FIFA World Cup 2026', $pageSize = 3)
    {
        if (empty($this->apiKey)) {
            return [];
        }

        // Cache for 1 hour (3600 seconds) to avoid hitting API limits and improve performance
        // REMOVE CACHE FOR DEBUGGING
        // return Cache::remember('news_feed', 3600, function () use ($query, $pageSize) {
        try {
            \Illuminate\Support\Facades\Log::info('NewsService: Attempting to fetch news.');

            if (empty($this->apiKey)) {
                \Illuminate\Support\Facades\Log::error('NewsService: API Key is missing.');

                return [];
            }

            $response = Http::withoutVerifying()->timeout(5)->get("{$this->baseUrl}/everything", [
                'q' => $query,
                'language' => 'en',
                'sortBy' => 'relevancy',
                'pageSize' => $pageSize,
                'apiKey' => $this->apiKey,
            ]);

            \Illuminate\Support\Facades\Log::info('NewsService: Response Status: '.$response->status());

            if ($response->successful()) {
                $articles = $response->json()['articles'] ?? [];
                \Illuminate\Support\Facades\Log::info('NewsService: Articles count: '.count($articles));

                return $articles;
            } else {
                \Illuminate\Support\Facades\Log::error('NewsService: API Error: '.$response->body());
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('NewsService: Exception: '.$e->getMessage());

            return [];
        }

        return [];
        // });
    }
}
