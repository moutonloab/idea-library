/**
 * Main Application Logic
 * Handles routing, UI updates, and user interactions
 */

import { db } from './db.js';

class IdeaApp {
    constructor() {
        this.currentView = null;
        this.currentIdeaId = null;
        this.currentTags = [];  // Tags for current idea being created/edited
        this.selectedSuggestionIndex = -1;  // For keyboard navigation in dropdown
        this.blurTimeoutId = null;  // Track blur timeout for cancellation (VoiceOver support)
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

        // Tags input
        const tagsInput = document.getElementById('idea-tags-input');
        tagsInput.addEventListener('keydown', (e) => this.handleTagInputKeydown(e));
        tagsInput.addEventListener('input', (e) => this.handleTagInputChange(e));
        tagsInput.addEventListener('focus', () => {
            // Cancel any pending blur timeout - user is back in the input
            this.cancelBlurTimeout();
            this.showTagSuggestions();
        });
        tagsInput.addEventListener('blur', () => {
            // Delay to allow click/touch on suggestions and VoiceOver navigation
            // Store timeout ID so it can be cancelled if focus moves to suggestions
            this.blurTimeoutId = setTimeout(() => {
                this.hideTagSuggestions();
                this.blurTimeoutId = null;
            }, 500);
        });
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
        const tags = idea.tags || [];
        const tagsHtml = tags.length > 0 ? tags.map(tag =>
            `<span class="tag">${this.escapeHtml(tag)}</span>`
        ).join('') : '';

        return `
            <a href="#/idea/${idea.id}" class="idea-card" role="listitem">
                <h3>${this.escapeHtml(idea.title)}</h3>
                <p class="idea-preview">${this.escapeHtml(preview)}</p>
                ${tagsHtml ? `<div class="idea-tags">${tagsHtml}</div>` : ''}
                <div class="metadata">
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

        const createdTime = document.getElementById('detail-created');
        createdTime.textContent = `Created ${this.formatDate(idea.created_at)}`;
        createdTime.setAttribute('datetime', idea.created_at);

        const updatedTime = document.getElementById('detail-updated');
        updatedTime.textContent = `Updated ${this.formatDate(idea.updated_at)}`;
        updatedTime.setAttribute('datetime', idea.updated_at);

        // Render tags
        const tags = idea.tags || [];
        const tagsContainer = document.getElementById('detail-tags');
        if (tags.length > 0) {
            tagsContainer.innerHTML = tags.map(tag =>
                `<span class="tag">${this.escapeHtml(tag)}</span>`
            ).join('');
        } else {
            tagsContainer.innerHTML = '';
        }

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
        this.currentTags = [];  // Reset tags

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
            this.currentTags = idea.tags || [];  // Load existing tags
        } else {
            // Create mode
            this.currentIdeaId = null;
            formTitle.textContent = 'New Idea';
            document.getElementById('idea-id').value = '';
        }

        this.renderTags();  // Render tags
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
                db.updateIdea(id, { title, body, tags: this.currentTags });
                window.location.hash = `#/idea/${id}`;
            } else {
                // Create new idea
                const newId = db.createIdea(title, body, this.currentTags);
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
     * Handle tag input keydown (Enter, Escape, Arrow keys)
     * Provides keyboard navigation for the autocomplete
     */
    handleTagInputKeydown(e) {
        const input = e.target;
        const dropdown = document.getElementById('tags-dropdown');
        const suggestions = dropdown.querySelectorAll('.tag-suggestion');
        const liveRegion = document.getElementById('tags-live-region');

        if (e.key === 'Enter') {
            e.preventDefault();

            let tagToAdd = '';
            let added = false;

            // If a suggestion is selected, use it
            if (this.selectedSuggestionIndex >= 0 && suggestions[this.selectedSuggestionIndex]) {
                tagToAdd = suggestions[this.selectedSuggestionIndex].getAttribute('data-tag');
                added = this.addTag(tagToAdd);
            } else {
                // Otherwise add the typed text
                tagToAdd = input.value.trim();
                if (tagToAdd) {
                    added = this.addTag(tagToAdd);
                }
            }

            input.value = '';
            this.hideTagSuggestions();
            this.selectedSuggestionIndex = -1;

            // Announce result to screen readers
            if (tagToAdd) {
                if (added) {
                    liveRegion.textContent = `Tag "${tagToAdd}" added. ${this.currentTags.length} tag${this.currentTags.length !== 1 ? 's' : ''} total.`;
                } else {
                    liveRegion.textContent = `Tag "${tagToAdd}" already exists.`;
                }
            }
        } else if (e.key === 'Escape') {
            this.hideTagSuggestions();
            this.selectedSuggestionIndex = -1;
            liveRegion.textContent = 'Suggestions closed.';
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (suggestions.length > 0) {
                this.selectedSuggestionIndex = Math.min(
                    this.selectedSuggestionIndex + 1,
                    suggestions.length - 1
                );
                this.updateSelectedSuggestion();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (suggestions.length > 0) {
                this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, 0);
                this.updateSelectedSuggestion();
            }
        }
    }

    /**
     * Handle tag input change (filter suggestions)
     */
    handleTagInputChange(e) {
        const value = e.target.value.trim();
        if (value) {
            this.showTagSuggestions(value);
        } else {
            this.showTagSuggestions();
        }
    }

    /**
     * Add a tag
     * @returns {boolean} true if tag was added, false if empty or duplicate
     */
    addTag(tag) {
        const trimmedTag = tag.trim();
        if (!trimmedTag) return false;

        // Don't add duplicates
        if (this.currentTags.includes(trimmedTag)) return false;

        this.currentTags.push(trimmedTag);
        this.renderTags();
        return true;
    }

    /**
     * Remove a tag
     * Announces the removal to screen readers
     */
    removeTag(tag) {
        const liveRegion = document.getElementById('tags-live-region');
        this.currentTags = this.currentTags.filter(t => t !== tag);
        this.renderTags();

        // Announce tag removal to screen readers
        const remaining = this.currentTags.length;
        if (remaining === 0) {
            liveRegion.textContent = `Tag "${tag}" removed. No tags remaining.`;
        } else {
            liveRegion.textContent = `Tag "${tag}" removed. ${remaining} tag${remaining !== 1 ? 's' : ''} remaining.`;
        }

        // Return focus to the tags input for seamless flow
        document.getElementById('idea-tags-input').focus();
    }

    /**
     * Render tags in the form
     * Each tag has accessible remove functionality
     */
    renderTags() {
        const display = document.getElementById('tags-display');
        display.innerHTML = this.currentTags.map((tag, index) => `
            <span class="tag" role="listitem" data-tag="${this.escapeHtml(tag)}">
                <span class="tag-text">${this.escapeHtml(tag)}</span>
                <button
                    class="tag-remove"
                    type="button"
                    data-tag="${this.escapeHtml(tag)}"
                    aria-label="Remove tag ${this.escapeHtml(tag)}"
                >×</button>
            </span>
        `).join('');

        // Add event listeners for remove buttons (click and touch for iOS VoiceOver)
        display.querySelectorAll('.tag-remove').forEach(btn => {
            const tagName = btn.getAttribute('data-tag');

            // Click handler
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.removeTag(tagName);
            });

            // Touch handler for iOS
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.removeTag(tagName);
            });
        });
    }

    /**
     * Show tag suggestions dropdown
     * Implements WAI-ARIA combobox pattern for screen reader accessibility
     */
    showTagSuggestions(filter = '') {
        const allTags = db.getAllTags();
        const dropdown = document.getElementById('tags-dropdown');
        const input = document.getElementById('idea-tags-input');
        const liveRegion = document.getElementById('tags-live-region');

        // Filter out already selected tags and apply search filter
        let suggestions = allTags.filter(tag =>
            !this.currentTags.includes(tag) &&
            tag.toLowerCase().includes(filter.toLowerCase())
        );

        if (suggestions.length === 0) {
            dropdown.style.display = 'none';
            input.setAttribute('aria-expanded', 'false');
            input.removeAttribute('aria-activedescendant');
            // Announce no suggestions available
            if (filter) {
                liveRegion.textContent = 'No matching tags found. Type and press Enter to create a new tag.';
            } else {
                liveRegion.textContent = '';
            }
            return;
        }

        // Build suggestions with unique IDs for aria-activedescendant
        dropdown.innerHTML = suggestions.map((tag, index) => `
            <div
                id="tag-suggestion-${index}"
                class="tag-suggestion"
                role="option"
                tabindex="-1"
                data-tag="${this.escapeHtml(tag)}"
                data-index="${index}"
                aria-selected="false"
            >
                ${this.escapeHtml(tag)}
            </div>
        `).join('');

        // Add event listeners for suggestions (click and touch for iOS VoiceOver)
        dropdown.querySelectorAll('.tag-suggestion').forEach(el => {
            // Click handler for mouse and VoiceOver synthetic clicks
            el.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const tag = el.getAttribute('data-tag');
                this.selectSuggestion(tag);
            });

            // Touch handler for iOS - fires before blur timeout
            el.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const tag = el.getAttribute('data-tag');
                this.selectSuggestion(tag);
            });

            // Focus handler for VoiceOver navigation
            // Cancel blur timeout to keep dropdown open while navigating
            el.addEventListener('focus', () => {
                // Cancel any pending blur timeout - user is still in the widget
                this.cancelBlurTimeout();

                const index = parseInt(el.getAttribute('data-index'));
                this.selectedSuggestionIndex = index;
                this.updateSelectedSuggestion();
            });

            // Blur handler for widget-level focus tracking
            // Only hide if focus is leaving the entire combobox widget
            el.addEventListener('blur', (e) => {
                // Check if focus is moving to another suggestion or back to input
                const relatedTarget = e.relatedTarget;
                const isMovingWithinWidget = relatedTarget && (
                    relatedTarget.id === 'idea-tags-input' ||
                    relatedTarget.classList.contains('tag-suggestion')
                );

                if (!isMovingWithinWidget) {
                    // Focus is leaving the widget entirely - hide after short delay
                    this.blurTimeoutId = setTimeout(() => {
                        this.hideTagSuggestions();
                        this.blurTimeoutId = null;
                    }, 300);
                }
            });
        });

        dropdown.style.display = 'block';
        input.setAttribute('aria-expanded', 'true');
        this.selectedSuggestionIndex = -1;

        // Announce suggestions to screen readers
        const count = suggestions.length;
        const tagList = suggestions.slice(0, 3).join(', ');
        const moreText = count > 3 ? ` and ${count - 3} more` : '';
        liveRegion.textContent = `${count} tag suggestion${count !== 1 ? 's' : ''} available: ${tagList}${moreText}. Use arrow keys to navigate or swipe to explore.`;
    }

    /**
     * Cancel any pending blur timeout
     * Called when focus moves within the combobox widget (e.g., to a suggestion)
     */
    cancelBlurTimeout() {
        if (this.blurTimeoutId) {
            clearTimeout(this.blurTimeoutId);
            this.blurTimeoutId = null;
        }
    }

    /**
     * Hide tag suggestions dropdown
     * Resets all ARIA states for accessibility
     */
    hideTagSuggestions() {
        // Cancel any pending blur timeout first
        this.cancelBlurTimeout();

        const dropdown = document.getElementById('tags-dropdown');
        const input = document.getElementById('idea-tags-input');
        const liveRegion = document.getElementById('tags-live-region');

        dropdown.style.display = 'none';
        input.setAttribute('aria-expanded', 'false');
        input.removeAttribute('aria-activedescendant');
        this.selectedSuggestionIndex = -1;

        // Clear any previous announcements
        liveRegion.textContent = '';
    }

    /**
     * Select a suggestion from dropdown
     * Announces the selection to screen readers
     */
    selectSuggestion(tag) {
        const liveRegion = document.getElementById('tags-live-region');
        const added = this.addTag(tag);

        document.getElementById('idea-tags-input').value = '';
        this.hideTagSuggestions();
        document.getElementById('idea-tags-input').focus();

        // Announce the tag was added
        if (added) {
            liveRegion.textContent = `Tag "${tag}" added. ${this.currentTags.length} tag${this.currentTags.length !== 1 ? 's' : ''} total.`;
        } else {
            liveRegion.textContent = `Tag "${tag}" already exists.`;
        }
    }

    /**
     * Update selected suggestion visual state
     * Sets aria-activedescendant for screen reader navigation
     */
    updateSelectedSuggestion() {
        const dropdown = document.getElementById('tags-dropdown');
        const input = document.getElementById('idea-tags-input');
        const suggestions = dropdown.querySelectorAll('.tag-suggestion');
        const liveRegion = document.getElementById('tags-live-region');

        suggestions.forEach((s, i) => {
            if (i === this.selectedSuggestionIndex) {
                s.classList.add('selected');
                s.setAttribute('aria-selected', 'true');
                s.scrollIntoView({ block: 'nearest' });

                // Set aria-activedescendant to point to the selected option
                input.setAttribute('aria-activedescendant', `tag-suggestion-${i}`);

                // Announce the selected tag to screen readers
                const tagName = s.getAttribute('data-tag');
                liveRegion.textContent = `${tagName}, ${i + 1} of ${suggestions.length}`;
            } else {
                s.classList.remove('selected');
                s.setAttribute('aria-selected', 'false');
            }
        });

        // If nothing is selected, remove aria-activedescendant
        if (this.selectedSuggestionIndex < 0) {
            input.removeAttribute('aria-activedescendant');
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
        window.app = new IdeaApp();
        window.app.init();
    });
} else {
    window.app = new IdeaApp();
    window.app.init();
}
