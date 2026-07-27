<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('loan_applications')) {
            Schema::create('loan_applications', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->decimal('amount', 12, 2);
                $table->string('purpose')->nullable();
                $table->enum('status', ['PENDING', 'APPROVED', 'REJECTED', 'DISBURSED'])->default('PENDING');
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('transactions')) {
            Schema::create('transactions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->enum('type', ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'PAYMENT']);
                $table->decimal('amount', 12, 2);
                $table->enum('status', ['PENDING', 'COMPLETED', 'FAILED'])->default('PENDING');
                $table->string('reference')->nullable();
                $table->text('description')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('loan_applications');
    }
};
