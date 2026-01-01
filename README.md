# idea-library

A library to frictionlessly capture ideas that emerge from my inner world, organize them in a timeless and logical structure, intuitively distill their essence into insights, and express them to the outer world, ready to be turned into action.

## Vision

This project aims to bridge the gap between thought and action by providing:
- **Frictionless Capture**: Quick and easy idea recording
- **Logical Organization**: Timeless structure for managing ideas
- **Intuitive Distillation**: Tools to extract insights
- **Action-Ready Output**: Transform ideas into actionable items

## Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Comprehensive architectural blueprint with design principles, technical stack, and implementation details
- **[ROADMAP.md](./ROADMAP.md)**: Phased implementation plan from MVP to advanced features
- **[DESIGN-PRINCIPLES-REVIEW.md](./DESIGN-PRINCIPLES-REVIEW.md)**: Analysis of design principles and best practices for knowledge management systems
- **[DESIGN-RATIONALE.md](./DESIGN-RATIONALE.md)**: Detailed rationale for architectural decisions

## Design Principles

1. **Simplicity First**: Minimal viable architecture, avoid over-engineering, proven technologies
2. **Accessibility by Design**: WCAG 2.1 AA compliant, keyboard navigable, screen reader optimized
3. **Easy to Maintain**: Low operational overhead, automated workflows, minimal manual intervention
4. **Privacy-First & Data Ownership**: You own your data, private by default, no vendor lock-in
5. **Future-Proof & Portable**: Standard formats, platform independence, 10+ year viability
6. **Content-First Design**: Content drives structure, minimal ceremony, fast and searchable

See [DESIGN-PRINCIPLES-REVIEW.md](./DESIGN-PRINCIPLES-REVIEW.md) for detailed rationale and best practices.

## Technology Stack

- **Content**: Markdown with YAML frontmatter
- **Build**: 11ty (Eleventy) static site generator
- **Hosting**: GitHub Pages
- **CI/CD**: GitHub Actions
- **Accessibility**: Semantic HTML5, ARIA, progressive enhancement

## Current Status

**Phase**: v0 Released! 🎉

**v0 Features:**
- ✅ Create, read, update ideas
- ✅ List all ideas (sorted by most recent)
- ✅ Export all ideas as JSON backup
- ✅ Local-first: All data stored in your browser
- ✅ No server, no sync, fully client-side
- ✅ WCAG 2.1 AA accessible

See [ROADMAP.md](./ROADMAP.md) for future planned features.

## Getting Started

### 🚀 Try the App

**Live Demo**: [GitHub Pages URL will be here after deployment]

Or run locally:
```bash
# Clone the repository
git clone https://github.com/moutonloab/idea-library.git
cd idea-library/docs

# Open in browser
open index.html
# or use a local server
python -m http.server 8000
```

See [docs/README.md](./docs/README.md) for detailed usage instructions.

### For Contributors

See [ROADMAP.md](./ROADMAP.md) for the development plan and how to contribute.

## License

To be determined

## Questions?

See the [architecture documentation](./ARCHITECTURE.md) for detailed design decisions and rationale.
