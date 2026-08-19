<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ad;
use App\Traits\Uploadable;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdController extends Controller
{
    use Uploadable;

    public function index()
    {
        $ads = Ad::latest()->get();

        return Inertia::render('Admin/Ads', [
            'ads' => $ads,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'link_url' => 'nullable|url',
            'ad_type' => 'required|string',
            'partner_name' => 'nullable|string',
            'image' => 'required|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $validated['image_url'] = $this->uploadFile($request->file('image'), 'ads');
            unset($validated['image']);
        }

        Ad::create($validated);

        return back()->with('success', 'Ad created');
    }

    public function update(Request $request, Ad $ad)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'link_url' => 'nullable|url',
            'ad_type' => 'required|string',
            'partner_name' => 'nullable|string',
            'image' => 'nullable|image|max:2048',
            'is_active' => 'boolean',
        ]);

        if ($request->hasFile('image')) {
            $validated['image_url'] = $this->uploadFile($request->file('image'), 'ads', $ad->image_url);
            unset($validated['image']);
        }

        $ad->update($validated);

        return back()->with('success', 'Ad updated');
    }

    public function destroy(Ad $ad)
    {
        $this->deleteFile($ad->image_url);
        $ad->delete();

        return back()->with('success', 'Ad deleted');
    }
}
