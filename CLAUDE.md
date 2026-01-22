# CLAUDE.md - AI Assistant Guide

This document provides essential context for AI assistants working on the Idea Library codebase.

## Project Overview

**Idea Library** is a local-first web application for capturing, organizing, and distilling personal ideas. All data is stored locally in the browser using SQLite via sql.js - there is no backend server.

**Current Status**: v0 Released (functional MVP)

### Key Design Principles

1. **Simplicity First** - Vanilla JS, no frameworks, minimal dependencies
2. **Accessibility by Design** - WCAG 2.1 AA compliant, keyboard navigable, screen reader optimized
3. **Privacy-First** - All data stays in browser localStorage, zero server communication
4. **Future-Proof** - Standard formats, platform independence, minimal vendor lock-in

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla HTML5, CSS3, ES6+ JavaScript |
| Database | SQLite via sql.js (runs in browser) |
| Storage | Browser localStorage (Base64 encoded) |
| Hosting | GitHub Pages (static files in `/docs`) |
| Modules | ES6 modules |

**No build system required** - the app is served directly as static files.

## Project Structure

```
idea-library/
├── docs/                      # GitHub Pages root (LIVE APPLICATION)
│   ├── index.html            # Single-page app with all views
│   ├── js/
│   │   ├── db.js             # Database layer (sql.js wrapper)
│   │   └── app.js            # Application logic, routing, UI
│   ├── css/
│   │   └── main.css          # Styles (mobile-first, accessible)
│   └── README.md             # User-facing documentation
│
├── ideas/                     # Content directory (future use with 11ty)
│   ├── captured/             # Raw ideas
│   ├── developing/           # Ideas being refined
│   ├── distilled/            # Processed insights
│   ├── actionable/           # Ready for action
│   └── archived/             # Completed/archived
│
├── ARCHITECTURE.md           # Technical blueprint
├── DESIGN-RATIONALE.md       # Why decisions were made
├── DESIGN-PRINCIPLES-REVIEW.md  # Design principles analysis
├── ROADMAP.md                # 7-phase implementation plan
├── README.md                 # Project overview
└── .idea-template.md         # Template for new ideas
```

## Key Files

### `docs/js/db.js` - Database Layer
- `IdeaDatabase` class wrapping sql.js
- CRUD operations: `createIdea()`, `getIdea()`, `updateIdea()`, `deleteIdea()`
- `getAllIdeas()` - returns ideas sorted by `updated_at` DESC
- `getAllTags()` - returns unique tags across all ideas
- `exportToJSON()` - exports all data
- Handles schema migrations automatically
- Persists to localStorage on every operation via `save()`

### `docs/js/app.js` - Application Logic
- `IdeaApp` class (~900 lines)
- Hash-based routing: `#/`, `#/create`, `#/edit/{id}`, `#/idea/{id}`
- Form handling with validation
- Tag autocomplete with full accessibility (ARIA combobox pattern)
- Draft auto-save (debounced, 500ms)
- VoiceOver/iOS-specific accessibility handling

### `docs/index.html` - Single Page App
- All views embedded in one file
- Semantic HTML5 structure
- Skip link, ARIA landmarks, proper heading hierarchy
- Views: loading, list, form (create/edit), detail, error

### `docs/css/main.css` - Styles
- CSS custom properties (design tokens)
- Mobile-first responsive (breakpoint at 640px)
- WCAG AA color contrast
- Focus indicators (3px outline)
- Dark mode support (respects user preference)
- Touch targets: 44px minimum (48px on iOS)

## Database Schema

```sql
CREATE TABLE ideas (
    id TEXT PRIMARY KEY,          -- UUID v4
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    tags TEXT DEFAULT '[]',       -- JSON array as string
    next_action TEXT,             -- Optional
    created_at TEXT NOT NULL,     -- ISO8601
    updated_at TEXT NOT NULL      -- ISO8601
);

CREATE INDEX idx_updated_at ON ideas(updated_at DESC);
```

## Development Workflow

### Running Locally

```bash
cd docs
python -m http.server 8000
# Open http://localhost:8000
```

Or use any static file server (e.g., `npx serve .`).

### Making Changes

1. Edit files in `/docs` directly
2. Refresh browser to see changes
3. Test on mobile and with keyboard navigation
4. Verify accessibility (screen reader, focus management)

### Deployment

Push to main branch - GitHub Pages auto-deploys from `/docs` folder.

## Code Conventions

### JavaScript

- **ES6 modules** with `import`/`export`
- **Class-based architecture** - `IdeaDatabase`, `IdeaApp`
- **Method naming**: camelCase (`handleFormSubmit`, `showListView`)
- **Constants**: UPPER_SNAKE_CASE (`DB_NAME`, `DB_VERSION`)
- **JSDoc comments** for method documentation
- **Utility functions**: `debounce()`, `escapeHtml()`, `truncate()`

### HTML

- Semantic elements: `<header>`, `<main>`, `<article>`, `<nav>`
- ARIA attributes for interactive components
- ID-based form field associations with labels
- Data attributes for component state (`data-tag`, `data-index`)

### CSS

- BEM-inspired naming: `view-header`, `form-group`, `tag-remove`
- Custom properties: `--color-*`, `--space-*`, `--font-*`
- Mobile-first media queries
- Focus states explicitly styled

## Accessibility Requirements (Critical)

**All changes MUST maintain WCAG 2.1 AA compliance.**

### Checklist for Every Change

- [ ] Keyboard navigable (Tab, Enter, Escape, Arrow keys)
- [ ] Focus indicators visible (3px outline minimum)
- [ ] Screen reader announcements for dynamic content (use `aria-live` regions)
- [ ] Form fields have associated labels
- [ ] Color contrast ratio 4.5:1 minimum
- [ ] Touch targets 44px minimum
- [ ] No content hidden from screen readers unless decorative

### Patterns Used

- **Combobox pattern** for tag autocomplete (see `showTagSuggestions()`)
- **Live regions** for announcing tag additions/removals
- **aria-activedescendant** for keyboard navigation in dropdowns
- **VoiceOver blur timeout** - 500ms delay to allow touch navigation

## Common Tasks

### Adding a New Feature

1. Read existing code patterns in `app.js`
2. Follow class method pattern in `IdeaApp`
3. Add event listeners in `setupEventListeners()`
4. Handle routing in `handleRoute()` if new view needed
5. Test accessibility thoroughly

### Modifying the Database Schema

1. Increment `DB_VERSION` in `db.js`
2. Add migration logic in `runMigrations()`
3. SQLite doesn't support `DROP COLUMN` - use table recreation pattern (see existing migration 2)

### Adding Form Fields

1. Add HTML in `docs/index.html` with proper ARIA
2. Add validation in `handleFormSubmit()`
3. Update `createIdea()` and `updateIdea()` in `db.js`
4. Add to export format in `exportToJSON()`

### Styling Changes

1. Use existing CSS custom properties where possible
2. Test on mobile (< 640px breakpoint)
3. Verify focus states
4. Check dark mode compatibility

## Testing Approach

**Currently**: Manual testing only

### Manual Testing Checklist

- [ ] Works in Chrome, Firefox, Safari
- [ ] Mobile responsive
- [ ] Keyboard navigation works end-to-end
- [ ] Screen reader announces correctly (test with VoiceOver on Mac/iOS)
- [ ] Form validation shows errors accessibly
- [ ] Draft auto-save works
- [ ] Data persists across page refresh

### Future Testing (Planned)

- Automated accessibility testing with axe-core
- Lighthouse CI audits
- Build validation in GitHub Actions

## Data Flow

```
User Action
    ↓
app.js (IdeaApp methods)
    ↓
db.js (IdeaDatabase methods)
    ↓
SQLite in-memory (sql.js)
    ↓
localStorage (Base64 encoded)
```

Every database operation triggers `save()` which exports to localStorage.

## Important Behaviors

### Draft Auto-Save

- Saves form state to localStorage after 500ms of inactivity
- Key format: `idea-draft-{id}` or `idea-draft-new`
- Compares timestamps to avoid overwriting newer database data
- Cleared after successful form submission

### Tag Autocomplete

- Shows existing tags filtered by input
- Keyboard: Arrow keys to navigate, Enter to select, Escape to close
- Touch: Direct tap on suggestions
- VoiceOver: Extended blur timeout (500ms) to allow swipe navigation
- Announces suggestions count and selection to screen readers

### Routing

- Hash-based (`window.location.hash`)
- Routes: `/`, `/create`, `/edit/{id}`, `/idea/{id}`
- Navigation state tracked via `updateNavActive()`

## Warnings

1. **No XSS protection via framework** - Always use `escapeHtml()` when rendering user content
2. **localStorage limit** - ~5-10MB per browser; may need migration strategy for heavy users
3. **sql.js loaded from CDN** - Requires internet on first load; caches after
4. **No data backup by default** - Export feature is manual; remind users to backup

## Related Documentation

- `ARCHITECTURE.md` - Full technical blueprint
- `DESIGN-RATIONALE.md` - Why each decision was made
- `ROADMAP.md` - Future phases (11ty integration, GitHub Actions, PWA, etc.)
- `docs/README.md` - User-facing help

## Quick Reference

| Task | File | Method/Section |
|------|------|----------------|
| Add new route | `app.js` | `handleRoute()` |
| Database CRUD | `db.js` | `createIdea()`, `getIdea()`, etc. |
| Form validation | `app.js` | `handleFormSubmit()` |
| Add CSS variable | `main.css` | `:root` section |
| Screen reader announcement | `app.js` | Use `#tags-live-region` pattern |
| Schema migration | `db.js` | `runMigrations()` |
