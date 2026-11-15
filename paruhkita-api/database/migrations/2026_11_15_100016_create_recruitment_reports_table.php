<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recruitment_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reporter_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('job_post_id')->nullable()->constrained('job_posts')->nullOnDelete();
            $table->foreignId('merchant_profile_id')->nullable()->constrained('merchant_profiles')->nullOnDelete();
            $table->string('stage', 50); // 'recruitment' atau 'work'
            $table->string('category', 100); // Jenis pelanggaran
            $table->string('title', 255);
            $table->text('description');
            $table->string('evidence_path', 500)->nullable();
            $table->string('evidence_name')->nullable();
            $table->string('status', 30)->default('submitted'); // submitted, investigating, resolved, dismissed
            $table->text('admin_note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recruitment_reports');
    }
};
