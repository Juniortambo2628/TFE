<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Traits\Uploadable;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductController extends Controller
{
    use Uploadable;

    public function index()
    {
        $products = Product::orderByDesc('created_at')
            ->paginate(15)
            ->through(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'category' => $product->category,
                    'price' => $product->price,
                    'image_url' => $product->image ? asset('storage/'.$product->image) : null,
                    'in_stock' => $product->in_stock,
                    'stock_quantity' => $product->stock_quantity,
                ];
            });

        $stats = [
            'total' => Product::count(),
            'out_of_stock' => Product::where('in_stock', false)->orWhere('stock_quantity', '<=', 0)->count(),
            'total_value' => Product::sum(\DB::raw('price * stock_quantity')),
        ];

        return Inertia::render('Admin/Products', [
            'products' => $products,
            'stats' => $stats,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'stock_quantity' => 'required|integer|min:0',
            'in_stock' => 'required|boolean',
            'image' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $this->uploadFile($request->file('image'), 'products');
        }

        Product::create($validated);

        return back()->with('success', 'Product created successfully');
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'stock_quantity' => 'required|integer|min:0',
            'in_stock' => 'required|boolean',
            'image' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $this->uploadFile($request->file('image'), 'products', $product->image);
        }

        $product->update($validated);

        return back()->with('success', 'Product updated successfully');
    }

    public function destroy(Product $product)
    {
        $this->deleteFile($product->image);
        $product->delete();

        return back()->with('success', 'Product deleted successfully');
    }
}
