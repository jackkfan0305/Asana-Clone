# Asana Clone vs Real Asana - Detailed Frontend Comparison Report

**Date:** April 13, 2026
**Real Asana Version:** Desktop app (Electron), Dark Mode
**Clone Version:** localhost:5173, React + TypeScript + Vite

---

## 1. Overall Layout & Shell

### What Matches
- Three-column layout: Icon Rail + Sidebar Panel + Main Content area
- Dark theme color scheme is very close
- Topbar spans full width above the three columns
- Footer area in sidebar with trial badge, billing, and invite links

### Differences

| # | Element | Real Asana | Clone | Severity |
|---|---------|-----------|-------|----------|
| 1.1 | **Main content background** | Solid dark background (`~#1e1f21`) | Gradient: `linear-gradient(to top right, #1a1b1d 0%, #3a3b3d 100%)` creating a visible lighter corner at top-right | Medium |
| 1.2 | **Browser tab / Title bar** | Electron app shows breadcrumb tabs (e.g., "Home > Asana") with Asana-styled tab UI | Standard browser tab with "Asana Clone" title | Low (inherent to web vs desktop) |
| 1.3 | **Content area padding** | Content sits flush against sidebar with internal padding per component | Global `padding: 16px 24px` wrapper around all content | Low |

**Fix for 1.1:** Change the `Shell.tsx` content background from the gradient to a solid color:
```css
background: var(--bg-content);  /* #1e1f21 — solid, no gradient */
```

---

## 2. Topbar

### What Matches
- "Create" button with `+` icon, coral/red color, pill-shaped
- Back/Forward navigation arrows
- Clock/History icon
- Search bar with pill shape and search icon
- Asana logo (three dots) + "asana" text on right
- Help and Settings icons on far right

### Differences

| # | Element | Real Asana | Clone | Severity |
|---|---------|-----------|-------|----------|
| 2.1 | **Hamburger menu** | No hamburger/menu icon visible in the topbar | Has a `Menu` (hamburger) icon on the far left that toggles sidebar visibility | Medium |
| 2.2 | **Create button placement** | "Create" button is the first element on the left (no hamburger before it) | "Create" button is the second element (after hamburger) | Medium |
| 2.3 | **Topbar height** | Appears slightly taller (~52px visual) with more breathing room | Set to `48px` via `--topbar-height` | Low |
| 2.4 | **Search bar width** | Wider search bar, appears to take ~40% of topbar width | `maxWidth: 480` with `flex: 1` | Low |
| 2.5 | **Asana logo style** | Uses the official Asana logomark (three overlapping circles forming a triangle pattern) displayed more prominently | Three separate circles in an inverted triangle SVG — close but not pixel-perfect | Low |
| 2.6 | **Create button label** | Shows `+ Create` with the plus icon integrated | Same `+ Create` layout — matches | N/A |

**Fix for 2.1/2.2:** In the real Asana app, there is no hamburger toggle in the topbar. The sidebar is always visible. Consider removing the hamburger icon and making the sidebar non-collapsible, or moving the toggle to match Asana's actual collapse behavior (which uses hover on the sidebar edge).

---

## 3. Icon Rail (Left Navigation Strip)

### What Matches
- Four vertically-stacked icon buttons: Work, Strategy, Workflow, People
- Icon + text label layout (icon above, tiny text label below)
- User avatar at the bottom of the rail
- Active state highlight background
- Rail width (~56px) is accurate

### Differences

| # | Element | Real Asana | Clone | Severity |
|---|---------|-----------|-------|----------|
| 3.1 | **Icon rail state independence** | The icon rail selection is **independent** of the current page. You can view the Home page while having the "Workflow" icon rail item selected (which shows Workflow sidebar items). | Icon rail active state is **determined by the current route** — navigating to `/home` always shows the "Work" icon as active. | High |
| 3.2 | **Icon style** | Uses filled/outlined custom SVG icons specific to Asana's design language | Uses `lucide-react` icons (`CircleCheckBig`, `Triangle`, `Workflow`, `Users`) — recognizably different shapes | Medium |
| 3.3 | **Active indicator** | Real Asana shows a subtle left-edge indicator bar on the active icon, plus a background highlight | Clone only uses a background color change (`--bg-sidebar-selected`) with white text | Low |
| 3.4 | **Help icon at bottom** | Has a `?` help circle icon at the very bottom of the icon rail, below the avatar | No help icon in the rail — help is only in the topbar | Low |

**Fix for 3.1:** This is the most significant structural difference. The icon rail should maintain its own state separate from the router. Clicking an icon rail item should change the sidebar panel content without navigating to a new page. Home and Inbox navigation should be handled from the sidebar panel only, not from the icon rail.

---

## 4. Sidebar Panel

### What Matches
- "Home" and "Inbox" links always visible at the top regardless of selected icon rail section
- Contextual section content below (Work items, Strategy items, Workflow items, People items)
- Collapsible project list under the "Work" section
- Colored dots for project indicators
- Trial badge footer with green ring, "14 days left" text
- "Add billing info" button
- "Invite teammates" link with avatar
- Section headers in uppercase with small font

### Differences

| # | Element | Real Asana | Clone | Severity |
|---|---------|-----------|-------|----------|
| 4.1 | **Sidebar panel width** | Appears wider (~220-240px) | Set to `200px` via `--sidebar-panel-width` | Low |
| 4.2 | **Workflow section items** | Template gallery, **AI Teammates**, Project templates, Custom fields, Rules, Forms, Task types, Bundles | Same items listed but only visible when icon rail "Workflow" is clicked (which navigates away from current page due to issue 3.1) | Medium |
| 4.3 | **Work section items** | In real Asana when "Work" icon is active: Home, Inbox, then project list (no "My tasks", "Projects", "Portfolios", "Goals" nav items in sidebar) | Shows: Home, Inbox, section header "Work", My tasks, divider, Projects, Portfolios, Goals, divider, section header "Work" (again), then project list | High |
| 4.4 | **Duplicate "Work" section header** | Only one section header for the collapsible project list | Two "Work" section headers: one above "My tasks" and another above the collapsible project list | Medium |
| 4.5 | **"My tasks" in sidebar** | Not a sidebar nav item — "My tasks" is accessed via the Home page widget or direct URL | Listed as a sidebar nav item under the "Work" section | Medium |
| 4.6 | **"Projects" in sidebar** | Not a dedicated sidebar nav item — projects are listed directly in the collapsible list | Listed as a separate nav item that links to `/projects` grid page | Medium |
| 4.7 | **Inbox notification badge** | Shows unread count as a small red/coral pill badge on the Inbox item | Same behavior — shows unread count badge | N/A |
| 4.8 | **Sidebar item hover state** | Smooth hover with slightly lighter background | Same hover with `--bg-sidebar-hover` | N/A |

**Fix for 4.3-4.6:** The real Asana sidebar "Work" panel does NOT show "My tasks", "Projects", "Portfolios", or "Goals" as navigation items. Instead, it shows:
- Home, Inbox (always at top)
- Then a collapsible section (labeled something like "Projects" or the workspace name) that directly lists the user's projects
The "My tasks", "Goals", and "Portfolios" are accessed from the Home page widgets or from the top-level icon rail sections. Restructure the sidebar to remove these as direct nav items.

---

## 5. Home Page

### What Matches
- Date string format: "Monday, April 13"
- Greeting: "Good afternoon, Jack" (large, light weight font)
- Stats bar with "My week" dropdown, tasks completed count, collaborators count, Customize button
- "My tasks" widget with avatar, lock icon, three-dot menu
- Tabs: Upcoming | Overdue | Completed with underline indicator
- "+ Create task" link
- Task rows with checkboxes, title, project badge, and due dates
- "Learn Asana" section at the bottom with horizontal card carousel

### Differences

| # | Element | Real Asana | Clone | Severity |
|---|---------|-----------|-------|----------|
| 5.1 | **Greeting font weight** | Very light/thin font weight (~300) for "Good afternoon, Jack" | `fontWeight: 400` — slightly heavier than real Asana | Low |
| 5.2 | **Greeting font size** | Appears larger (~32px) | Set to `28px` | Low |
| 5.3 | **Date text color** | Slightly more muted/secondary color | Uses `--text-primary` (full white) — should be `--text-secondary` | Low |
| 5.4 | **My tasks widget - task badge style** | Badges are compact pill labels showing truncated project names (e.g., "Cros...") with subtle coloring, right-aligned alongside dates | Clone badges use `Badge` component with transparent colored background — close but badges appear slightly different in padding/opacity | Low |
| 5.5 | **My tasks - date format** | Shows dates like "Today - Apr 15" for date ranges, or "Apr 14 - 18" for ranges | Shows "Apr 6 - Apr 18" or "Apr 22" — similar but "Today" keyword not used for today's date | Low |
| 5.6 | **Learn Asana card images** | Professional illustrated artwork (rocket launch, puzzle pieces, strategy board, thermometer) with detailed vector illustrations | Emoji icons (rocket, pencil, handshake, lightning) on dark coral/magenta gradient backgrounds | High |
| 5.7 | **Learn Asana card styling** | Cards have more detail: distinct illustration per card, rounded corners, duration badge with clock icon at bottom-left | Cards use plain emoji centered on gradient, duration badge uses "timer" emoji character | Medium |
| 5.8 | **Learn Asana card titles** | Card titles visible below the thumbnail image | No titles visible below images — titles only defined in code but not rendered | Medium |
| 5.9 | **Stats bar - segmented control** | "My week" dropdown, check icon + "N tasks completed", people icon + "N collaborators" all in a single segmented/bordered row | Same structure — close match | N/A |
| 5.10 | **Customize button** | Has a colorful 4-square grid icon | Clone also has the same 4-square SVG icon — matches | N/A |

**Fix for 5.6-5.8:** The Learn Asana cards should have:
1. Proper illustrated images (SVG or PNG artwork) instead of emojis
2. Card titles rendered below the thumbnail image
3. Better duration badge styling with a proper clock/timer icon instead of emoji

---

## 6. Inbox Page

### What Matches
- "Inbox" page header
- Inbox Summary AI card concept
- Activity/Bookmarks/Archive/@Mentioned tabs
- Filter, Sort, Density controls
- "Archive all notifications" link
- Notification items with avatar, preview text, and timestamp
- Unread indicator (blue dot)
- Bookmark (star) and archive (X) action buttons per notification

### Differences

| # | Element | Real Asana | Clone | Severity |
|---|---------|-----------|-------|----------|
| 6.1 | **Tab position** | Tabs (Activity, Bookmarks, Archive, @Mentioned, +) are positioned directly below the "Inbox" header, ABOVE the AI Summary card | Tabs are positioned BELOW the AI Summary card | High |
| 6.2 | **Plus tab button** | Has a `+` button at the end of the tab row for adding custom filters/views | No `+` button in the tab row | Medium |
| 6.3 | **Controls placement** | Filter, Sort, Density controls are on a separate row below the tabs | Controls are on the same row as the "Inbox" header, pushed to the right | Medium |
| 6.4 | **"Manage notifications" placement** | Displayed in the top-right corner as a standalone link, separate from controls | Inline with the controls row | Low |
| 6.5 | **Inbox Summary card - text** | "Summarize your most important and actionable notifications with Asana AI." | "Get an AI-powered summary of your notifications" — different wording | Low |
| 6.6 | **Inbox Summary card - features** | Has a "Timeframe: Past week" dropdown selector + "View summary" button + X dismiss button | Only has "Generate summary" button — no timeframe selector, no dismiss button | Medium |
| 6.7 | **Inbox Summary card - icon** | Sparkle icon ✨ with "Inbox Summary" heading | Same sparkle emoji + heading — matches | N/A |
| 6.8 | **Inbox Summary card - styling** | White/light card with subtle border, not gradient | Blue-purple gradient background: `linear-gradient(135deg, rgba(69,115,210,0.1), rgba(122,111,240,0.1))` | Low |
| 6.9 | **Three-dot menu** | Has a `...` menu icon on the controls row | No three-dot menu on the controls row | Low |
| 6.10 | **Notification row - checkbox** | Has a circular completion checkbox on each notification row | No checkbox on notification rows — just avatar + text + actions | Medium |

**Fix for 6.1:** Move the tabs to render ABOVE the AI Summary card. The layout order should be:
1. Header row ("Inbox" + "Manage notifications")
2. Tabs row (Activity | Bookmarks | Archive | @Mentioned | +)
3. Controls row (Filter | Sort | Density | ...)
4. Inbox Summary card
5. "Archive all notifications" link
6. Notification items

---

## 7. My Tasks Page

### What Matches
- Page header "My Tasks"
- View toggle tabs (List, Board, Calendar)
- Collapsible sections: "Recently assigned", "Do today", "Do next week", "Do later"
- Task rows with checkboxes, task name, project badge, due dates, priority indicators
- "+ Add task" functionality

### Differences

| # | Element | Real Asana | Clone | Severity |
|---|---------|-----------|-------|----------|
| 7.1 | **Section headers** | Sections use a caret/triangle expand icon and bold section name with task count | Clone uses `ChevronRight` icon that rotates, section name in bold, task count in parentheses — close but the expand icon style differs slightly | Low |
| 7.2 | **Task row columns** | Columns: Checkbox, Task name, (spacer), Project badge, Due date with inline editing on hover | Similar columns but column widths and spacing differ | Low |
| 7.3 | **Priority badges** | Real Asana shows priority as colored flags or icons, not text pills | Clone shows priority as colored text pills ("High", "Medium", "Low") using the `StatusBadge` component | Medium |
| 7.4 | **Date range display** | Shows date ranges with en-dash and compact format | Shows similar format but uses different date formatting approach | Low |
| 7.5 | **Page breadcrumb** | Shows "My Tasks" with the user's avatar next to it | Just shows "My Tasks" text, no avatar | Low |

---

## 8. Projects List Page

### What Matches
- Grid layout of project cards
- Each card shows: colored project icon, project name, status badge, department badge, owner avatar

### Differences

| # | Element | Real Asana | Clone | Severity |
|---|---------|-----------|-------|----------|
| 8.1 | **Page existence** | Real Asana does not have a standalone "/projects" grid page — projects are accessed from the sidebar list or via search | Clone has a dedicated `/projects` route with a grid of project cards | Medium |
| 8.2 | **"+ New Project" button** | N/A (no projects grid page) | Has a blue "+ New Project" button in the top right | Medium |
| 8.3 | **Project card detail** | N/A | Cards show project icon (emoji), name, status badge, department badge, and owner avatar with name | N/A |

**Note:** This page doesn't exist in real Asana as a standalone view. Consider whether to keep it as-is (it's a useful addition) or restructure navigation to match Asana's pattern where projects are only listed in the sidebar.

---

## 9. Project Detail Views

### What Matches
- Project name header with star/favorite icon, colored status dot
- Tab navigation: Overview, List, Board, Timeline, Dashboard, Calendar, Workflow, Messages, Files
- Share and Customize buttons
- List view with columns: Task name, Assignee, Due date, Priority, Status
- Collapsible sections (To do, In Progress, Done)
- "+ Add task" per section
- Board view with Kanban columns
- Task cards in board view with priority/status badges

### Differences

| # | Element | Real Asana | Clone | Severity |
|---|---------|-----------|-------|----------|
| 9.1 | **Tab bar styling** | Tabs have a more subtle, integrated look with the page header, using a flat underline style | Tabs use a similar underline but appear slightly more spaced out | Low |
| 9.2 | **Filter/Sort/Group controls** | Controls appear as dropdown buttons in a horizontal toolbar below tabs | Same structure — close match | N/A |
| 9.3 | **Board view card spacing** | Cards have tighter spacing with smaller margins | Cards have slightly more generous padding | Low |
| 9.4 | **Board column header** | Column headers show section name + task count + add button | Clone shows section name + count + chevron, different styling | Low |
| 9.5 | **"+ Add section" in board** | Shown as a subtle text button at the end of columns | Present in clone — matches | N/A |
| 9.6 | **Assignee column** | Shows avatar only (no name text) in the list view | Shows avatar with some inline display | Low |

---

## 10. Goals Page

### What Matches
- Page header "Goals" with "+ Create goal" button
- Tabs: Strategy map, Team goals, My goals
- Table with columns: Name, Status, Progress, Time period, Team, Owner
- Expandable sub-goals with indentation
- Progress bar visualization
- Status badges (On Track, At Risk, Off Track)

### Differences

| # | Element | Real Asana | Clone | Severity |
|---|---------|-----------|-------|----------|
| 10.1 | **Strategy map tab** | Shows a visual tree/graph of goals and their relationships | Clone's "Strategy map" tab likely shows the same table layout | Medium |
| 10.2 | **Read-only notice** | No notice — goals are fully interactive | Shows "Goals = read-only stub. Create and edit functionality not available." text at bottom | Low (expected for frontend-only) |

---

## 11. Common Components

### Checkbox
- **Matches:** Circular shape (borderRadius: 50%), green fill when checked, white checkmark SVG
- **Difference:** None significant — the circular checkbox matches Asana's signature style

### Badge
- **Matches:** Pill shape, colored background with transparency, matching text color
- **Difference:** Clone uses `${color}22` (hex alpha) for background opacity. Real Asana appears to use slightly different opacity levels depending on context.

### Avatar
- **Matches:** Circular shape, proper sizing
- **Difference:** Clone uses `img` tags with `avatarUrl` from seed data. Real Asana uses colored initials circles as fallback when no photo is available. The clone's seed data uses external avatar URLs which may not match the initials-based style.

---

## 12. Color & Theme

### What Matches
- Overall dark theme palette is very close
- Sidebar background (`#2e2f31`)
- Card background (`#2a2b2d`)
- Create button coral color (`#e8534b`)
- Primary blue (`#4573d2`)
- Status colors (green/yellow/red)

### Differences

| # | Element | Real Asana | Clone | Severity |
|---|---------|-----------|-------|----------|
| 12.1 | **Content area background** | Solid `#1e1f21` | Gradient (see 1.1) | Medium |
| 12.2 | **Hover states** | Slightly more subtle/translucent hover backgrounds | Uses `--bg-sidebar-hover: #3a3b3d` which is close but sometimes slightly more opaque | Low |
| 12.3 | **Border colors** | Very subtle borders, sometimes nearly invisible | Borders at `--border-default: #3a3b3d` are slightly more visible | Low |
| 12.4 | **Scrollbar styling** | Custom thin scrollbar matching dark theme | Styled with webkit scrollbar CSS — close match | N/A |

---

## 13. Typography

| # | Element | Real Asana | Clone | Severity |
|---|---------|-----------|-------|----------|
| 13.1 | **Font family** | `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto` (system fonts) | `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto` — Inter is first priority | Low |
| 13.2 | **Body font size** | 13px base — matches | 13px base via `--font-body` | N/A |
| 13.3 | **Heading weights** | Uses lighter font weights (~300-400) for large headings | Uses 400-500 for headings — slightly bolder | Low |

---

## 14. Missing Features / Functionality Gaps

These are features visible in the real Asana that are not implemented (or only stubbed) in the clone:

| # | Feature | Status in Clone |
|---|---------|----------------|
| 14.1 | **Drag and drop** for task reordering (list and board views) | Not implemented |
| 14.2 | **Inline task editing** (click to edit task name directly in the list) | Not implemented — clicking opens detail pane |
| 14.3 | **Task detail pane** slide-in from right | Implemented (TaskDetailPane component) |
| 14.4 | **Multi-select / Bulk actions** toolbar | Implemented (BulkToolbar component) |
| 14.5 | **Search overlay** with recent searches and filters | Implemented (SearchOverlay component) |
| 14.6 | **Keyboard shortcuts** (Tab+Q for quick add, Tab+Enter for new task, etc.) | Not implemented |
| 14.7 | **Right-click context menus** on tasks | Not implemented |
| 14.8 | **Task assignee picker dropdown** | Not implemented (avatar shown but no picker) |
| 14.9 | **Due date picker** (calendar popup) | Not implemented |
| 14.10 | **Custom fields** editing UI | Not implemented (page exists but read-only) |
| 14.11 | **Real-time / optimistic updates** | Partial — state management is synchronous |
| 14.12 | **Notification toasts** for actions (task completed, archived, etc.) | Not implemented |

---

## Priority Fix Summary

### High Priority (Structural/Layout Issues)
1. **[3.1]** Icon rail state should be independent of current page route
2. **[4.3-4.6]** Remove "My tasks", "Projects", "Portfolios", "Goals" from sidebar Work panel — real Asana doesn't have these as sidebar items
3. **[6.1]** Move Inbox tabs above the AI Summary card
4. **[5.6-5.8]** Replace emoji Learn Asana cards with proper illustrated artwork and visible titles

### Medium Priority (Visual Fidelity)
5. **[1.1]** Remove gradient from main content area — use solid background
6. **[2.1-2.2]** Remove hamburger icon from topbar or relocate to match Asana behavior
7. **[4.4]** Fix duplicate "Work" section header in sidebar
8. **[6.2]** Add `+` button to inbox tab row
9. **[6.6]** Add timeframe dropdown and dismiss button to Inbox Summary card
10. **[6.10]** Add circular checkboxes to inbox notification rows
11. **[7.3]** Change priority indicators from text pills to colored flag icons

### Low Priority (Polish)
12. **[5.1-5.3]** Adjust greeting font weight/size and date text color
13. **[4.1]** Increase sidebar panel width to ~220px
14. **[2.3-2.5]** Fine-tune topbar height, search bar width, and logo
15. **[12.1-12.3]** Fine-tune border opacity and hover states
16. **[13.1-13.3]** Adjust heading font weights to be lighter

---

*Report generated by comparing the real Asana desktop app (macOS, dark mode) against the Asana Clone running at localhost:5173 on April 13, 2026.*
