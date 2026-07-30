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

        return Cache::remember('news_feed', 3600, function () use ($query, $pageSize) {
            try {
                $response = Http::withoutVerifying()->timeout(5)->get("{$this->baseUrl}/everything", [
                    'q' => $query,
                    'language' => 'en',
                    'sortBy' => 'relevancy',
                    'pageSize' => $pageSize,
                    'apiKey' => $this->apiKey,
                ]);

                if ($response->successful()) {
                    return $response->json()['articles'] ?? [];
                }

                return [];
            } catch (\Exception $e) {
                return [];
            }
        });
    }
}
