<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('campuses', function (Blueprint $table) {
            $table->string('code', 20)->nullable()->unique();
            $table->string('accreditation')->nullable();
        });

        Schema::table('study_programs', function (Blueprint $table) {
            $table->string('code')->nullable();
            $table->string('degree_level')->default('S1');
            $table->string('status')->default('active');
        });

        Schema::create('job_subcategories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_category_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();
            $table->unique(['job_category_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_subcategories');

        Schema::table('study_programs', function (Blueprint $table) {
            $table->dropColumn(['code', 'degree_level', 'status']);
        });

        Schema::table('campuses', function (Blueprint $table) {
            $table->dropUnique(['code']);
            $table->dropColumn(['code', 'accreditation']);
        });

    }
};
