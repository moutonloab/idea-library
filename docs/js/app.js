/**
 * Main Application Logic
 * Handles routing, UI updates, and user interactions
 */

import { db } from './db.js';

class IdeaApp {
    constructor() {
        this.currentView = null;
        this.currentIdeaId = null;
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Show loading view
            this.showView('loading-view');

            // Initialize database
            await db.init();

            // Set up event listeners
            this.setupEventListeners();

            // Handle initial route
            this.handleRoute();

            // Listen for hash changes (client-side routing)
            window.addEventListener('hashchange', () => this.handleRoute());

        } catch (error) {
            console.error('App initialization failed:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Form submission
        const form = document.getElementById('idea-form');
        form.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Export button
        const exportBtn = document.getElementById('export-btn');
        exportBtn.addEventListener('click', () => this.handleExport());

        // Delete button
        const deleteBtn = document.getElementById('delete-btn');
        deleteBtn.addEventListener('click', () => this.handleDelete());
    }

    /**
     * Handle routing based on hash
     */
    handleRoute() {
        const hash = window.location.hash.slice(1) || '/';
        const [path, id] = hash.split('/').filter(Boolean);

        // Update nav active state
        this.updateNavActive(path);

        // Route to appropriate view
        if (!path || path === '') {
            this.showListView();
        } else if (path === 'create') {
            this.showFormView();
        } else if (path === 'edit' && id) {
            this.showFormView(id);
        } else if (path === 'idea' && id) {
            this.showDetailView(id);
        } else {
            this.showListView();
        }
    }

    /**
     * Update navigation active state
     */
    updateNavActive(path) {
        document.querySelectorAll('nav a').forEach(link => {
            link.classList.remove('active');
        });

        if (!path || path === '') {
            document.getElementById('nav-home')?.classList.add('active');
        } else if (path === 'create') {
            document.getElementById('nav-create')?.classList.add('active');
        }
    }

    /**
     * Show list view
     */
    showListView() {
        const ideas = db.getAllIdeas();
        const listContainer = document.getElementById('ideas-list');
        const emptyState = document.getElementById('empty-state');

        if (ideas.length === 0) {
            listContainer.innerHTML = '';
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            listContainer.innerHTML = ideas.map(idea => this.renderIdeaCard(idea)).join('');
        }

        this.showView('list-view');
    }

    /**
     * Render an idea card for list view
     */
    renderIdeaCard(idea) {
        const preview = this.truncate(idea.body, 150);
        const relativeTime = this.getRelativeTime(idea.updated_at);

        return `
            <a href="#/idea/${idea.id}" class="idea-card" role="listitem">
                <h3>${this.escapeHtml(idea.title)}</h3>
                <p class="idea-preview">${this.escapeHtml(preview)}</p>
                <div class="metadata">
                    <span class="badge ${idea.stage}">${idea.stage}</span>
                    <time datetime="${idea.updated_at}">Updated ${relativeTime}</time>
                </div>
            </a>
        `;
    }

    /**
     * Show detail view
     */
    showDetailView(id) {
        const idea = db.getIdea(id);

        if (!idea) {
            this.showError('Idea not found');
            return;
        }

        this.currentIdeaId = id;

        // Update detail view
        document.getElementById('detail-title').textContent = idea.title;
        document.getElementById('detail-body').textContent = idea.body;
        document.getElementById('detail-stage').textContent = idea.stage;
        document.getElementById('detail-stage').className = `badge ${idea.stage}`;

        const createdTime = document.getElementById('detail-created');
        createdTime.textContent = `Created ${this.formatDate(idea.created_at)}`;
        createdTime.setAttribute('datetime', idea.created_at);

        const updatedTime = document.getElementById('detail-updated');
        updatedTime.textContent = `Updated ${this.formatDate(idea.updated_at)}`;
        updatedTime.setAttribute('datetime', idea.updated_at);

        // Update edit button href
        document.getElementById('edit-btn').href = `#/edit/${id}`;

        this.showView('detail-view');
    }

    /**
     * Show form view (create or edit)
     */
    showFormView(id = null) {
        const form = document.getElementById('idea-form');
        const formTitle = document.getElementById('form-title');

        // Reset form
        form.reset();
        this.clearFormErrors();

        if (id) {
            // Edit mode
            const idea = db.getIdea(id);
            if (!idea) {
                this.showError('Idea not found');
                return;
            }

            this.currentIdeaId = id;
            formTitle.textContent = 'Edit Idea';
            document.getElementById('idea-id').value = id;
            document.getElementById('idea-title').value = idea.title;
            document.getElementById('idea-body').value = idea.body;
        } else {
            // Create mode
            this.currentIdeaId = null;
            formTitle.textContent = 'New Idea';
            document.getElementById('idea-id').value = '';
        }

        this.showView('form-view');
        // Focus first input for accessibility
        document.getElementById('idea-title').focus();
    }

    /**
     * Handle form submission
     */
    handleFormSubmit(e) {
        e.preventDefault();

        // Clear previous errors
        this.clearFormErrors();

        // Get form data
        const id = document.getElementById('idea-id').value;
        const title = document.getElementById('idea-title').value.trim();
        const body = document.getElementById('idea-body').value.trim();

        // Validate
        let isValid = true;

        if (!title) {
            this.showFieldError('title', 'Title is required');
            isValid = false;
        }

        if (!body) {
            this.showFieldError('body', 'Description is required');
            isValid = false;
        }

        if (!isValid) {
            return;
        }

        try {
            if (id) {
                // Update existing idea
                db.updateIdea(id, { title, body });
                window.location.hash = `#/idea/${id}`;
            } else {
                // Create new idea
                const newId = db.createIdea(title, body);
                window.location.hash = `#/idea/${newId}`;
            }
        } catch (error) {
            console.error('Failed to save idea:', error);
            this.showError('Failed to save idea. Please try again.');
        }
    }

    /**
     * Handle delete
     */
    handleDelete() {
        if (!this.currentIdeaId) return;

        if (confirm('Are you sure you want to delete this idea? This action cannot be undone.')) {
            try {
                db.deleteIdea(this.currentIdeaId);
                window.location.hash = '#/';
            } catch (error) {
                console.error('Failed to delete idea:', error);
                alert('Failed to delete idea. Please try again.');
            }
        }
    }

    /**
     * Handle export
     */
    handleExport() {
        try {
            const data = db.exportToJSON();
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `idea-library-backup-${timestamp}.json`;

            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();

            URL.revokeObjectURL(url);

            alert(`Exported ${data.ideas.length} ideas successfully!`);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export ideas. Please try again.');
        }
    }

    /**
     * Show a specific view and hide others
     */
    showView(viewId) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.style.display = 'none';
        });

        // Show target view
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.style.display = 'block';
            this.currentView = viewId;
        }
    }

    /**
     * Show error view
     */
    showError(message) {
        document.getElementById('error-message').textContent = message;
        this.showView('error-view');
    }

    /**
     * Show field validation error
     */
    showFieldError(fieldName, message) {
        const input = document.getElementById(`idea-${fieldName}`);
        const error = document.getElementById(`${fieldName}-error`);

        input.classList.add('invalid');
        input.setAttribute('aria-invalid', 'true');
        error.textContent = message;
    }

    /**
     * Clear all form errors
     */
    clearFormErrors() {
        document.querySelectorAll('.error').forEach(el => {
            el.textContent = '';
        });

        document.querySelectorAll('input, textarea').forEach(el => {
            el.classList.remove('invalid');
            el.removeAttribute('aria-invalid');
        });
    }

    /**
     * Utility: Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Utility: Truncate text
     */
    truncate(text, length) {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    }

    /**
     * Utility: Format date
     */
    formatDate(isoString) {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Utility: Get relative time
     */
    getRelativeTime(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return this.formatDate(isoString);
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = new IdeaApp();
        app.init();
    });
} else {
    const app = new IdeaApp();
    app.init();
}
