<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cv_builder_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cv_id')->constrained('student_cvs')->onDelete('cascade');
            $table->string('section_type', 100);
            $table->string('title', 255)->nullable();
            $table->json('content');
            $table->integer('order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cv_builder_sections');
    }
};
