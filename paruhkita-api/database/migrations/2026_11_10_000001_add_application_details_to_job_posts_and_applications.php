<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_posts', function (Blueprint $table) {
            if (!Schema::hasColumn('job_posts', 'responsibilities')) {
                $table->text('responsibilities')->nullable();
            }
            if (!Schema::hasColumn('job_posts', 'qualifications')) {
                $table->text('qualifications')->nullable();
            }
            if (!Schema::hasColumn('job_posts', 'application_deadline')) {
                $table->date('application_deadline')->nullable();
            }
        });

        Schema::table('job_applications', function (Blueprint $table) {
            if (!Schema::hasColumn('job_applications', 'motivation')) {
                $table->text('motivation')->nullable();
            }
        });

        if (!Schema::hasTable('job_application_documents')) {
            Schema::create('job_application_documents', function (Blueprint $table) {
                $table->id();
                $table->foreignId('job_application_id')->constrained()->cascadeOnDelete();
                $table->string('document_type', 30);
                $table->string('original_name');
                $table->string('file_path', 500);
                $table->string('mime_type', 100);
                $table->unsignedBigInteger('file_size');
                $table->timestamps();
                $table->unique(['job_application_id', 'document_type'], 'job_app_docs_type_unique');
            });
        }

        if (!Schema::hasTable('job_application_status_histories')) {
            Schema::create('job_application_status_histories', function (Blueprint $table) {
                $table->id();
                $table->foreignId('job_application_id')->constrained()->cascadeOnDelete();
                $table->string('status', 30);
                $table->text('note')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('job_application_status_histories');
        Schema::dropIfExists('job_application_documents');
        Schema::table('job_applications', function (Blueprint $table) {
            $table->dropColumn('motivation');
        });
        Schema::table('job_posts', function (Blueprint $table) {
            $table->dropColumn(['responsibilities', 'qualifications', 'application_deadline']);
        });
    }
};