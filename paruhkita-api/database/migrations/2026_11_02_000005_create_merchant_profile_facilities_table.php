<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('merchant_profile_facilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('merchant_profile_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('category');
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('merchant_profile_facilities');
    }
};
