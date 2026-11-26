<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Campus;
use App\Services\ActivityLogService;
use App\Models\JobCategory;
use App\Models\JobSubcategory;
use App\Models\StudyProgram;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminReferenceDataController extends Controller
{
    public function index(Request $request)
    {
        $this->authorizeAdmin($request);

        $campuses = Campus::withCount('studyPrograms')->orderBy('name')->get();
        $campusStudents = DB::table('student_profiles')
            ->select('university', DB::raw('COUNT(*) as total'))
            ->whereNotNull('university')
            ->groupBy('university')
            ->get()
            ->mapWithKeys(fn ($row) => [$row->university => (int) $row->total]);
        $campuses->each(fn (Campus $campus) => $campus->setAttribute('students_count', $campusStudents[$campus->name] ?? 0));

        $studyPrograms = StudyProgram::with('campus:id,name,code')->orderBy('name')->get();
        $programStudents = DB::table('student_profiles')
            ->select('university', 'major', DB::raw('COUNT(*) as total'))
            ->whereNotNull('university')
            ->whereNotNull('major')
            ->groupBy('university', 'major')
            ->get()
            ->mapWithKeys(fn ($row) => [$row->university."\0".$row->major => (int) $row->total]);
        $studyPrograms->each(function (StudyProgram $program) use ($programStudents) {
            $key = ($program->campus?->name ?? '')."\0".$program->name;
            $program->setAttribute('students_count', $programStudents[$key] ?? 0);
        });

        return response()->json([
            'status' => true,
            'data' => [
                'campuses' => $campuses,
                'study_programs' => $studyPrograms,
                'job_categories' => JobCategory::withCount('subcategories')->orderBy('name')->get(),
                'job_subcategories' => JobSubcategory::with('category:id,name')->orderBy('name')->get(),
            ],
        ]);
    }

    public function storeCampus(Request $request)
    {
        $this->authorizeAdmin($request);
        $campus = Campus::create($request->validate([
            'name' => 'required|string|max:255|unique:campuses,name',
            'code' => 'nullable|string|max:20|unique:campuses,code',
            'city' => 'required|string|max:255',
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'accreditation' => 'nullable|string|max:50',
        ]));

        ActivityLogService::logAuth('create', 'Menambahkan data kampus ' . $campus->name, 'Campus', $campus->id);

        return $this->created('Kampus berhasil ditambahkan.', $campus->loadCount('studyPrograms'));
    }

    public function updateCampus(Request $request, Campus $campus)
    {
        $this->authorizeAdmin($request);
        $campus->update($request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('campuses', 'name')->ignore($campus->id)],
            'code' => ['nullable', 'string', 'max:20', Rule::unique('campuses', 'code')->ignore($campus->id)],
            'city' => 'required|string|max:255',
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'accreditation' => 'nullable|string|max:50',
        ]));

        ActivityLogService::logAuth('update', 'Memperbarui data kampus ' . $campus->name, 'Campus', $campus->id);

        return $this->success('Kampus berhasil diperbarui.', $campus->fresh()->loadCount('studyPrograms'));
    }

    public function destroyCampus(Request $request, Campus $campus)
    {
        $this->authorizeAdmin($request);
        if ($campus->studyPrograms()->exists()) {
            return response()->json([
                'status' => false,
                'message' => 'Kampus tidak dapat dihapus selama masih memiliki program studi.',
            ], 422);
        }

        ActivityLogService::logAuth('delete', 'Menghapus data kampus ' . $campus->name, 'Campus', $campus->id);
        $campus->delete();
        return $this->success('Kampus berhasil dihapus.');
    }

    public function storeStudyProgram(Request $request)
    {
        $this->authorizeAdmin($request);
        $program = StudyProgram::create($request->validate([
            'campus_id' => 'required|integer|exists:campuses,id',
            'degree_level' => ['sometimes', 'required', 'string', Rule::in(['S1', 'D3', 'D4', 'S2', 'S3'])],
            'status' => ['sometimes', 'required', Rule::in(['active', 'inactive'])],
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('study_programs', 'name')->where('campus_id', $request->input('campus_id')),
            ],
            'code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('study_programs', 'code')
                    ->where('campus_id', $request->input('campus_id')),
            ],
        ]));

        ActivityLogService::logAuth('create', 'Menambahkan program studi ' . $program->name, 'StudyProgram', $program->id);

        return $this->created('Program studi berhasil ditambahkan.', $program->load('campus:id,name'));
    }

    public function updateStudyProgram(Request $request, StudyProgram $studyProgram)
    {
        $this->authorizeAdmin($request);
        $validated = $request->validate([
            'campus_id' => 'required|integer|exists:campuses,id',
            'degree_level' => ['sometimes', 'required', 'string', Rule::in(['S1', 'D3', 'D4', 'S2', 'S3'])],
            'status' => ['sometimes', 'required', Rule::in(['active', 'inactive'])],
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('study_programs', 'name')
                    ->where('campus_id', $request->input('campus_id'))
                    ->ignore($studyProgram->id),
            ],
            'code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('study_programs', 'code')
                    ->where('campus_id', $request->input('campus_id'))
                    ->ignore($studyProgram->id),
            ],
        ]);
        $studyProgram->update($validated);

        ActivityLogService::logAuth('update', 'Memperbarui program studi ' . $studyProgram->name, 'StudyProgram', $studyProgram->id);

        return $this->success('Program studi berhasil diperbarui.', $studyProgram->fresh()->load('campus:id,name'));
    }

    public function destroyStudyProgram(Request $request, StudyProgram $studyProgram)
    {
        $this->authorizeAdmin($request);
        ActivityLogService::logAuth('delete', 'Menghapus program studi ' . $studyProgram->name, 'StudyProgram', $studyProgram->id);
        $studyProgram->delete();

        return $this->success('Program studi berhasil dihapus.');
    }

    public function storeJobCategory(Request $request)
    {
        $this->authorizeAdmin($request);
        $category = JobCategory::create($request->validate([
            'name' => 'required|string|max:255|unique:job_categories,name',
            'description' => 'required|string|max:2000',
            'status' => ['sometimes', 'required', Rule::in(['active', 'inactive'])],
        ]));

        ActivityLogService::logAuth('create', 'Menambahkan kategori pekerjaan ' . $category->name, 'JobCategory', $category->id);

        return $this->created('Kategori pekerjaan berhasil ditambahkan.', $category);
    }

    public function updateJobCategory(Request $request, JobCategory $jobCategory)
    {
        $this->authorizeAdmin($request);
        $jobCategory->update($request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('job_categories', 'name')->ignore($jobCategory->id)],
            'description' => 'required|string|max:2000',
            'status' => ['sometimes', 'required', Rule::in(['active', 'inactive'])],
        ]));

        ActivityLogService::logAuth('update', 'Memperbarui kategori pekerjaan ' . $jobCategory->name, 'JobCategory', $jobCategory->id);

        return $this->success('Kategori pekerjaan berhasil diperbarui.', $jobCategory->fresh());
    }

    public function destroyJobCategory(Request $request, JobCategory $jobCategory)
    {
        $this->authorizeAdmin($request);
        ActivityLogService::logAuth('delete', 'Menghapus kategori pekerjaan ' . $jobCategory->name, 'JobCategory', $jobCategory->id);
        $jobCategory->delete();

        return $this->success('Kategori pekerjaan berhasil dihapus.');
    }

    public function storeJobSubcategory(Request $request)
    {
        $this->authorizeAdmin($request);
        $validated = $request->validate([
            'job_category_id' => 'required|integer|exists:job_categories,id',
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('job_subcategories', 'name')->where('job_category_id', $request->input('job_category_id')),
            ],
        ]);
        $subcategory = JobSubcategory::create($validated);

        ActivityLogService::logAuth('create', 'Menambahkan subkategori pekerjaan ' . $subcategory->name, 'JobSubcategory', $subcategory->id);

        return $this->created('Subkategori pekerjaan berhasil ditambahkan.', $subcategory->load('category:id,name'));
    }

    public function updateJobSubcategory(Request $request, JobSubcategory $jobSubcategory)
    {
        $this->authorizeAdmin($request);
        $validated = $request->validate([
            'job_category_id' => 'required|integer|exists:job_categories,id',
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('job_subcategories', 'name')
                    ->where('job_category_id', $request->input('job_category_id'))
                    ->ignore($jobSubcategory->id),
            ],
        ]);
        $jobSubcategory->update($validated);

        ActivityLogService::logAuth('update', 'Memperbarui subkategori pekerjaan ' . $jobSubcategory->name, 'JobSubcategory', $jobSubcategory->id);

        return $this->success('Subkategori pekerjaan berhasil diperbarui.', $jobSubcategory->fresh()->load('category:id,name'));
    }

    public function destroyJobSubcategory(Request $request, JobSubcategory $jobSubcategory)
    {
        $this->authorizeAdmin($request);
        ActivityLogService::logAuth('delete', 'Menghapus subkategori pekerjaan ' . $jobSubcategory->name, 'JobSubcategory', $jobSubcategory->id);
        $jobSubcategory->delete();

        return $this->success('Subkategori pekerjaan berhasil dihapus.');
    }

    private function authorizeAdmin(Request $request): void
    {
        abort_unless($request->user()?->role === 'admin', 403, 'Akses hanya untuk admin.');
        abort_unless($request->user()?->role === 'admin', 403, 'Akses ditolak untuk peran akun ini.');
    }

    private function created(string $message, $data)
    {
        return response()->json(['status' => true, 'message' => $message, 'data' => $data], 201);
    }

    private function success(string $message, $data = null)
    {
        $response = ['status' => true, 'message' => $message];
        if ($data !== null) {
            $response['data'] = $data;
        }

        return response()->json($response);
    }
}
