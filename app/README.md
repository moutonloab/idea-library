# Idea Library v0 - Local-First Web App

A client-side web application for capturing, organizing, and distilling ideas. All data is stored locally in your browser using SQLite.

## Features

✅ **Create Ideas** - Capture new ideas with title and description
✅ **List Ideas** - View all ideas sorted by most recently updated
✅ **Read Ideas** - View full details of any idea
✅ **Update Ideas** - Edit title and description
✅ **Export Backup** - Download all ideas as JSON

## Technology Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript (ES6 modules)
- **Database**: SQLite via [sql.js](https://github.com/sql-js/sql.js) (runs in browser)
- **Storage**: LocalStorage for database persistence
- **Hosting**: GitHub Pages (static site)

## Data Model

Each idea contains:
- `id` - Unique identifier (UUID)
- `title` - Idea title (required)
- `body` - Idea description (required)
- `stage` - Lifecycle stage: captured | distilled | expressed | actioned
- `essence` - Distilled essence (optional, future use)
- `insight` - Key insights (optional, future use)
- `next_action` - Action items (optional, future use)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## How It Works

### Local-First Architecture

1. **On first load**: Creates new SQLite database in browser memory
2. **After operations**: Saves database to localStorage as Base64
3. **On subsequent loads**: Loads database from localStorage
4. **All CRUD operations**: Read/write directly to local database
5. **No server required**: Everything runs client-side

### File Structure

```
app/
├── index.html       # Main HTML file with all views
├── css/
│   └── main.css     # Accessible, mobile-first styling
├── js/
│   ├── db.js        # Database layer (SQLite operations)
│   └── app.js       # Application logic (routing, UI)
└── README.md        # This file
```

### Routing

Client-side routing using URL hash:
- `#/` - List all ideas
- `#/create` - Create new idea
- `#/idea/{id}` - View idea details
- `#/edit/{id}` - Edit idea

## Usage

### Running Locally

1. Simply open `index.html` in a modern browser
2. Or use a local server:
   ```bash
   python -m http.server 8000
   # or
   npx serve .
   ```
3. Navigate to `http://localhost:8000`

### Deploying to GitHub Pages

1. Push the `app` directory to your repository
2. Go to repository Settings → Pages
3. Set source to deploy from branch
4. Set directory to `/app`
5. Save and wait for deployment

## Accessibility

This app follows WCAG 2.1 AA guidelines:
- ✅ Semantic HTML structure
- ✅ Keyboard navigation support
- ✅ Screen reader optimization
- ✅ Focus indicators
- ✅ ARIA labels where needed
- ✅ Color contrast compliance
- ✅ Responsive design (mobile-first)

## Data Export

Click "Export" to download all your ideas as JSON:

```json
{
  "schema_version": 1,
  "exported_at": "2026-01-01T12:00:00.000Z",
  "ideas": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "My Idea",
      "body": "Description...",
      "stage": "captured",
      "created_at": "2026-01-01T10:00:00.000Z",
      "updated_at": "2026-01-01T11:00:00.000Z"
    }
  ]
}
```

## Browser Compatibility

Works in all modern browsers that support:
- ES6 modules
- LocalStorage
- WebAssembly (for sql.js)

Tested in:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Limitations (v0)

- ❌ No import functionality (export only)
- ❌ No search or filtering
- ❌ No tags or categories
- ❌ No sync across devices
- ❌ No authentication
- ❌ No backend/server
- ❌ Limited to localStorage size (~5-10MB depending on browser)

## Future Enhancements

See [ROADMAP.md](../ROADMAP.md) for planned features in future versions.

## Privacy & Data Ownership

- **100% local**: All data stays in your browser
- **No tracking**: Zero analytics or external requests (except CDN for sql.js)
- **You own your data**: Export anytime, no vendor lock-in
- **Private by default**: Nothing is shared unless you choose to export

## License

To be determined

## Support

For issues or questions, see the main repository.
