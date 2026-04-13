# Asana Design Tokens & Layout Reference

> Observed from the Asana desktop app (Electron) on 2026-04-13. App runs in **dark mode**.

## Colors

### Backgrounds (Dark Mode)
- **Icon rail background**: `#1a1a1a` (near-black, far-left icon column)
- **Sidebar panel background**: `#2a2b2d` (secondary sidebar panel)
- **Sidebar hover**: `#3a3b3d`
- **Sidebar selected**: `#404142` (slightly lighter highlight)
- **Topbar background**: `#2e2f31` (dark, same tone as sidebar)
- **Content area background**: `#1e1f21` (main content, dark charcoal)
- **Card/panel background**: `#2a2b2d` (cards, modals, widgets)
- **Table row hover**: `#333435`
- **Modal overlay**: `rgba(0, 0, 0, 0.6)`
- **Input/field background**: `#353638`

### Brand / Action
- **Create button**: `#e8534b` (red/coral) — the "+ Create" button in sidebar header
- **Add task button**: `#4573d2` (blue) — "+ Add task" inside project views
- **Primary hover**: `#d64840`
- **Secondary action**: `#4573d2` (blue) — links, secondary buttons
- **Success/complete**: `#5da283` (green checkmark)
- **Warning**: `#f1bd6c` (amber)
- **Error/overdue**: `#e8384f` (red)

### Text (Dark Mode)
- **Primary text**: `#f1f1f1` (white/off-white)
- **Secondary text**: `#a2a0a2` (muted gray)
- **Placeholder text**: `#6d6e6f`
- **Icon rail text**: `#8a8a8a` (muted labels under icons)
- **Sidebar text**: `#c8c8c8`
- **Sidebar text active**: `#ffffff`
- **Link text**: `#4573d2`
- **Section header text**: `#f1f1f1` (bold, uppercase-ish)

### Borders (Dark Mode)
- **Default border**: `#3a3b3d`
- **Divider**: `#353638`
- **Input border**: `#4a4b4d`
- **Input focus border**: `#4573d2`
- **Table column border**: `#353638`

### Status Colors (custom fields / tags — current API, confirmed Sep 2020+)
- Red: `#e8384f`
- Orange: `#fd612c`
- Yellow-orange: `#fd9a00`
- Yellow: `#eec300`
- Yellow-green: `#a4cf30`
- Green: `#62d26f`
- Blue-green: `#37c5ab`
- Aqua: `#20aaea`
- Blue: `#4186e0`
- Indigo: `#7a6ff0`
- Purple: `#aa62e3`
- Magenta: `#e56ce5`
- Hot-pink: `#eb59a3`
- Pink: `#fc91ad`
- Cool gray: `#8da3a6`
- None: `#ffffff`

### Legacy Project Colors (older API — softer/pastel variants)
- Red: `#f06a6a` | Orange: `#ec8d71` | Yellow-orange: `#f1bd6c`
- Yellow: `#f8df72` | Yellow-green: `#aecf55` | Green: `#5da283`
- Blue-green: `#4ecbc4` | Aqua: `#9ee7e3` | Blue: `#4573d2`
- Indigo: `#8d84e8` | Purple: `#b36bd4` | Magenta: `#f9aaef`
- Hot-pink: `#f26fb2` | Pink: `#fc979a` | Cool-gray: `#6d6e6f`

### Brand / Gradient Palette (from asana.com/styles — used in marketing & logo)
- Fluorescent Mint: `#3BE8B0` | Bright Green: `#3BF7D1`
- Battery Charged Blue: `#1AAFD0` | Bright Teal: `#02CEFF`
- Slate Blue: `#6A67CE` | Bright Purple: `#A177FF`
- Amber: `#FFB900` | Bright Gold: `#FFD200`
- Light Gray: `#EFF0F1` | Navy: `#2E3C54`
- Logo Coral: `#F06A6A`

## Typography

- **Font family (desktop/Electron)**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
- **Font family (web app)**: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` — Asana uses **Inter** (400/500/700) as primary web font; desktop Electron app falls through to system fonts
- **Marketing site fonts**: Ghost (headings, by Sharp Type), TWK Lausanne (body, by Weltkern) — not used in product UI
- **Page title (H1)**: 20px, font-weight 500
- **Section header (H2)**: 16px, font-weight 500
- **Subsection (H3)**: 14px, font-weight 600
- **Body text**: 13px, font-weight 400
- **Small / label**: 11px, font-weight 400, text-transform uppercase for labels
- **Task title in list**: 13px, font-weight 400
- **Task title in detail**: 20px, font-weight 500
- **Sidebar nav item**: 13px, font-weight 400
- **Line height**: 1.4–1.5 for body, 1.2 for headings

## Spacing

- **Base unit**: 4px
- **XS**: 4px
- **SM**: 8px
- **MD**: 12px
- **LG**: 16px
- **XL**: 24px
- **XXL**: 32px
- **Section gap**: 24px
- **Card padding**: 16px
- **List row height**: 36px
- **Sidebar item padding**: 8px 16px 8px 24px

## Border Radius
- **Buttons**: 6px
- **Cards/panels**: 8px
- **Inputs**: 6px
- **Avatars**: 50% (circle)
- **Tags/pills**: 12px
- **Modals**: 12px

## Shadows
- **Card shadow**: `0 1px 3px rgba(0,0,0,0.08)`
- **Dropdown shadow**: `0 4px 12px rgba(0,0,0,0.15)`
- **Modal shadow**: `0 8px 24px rgba(0,0,0,0.2)`

## Layout Dimensions

- **Icon rail width**: ~56px (far-left icon column, always visible)
- **Sidebar panel width**: ~200px (secondary nav panel, context-dependent)
- **Total sidebar width**: ~256px (icon rail + panel)
- **Topbar height**: ~48px (contains hamburger, Create button, nav arrows, search bar, Asana logo)
- **Content area padding**: 24px horizontal, 16px top
- **Detail pane width**: ~50% of content area (right-side slide-over panel)
- **Task list row height**: 36px
- **Board card width**: ~260px
- **Board column width**: ~280px
- **Board column gap**: 12px

## Navigation Structure

### Icon Rail (far-left, darkest)
Vertical icon buttons with labels below each icon:
1. **Work** (checkmark icon) — opens Work sidebar panel
2. **Strategy** (triangle/pyramid icon) — opens Strategy sidebar panel
3. **Workflow** (connected nodes icon) — opens Workflow sidebar panel
4. **People** (people icon) — opens People sidebar panel

### Sidebar Panel (context-dependent, changes based on icon rail selection)

**Work panel:**
- Home
- Inbox
- **Divider — "Work"**
- My tasks
- **Divider**
- Projects
- Portfolios
- Goals
- **Divider — "Work" section header**
- Expandable project list with "+" button (e.g., "Cross-functional p...")
- Each project: color dot + name

**Strategy panel:**
- Goals
- Resourcing
- Reporting

**Workflow panel:**
- Template gallery
- AI Teammates
- Project templates
- Custom fields
- Rules
- Forms
- Task types
- Bundles

**People panel:**
- Profile (with avatar)
- Team > My workspace

### Sidebar Footer (bottom of panel)
- Trial status badge ("Advanced free trial — 14 days left")
- "Add billing info" button
- User avatar + "Invite teammates" button

### Sidebar Header (top of panel)
- Hamburger menu (☰)
- **"+ Create" button** (red/coral, rounded pill)
- Back/forward arrows
- Clock icon (recent)

### Topbar (integrated into sidebar header area)
- Search bar (centered, full-width in topbar area with magnifier icon)
- Asana logo (far right)
- Help icon (?)
- Settings gear icon

### Project View Tabs
- Overview | List | Board | Timeline | Dashboard | Calendar | Workflow | Messages | Files | +
- Right side: Filter, Sort, Group, Options, Search icon
- Project header: project icon + name + dropdown + star + "Set status" + member avatars + Share + "..." + Customize

### Project Content Area
- Section headers (collapsible, e.g., "To do", "Doing", "Done")
- Task rows with: completion checkbox, task name, assignee avatar, due date range, custom field columns (Priority, Status)
- "+ Add task" button (blue) at top and "Add task..." placeholder within sections
- "+ Add section" at bottom
- Column headers: Name, Assignee, Due date, Priority, Status, + (add column)

### Task Detail Pane (right slide-over)
- "Mark complete" button (top)
- Share button, link icon, fullscreen icon, "..." more menu, close X
- Task title (large, editable)
- Assignee (avatar + name + "Recently assigned" dropdown)
- Due date (calendar icon + date range + clear X)
- Dependencies ("Add dependencies")
- **Projects** section: count badge, project name with color dot, section assignment ("To do" dropdown)
- Custom fields per project: Priority, Status (colored badges)
- Description (rich text: "What is this task about?")
- Subtasks section with "+" button
- Comment input ("Add a comment") with user avatar

### Home Page Layout
- Greeting: "Good morning, [Name]" with date
- Stats bar: "My week" dropdown, tasks completed count, collaborators count, "Customize" button
- **My tasks widget**: avatar + "My tasks" title + lock icon
  - Tabs: Upcoming | Overdue | Completed
  - "+ Create task" link
  - Task list with completion circles, task name, project tag, date range
- **Learn Asana** carousel: horizontal scrollable cards with thumbnails and duration badges

---

## Icons

### Project Icons (32 options, from Asana OpenAPI spec)
These are the official icon identifiers for projects. Use a matching icon library (Lucide recommended) to render equivalents.

| API Value | Description | Lucide Equivalent |
|-----------|-------------|-------------------|
| `list` | List view | `list` |
| `board` | Board/kanban | `kanban` or `layout-grid` |
| `timeline` | Timeline/gantt | `gantt-chart` |
| `calendar` | Calendar | `calendar` |
| `rocket` | Rocket/launch | `rocket` |
| `people` | People/team | `users` |
| `graph` | Graph/chart | `bar-chart-3` |
| `star` | Star/favorite | `star` |
| `bug` | Bug/issue | `bug` |
| `light_bulb` | Idea/lightbulb | `lightbulb` |
| `globe` | Globe/international | `globe` |
| `gear` | Settings/gear | `settings` |
| `notebook` | Notebook/notes | `notebook` |
| `computer` | Computer/tech | `monitor` |
| `check` | Checkmark/done | `circle-check-big` |
| `target` | Target/goal | `target` |
| `html` | Code/web | `code` |
| `megaphone` | Announcement | `megaphone` |
| `chat_bubbles` | Chat/messages | `message-circle` |
| `briefcase` | Business/work | `briefcase` |
| `page_layout` | Page layout | `layout` |
| `mountain_flag` | Milestone/flag | `mountain` or `flag` |
| `puzzle` | Puzzle/integration | `puzzle` |
| `presentation` | Presentation | `presentation` |
| `line_and_symbols` | Analytics | `activity` |
| `speed_dial` | Dashboard/gauge | `gauge` |
| `ribbon` | Award/ribbon | `award` |
| `shoe` | Running/sprint | `footprints` |
| `shopping_basket` | Shopping/commerce | `shopping-basket` |
| `map` | Map/location | `map` |
| `ticket` | Ticket/support | `ticket` |
| `coins` | Finance/money | `coins` |

### Project Color API Values (from Asana OpenAPI spec)
These are the named color values accepted by the API for project colors:
```
dark-pink, dark-green, dark-blue, dark-red, dark-teal, dark-brown,
dark-orange, dark-purple, dark-warm-gray, light-pink, light-green,
light-blue, light-red, light-teal, light-brown, light-orange,
light-purple, light-warm-gray, none
```

### Navigation Icon Rail Icons (observed from app)
| Position | Label | Description | Lucide Equivalent |
|----------|-------|-------------|-------------------|
| 1 | Work | Checkmark in circle | `circle-check-big` |
| 2 | Strategy | Triangle/pyramid | `triangle` |
| 3 | Workflow | Connected nodes | `workflow` or `git-branch` |
| 4 | People | People silhouettes | `users` |

### Sidebar Menu Icons (observed from screenshot)
| Menu Item | Description | Lucide Equivalent |
|-----------|-------------|-------------------|
| Home | House | `home` |
| Inbox | Bell/inbox | `inbox` |
| My tasks | Checkmark circle | `circle-check` |
| Projects | Folder/board | `folder` |
| Portfolios | Briefcase/stack | `briefcase` |
| Goals | Target | `target` |
| Template gallery | Grid of squares | `layout-grid` |
| AI Teammates | Sparkle/robot | `sparkles` or `bot` |
| Project templates | Document/clipboard | `clipboard` |
| Custom fields | Sliders/fields | `sliders-horizontal` |
| Rules | Lightning bolt | `zap` |
| Forms | Form/document | `file-text` |
| Task types | Labeled circle | `circle-dot` |
| Bundles | Package/box | `package` |

### Recommended Icon Library
**Lucide React** (`lucide-react`) — best match for Asana's clean, stroke-based icon style:
- 1500+ icons, consistent 24x24 grid, 2px stroke
- Tree-shakable React components
- Install: `npm install lucide-react`
- Usage: `import { Home, Inbox, Target } from 'lucide-react'`
- Customizable: `<Home size={16} strokeWidth={1.5} />`

Alternative libraries (if Lucide lacks a specific icon):
- **Phosphor Icons** (`@phosphor-icons/react`) — 6 weights (thin to duotone), good for the icon rail
- **Heroicons** (`@heroicons/react`) — from Tailwind team, outline + solid styles

### Icon Source for Asana Logo
- [Asana Logo SVG — Worldvectorlogo](https://worldvectorlogo.com/logo/asana-1)
- [Asana Logo — LogoKit](https://logokit.com/brands/asana.com)
- Three-dot logo mark: three overlapping circles in coral `#F06A6A`

---

## Sources & References

### Direct Observation
- Asana desktop app (Electron, dark mode) — inspected 2026-04-13

### Web Research (brand palette, API colors, typography)
- [Asana Forum — API Color Codes](https://forum.asana.com/t/color-codes-in-api/23716)
- [ColorsWall — Full 11-color Brand Palette](https://colorswall.com/palette/35)
- [Design Pieces — Asana Color Palette](https://www.designpieces.com/palette/asana-color-palette-hex-and-rgb/)
- [Pick Color Online — Asana Brand](https://pickcoloronline.com/brands/asana/) (confirms colors from asana.com/styles)
- [DesignYourWay — Asana Font (Inter)](https://www.designyourway.net/blog/asana-font/)
- [Fonts In Use — Asana Marketing Site](https://fontsinuse.com/uses/68326/asana-website)
- [GitHub — siebmanb/asanacolors](https://github.com/siebmanb/asanacolors)
- [Mobbin — Asana Web/iOS/Android Screenshots](https://mobbin.com/colors/brand/asana)

### Icons & API Spec
- [Asana OpenAPI Spec (icon + color enums)](https://raw.githubusercontent.com/Asana/openapi/master/defs/asana_oas.yaml)
- [Lucide Icons](https://lucide.dev/icons/) — recommended icon library
- [Phosphor Icons](https://phosphoricons.com/) — alternative with weight variants
- [GitHub — algolia/demo-asana (icon font)](https://github.com/algolia/demo-asana/blob/master/fonts/asana-icon-font.ttf)
- [Asana Logo SVG — Worldvectorlogo](https://worldvectorlogo.com/logo/asana-1)

### Design Kits (for visual reference, not exact tokens)
- [Mobbin — Asana Web Screens](https://mobbin.com/screens/864242a3-4072-44b0-9021-16223ad574f4)
- [Userstyles.org — Community Asana Themes](https://userstyles.org/styles/browse/asana)
