# iOS Layout Transformation Plan

## Overview

Transform the web app from a sidebar-based dashboard layout into a native-feeling iOS application using `UINavigationController` + `UITabBar` patterns with proper push/pop navigation, grouped table views, and iOS HIG-compliant components.

---

## Phase 1: Navigation Architecture

### 1.1 iOS NavigationStack (NavBar + Push/Pop)

**Current**: Desktop sidebar + breadcrumbs. Mobile has a static large title nav bar.
**Target**: iOS `UINavigationController`-style push/pop navigation.

**Changes:**

- **AppShell.tsx**: Remove desktop sidebar wrapper on mobile. Wrap content in a `<NavigationStack>` context provider that tracks navigation history and provides push/pop transitions.

- **NavigationBar.tsx** (new component):
  - Large title (34pt) on root screens, collapses to inline title (17pt) on scroll (use `IntersectionObserver` or `scroll` event)
  - Back button with native iOS chevron (‹ Title) for pushed screens
  - Right bar button items (add, edit, etc.)
  - Translucent frosted glass background (`ios-blur bg-nav-bar`)
  - Bottom border/shadow separator
  
- **Page Transitions**:
  - Push: slide from right (cubic-bezier spring)
  - Pop: slide to right
  - Modal presentation: slide up from bottom

- **Files to modify**:
  - `components/AppShell.tsx` — wrap content in NavigationStack
  - `components/Breadcrumbs.tsx` → replace with `NavigationBar.tsx`
  - New: `components/NavigationBar.tsx`
  - New: `components/NavigationStack.tsx` (context provider)

### 1.2 iOS Tab Bar Enhancement

**Current**: Bottom tab bar with basic icons + labels, frosted glass.
**Target**: Full iOS `UITabBar` with proper styling.

**Changes:**

- **Tab bar items**: Use SF Symbols-equivalent filled icons for active state, outlined for inactive
- **Active indicator**: No background shape — just tint color + filled icon (iOS 18+ style)
- **Badge notifications**: Red badge dots on tab items when needed
- **Animations**: Spring animation on tab switch, cross-fade content transition
- **Safe area**: Respect home indicator (already done)

- **Files to modify**:
  - `components/Sidebar.tsx` — update tab bar rendering
  - `app/globals.css` — update tab bar styles

---

## Phase 2: iOS-Style Content Layouts

### 2.1 Grouped Table View (InsetGrouped)

**Current**: Cards with `rounded-xl`, border, shadow in a flex column layout.
**Target**: iOS `UITableView` in `.insetGrouped` style (like Settings app).

**Changes:**

- **`.ios-table-section`** (new CSS class):
  - Rounded corners on first and last items (12pt radius)
  - Consistent horizontal margins (16pt on mobile, wider on desktop)
  - Section headers: uppercase styled text (13pt, system gray)
  - Section footers: smaller text for explanations
  
- **`.ios-table-row`** (new CSS class):
  - Full-width touch target (min 44pt height)
  - Left-aligned icon + label
  - Right-aligned detail + disclosure chevron
  - Separator inset from left (first row no top separator, last row no bottom separator)
  - `hover:` and `active:` states with gray highlight

- **Files to modify**:
  - `app/globals.css` — add iOS table styles
  - `components/AppointmentCard.tsx` — convert to iOS table row style
  - `app/student/meetings/page.tsx` — update list layouts
  - `app/faculty/meetings/page.tsx` — update list layouts
  - `app/student/m/meetings/page.tsx` — update mobile list
  - `app/faculty/m/meetings/page.tsx` — update mobile list

### 2.2 iOS Action Buttons

**Current**: `btn-primary`, `btn-secondary`, `btn-success`, `btn-danger`.
**Target**: iOS `UIButton` styles matching system buttons.

**Changes:**

- **Filled**: `.btn-ios-primary` — gold filled (for primary CTA)
- **Tinted**: `.btn-ios-tinted` — gold tinted background with white text (for secondary actions)
- **Gray**: `.btn-ios-gray` — gray filled (for tertiary actions)
- **Plain**: `.btn-ios-plain` — text-only blue/gold button (like "Cancel", "View Details")
- **Borderless**: `.btn-ios-borderless` — text-only with no background
- **Destructive**: `.btn-ios-destructive` — red tinted like iOS "Delete"

- **Files to modify**:
  - `app/globals.css` — add iOS button styles
  - `components/SubmitButton.tsx` — add new variants
  - All pages using buttons — migrate to new variants

### 2.3 iOS Search Bar

**Current**: `SearchInput.tsx` with a text input + icon.
**Target**: iOS `UISearchBar` integrated into navigation bar.

**Changes:**

- **SearchBar.tsx** (new component):
  - Rounded search field with magnifying glass icon
  - "Cancel" button that appears on focus (iOS 18+ style)
  - Scope bar / filter chips below search (optional)
  - Debounced input
  - Transitions: smooth expand on focus
  
- **Integration**: Place in navigation bar's `titleView` or as a large title search (iOS 15+)

- **Files to modify**:
  - New: `components/SearchBar.tsx`
  - `components/SearchInput.tsx` → refactor or replace
  - Pages with search functionality

### 2.4 iOS Segmented Control

**Current**: Filter pills using `<Link>` with `rounded-full` styling.
**Target**: iOS `UISegmentedControl` style.

**Changes:**

- **SegmentedControl.tsx** (new component):
  - Equal-width segments in a rounded container
  - Active segment: filled background with text
  - Inactive segments: transparent with secondary text
  - Smooth sliding indicator animation on switch
  - Compact and regular size variants

- **Files to modify**:
  - New: `components/SegmentedControl.tsx`
  - `app/student/m/meetings/page.tsx` — replace filter pills
  - `app/faculty/m/meetings/page.tsx` — replace filter pills
  - `app/student/meetings/page.tsx` — replace filter pills
  - `app/faculty/meetings/page.tsx` — replace filter pills

### 2.5 iOS Action Sheet / Alert

**Current**: No dedicated action sheet or alert component.
**Target**: iOS `UIAlertController` style action sheets and alerts.

**Changes:**

- **ActionSheet.tsx** (new component):
  - Slides up from bottom on mobile
  - Centered card on desktop
  - Title + message (optional)
  - List of action buttons (default, cancel, destructive)
  - Frosted glass background
  - Backdrop tap to dismiss

- **Alert.tsx** (new component):
  - Centered card with title, message, and buttons
  - 1-2 buttons (default + cancel)
  - iOS-style rounded corners and shadow

- **Files to modify**:
  - New: `components/ActionSheet.tsx`
  - New: `components/Alert.tsx`
  - Pages with confirmation dialogs

---

## Phase 3: iOS Gestures & Interactions

### 3.1 Swipe Back Gesture

**Current**: Back button only.
**Target**: iOS interactive pop gesture (swipe from left edge).

**Changes:**

- **NavigationStack** context tracks history
- On touch start near left edge (< 20px), intercept and track finger horizontally
- Drag indicator: shadow overlay on current page, peek of previous page
- Release at < 50%: snap back to current page
- Release at >= 50%: complete navigation pop
- Spring animation on completion/cancellation

- **Files to modify**:
  - `components/NavigationStack.tsx` — add gesture handling
  - `components/AppShell.tsx` — wrap content for gesture detection

### 3.2 Swipe Actions on List Rows

**Current**: Action buttons inline in cards.
**Target**: iOS swipe-to-reveal actions (like Mail app).

**Changes:**

- **SwipeableRow.tsx** (new component):
  - Wraps a list row
  - Swipe left to reveal action buttons (Accept, Decline, etc.)
  - Swipe right (less common, for special actions)
  - Haptic-style spring animation
  - Action buttons with colored backgrounds (green/red/gray)

- **Files to modify**:
  - New: `components/SwipeableRow.tsx`
  - `components/AppointmentCard.tsx` — wrap in SwipeableRow
  - List pages

### 3.3 Pull to Refresh

**Current**: No pull-to-refresh.
**Target**: iOS `UIRefreshControl` style.

**Changes:**

- **PullToRefresh.tsx** (new utility/hook):
  - Tracks scroll position
  - At scrollTop < -60px, trigger refresh after brief hold
  - Spinner animation during refresh
  - "Pull to refresh" / "Release to refresh" text states
  - Haptic feedback style

- **Files to modify**:
  - New: `hooks/usePullToRefresh.ts`
  - Pages with refreshable content (meetings lists, dashboards)

### 3.4 Context Menu (Long Press)

**Current**: No context menus.
**Target**: iOS `UIContextMenu` style (long press to reveal actions).

**Changes:**

- **ContextMenu.tsx** (new component):
  - Long press (> 500ms) triggers menu reveal
  - Menu appears as a popover near the touch point
  - List of actions with icons
  - Subtle spring animation
  - Tap outside to dismiss

---

## Phase 4: iOS Visual Polish

### 4.1 Status Bar & Safe Areas

- **Status bar**: Proper styling (light content on dark backgrounds, dark content on light)
- **Dynamic island / notch**: Content avoids safe areas
- **Home indicator**: Bottom content respects safe area (already done via `pb-safe`)

### 4.2 Loading States (iOS Skeleton)

- Replace the current `animate-pulse` pattern with iOS-style shimmer skeletons:
  - Gray rounded rectangles for text lines
  - Circular shimmer for avatars
  - Proper sizing matching actual content dimensions
  - Slower shimmer animation mimicking iOS loading

### 4.3 Empty States

- Update empty states to match iOS style:
  - Large SF Symbol icon in gray
  - Title (17pt bold)
  - Description (15pt regular, gray)
  - Single primary action button
  - Centered layout

### 4.4 Keyboard Handling

- iOS-style keyboard avoidance:
  - `inputmode` and `enterkeyhint` attributes on inputs
  - Content scrolls to keep focused input visible
  - "Done" toolbar above keyboard for number/date inputs

---

## Phase 5: Page-by-Page Migration

### 5.1 Mobile Student Pages

| Page | Current | Target |
|------|---------|--------|
| `/student/m/book` | Custom `MobileBookingFlow` wizard | iOS wizard with page sheets |
| `/student/m/meetings` | Filtered card list | iOS grouped table with swipe actions |
| `/student/m/meetings/[id]` | Detail card | iOS detail view with table sections |

### 5.2 Mobile Faculty Pages

| Page | Current | Target |
|------|---------|--------|
| `/faculty/m/meetings` | Filtered card list | iOS grouped table with swipe actions |
| `/faculty/m/meetings/[id]` | Detail + actions | iOS detail with action sheet |
| `/faculty/m/meetings/new` | Reuses desktop booking | iOS form in grouped table |

### 5.3 Mobile Dean Pages

| Page | Current | Target |
|------|---------|--------|
| `/dean/m` | "Desktop only" message | iOS dashboard with stats |
| `/dean/m/upload` | Simple form | iOS form with document picker |
| `/dean/m/departments` | CRUD form | iOS grouped table + modal |

### 5.4 Auth Pages

| Page | Current | Target |
|------|---------|--------|
| `/login` | Centered card | Full-screen iOS login |
| `/activate` | Centered card | iOS form in grouped table |
| `/forgot-password` | Centered card | iOS modal presentation |

---

## Implementation Order

1. **NavigationStack + NavigationBar** (foundation)
2. **iOS table styles** in globals.css (visual foundation)
3. **Tab bar enhancement** (UI polish)
4. **iOS button variants** (component update)
5. **SegmentedControl** (replace filter pills)
6. **SearchBar** (replace search input)
7. **ActionSheet + Alert** (modals)
8. **SwipeableRow** (gesture)
9. **Pull to refresh** (gesture)
10. **Page-by-page migration** (content)

---

## Files to Create

| File | Purpose |
|------|---------|
| `components/NavigationStack.tsx` | Navigation context + push/pop transitions |
| `components/NavigationBar.tsx` | iOS-style nav bar with large titles |
| `components/SearchBar.tsx` | iOS UISearchBar |
| `components/SegmentedControl.tsx` | iOS UISegmentedControl |
| `components/ActionSheet.tsx` | iOS action sheet |
| `components/Alert.tsx` | iOS alert dialog |
| `components/SwipeableRow.tsx` | Swipe-to-reveal actions |
| `hooks/usePullToRefresh.ts` | Pull-to-refresh hook |
| `hooks/useSwipeBack.ts` | Interactive pop gesture hook |

## Files to Modify

| File | Changes |
|------|---------|
| `app/globals.css` | iOS table styles, button variants, search, segmented control, action sheet |
| `components/AppShell.tsx` | Wrap in NavigationStack, remove sidebar on mobile |
| `components/Breadcrumbs.tsx` | Replace with NavigationBar |
| `components/SubmitButton.tsx` | Add iOS button variants |
| `components/SearchInput.tsx` | Refactor or replace with SearchBar |
| `components/AppointmentCard.tsx` | iOS table row style + SwipeableRow |
| `components/Sidebar.tsx` | Enhanced tab bar |
| All mobile route pages | Update to iOS content layouts |
