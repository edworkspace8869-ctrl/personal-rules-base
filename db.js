/**
 * Personal Rules - IndexedDB Database Layer
 * Handles all data persistence operations
 */

class RulesDatabase {
    constructor() {
        this.dbName = 'PersonalRulesDB';
        this.version = 3; // Increment version for systemId addition
        this.db = null;
    }

    /**
     * Initialize the database
     * Creates object stores and indexes if they don't exist
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('Database failed to open:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database opened successfully');
                resolve(this.db);
            };

            // This event is only triggered when the database is created for the first time
            // or when the version number is increased
            request.onupgradeneeded = (event) => {
                this.db = event.target.result;
                console.log('Database upgrade needed, creating object stores...');

                // Create object store for rules
                if (!this.db.objectStoreNames.contains('rules')) {
                    const rulesStore = this.db.createObjectStore('rules', { keyPath: 'id' });
                    
                    // Create indexes for efficient querying
                    rulesStore.createIndex('status', 'status', { unique: false });
                    rulesStore.createIndex('system', 'system', { unique: false });
                    rulesStore.createIndex('isArchived', 'isArchived', { unique: false });
                    rulesStore.createIndex('createdAt', 'createdAt', { unique: false });
                    rulesStore.createIndex('expirationDate', 'expirationDate', { unique: false });
                    rulesStore.createIndex('baseRuleId', 'baseRuleId', { unique: false });
                    
                    console.log('Rules object store created with indexes');
                }

                // Create object store for systems
                if (!this.db.objectStoreNames.contains('systems')) {
                    const systemsStore = this.db.createObjectStore('systems', { keyPath: 'name' });
                    
                    // Create indexes
                    systemsStore.createIndex('createdAt', 'createdAt', { unique: false });
                    systemsStore.createIndex('systemId', 'systemId', { unique: true });
                    
                    console.log('Systems object store created with indexes');
                }
            };
        });
    }

    /**
     * Create a new rule
     * @param {Object} rule - The rule object to create
     * @returns {Promise<Object>} The created rule
     */
    async createRule(rule) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rules'], 'readwrite');
            const store = transaction.objectStore('rules');
            const request = store.add(rule);

            request.onsuccess = () => {
                console.log('Rule created:', rule.id);
                resolve(rule);
            };

            request.onerror = () => {
                console.error('Failed to create rule:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get a rule by ID
     * @param {string} ruleId - The ID of the rule to retrieve
     * @returns {Promise<Object|null>} The rule object or null if not found
     */
    async getRule(ruleId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rules'], 'readonly');
            const store = transaction.objectStore('rules');
            const request = store.get(ruleId);

            request.onsuccess = () => {
                resolve(request.result || null);
            };

            request.onerror = () => {
                console.error('Failed to get rule:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get all rules
     * @returns {Promise<Array>} Array of all rules
     */
    async getAllRules() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rules'], 'readonly');
            const store = transaction.objectStore('rules');
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                console.error('Failed to get all rules:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get rules by status
     * @param {string} status - The status to filter by
     * @returns {Promise<Array>} Array of rules with the specified status
     */
    async getRulesByStatus(status) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rules'], 'readonly');
            const store = transaction.objectStore('rules');
            const index = store.index('status');
            const request = index.getAll(status);

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                console.error('Failed to get rules by status:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get rules by system
     * @param {string} system - The system to filter by
     * @returns {Promise<Array>} Array of rules in the specified system
     */
    async getRulesBySystem(system) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rules'], 'readonly');
            const store = transaction.objectStore('rules');
            const index = store.index('system');
            const request = index.getAll(system);

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                console.error('Failed to get rules by system:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get archived rules
     * @returns {Promise<Array>} Array of archived rules
     */
    async getArchivedRules() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rules'], 'readonly');
            const store = transaction.objectStore('rules');
            const index = store.index('isArchived');
            const request = index.getAll(true);

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                console.error('Failed to get archived rules:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get all amendments for a base rule
     * @param {string} baseRuleId - The base rule ID
     * @returns {Promise<Array>} Array of amendments
     */
    async getAmendments(baseRuleId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rules'], 'readonly');
            const store = transaction.objectStore('rules');
            const index = store.index('baseRuleId');
            const request = index.getAll(baseRuleId);

            request.onsuccess = () => {
                const amendments = request.result || [];
                // Sort by amendment number
                amendments.sort((a, b) => a.amendmentNumber - b.amendmentNumber);
                resolve(amendments);
            };

            request.onerror = () => {
                console.error('Failed to get amendments:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Update an existing rule
     * @param {Object} rule - The rule object with updated data
     * @returns {Promise<Object>} The updated rule
     */
    async updateRule(rule) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rules'], 'readwrite');
            const store = transaction.objectStore('rules');
            const request = store.put(rule);

            request.onsuccess = () => {
                console.log('Rule updated:', rule.id);
                resolve(rule);
            };

            request.onerror = () => {
                console.error('Failed to update rule:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Delete a rule
     * @param {string} ruleId - The ID of the rule to delete
     * @returns {Promise<boolean>} True if deleted successfully
     */
    async deleteRule(ruleId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rules'], 'readwrite');
            const store = transaction.objectStore('rules');
            const request = store.delete(ruleId);

            request.onsuccess = () => {
                console.log('Rule deleted:', ruleId);
                resolve(true);
            };

            request.onerror = () => {
                console.error('Failed to delete rule:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get rules expiring within a certain number of days
     * @param {number} days - Number of days to check ahead
     * @returns {Promise<Array>} Array of rules expiring soon
     */
    async getRulesExpiringSoon(days = 7) {
        const allRules = await this.getAllRules();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + days);

        return allRules.filter(rule => {
            if (rule.status !== 'active' || !rule.expirationDate) {
                return false;
            }

            const expirationDate = new Date(rule.expirationDate);
            expirationDate.setHours(0, 0, 0, 0);

            return expirationDate >= today && expirationDate <= futureDate;
        });
    }

    /**
     * Get rules for a specific year
     * @param {number} year - The year to filter by
     * @returns {Promise<Array>} Array of rules from that year
     */
    async getRulesForYear(year) {
        const allRules = await this.getAllRules();
        return allRules.filter(rule => rule.id.startsWith(`PR${year}`));
    }

    /**
     * Export all data as JSON
     * Includes both rules and systems for a complete backup
     * @returns {Promise<string>} JSON string of all data
     */
    async exportData() {
        const allRules = await this.getAllRules();
        const allSystems = await this.getAllSystems();
        return JSON.stringify({
            version: this.version,
            exportDate: new Date().toISOString(),
            rules: allRules,
            systems: allSystems
        }, null, 2);
    }

    /**
     * Import data from JSON
     * Restores both rules and systems
     * WARNING: This will overwrite existing data
     * @param {string} jsonData - JSON string to import
     * @returns {Promise<number>} Number of rules imported
     */
    async importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (!data.rules || !Array.isArray(data.rules)) {
                throw new Error('Invalid import data format');
            }

            // Clear existing data
            await this.clearAllRules();
            await this.clearAllSystems();

            // Import rules
            const rulesTransaction = this.db.transaction(['rules'], 'readwrite');
            const rulesStore = rulesTransaction.objectStore('rules');

            for (const rule of data.rules) {
                rulesStore.add(rule);
            }

            await new Promise((resolve, reject) => {
                rulesTransaction.oncomplete = () => {
                    console.log(`Imported ${data.rules.length} rules`);
                    resolve();
                };
                rulesTransaction.onerror = () => {
                    console.error('Rules import failed:', rulesTransaction.error);
                    reject(rulesTransaction.error);
                };
            });

            // Import systems (gracefully handle legacy backups that lack the key)
            if (data.systems && Array.isArray(data.systems)) {
                const systemsTransaction = this.db.transaction(['systems'], 'readwrite');
                const systemsStore = systemsTransaction.objectStore('systems');

                for (const system of data.systems) {
                    systemsStore.add(system);
                }

                await new Promise((resolve, reject) => {
                    systemsTransaction.oncomplete = () => {
                        console.log(`Imported ${data.systems.length} systems`);
                        resolve();
                    };
                    systemsTransaction.onerror = () => {
                        console.error('Systems import failed:', systemsTransaction.error);
                        reject(systemsTransaction.error);
                    };
                });
            }

            return data.rules.length;
        } catch (error) {
            console.error('Failed to import data:', error);
            throw error;
        }
    }

    /**
     * Clear all rules from the database
     * USE WITH CAUTION
     * @returns {Promise<boolean>} True if cleared successfully
     */
    async clearAllRules() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rules'], 'readwrite');
            const store = transaction.objectStore('rules');
            const request = store.clear();

            request.onsuccess = () => {
                console.log('All rules cleared');
                resolve(true);
            };

            request.onerror = () => {
                console.error('Failed to clear rules:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Clear all systems from the database
     * USE WITH CAUTION
     * @returns {Promise<boolean>} True if cleared successfully
     */
    async clearAllSystems() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['systems'], 'readwrite');
            const store = transaction.objectStore('systems');
            const request = store.clear();

            request.onsuccess = () => {
                console.log('All systems cleared');
                resolve(true);
            };

            request.onerror = () => {
                console.error('Failed to clear systems:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get database statistics
     * @returns {Promise<Object>} Statistics about the database
     */
    async getStats() {
        const allRules = await this.getAllRules();
        
        const stats = {
            total: allRules.length,
            byStatus: {},
            bySystems: {},
            archived: 0,
            amendments: 0
        };

        allRules.forEach(rule => {
            // Count by status
            stats.byStatus[rule.status] = (stats.byStatus[rule.status] || 0) + 1;

            // Count by system
            stats.bySystems[rule.system] = (stats.bySystems[rule.system] || 0) + 1;

            // Count archived
            if (rule.isArchived) {
                stats.archived++;
            }

            // Count amendments
            if (rule.amendmentNumber > 0) {
                stats.amendments++;
            }
        });

        return stats;
    }

    /**
     * Search rules by text
     * Searches in title, system, and clause text
     * @param {string} searchText - Text to search for
     * @returns {Promise<Array>} Array of matching rules
     */
    async searchRules(searchText) {
        const allRules = await this.getAllRules();
        const searchLower = searchText.toLowerCase();

        return allRules.filter(rule => {
            return rule.title.toLowerCase().includes(searchLower) ||
                   rule.system.toLowerCase().includes(searchLower) ||
                   rule.clauseText.toLowerCase().includes(searchLower) ||
                   (rule.body && rule.body.toLowerCase().includes(searchLower));
        });
    }

    // ============================================
    // SYSTEMS MANAGEMENT
    // ============================================

    /**
     * Get the next available system ID number
     * @returns {Promise<number>} Next system ID number
     */
    async getNextSystemId() {
        const allSystems = await this.getAllSystems();
        if (allSystems.length === 0) return 1;
        const ids = allSystems
            .map(s => parseInt(s.systemId, 10))
            .filter(n => !isNaN(n));
        return ids.length === 0 ? 1 : Math.max(...ids) + 1;
    }

    /**
     * Create a new system
     * @param {Object} system - The system object to create
     * @returns {Promise<Object>} The created system
     */
    async createSystem(system) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['systems'], 'readwrite');
            const store = transaction.objectStore('systems');
            const request = store.add(system);

            request.onsuccess = () => {
                console.log('System created:', system.name);
                resolve(system);
            };

            request.onerror = () => {
                console.error('Failed to create system:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get a system by name
     * @param {string} systemName - The name of the system to retrieve
     * @returns {Promise<Object|null>} The system object or null if not found
     */
    async getSystem(systemName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['systems'], 'readonly');
            const store = transaction.objectStore('systems');
            const request = store.get(systemName);

            request.onsuccess = () => {
                resolve(request.result || null);
            };

            request.onerror = () => {
                console.error('Failed to get system:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get all systems
     * @returns {Promise<Array>} Array of all systems
     */
    async getAllSystems() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['systems'], 'readonly');
            const store = transaction.objectStore('systems');
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                console.error('Failed to get all systems:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Update an existing system
     * @param {Object} system - The system object with updated data
     * @returns {Promise<Object>} The updated system
     */
    async updateSystem(system) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['systems'], 'readwrite');
            const store = transaction.objectStore('systems');
            const request = store.put(system);

            request.onsuccess = () => {
                console.log('System updated:', system.name);
                resolve(system);
            };

            request.onerror = () => {
                console.error('Failed to update system:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Delete a system
     * @param {string} systemName - The name of the system to delete
     * @returns {Promise<boolean>} True if deleted successfully
     */
    async deleteSystem(systemName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['systems'], 'readwrite');
            const store = transaction.objectStore('systems');
            const request = store.delete(systemName);

            request.onsuccess = () => {
                console.log('System deleted:', systemName);
                resolve(true);
            };

            request.onerror = () => {
                console.error('Failed to delete system:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Close the database connection
     */
    close() {
        if (this.db) {
            this.db.close();
            console.log('Database connection closed');
        }
    }
}