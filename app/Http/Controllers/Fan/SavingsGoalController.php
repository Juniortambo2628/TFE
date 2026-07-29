<?php

namespace App\Http\Controllers\Fan;

use App\Http\Controllers\Controller;
use App\Models\SavingsGoal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SavingsGoalController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $goals = SavingsGoal::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Fan/SavingsGoals', [
            'goals' => $goals,
            'auth' => ['user' => $user],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'target_amount' => 'required|numeric|min:1000',
            'target_date' => 'nullable|date|after:today',
            'budget_id' => 'nullable|exists:budgets,id',
        ]);

        $user = Auth::user();

        SavingsGoal::create([
            'user_id' => $user->id,
            'budget_id' => $validated['budget_id'] ?? null,
            'name' => $validated['name'],
            'target_amount' => $validated['target_amount'],
            'current_amount' => 0,
            'target_date' => $validated['target_date'] ?? null,
            'status' => 'active',
        ]);

        return back()->with('success', 'Savings goal created successfully!');
    }

    public function update(Request $request, SavingsGoal $savingsGoal)
    {
        if ($savingsGoal->user_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'target_amount' => 'sometimes|numeric|min:1000',
            'target_date' => 'nullable|date',
        ]);

        $savingsGoal->update($validated);

        return back()->with('success', 'Savings goal updated.');
    }

    public function destroy(SavingsGoal $savingsGoal)
    {
        if ($savingsGoal->user_id !== Auth::id()) {
            abort(403);
        }

        $savingsGoal->delete();

        return back()->with('success', 'Savings goal deleted.');
    }
}
