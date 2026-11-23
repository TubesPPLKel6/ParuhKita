<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interview_evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('interview_schedule_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('job_application_id')->constrained()->cascadeOnDelete();
            $table->json('criteria');
            $table->unsignedTinyInteger('total_score')->default(0);
            $table->string('recommendation')->nullable();
            $table->text('feedback')->nullable();
            $table->boolean('send_feedback')->default(false);
            $table->string('decision')->nullable();
            $table->string('status')->default('draft');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interview_evaluations');
    }
};
