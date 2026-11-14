<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_posts', function (Blueprint $table) {
            $table->string('location')->nullable()->after('schedule');
        });

        DB::table('job_posts')
            ->leftJoin('merchant_profiles', 'merchant_profiles.id', '=', 'job_posts.merchant_profile_id')
            ->select('job_posts.id', 'merchant_profiles.address')
            ->whereNull('job_posts.location')
            ->get()
            ->each(function ($job) {
                DB::table('job_posts')
                    ->where('id', $job->id)
                    ->update(['location' => $job->address]);
            });
    }

    public function down(): void
    {
        Schema::table('job_posts', function (Blueprint $table) {
            $table->dropColumn('location');
        });
    }
};
