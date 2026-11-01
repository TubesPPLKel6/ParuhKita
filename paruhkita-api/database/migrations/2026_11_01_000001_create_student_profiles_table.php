<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('photo_url', 500)->nullable();
            $table->string('phone', 20)->nullable();
            $table->text('bio')->nullable();
            $table->string('university', 255)->nullable();
            $table->string('faculty', 255)->nullable();
            $table->string('major', 255)->nullable();
            $table->year('graduation_year')->nullable();
            $table->decimal('gpa', 3, 2)->nullable();
            $table->string('linkedin_url', 500)->nullable();
            $table->string('github_url', 500)->nullable();
            $table->string('instagram_url', 500)->nullable();
            $table->boolean('is_profile_public')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_profiles');
    }
};
