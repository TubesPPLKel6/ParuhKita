<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            $table->string('nim', 50)->nullable()->after('major');
            $table->string('ktm_file_path')->nullable()->after('nim');
            $table->boolean('is_verified')->default(false)->after('is_profile_public');
            $table->enum('verification_status', ['not_submitted', 'pending', 'approved', 'revision_required', 'rejected'])
                ->default('not_submitted')->after('is_verified');
            $table->timestamp('verification_submitted_at')->nullable()->after('verification_status');
            $table->timestamp('verified_at')->nullable()->after('verification_submitted_at');
            $table->text('verification_note')->nullable()->after('verified_at');
            $table->foreignId('verified_by_user_id')->nullable()->constrained('users')->nullOnDelete()->after('verification_note');
        });
    }

    public function down(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            $table->dropForeign(['verified_by_user_id']);
            $table->dropColumn([
                'nim', 'ktm_file_path', 'is_verified', 'verification_status',
                'verification_submitted_at', 'verified_at', 'verification_note', 'verified_by_user_id',
            ]);
        });
    }
};
