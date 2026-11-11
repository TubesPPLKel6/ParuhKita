<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobApplicationDocument extends Model
{
    protected $fillable = [
        'document_type',
        'original_name',
        'file_path',
        'mime_type',
        'file_size',
    ];
}