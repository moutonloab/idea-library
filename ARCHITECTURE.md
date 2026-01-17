# Idea Library - Architecture Blueprint

## Vision Statement
A library to frictionlessly capture ideas that emerge from my inner world, organize them in a timeless and logical structure, intuitively distill their essence into insights, and express them to the outer world, ready to be turned into action.

## Design Principles

### 1. **Simplicity First**
- Start with the minimal viable architecture
- Avoid over-engineering
- Use proven, stable technologies
- Prefer convention over configuration
- YAGNI (You Aren't Gonna Need It)

### 2. **Accessibility by Design**
- WCAG 2.1 AA compliance minimum
- Semantic HTML structure
- Keyboard navigation support
- Screen reader optimization
- Progressive enhancement approach

### 3. **Easy to Maintain**
- Low operational overhead - minimal time spent on system maintenance
- Self-explanatory structure - clear organization without extensive documentation
- Automated where possible - CI/CD, testing, deployment
- Graceful degradation - system works even if some parts fail
- Clear upgrade paths - easy to update dependencies and features
- Minimal manual intervention - reduce toil and repetitive tasks
- Fast feedback loops - quick to test, build, deploy

### 4. **Privacy-First & Data Ownership**
- You own your data - plain text files you control
- Private by default - public sharing is opt-in
- No vendor lock-in - export and migrate anytime
- No tracking - no analytics unless explicitly added
- Local-first capable - works offline, syncs when online
- Transparent data flow - clear where data goes

### 5. **Future-Proof & Portable**
- Technology choices with long-term viability (10+ years)
- Minimal dependencies - fewer things to break
- Standard formats - Markdown, HTML, CSS, JSON
- Platform independence - not tied to any single vendor
- Easy migration - can move to any platform
- Backward compatible - old content always works
- Forward compatible - ready for new features

### 6. **Content-First Design**
- Content drives structure - organization emerges from content
- Minimal ceremony - low overhead to create and edit
- Readable source - plain text, human-readable
- Version control - full history preserved
- Search-friendly - easy to find content
- Fast to render - content loads quickly

### Implementation Note: GitHub Integration

While **GitHub-Native** is not a core design principle (to avoid platform lock-in), we deliberately choose GitHub for implementation because:
- Excellent free hosting via GitHub Pages
- Robust CI/CD via GitHub Actions
- Built-in version control
- Issue templates for idea capture
- Wide adoption and reliability

**Important:** The architecture remains platform-independent. All content is in standard Markdown, and the static site can be hosted anywhere (Netlify, Vercel, self-hosted, etc.). GitHub is a choice, not a requirement.

---

## Architecture Overview

### High-Level Architecture Type: **JAMstack Static Site**

```
┌─────────────────────────────────────────────────────────────┐
│                        GitHub Repository                      │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │  Content Layer │  │  Build Layer │  │  Presentation   │ │
│  │   (Markdown)   │→ │   (SSG/CI)   │→ │  (Static Site)  │ │
│  └────────────────┘  └──────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    ┌──────────────────┐
                    │  GitHub Pages    │
                    │   (Hosting)      │
                    └──────────────────┘
```

---

## Technical Stack

### Phase 1: Foundation (Current Focus)

#### Content Layer
- **Format**: Markdown with YAML frontmatter
- **Storage**: Git repository (version controlled)
- **Structure**: Hierarchical directory organization

#### Build Layer
- **Static Site Generator**: **11ty (Eleventy)**
  - *Why*: Simple, flexible, uses familiar JavaScript
  - *Why*: Excellent for content-focused sites
  - *Why*: No client-side framework lock-in
  - *Why*: Fast build times
  - *Alternative considered*: Jekyll (more opinionated, Ruby dependency)

#### Presentation Layer
- **HTML**: Semantic HTML5
- **CSS**: Modern CSS with custom properties
  - Mobile-first responsive design
  - No CSS framework initially (add Tailwind/similar only if needed)
- **JavaScript**: Progressive enhancement
  - Vanilla JS for interactions
  - No heavy framework (React/Vue) unless complexity demands it
- **Search**: Client-side search with Lunr.js or similar

#### Hosting & Deployment
- **Hosting**: GitHub Pages
- **CI/CD**: GitHub Actions
- **Domain**: Custom domain support via GitHub Pages

---

## Data Model

### Idea Structure

Each idea is a Markdown file with YAML frontmatter:

```yaml
---
id: unique-identifier (auto-generated UUID or timestamp)
title: "Idea Title"
created: 2026-01-01T10:00:00Z
updated: 2026-01-01T10:00:00Z
status: captured | developing | distilled | actionable | archived
tags: [tag1, tag2, tag3]
category: personal | work | technical | creative
priority: low | medium | high
visibility: private | public
related_ideas: [id1, id2]
---

# Main Content

The idea description in Markdown format.

## Insights

Key insights distilled from the idea.

## Action Items

- [ ] Specific action item 1
- [ ] Specific action item 2
```

### Metadata Fields Explained

- **id**: Unique identifier for cross-referencing
- **status**: Lifecycle stage tracking
  - `captured`: Initial capture
  - `developing`: Being explored/refined
  - `distilled`: Essence extracted
  - `actionable`: Ready for action
  - `archived`: Completed or no longer relevant
- **tags**: Flexible categorization
- **category**: High-level grouping
- **priority**: Importance ranking
- **visibility**: Public/private toggle for selective sharing
- **related_ideas**: Link network of connected ideas

---

## Directory Structure

```
idea-library/
├── .github/
│   ├── workflows/
│   │   ├── build-deploy.yml      # GitHub Actions for building & deploying
│   │   └── validate-idea.yml     # Validate idea format on PR
│   └── ISSUE_TEMPLATE/
│       └── new-idea.yml           # Template for capturing ideas via Issues
│
├── ideas/
│   ├── captured/                  # Raw ideas
│   ├── developing/                # Ideas being refined
│   ├── distilled/                 # Processed insights
│   ├── actionable/                # Ready for action
│   └── archived/                  # Completed/archived
│
├── _includes/                     # 11ty template partials
│   ├── head.njk
│   ├── header.njk
│   ├── footer.njk
│   └── idea-card.njk
│
├── _layouts/                      # 11ty layouts
│   ├── base.njk
│   ├── idea.njk
│   ├── list.njk
│   └── home.njk
│
├── _data/                         # Global data files
│   └── site.json                  # Site configuration
│
├── assets/
│   ├── css/
│   │   ├── main.css              # Main styles
│   │   └── accessibility.css     # Accessibility-specific styles
│   ├── js/
│   │   ├── search.js             # Client-side search
│   │   └── interactions.js       # Progressive enhancements
│   └── images/
│
├── _site/                         # Generated output (git-ignored)
│
├── .eleventy.js                   # 11ty configuration
├── package.json
├── .gitignore
├── README.md
├── ARCHITECTURE.md                # This file
├── CONTRIBUTING.md                # Contribution guidelines
└── LICENSE
```

---

## Accessibility Strategy

### Semantic HTML
- Proper heading hierarchy (h1 → h2 → h3)
- Semantic elements (`<nav>`, `<main>`, `<article>`, `<aside>`)
- Landmark roles for major sections

### Keyboard Navigation
- Skip to main content link
- Logical tab order
- Focus indicators (visible and clear)
- Keyboard shortcuts for common actions

### Screen Reader Optimization
- ARIA labels where needed
- Alt text for all images
- Status announcements for dynamic changes
- Descriptive link text

### Visual Accessibility
- Minimum contrast ratio 4.5:1 (AAA for body text)
- Resizable text (up to 200% without breaking)
- No information conveyed by color alone
- Clear visual focus indicators

### Testing Strategy
- Automated testing with axe-core
- Manual keyboard navigation testing
- Screen reader testing (NVDA/JAWS/VoiceOver)
- Lighthouse accessibility audits in CI

---

## GitHub Integration

### GitHub Pages
- Automatic deployment from `main` branch
- Custom domain support
- HTTPS by default

### GitHub Actions Workflows

#### 1. Build & Deploy (`build-deploy.yml`)
```yaml
- Trigger: Push to main branch
- Steps:
  1. Checkout code
  2. Setup Node.js
  3. Install dependencies
  4. Run 11ty build
  5. Run accessibility tests
  6. Deploy to GitHub Pages
```

#### 2. Validate Idea (`validate-idea.yml`)
```yaml
- Trigger: Pull request with changes to /ideas
- Steps:
  1. Validate YAML frontmatter
  2. Check required fields
  3. Lint Markdown
  4. Preview build
```

### GitHub Issues as Capture Mechanism
- Issue templates for quick idea capture
- Automatic conversion to Markdown files via Actions
- Labels map to idea categories/tags

### GitHub Discussions (Future)
- Community engagement
- Idea refinement discussions
- Collaborative distillation

---

## Workflow: From Idea to Action

### 1. Capture
```
User Input → GitHub Issue/Web Form/Direct File
     ↓
New Markdown file in ideas/captured/
     ↓
Git commit & push
```

### 2. Organize
```
Manual/Automated categorization
     ↓
Move to appropriate status folder
     ↓
Update frontmatter (tags, category, priority)
```

### 3. Distill
```
Add insights section to Markdown
     ↓
Update status to 'distilled'
     ↓
Link related ideas
```

### 4. Action
```
Add action items (checkboxes)
     ↓
Update status to 'actionable'
     ↓
Export to task management tool (future integration)
```

---

## Future-Proofing Considerations

### Phase 2 Enhancements (Future)
- **Search**: Full-text search with filters
- **Visualization**: Idea relationship graphs
- **AI Integration**: Auto-tagging, insight extraction
- **Mobile App**: Progressive Web App (PWA)
- **API**: REST API for external integrations
- **Export**: PDF, JSON, other formats
- **Collaboration**: Shared ideas, comments

### Technology Migration Path
- Content in Markdown → Portable to any system
- Static site → Can migrate to dynamic if needed
- No framework lock-in → Easy to change build tools
- Git-based → Can move to any Git hosting

### Scalability
- Static sites scale infinitely (CDN-friendly)
- Client-side search up to ~1000 ideas
- Beyond that: Algolia, Meilisearch, or backend search

---

## Security & Privacy

### Private by Default
- GitHub repository can be private
- Public deployment optional
- Visibility field controls what gets published

### No Server-Side Processing
- Static site = minimal attack surface
- No database to compromise
- No server to maintain

### Content Security
- GitHub's access controls
- Branch protection rules
- Signed commits (optional)

---

## Development Workflow

### Local Development
```bash
npm install          # Install dependencies
npm run dev          # Start local server with hot reload
npm run build        # Build static site
npm run test         # Run tests (accessibility, lint)
```

### Contributing
- Fork repository
- Create feature branch
- Make changes
- Run tests
- Submit pull request
- Automated checks run
- Review & merge

---

## Success Metrics

### Capture Friction
- Time from idea to saved: < 2 minutes
- Mobile capture success rate: > 90%

### Organization Quality
- Ideas with tags: > 80%
- Ideas with category: 100%
- Orphaned ideas: < 10%

### Accessibility
- Lighthouse accessibility score: 100
- WCAG 2.1 AA compliance: 100%
- Keyboard navigation coverage: 100%

### Performance
- Build time: < 30 seconds
- Page load time: < 2 seconds
- Time to interactive: < 3 seconds

---

## Conclusion

This architecture embodies the 6 core design principles:

1. ✅ **Simplicity First**: Minimal viable architecture, proven technologies, no over-engineering
2. ✅ **Accessibility by Design**: WCAG 2.1 AA compliant, keyboard navigable, screen reader optimized
3. ✅ **Easy to Maintain**: Low operational overhead, automated workflows, self-explanatory structure
4. ✅ **Privacy-First & Data Ownership**: You own your data, private by default, no vendor lock-in
5. ✅ **Future-Proof & Portable**: Standard formats, platform independence, 10+ year viability
6. ✅ **Content-First Design**: Content drives structure, minimal ceremony, fast and searchable

**What this means in practice:**
- **Frictionless capture**: Multiple input methods, simple workflow
- **Logical organization**: Status-based folders, metadata-rich
- **Intuitive distillation**: Structured format guides insight extraction
- **Action-ready**: Built-in action items, export capabilities
- **Low maintenance**: Automated deployment, minimal intervention needed
- **Your data, your control**: Plain text files, easy to migrate, no lock-in
- **Built to last**: Simple stack, portable, scalable

The architecture starts simple but with clear paths for growth, ensuring the system can evolve as needs expand while maintaining its core principles and respecting user sovereignty over their ideas.
