<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sprint 14 — attribute each loan application to a finance partner.
 *
 * A LoanApplication is now routed to a specific finance partner (an
 * Ecobank, a KCB, a future stakeholder) so that partner's dashboard
 * can show their own conversion queue rather than the global one.
 * Nullable so legacy rows survive and admin-created applications
 * without a partner routing still work.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('loan_applications')) {
            return;
        }

        Schema::table('loan_applications', function (Blueprint $t) {
            if (! Schema::hasColumn('loan_applications', 'finance_partner_id')) {
                $t->foreignId('finance_partner_id')
                    ->nullable()
                    ->after('budget_id')
                    ->constrained('users')
                    ->nullOnDelete();
                $t->index(['finance_partner_id', 'status']);
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('loan_applications')) {
            return;
        }

        Schema::table('loan_applications', function (Blueprint $t) {
            if (Schema::hasColumn('loan_applications', 'finance_partner_id')) {
                $t->dropForeign(['finance_partner_id']);
                $t->dropIndex(['finance_partner_id', 'status']);
                $t->dropColumn('finance_partner_id');
            }
        });
    }
};
