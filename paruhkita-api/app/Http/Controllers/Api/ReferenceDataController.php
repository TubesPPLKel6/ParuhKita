<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobCategory;

class ReferenceDataController extends Controller
{
    public function jobCategories()
    {
        return response()->json([
            'status' => true,
            'data' => JobCategory::where('status', 'active')
                ->with('subcategories:id,job_category_id,name')
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }
}
