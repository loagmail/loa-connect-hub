# Student CSV Upload Flow

> Design document for the student CSV bulk import feature.
> Pre-requisite: Faculty CSV upload (establishes Faculty-Subject-Section mappings).

---

## CSV Format

```
student email, name, subject code, section
alice.student@lyceumalabang.edu.ph, Alice Student, ELEC-323, BSIT-32A1
```

| Column | Header | Required | Description |
|--------|--------|----------|-------------|
| 1 | `student email` | Yes | Email (must end with `@lyceumalabang.edu.ph` or `@itmlyceumalabang.onmicrosoft.com`) |
| 2 | `name` | Yes | Student's full name |
| 3 | `subject code` | Yes | Subject code (e.g. `ELEC-323`) |
| 4 | `section` | Yes | Section identifier with program prefix (e.g. `BSIT-32A1`) — parsed into `{program, name}` |

Mirrors the ETL faculty format (`faculty email, name, subject code, section`).

---

## Per-Row Validation & Processing

```
For each CSV row (in order):

  1. Parse & validate columns
     - Email domain must match allowed patterns
     - Name must not be empty
     - Subject code must not be empty
     - Section must not be empty
     - Parse section "BSIT-32A1" → { program: "BSIT", name: "32A1" }
     → Failure → add to parseErrors, skip row

  2. Check if user exists by email
     → Not found: create STUDENT user (name, email, departmentId from uploader)
     → Found: skip user creation (no-op)

  3. Validate section exists
     - sectionRepository.findByNameAndProgram(name, program)
     → Not found → add to failed[] with remark "Section not found", skip row

  4. Validate subject exists
     - subjectRepository.findByCode(code)
     → Not found → add to failed[] with remark "Subject not found", skip row

  5. Validate faculty-subject mapping exists
     - facultySubjectRepository.findBySubjectAndSection(subjectId, sectionId)
     → Not found → add to failed[] with remark "No faculty assigned to [code] in [section]", skip row

  6. Create enrollment (additive)
     - Check if student_enrollment already exists for (studentId, sectionId)
     - If not exists: insert
     → Success → add to enrolled[]
```

**No auto-creation of sections or subjects.** The faculty upload must establish them first.

---

## API: `POST /api/import/students`

### Request

`multipart/form-data` with CSV file, or `application/json` with rows array.

### Auth

FACULTY, DEAN, or ADMIN.

### Response

```json
{
  "created": [
    { "name": "Alice Cruz", "email": "alice@...", "role": "STUDENT" }
  ],
  "skipped": [
    { "email": "bob@...", "reason": "User already exists" }
  ],
  "enrolled": 5,
  "failed": [
    { "row": 3, "email": "carol@...", "subjectCode": "ENGL-101", "section": "BSIT-32A1", "remark": "Subject ENGL-101 not found" }
  ],
  "parseErrors": [
    { "row": 4, "message": "Email must end with @lyceumalabang.edu.ph" }
  ],
  "successCsv": "student email,name,subject code,section\nalice@...,Alice Cruz,ELEC-323,BSIT-32A1\n...",
  "failureCsv": "student email,name,subject code,section,remarks\ncarol@...,Carol Tan,ENGL-101,BSIT-32A1,Subject ENGL-101 not found\n...",
  "totalRows": 10
}
```

`successCsv` and `failureCsv` are CSV strings the client can turn into blob downloads — no Excel library needed.

---

## UI Flow

1. User selects CSV file, clicks **Upload & Import**
2. **Blocking modal** appears with spinner/progress bar (user cannot interact)
3. On completion, modal shows summary:
   - X users created
   - Y enrollments created
   - Z failed rows
   - W parse errors
4. Two download buttons in the modal:
   - **Download Successes (.csv)** — blob from `successCsv`
   - **Download Failures (.csv)** — blob from `failureCsv`
5. User dismisses modal; results remain visible on the page below

---

## Files

### New

| File | Purpose |
|------|---------|
| `lib/services/studentImport.ts` | `parseStudentCsv()`, `importStudents()`, `getStudentCsvTemplate()` |

### Modified

| File | Changes |
|------|---------|
| `app/api/import/students/route.ts` | Replace `importUsers()` with new `importStudents()`. Return `successCsv` + `failureCsv`. Keep GET for template download. |
| `app/faculty/upload/page.tsx` | Update template display to new 4-col format. Add blocking progress modal. Add summary + two download buttons. |
| `app/dean/upload/page.tsx` | Same UI updates for student toggle. |

### Tests

| File | Purpose |
|------|---------|
| `lib/__tests__/studentImport.test.ts` | Tests for parse + import + validation paths + edge cases |

### No changes to

- `csvParser.ts` — new parser lives in `studentImport.ts`
- `userImport.ts` — no longer called for students
- `package.json` — no new dependencies
- DB schema — all tables already exist

---

## Key Design Properties

| Property | Behavior |
|----------|----------|
| **Idempotent** | Re-uploading same CSV creates no duplicates (user check + enrollment check) |
| **Safe** | Per-row granularity — one failure doesn't block the batch |
| **Debuggable** | Successes and failures downloadable as CSVs with remarks column |
| **Enforces prerequisite** | Section, subject, and faculty-subject mapping must exist before enrollment |
| **Consistent** | Mirrors ETL patterns (`parseSectionIdentifier`, batch lookups) |
| **Non-destructive** | Additive only — never deletes existing enrollments |
