# Dean Report 1: Department Faculty Consultation & Performance Report

This document serves as an extremely detailed prompt and implementation plan to build the first reporting feature for Deans. 

## Strict Constraints
- **NO PRISMA**: You must exclusively use `@supabase/supabase-js` for all database interactions.
- **Premium Aesthetics**: The UI must follow modern web design principles (clean Tailwind CSS, harmonious colors, micro-animations on hover, beautiful typography, clear data visualization).
- **Security**: Validate that the user is authenticated and has the `DEAN` role.

---

## Step-by-Step Implementation Prompt

### Phase 1: Repository Layer (Data Access)
1. **Define Interfaces**:
   - In `lib/repositories/interfaces.ts`, create a new interface `IReportsRepository`.
   - Add a method signature: `getDepartmentConsultationStats(departmentId: string, filters?: { startDate?: string, endDate?: string, status?: string }): Promise<FacultyStatsData[]>`
   - Define `FacultyStatsData` type containing: `facultyId`, `facultyName`, `total`, `completed`, `pending`, `cancelled`, and `completionRate`, plus a list of raw appointments if needed for transformation.
2. **Implement Supabase Query**:
   - Create or update `lib/repositories/supabase.ts` (or a dedicated `reports_supabase.ts` if preferred) to implement `IReportsRepository`.
   - **Query Logic**:
     1. Query the `users` table where `departmentId` matches the target department and `role = 'FACULTY'`.
     2. Query the `appointments` table where `meetingType = 'CONSULTATION'` and `facultyId` is in the list of the fetched faculty IDs. Apply `gte` and `lte` filters on the `date` column if dates are provided, and filter by `status` if provided.
     3. Group appointments dynamically in TypeScript to aggregate the counts for each faculty member.
3. **Update Factory**:
   - Expose the new repository through `lib/repositories/factory.ts` as `reportsRepository`.

### Phase 2: Controller Layer (Business Logic)
1. **Create Controller**:
   - Create `lib/controllers/reports.ts`.
2. **Implement Service Method**:
   - Add function `getDeanDepartmentStats(deanId: string, filters?: { startDate?: string, endDate?: string, status?: string })`.
   - Logic:
     - Fetch the Dean's department using `departmentRepository.findByDeanId(deanId)`.
     - Throw an error or return null if the Dean has no assigned department.
     - Call `reportsRepository.getDepartmentConsultationStats(department.id, filters)`.
     - Return an object: `{ departmentName: department.name, stats: facultyStatsArray, rawData: appointments }`.

### Phase 3: Presentation Layer (UI/UX, Viz, Extraction)
1. **Create Page Route & Data Fetching**:
   - Create a new Server Component at `app/faculty/reports/page.tsx`.
   - Require authentication and verify `session.user.role === "DEAN"`.
   - Fetch data securely on the server, passing URL `searchParams` for filters (start, end, status).
2. **Interactive Filtering System**:
   - Create a sleek client-side form updating URL parameters:
     - Date Range Picker (Start & End).
     - Status Dropdown Filter (All, Completed, Pending, Cancelled).
3. **Visualizations (Recharts / Chart.js)**:
   - Include dynamic visual charts (e.g., using `recharts` if installed, or plain CSS/SVG visualizations):
     - **Bar Chart**: "Consultations by Faculty" (Total vs Completed).
     - **Donut Chart**: "Department-wide Status Breakdown" (Completed vs Pending vs Cancelled).
4. **Data Transformation & Views**:
   - Provide a toggle to transform the data view:
     - **Summary View**: Grouped by Faculty (the default table).
     - **Timeline View**: Grouped by Date/Week to see the trend of consultations.
5. **Data Extraction (Export to CSV/PDF)**:
   - Create an "Export" button component.
   - Implement client-side CSV generation: Convert the `stats` and `rawData` arrays into a comma-separated format and trigger a browser download via a Blob.
   - Example filename: `Department_Report_YYYY-MM-DD.csv`.
6. **Build Premium UI Layout**:
   - **Header**: Large bold typography showing "Department Performance Report" and the `<Department Name>`.
   - **Top Summary Cards**: 3 dynamic glass-like cards showing: Total Consultations, Overall Completion Rate, Total Pending Requests.
   - **Data Table**: A beautiful, responsive Tailwind CSS table listing the transformed data. Add colored pill badges for `Completion Rate` (e.g., Green > 80%, Yellow 50-80%, Red < 50%).

### Review & Quality Check
- Confirm NO Prisma queries were executed.
- Verify CSV export correctly formats dates and escapes commas in faculty names.
- Ensure charts render gracefully even when data is empty.
