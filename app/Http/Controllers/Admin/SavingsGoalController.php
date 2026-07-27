<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SavingsGoal;
use Inertia\Inertia;

class SavingsGoalController extends Controller
{
    public function index()
    {
        $goals = SavingsGoal::with(['user', 'budget'])
            ->orderByDesc('created_at')
            ->paginate(15)
            ->through(function ($goal) {
                return [
                    'id' => $goal->id,
                    'user_name' => $goal->user->name ?? 'Unknown',
                    'budget_name' => $goal->budget->name ?? 'N/A',
                    'target_amount' => $goal->target_amount,
                    'current_amount' => $goal->current_amount,
                    'progress' => $goal->target_amount > 0 ? round(($goal->current_amount / $goal->target_amount) * 100, 1) : 0,
                    'status' => $goal->status,
                    'created_at' => $goal->created_at->format('M d, Y'),
                ];
            });

        $stats = [
            'total' => SavingsGoal::count(),
            'active' => SavingsGoal::where('status', 'ACTIVE')->count(),
            'completed' => SavingsGoal::where('status', 'COMPLETED')->count(),
            'total_saved' => SavingsGoal::sum('current_amount'),
        ];

        return Inertia::render('Admin/SavingsGoals', [
            'goals' => $goals,
            'stats' => $stats,
        ]);
    }

    public function destroy(SavingsGoal $savingsGoal)
    {
        $savingsGoal->delete();

        return back()->with('success', 'Savings goal deleted successfully');
    }
}
