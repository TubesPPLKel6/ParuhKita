<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workplace_surveys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('merchant_profile_id')->constrained()->cascadeOnDelete();
            $table->string('position', 120);
            $table->string('department', 120);
            $table->date('start_date');
            $table->date('end_date');
            $table->json('ratings');
            $table->text('comments')->nullable();
            $table->timestamps();

            $table->index(['merchant_profile_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workplace_surveys');
    }
};