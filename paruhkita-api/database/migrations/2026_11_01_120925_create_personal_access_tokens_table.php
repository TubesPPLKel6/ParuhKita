<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// NOTE: This is a duplicate no-op. personal_access_tokens is handled by the earlier migration.
return new class extends Migration
{
    public function up(): void
    {
        // no-op: personal_access_tokens already handled
    }

    public function down(): void
    {
        // no-op
    }
};
