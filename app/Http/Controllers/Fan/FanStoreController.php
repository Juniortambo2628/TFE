<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FanStoreController extends Controller
{
    public function index()
    {
        $products = Product::orderBy('name')->get()->map(function ($product) {
            return [
                'id' => $product->id,
                'name' => $product->name,
                'category' => $product->category,
                'price' => $product->price,
                'image' => $product->image,
                'description' => $product->description,
                'in_stock' => $product->in_stock,
            ];
        });

        // Get unique categories from products
        $categories = ['All'];
        $productCategories = Product::distinct()->pluck('category')->toArray();
        $categories = array_merge($categories, $productCategories);

        return Inertia::render('Fan/FanStore', [
            'products' => $products,
            'categories' => $categories,
        ]);
    }
}
