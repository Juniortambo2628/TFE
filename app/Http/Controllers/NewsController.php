<?php

namespace App\Http\Controllers;

use App\Services\NewsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class NewsController extends Controller
{
    protected $newsService;

    public function __construct(NewsService $newsService)
    {
        $this->newsService = $newsService;
    }

    public function index(?string $category = null): JsonResponse
    {
        $category = $category ?: request()->query('category', 'general');
        $articles = $this->newsService->getLatestNews($category, 8);

        $formatted = array_map(function ($article) {
            return [
                'title' => $article['title'],
                'date' => date('M j, Y', strtotime($article['publishedAt'] ?? 'now')),
                'image' => $article['urlToImage'] ?? null,
                'excerpt' => $article['description'] ?? '',
                'source' => $article['source']['name'] ?? '',
                'url' => $article['url'],
            ];
        }, $articles);

        return response()->json([
            'category' => $category,
            'articles' => $formatted,
        ]);
    }

    public function categories(): JsonResponse
    {
        return response()->json($this->newsService->getCategories());
    }
}
