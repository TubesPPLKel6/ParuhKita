<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    /**
     * GET /api/v1/activity-logs
     *
     * Query params:
     *   - search      (string)   free-text filter on description
     *   - action_type (string)   create | update | delete
     *   - start_date  (date)     YYYY-MM-DD
     *   - end_date    (date)     YYYY-MM-DD
     *   - page        (int)      pagination page (10 per page)
     *
     * Access rules:
     *   - mahasiswa  → own logs (role = mahasiswa)
     *   - merchant   → own logs (role = merchant)
     *   - admin      → all admin-role logs
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = ActivityLog::query();

        if ($user->role === 'admin') {
            // Admin sees all admin-role logs
            $query->where('role', 'admin');
        } else {
            // Pelamar & Merchant only see their own logs
            $query->where('user_id', $user->id);
        }

        // Filter: search in description
        if ($search = $request->query('search')) {
            $query->where('description', 'like', '%' . $search . '%');
        }

        // Filter: action type
        if ($actionType = $request->query('action_type')) {
            if (in_array($actionType, ['create', 'update', 'delete'])) {
                $query->where('action_type', $actionType);
            }
        }

        // Filter: date range
        if ($startDate = $request->query('start_date')) {
            $query->whereDate('created_at', '>=', $startDate);
        }
        if ($endDate = $request->query('end_date')) {
            $query->whereDate('created_at', '<=', $endDate);
        }

        $query->orderByDesc('created_at');

        $paginator = $query->paginate(10)->withQueryString();

        return response()->json([
            'status' => true,
            'data'   => $paginator->items(),
            'meta'   => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'total'        => $paginator->total(),
                'per_page'     => $paginator->perPage(),
                'from'         => $paginator->firstItem(),
                'to'           => $paginator->lastItem(),
            ],
        ]);
    }
}
