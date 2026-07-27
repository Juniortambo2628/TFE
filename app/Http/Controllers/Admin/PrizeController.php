<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Prize;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PrizeController extends Controller
{
    public function index()
    {
        $prizes = Prize::orderBy('position')
            ->get()
            ->map(function ($prize) {
                return [
                    'id' => $prize->id,
                    'position' => $prize->position,
                    'name' => $prize->name,
                    'description' => $prize->description,
                    'value' => $prize->value,
                    'value_formatted' => $prize->formatted_value,
                    'active' => $prize->active,
                ];
            });

        return Inertia::render('Admin/Prizes', [
            'prizes' => $prizes,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'position' => 'required|integer|unique:prizes,position',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'value' => 'required|numeric|min:0',
            'active' => 'required|boolean',
        ]);

        Prize::create($validated);

        return back()->with('success', 'Prize created successfully');
    }

    public function update(Request $request, Prize $prize)
    {
        $validated = $request->validate([
            'position' => 'required|integer|unique:prizes,position,'.$prize->id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'value' => 'required|numeric|min:0',
            'active' => 'required|boolean',
        ]);

        $prize->update($validated);

        return back()->with('success', 'Prize updated successfully');
    }

    public function destroy(Prize $prize)
    {
        $prize->delete();

        return back()->with('success', 'Prize deleted successfully');
    }
}
