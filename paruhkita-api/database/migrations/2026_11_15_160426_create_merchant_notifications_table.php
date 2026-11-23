<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('merchant_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('merchant_profile_id')->constrained('merchant_profiles')->cascadeOnDelete();
            $table->foreignId('recruitment_report_id')->nullable()->constrained('recruitment_reports')->nullOnDelete();
            $table->string('title', 255);
            $table->text('message');
            $table->boolean('is_read')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('merchant_notifications');
    }
};
