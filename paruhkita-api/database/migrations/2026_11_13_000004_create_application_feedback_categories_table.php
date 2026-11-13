<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('application_feedback_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_application_id')->constrained()->cascadeOnDelete();
            $table->string('name', 80);
            $table->unsignedTinyInteger('score')->nullable();
            $table->text('note')->nullable();
            $table->unsignedSmallInteger('position')->default(0);
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->index(['job_application_id', 'position']);
        });

        // Backfill kategori bawaan dari laporan feedback yang sudah ada.
        $reports = DB::table('application_feedback_reports')->get();

        foreach ($reports as $report) {
            $defaults = [
                ['name' => 'Dokumen CV', 'score' => $report->cv_score, 'note' => $report->cv_note],
                ['name' => 'Portofolio', 'score' => $report->portfolio_score, 'note' => $report->portfolio_note],
                ['name' => 'Tingkat Keterampilan (Skills)', 'score' => $report->skills_score, 'note' => $report->skills_note],
            ];

            foreach ($defaults as $index => $category) {
                DB::table('application_feedback_categories')->insert([
                    'job_application_id' => $report->job_application_id,
                    'name' => $category['name'],
                    'score' => $category['score'],
                    'note' => $category['note'],
                    'position' => $index,
                    'is_default' => true,
                    'created_at' => $report->created_at,
                    'updated_at' => $report->updated_at,
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('application_feedback_categories');
    }
};
