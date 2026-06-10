# Evaluation Route & Auth Fix — qwen2.5 Prompts

These prompts are designed to be copy-pasted into separate qwen2.5:14B chats. Each is self-contained.

---

## Prompt 1 — Add getEvaluationIfOwner helper

You are working in a Next.js 16 project at the root directory. Do not add comments.

Open `features/evaluations/evaluations.service.ts`. Add this function before the last export:

```
export async function getEvaluationIfOwner(evaluationId: string, userId: string) {
  const evaluation = await evaluationRepository.findById(evaluationId)
  if (!evaluation) return null
  if (evaluation.evaluatorId !== userId) return null
  return evaluation
}
```

Verify: `import { evaluationRepository }` is already at the top of the file. Do not duplicate imports. Do not add any other code.

---

## Prompt 2 — Guard ratings/route.ts (GET)

You are working in a Next.js 16 project at the root directory. Do not add comments.

Open `app/api/evaluations/[id]/ratings/route.ts`. In the `GET` handler, after the session auth check, add an ownership check before fetching ratings.

Current GET handler logic:
1. `const session = await auth()`
2. `if (!session?.user) return ...`
3. `const { id } = await params`
4. `const ratings = await getEvaluationRatings(id)`
5. `return NextResponse.json({ ratings })`

Change it to:
1. `const session = await auth()`
2. `if (!session?.user) return ...`
3. `const userId = (session.user as Record<string, unknown>).id as string`
4. `const { id } = await params`
5. `import { getEvaluationIfOwner } from "@/features/evaluations/evaluations.service"` (add to the existing import line)
6. `const evaluation = await getEvaluationIfOwner(id, userId)`
7. `if (!evaluation) return NextResponse.json({ error: "Not found" }, { status: 404 })`
8. `const ratings = await getEvaluationRatings(id)`
9. `return NextResponse.json({ ratings })`

The existing import line is:
```
import { saveRatings, getEvaluationRatings } from "@/features/evaluations/evaluations.service"
```
Change it to:
```
import { saveRatings, getEvaluationRatings, getEvaluationIfOwner } from "@/features/evaluations/evaluations.service"
```

Do not modify anything else in the file. Do not add comments.

---

## Prompt 3 — Guard ratings/route.ts (PUT)

You are working in a Next.js 16 project at the root directory. Do not add comments.

Open `app/api/evaluations/[id]/ratings/route.ts`. In the `PUT` handler, after the session auth and role check, add an ownership check before saving ratings.

Current PUT handler logic:
1. `const session = await auth()`
2. `if (!session?.user || !hasRole(...)) return ...`
3. `const { id } = await params`
4. `const { ratings } = await request.json()`
5. `await saveRatings(id, ratings)`
6. `return NextResponse.json({ success: true })`

Change it to:
1. `const session = await auth()`
2. `if (!session?.user || !hasRole(...)) return ...`
3. `const userId = (session.user as Record<string, unknown>).id as string`
4. `const { id } = await params`
5. `const evaluation = await getEvaluationIfOwner(id, userId)`
6. `if (!evaluation) return NextResponse.json({ error: "Not found" }, { status: 404 })`
7. `const { ratings } = await request.json()`
8. `await saveRatings(id, ratings)`
9. `return NextResponse.json({ success: true })`

The `getEvaluationIfOwner` import is already added from the previous step. Do not duplicate the import. Do not add comments.

---

## Prompt 4 — Guard comments/route.ts (GET + POST)

You are working in a Next.js 16 project at the root directory. Do not add comments.

Open `app/api/evaluations/[id]/comments/route.ts`.

Update the import line at the top from:
```
import { addEvaluationComment, getEvaluationComment } from "@/features/evaluations/evaluations.service"
```
to:
```
import { addEvaluationComment, getEvaluationComment, getEvaluationIfOwner } from "@/features/evaluations/evaluations.service"
```

In the `GET` handler, after the session auth check:
1. Keep `const session = await auth()` and `if (!session?.user) return ...`
2. Add `const userId = (session.user as Record<string, unknown>).id as string`
3. Keep `const { id } = await params`
4. Add:
```
const evaluation = await getEvaluationIfOwner(id, userId)
if (!evaluation) return NextResponse.json({ error: "Not found" }, { status: 404 })
```
5. Keep `const comment = await getEvaluationComment(id)` and `return NextResponse.json({ comment })`

In the `POST` handler, after the session auth + role check:
1. Keep `const session = await auth()` and `if (!session?.user || !hasRole(...)) return ...`
2. Add `const userId = (session.user as Record<string, unknown>).id as string`
3. Keep `const { id } = await params`
4. Add:
```
const evaluation = await getEvaluationIfOwner(id, userId)
if (!evaluation) return NextResponse.json({ error: "Not found" }, { status: 404 })
```
5. Keep the rest unchanged.

Do not modify anything else. Do not add comments.

---

## Prompt 5 — Guard submit/route.ts (POST)

You are working in a Next.js 16 project at the root directory. Do not add comments.

Open `app/api/evaluations/[id]/submit/route.ts`.

Update the import line at the top from:
```
import { submitEvaluation } from "@/features/evaluations/evaluations.service"
```
to:
```
import { submitEvaluation, getEvaluationIfOwner } from "@/features/evaluations/evaluations.service"
```

In the `POST` handler, after the session auth + role check:
1. Keep `const session = await auth()` and `if (!session?.user || !hasRole(...)) return ...`
2. Add `const userId = (session.user as Record<string, unknown>).id as string`
3. Keep `const { id } = await params`
4. Add:
```
const evaluation = await getEvaluationIfOwner(id, userId)
if (!evaluation) return NextResponse.json({ error: "Not found" }, { status: 404 })
```
5. Keep the rest unchanged.

Do not modify anything else. Do not add comments.

---

## Prompt 6 — Guard evaluations/[id]/route.ts (GET)

You are working in a Next.js 16 project at the root directory. Do not add comments.

Open `app/api/evaluations/[id]/route.ts`.

Current file content:
```
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getEvaluation } from "@/features/evaluations/evaluations.service"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  try {
    const evaluation = await getEvaluation(id)
    if (!evaluation) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ evaluation })
  } catch {
    return NextResponse.json({ error: "Failed to fetch evaluation" }, { status: 500 })
  }
}
```

Change it to:
```
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getEvaluation } from "@/features/evaluations/evaluations.service"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = (session.user as Record<string, unknown>).id as string
  const { id } = await params
  try {
    const evaluation = await getEvaluation(id)
    if (!evaluation) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (evaluation.evaluatorId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ evaluation })
  } catch {
    return NextResponse.json({ error: "Failed to fetch evaluation" }, { status: 500 })
  }
}
```

Do not add comments. Do not modify anything else.

---

## Prompt 7 — Guard POST /api/evaluations enrollment check

You are working in a Next.js 16 project at the root directory. Do not add comments.

Open `app/api/evaluations/route.ts`. In the `POST` handler, after extracting `evaluateeId` from the request body and before calling `getOrCreateEvaluation`, add an enrollment check.

Current POST handler flow:
1. Auth check, role check, extract userId
2. `const { periodId, evaluateeId } = await request.json()`
3. `const activeSemesterId = periodId || (await getActiveSemester())?.id`
4. `if (!activeSemesterId) return ...`
5. `const evaluation = await getOrCreateEvaluation(activeSemesterId, userId, evaluateeId)`
6. Fetch faculty name, return result

Change step 5 to:
```
const { data: enrollment } = await supabase
  .from("student_enrollments")
  .select("section_id")
  .eq("student_id", userId)
  .eq("semesterId", activeSemesterId)
  .limit(1)
  .single()
if (enrollment) {
  const { data: facultyLink } = await supabase
    .from("faculty_subjects")
    .select("faculty_id")
    .eq("section_id", enrollment.section_id)
    .eq("faculty_id", evaluateeId)
    .eq("semesterId", activeSemesterId)
    .maybeSingle()
  if (!facultyLink) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
} else {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}
const evaluation = await getOrCreateEvaluation(activeSemesterId, userId, evaluateeId)
```

The `supabase` import at the top is:
```
import { supabase } from "@/lib/supabase"
```
This already exists in the file.

Do not add comments. Do not modify anything else.

---

## Prompt 8 — Fix evaluation list page to redirect by evaluation UUID

You are working in a Next.js 16 project at the root directory. Do not add comments.

Open `app/student/evaluations/page.tsx`. The page has two `<Link>` components (lines 87-90 for pending, lines 119-122 for completed) that navigate to `/student/evaluations/${item.evaluateeId}`. Change them to create/get the evaluation first, then navigate to the evaluation UUID.

Replace ALL `<Link>` with click handlers.

For the pending list (around line 86-107):
```
{pending.map((item) => (
  <button
    key={item.evaluateeId}
    onClick={async () => {
      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluateeId: item.evaluateeId }),
      })
      const data = await res.json()
      if (data.evaluation?.id) router.push(`/student/evaluations/${data.evaluation.id}`)
    }}
    className="flex items-center justify-between w-full pl-4 pr-4 py-4 active:bg-slate-50 dark:active:bg-slate-800 transition-colors text-left"
  >
    ...existing content...
  </button>
))}
```

For the completed list (around line 118-147):
```
{evaluations.map((ev) => (
  <button
    key={ev.id}
    onClick={async () => {
      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluateeId: ev.evaluateeId }),
      })
      const data = await res.json()
      if (data.evaluation?.id) router.push(`/student/evaluations/${data.evaluation.id}`)
    }}
    className="flex items-center justify-between w-full pl-4 pr-4 py-4 active:bg-slate-50 dark:active:bg-slate-800 transition-colors text-left"
  >
    ...existing content...
  </button>
))}
```

Remove the `import Link from "next/link"` at the top. Add `import { useRouter } from "next/navigation"` at the top. Add `const router = useRouter()` inside the component function, after the useState hooks.

Keep all existing content inside each list item (name, email, status badges, SVG arrows) unchanged. Only change `<Link href={...}>` to `<button onClick={...}>` and change `className` to include `w-full text-left`.

Do not add comments. Do not modify anything else in the file.

---

## Prompt 9 — Remove create-or-get POST from evaluation page

You are working in a Next.js 16 project at the root directory. Do not add comments.

Open `app/student/evaluations/[id]/page.tsx`. This page currently calls `POST /api/evaluations` on mount to create or get the evaluation. Since the list page now redirects using the evaluation UUID, this page only needs to fetch the evaluation by UUID.

Changes:

1. Remove the entire second `useEffect` block (the one that contains `init()` with the API calls for periods, rubric, POST evaluations, ratings, comments). Keep only the cleanup effect:
```
useEffect(() => {
  return () => setExclusive(false)
}, [setExclusive])
```

2. Remove these state variables that were only used in the removed effect: `categories`, `evaluationId`, `evaluateeName`, `ratings`, `comment`, `submitting`, `step`, `pledgeAgreed`, `isSubmitted`, `submittedAt`, `existingComment`, `subjects`, `loading`.

Wait — the entire page renders different views based on these states (loading skeleton, submitted results, fill form). So we cannot simply remove all of them.

Instead, replace the second useEffect with a simpler one that just fetches the evaluation by UUID:
```
useEffect(() => {
  setExclusive(true)
  async function load() {
    try {
      const res = await fetch(`/api/evaluations/${params.id}`)
      if (!res.ok) { router.push("/student/evaluations"); return }
      const data = await res.json()
      const ev = data.evaluation
      if (!ev) { router.push("/student/evaluations"); return }
      setEvaluateeName(ev.evaluateeName || "Unknown")
      setEvaluationId(ev.id)
      if (ev.status === "SUBMITTED") {
        setExclusive(false)
        setIsSubmitted(true)
        setSubmittedAt(ev.submittedAt || null)
      }
      // Fetch ratings
      const ratingsRes = await fetch(`/api/evaluations/${ev.id}/ratings`)
      const ratingsData = await ratingsRes.json()
      if (ratingsData.ratings?.length > 0) {
        const map: Record<string, number> = {}
        for (const r of ratingsData.ratings) map[r.itemId] = r.rating
        setRatings(map)
      }
      if (ev.status === "SUBMITTED") {
        const commentRes = await fetch(`/api/evaluations/${ev.id}/comments`)
        const commentData = await commentRes.json()
        if (commentData.comment) setExistingComment(commentData.comment.comment || null)
      }
      // Fetch rubric
      const periodRes = await fetch("/api/evaluation-periods")
      const periodData = await periodRes.json()
      const activePeriod = (periodData.periods || []).find((p: { isActive: boolean }) => p.isActive)
      if (activePeriod) {
        const rubricRes = await fetch(`/api/evaluation-periods/${activePeriod.id}/rubric`)
        const rubricData = await rubricRes.json()
        setCategories(rubricData.rubric || [])
      }
    } catch {
      alert("Failed to load evaluation")
      router.push("/student/evaluations")
    } finally {
      setLoading(false)
    }
  }
  load()
}, [params.id, router, setExclusive])
```

The dependency array should be: `[params.id, router, setExclusive]`

Do not add comments. Do not modify the cleanup effect, the render logic, or any other part of the file.

---

## Prompt 10 — Rename route folder to [evaluationId] (optional)

You are working in a Next.js 16 project at the root directory. Do not add comments.

1. Rename folder `app/student/evaluations/[id]` to `app/student/evaluations/[evaluationId]`
2. Open `app/student/evaluations/[evaluationId]/page.tsx` and update the useParams call from `useParams<{ id: string }>()` to `useParams<{ evaluationId: string }>()`
3. In the two places where `params.id` is used, change to `params.evaluationId`
4. Open `app/student/evaluations/page.tsx` and update both `router.push(`/student/evaluations/${data.evaluation.id}`)` calls — these already use `data.evaluation.id` which is the evaluation UUID, so the route param name change doesn't affect them. They already push to the correct path format.
5. Search for any other files that reference `/student/evaluations/${` and update them if they pass an `id` that should now be an `evaluationId`.

Use the command: `rg '/student/evaluations/\$\{' --type tsx,ts` to find all references.

Do not add comments.
