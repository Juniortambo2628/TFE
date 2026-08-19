<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $this->convertEnumToString('fixtures', 'status');
        $this->convertEnumToString('loan_applications', 'status');
        $this->convertEnumToString('transactions', 'type');
        $this->convertEnumToString('transactions', 'status');
        $this->convertEnumToString('world_cup_matches', 'status');
        $this->convertEnumToString('announcements', 'type');
        $this->convertEnumToString('event_rsvps', 'status');
        $this->convertEnumToString('payment_methods', 'type');
        $this->convertEnumToString('payment_transactions', 'type');
        $this->convertEnumToString('payment_transactions', 'method');
        $this->convertEnumToString('payment_transactions', 'status');
    }

    public function down(): void
    {
        // Enums are not easily restored; create a new migration if rollback is needed.
    }

    private function convertEnumToString(string $table, string $column): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE `{$table}` MODIFY `{$column}` VARCHAR(255) NOT NULL");
        } elseif ($driver === 'sqlite') {
            // SQLite stores enums as TEXT natively, no-op.
        } elseif ($driver === 'pgsql') {
            DB::statement("ALTER TABLE \"{$table}\" ALTER COLUMN \"{$column}\" TYPE VARCHAR(255) USING \"{$column}\"::VARCHAR(255)");
        }
    }
};
