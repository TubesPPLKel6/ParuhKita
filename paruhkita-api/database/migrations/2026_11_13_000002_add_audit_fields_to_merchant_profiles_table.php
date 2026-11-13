<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('merchant_profiles', function (Blueprint $table) {
            $table->timestamp('verified_at')->nullable()->after('verification_note');
            $table->foreignId('verified_by_user_id')->nullable()->constrained('users')->nullOnDelete()->after('verified_at');
        });
    }

    public function down(): void
    {
        Schema::table('merchant_profiles', function (Blueprint $table) {
            $table->dropForeign(['verified_by_user_id']);
            $table->dropColumn(['verified_at', 'verified_by_user_id']);
        });
    }
};
