/**
 * Database Layer - SQLite in browser using sql.js
 * Handles all database operations for the Idea Library
 */

const DB_NAME = 'idea-library.db';
const DB_VERSION = 1;

class IdeaDatabase {
    constructor() {
        this.db = null;
        this.SQL = null;
    }

    /**
     * Initialize the database
     * Load existing DB from localStorage or create new one
     */
    async init() {
        try {
            // Initialize sql.js
            this.SQL = await initSqlJs({
                locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
            });

            // Try to load existing database from localStorage
            const savedDb = localStorage.getItem(DB_NAME);

            if (savedDb) {
                // Load existing database
                const uint8Array = this.base64ToUint8Array(savedDb);
                this.db = new this.SQL.Database(uint8Array);
                console.log('Loaded existing database from localStorage');

                // Run migrations for existing databases
                this.runMigrations();
            } else {
                // Create new database
                this.db = new this.SQL.Database();
                this.createSchema();
                this.save();
                console.log('Created new database');
            }

            return true;
        } catch (error) {
            console.error('Failed to initialize database:', error);
            throw error;
        }
    }

    /**
     * Create database schema
     */
    createSchema() {
        const schema = `
            CREATE TABLE IF NOT EXISTS ideas (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                body TEXT NOT NULL,
                stage TEXT NOT NULL DEFAULT 'captured',
                tags TEXT DEFAULT '[]',
                essence TEXT,
                insight TEXT,
                next_action TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                CHECK(stage IN ('captured', 'distilled', 'expressed', 'actioned'))
            );

            CREATE INDEX IF NOT EXISTS idx_updated_at ON ideas(updated_at DESC);
            CREATE INDEX IF NOT EXISTS idx_stage ON ideas(stage);
        `;

        this.db.run(schema);
        console.log('Database schema created');
    }

    /**
     * Run migrations for existing databases
     */
    runMigrations() {
        try {
            // Check if tags column exists
            const tableInfo = this.db.exec("PRAGMA table_info(ideas)");
            const columns = tableInfo[0]?.values.map(row => row[1]) || [];

            if (!columns.includes('tags')) {
                // Add tags column to existing tables
                this.db.run("ALTER TABLE ideas ADD COLUMN tags TEXT DEFAULT '[]'");
                this.save();
                console.log('Migration: Added tags column');
            }
        } catch (error) {
            console.error('Migration failed:', error);
        }
    }

    /**
     * Save database to localStorage
     */
    save() {
        try {
            const data = this.db.export();
            const base64 = this.uint8ArrayToBase64(data);
            localStorage.setItem(DB_NAME, base64);
        } catch (error) {
            console.error('Failed to save database:', error);
            throw error;
        }
    }

    /**
     * Create a new idea
     */
    createIdea(title, body, tags = []) {
        const id = this.generateUUID();
        const now = new Date().toISOString();
        const tagsJson = JSON.stringify(tags);

        const stmt = this.db.prepare(`
            INSERT INTO ideas (id, title, body, stage, tags, created_at, updated_at)
            VALUES (?, ?, ?, 'captured', ?, ?, ?)
        `);

        stmt.bind([id, title, body, tagsJson, now, now]);
        stmt.step();
        stmt.free();

        this.save();
        return id;
    }

    /**
     * Get all ideas sorted by updated_at DESC
     */
    getAllIdeas() {
        const stmt = this.db.prepare('SELECT * FROM ideas ORDER BY updated_at DESC');
        const ideas = [];

        while (stmt.step()) {
            const row = stmt.getAsObject();
            // Parse tags from JSON
            if (row.tags) {
                try {
                    row.tags = JSON.parse(row.tags);
                } catch (e) {
                    row.tags = [];
                }
            } else {
                row.tags = [];
            }
            ideas.push(row);
        }

        stmt.free();
        return ideas;
    }

    /**
     * Get a single idea by ID
     */
    getIdea(id) {
        const stmt = this.db.prepare('SELECT * FROM ideas WHERE id = ?');
        stmt.bind([id]);

        let idea = null;
        if (stmt.step()) {
            idea = stmt.getAsObject();
            // Parse tags from JSON
            if (idea.tags) {
                try {
                    idea.tags = JSON.parse(idea.tags);
                } catch (e) {
                    idea.tags = [];
                }
            } else {
                idea.tags = [];
            }
        }

        stmt.free();
        return idea;
    }

    /**
     * Update an idea
     */
    updateIdea(id, updates) {
        const now = new Date().toISOString();
        const fields = [];
        const values = [];

        // Build dynamic UPDATE query
        for (const [key, value] of Object.entries(updates)) {
            if (key !== 'id' && key !== 'created_at') {
                // Convert tags array to JSON string
                const finalValue = key === 'tags' ? JSON.stringify(value) : value;
                fields.push(`${key} = ?`);
                values.push(finalValue);
            }
        }

        // Always update updated_at
        fields.push('updated_at = ?');
        values.push(now);
        values.push(id);

        const query = `UPDATE ideas SET ${fields.join(', ')} WHERE id = ?`;
        const stmt = this.db.prepare(query);
        stmt.bind(values);
        stmt.step();
        stmt.free();

        this.save();
        return true;
    }

    /**
     * Delete an idea
     */
    deleteIdea(id) {
        const stmt = this.db.prepare('DELETE FROM ideas WHERE id = ?');
        stmt.bind([id]);
        stmt.step();
        stmt.free();

        this.save();
        return true;
    }

    /**
     * Export all ideas as JSON
     */
    exportToJSON() {
        const ideas = this.getAllIdeas();

        return {
            schema_version: DB_VERSION,
            exported_at: new Date().toISOString(),
            ideas: ideas
        };
    }

    /**
     * Get all unique tags from all ideas
     */
    getAllTags() {
        const ideas = this.getAllIdeas();
        const tagSet = new Set();

        ideas.forEach(idea => {
            if (Array.isArray(idea.tags)) {
                idea.tags.forEach(tag => tagSet.add(tag));
            }
        });

        return Array.from(tagSet).sort();
    }

    /**
     * Generate UUID v4
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Convert Uint8Array to Base64
     */
    uint8ArrayToBase64(uint8Array) {
        let binary = '';
        const len = uint8Array.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(uint8Array[i]);
        }
        return btoa(binary);
    }

    /**
     * Convert Base64 to Uint8Array
     */
    base64ToUint8Array(base64) {
        const binary = atob(base64);
        const len = binary.length;
        const uint8Array = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            uint8Array[i] = binary.charCodeAt(i);
        }
        return uint8Array;
    }

    /**
     * Clear all data (for testing/reset)
     */
    clearAll() {
        this.db.run('DELETE FROM ideas');
        this.save();
    }
}

// Export singleton instance
export const db = new IdeaDatabase();
