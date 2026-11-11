<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('merchant_profiles', function (Blueprint $table) {
            $table->string('verification_status')->default('not_submitted');
            $table->timestamp('verification_submitted_at')->nullable();
            $table->text('verification_note')->nullable();
        });

        Schema::create('merchant_verification_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('merchant_profile_id')->constrained()->cascadeOnDelete();
            $table->string('document_type');
            $table->string('file_path');
            $table->string('original_name');
            $table->timestamps();
            $table->unique(['merchant_profile_id', 'document_type'], 'mvd_profile_doc_type_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('merchant_verification_documents');

        Schema::table('merchant_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'verification_status',
                'verification_submitted_at',
                'verification_note',
            ]);
        });
    }
};
