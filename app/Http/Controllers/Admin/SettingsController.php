<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index()
    {
        $settings = SiteSetting::all()->pluck('value', 'key');

        return Inertia::render('Admin/Settings', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->all();

        foreach ($data as $key => $value) {
            // Handle file uploads
            if ($request->hasFile($key)) {
                $path = $request->file($key)->store('settings', 'public');
                SiteSetting::set($key, Storage::url($path), 'image');
            } elseif (! is_array($value)) {
                // Determine type
                $type = is_bool($value) ? 'boolean' : 'text';
                SiteSetting::set($key, $value, $type);
            }
        }

        return back()->with('success', 'Settings updated successfully');
    }

    public function refreshTournaments(Request $request)
    {
        $id = $request->input('id');

        $params = [];
        if (! empty($id)) {
            $params = ['--id' => [$id]];
        }

        Artisan::call('tournaments:refresh', $params);
        $output = Artisan::output();

        return back()->with('success', 'Tournament data refreshed.')->with('tournament_refresh_output', $output);
    }
}
