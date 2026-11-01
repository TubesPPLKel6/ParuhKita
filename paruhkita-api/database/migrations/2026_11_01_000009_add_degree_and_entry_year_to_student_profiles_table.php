<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            $table->string('degree_level', 50)->nullable()->after('major'); // e.g. D3, D4, S1, S2, S3
            $table->integer('entry_year')->nullable()->after('degree_level'); // e.g. 2024
            $table->boolean('is_currently_studying')->default(true)->after('graduation_year'); // masih menempuh studi?
        });
    }

    public function down(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            $table->dropColumn(['degree_level', 'entry_year', 'is_currently_studying']);
        });
    }
};

