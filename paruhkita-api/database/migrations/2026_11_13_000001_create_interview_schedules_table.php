<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interview_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('merchant_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('job_post_id')->constrained()->cascadeOnDelete();
            $table->foreignId('job_application_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('interview_type')->default('tatap_muka');
            $table->date('scheduled_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->string('location');
            $table->string('status')->default('terjadwal');
            $table->string('availability_label')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index(['merchant_profile_id', 'scheduled_date']);
            $table->index(['user_id', 'scheduled_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interview_schedules');
    }
};
