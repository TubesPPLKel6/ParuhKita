<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('application_feedback_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_application_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('cv_score')->nullable();
            $table->unsignedTinyInteger('portfolio_score')->nullable();
            $table->unsignedTinyInteger('skills_score')->nullable();
            $table->text('cv_note')->nullable();
            $table->text('portfolio_note')->nullable();
            $table->text('skills_note')->nullable();
            $table->json('recommendations')->nullable();
            $table->string('status')->default('draft');
            $table->timestamp('decided_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('application_feedback_reports');
    }
};
