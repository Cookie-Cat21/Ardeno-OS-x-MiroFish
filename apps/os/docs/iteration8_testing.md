# Ardeno OS — Iteration 8 Testing Guide

## Prerequisites
1. Run all SQL migrations in order: `iteration4.sql` → `iteration6.sql` → `iteration8.sql`
2. Copy `.env.example` to `.env` and fill in Supabase, Canva, Telegram, GitHub credentials
3. Deploy edge functions:
   ```bash
   supabase functions deploy consensus-review
   supabase functions deploy security-scan
   ```
4. Install new dependencies:
   ```bash
   npm install react-flow-renderer html-to-image
   ```
5. Start dev server: `npm run dev`

---

## Test 1 — User Roles & Admin Controls

### Step 1a: Assign admin role (via Supabase Dashboard)
1. Open Supabase Studio → Table Editor → `user_roles`
2. Insert a row: `{ user_id: <your-auth-user-id>, role: 'admin' }`
3. Refresh the Ardeno OS app

### Step 1b: Verify role in UI
- Sidebar: should show **Admin** section with a "Role Manager" link and a gold crown badge next to your username
- Header: gold **admin** badge visible, "Manage Roles" button appears

### Step 1c: Role Manager dialog
1. Click "Manage Roles" in the header
2. Should list all users from `user_roles` table
3. Click "Make Admin" on another user → verify `user_roles` row updated
4. Click "Revoke Admin" → verify role reverts to `user`

---

## Test 2 — Skills Usage Dashboard

1. Navigate to `/skills-usage`
2. Verify:
   - **Top 10 Skills by Usage** bar chart renders (will show empty state if no skill_usages yet)
   - **Skills by Category** pie chart renders
   - All skills table shows `usage_count`, `success_rate`, `total_bonus_pts`, `version`
3. After running a review (Test 4), refresh this page to see updated counts

---

## Test 3 — Canva + GitHub Chain

1. Create a project in **Design** or **Deploy** stage
2. Open the project's Kanban card → look for **"Generate & Commit"** button (purple)
3. Click it → the `CanvaGithubChain` dialog opens
4. Click **Run Chain** — 5 steps animate:
   - Create Canva design
   - Export as PNG
   - Fetch image bytes
   - Commit to GitHub (check your repo for `moodboards/<projectId>.png`)
   - Save `moodboard_url` to project
5. On success: check the project record in Supabase for `moodboard_url`
6. **Rollback test**: use an invalid GitHub token → the chain fails at step 4, and should auto-delete the file if it was partially committed

---

## Test 4 — Agent Review with Skills Bonus + Flow Graph

1. Create a project with a few skills in the `skills` table that have `success_rate > 85`
2. Drag the project to **Build** or **Security** stage
3. The edge function `consensus-review` auto-triggers:
   - Each agent receives +4 pts per matching high-performing skill (capped at 12)
   - Skills in `skill_usages` table get new rows
   - `skills.usage_count` increments
4. Open project detail → click **"View Interactive Agent Flow Graph"**
5. In the graph:
   - Zoom in/out (scroll wheel or controls)
   - Drag nodes to reposition (positions saved to localStorage)
   - Click an agent node → detail dialog shows score, risk, reasoning
   - Toggle **"Critical path"** to dim low-risk edges
   - Click **"Fit View"** to reset zoom
   - Click **"Export PNG"** (requires `html-to-image`)
6. Trigger another review → graph should pulse with a **"Live update"** badge

---

## Test 5 — Deployment Escalation

1. Create a project with `consensus_score < 80`
2. Drag it to **Deploy** stage
3. Expected behavior:
   - `consensus-review` edge function fires
   - If consensus < 80%: Telegram message sent: "Deployment Needs Approval — Reply /approve <id>"
   - Header bell icon shows a badge with the count of pending deployments
   - Click bell → see the "Deployment Needs Approval" alert with project name + consensus
4. Navigate to `/security` and run a scan on the same project → another Telegram alert fires

---

## Test 6 — Full Project Report PDF

```typescript
// In browser console or via a test button:
import { exportFullReportPDF } from '@/lib/pdf';
exportFullReportPDF({
  project:   { /* your project object */ },
  reviews:   [ /* agent_reviews rows */ ],
  scans:     [ /* security_scans rows */ ],
  auditLogs: [ /* audit_logs rows */ ],
  skills:    [ /* skills rows */ ],
  commits:   [ /* { sha, message, committed_at } */ ],
});
```

Or trigger from the project detail page (wire up a button that calls `exportFullReportPDF` with data from your hooks).

Expected PDF contents (8 pages):
1. Cover page with stage progress bar
2. Table of Contents
3. Project details + score bars
4. Agent reviews table
5. Security scans with vulnerability list
6. Skills used table
7. Git commits table
8. Audit log summary

---

## Test 7 — New Navigation Pages

| Page | URL | What to verify |
|------|-----|----------------|
| Analytics | `/analytics` | 4 recharts charts render |
| Security | `/security` | Scan history + "Run Scan" buttons |
| Skills Usage | `/skills-usage` | Charts + table |
| Role Manager (admin only) | `/admin/roles` | User list + role toggle |

---

## Rollback Test (Audit Log)

1. Drag a project to a new stage
2. Navigate to `/activity`
3. Find the `stage_changed` entry
4. Click **Rollback** → project returns to previous stage
5. Verify `audit_logs.rolled_back = true` in Supabase

---

## Environment Variables Checklist

| Variable | Used by |
|----------|---------|
| `VITE_SUPABASE_URL` | All Supabase calls |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Auth + DB |
| `VITE_CANVA_ACCESS_TOKEN` | CanvaGithubChain |
| `VITE_CANVA_MOODBOARD_TEMPLATE` | CanvaGithubChain (optional) |
| `VITE_TELEGRAM_BOT_TOKEN` | Alerts |
| `VITE_TELEGRAM_GROUP_ID` | Alerts |
| `VITE_GITHUB_TOKEN` | CanvaGithubChain + commits |
| `VITE_GITHUB_REPO` | CanvaGithubChain |
