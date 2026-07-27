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

    public function index(): JsonResponse
    {
        $articles = $this->newsService->getLatestNews();
        
        // Transform the data to match frontend expectations if necessary
        // NewsAPI returns: source, author, title, description, url, urlToImage, publishedAt, content
        
        $formatted = array_map(function($article) {
            return [
                'title' => $article['title'],
                'date' => date('M j, Y', strtotime($article['publishedAt'])),
                'image' => $article['urlToImage'],
                'excerpt' => $article['description'],
                'url' => $article['url']
            ];
        }, $articles);

        return response()->json($formatted);
    }
}
