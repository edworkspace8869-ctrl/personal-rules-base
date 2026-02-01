/**
 * Personal Rules - Core Application Logic
 * Manages rule lifecycle, UI rendering, and user interactions
 */

class PersonalRulesApp {
    constructor() {
        this.db = null;
        this.currentView = 'dashboard';
        this.rules = [];
        this.systems = [];
        this.editingRule = null;
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Initialize database
            this.db = new RulesDatabase();
            await this.db.init();

            // Load all rules
            await this.loadRules();

            // Setup event listeners
            this.setupEventListeners();

            // Run daily status check
            await this.dailyStatusCheck();

            // Render initial view
            this.renderView(this.currentView);

            console.log('Personal Rules app initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    /**
     * Load all rules from database
     */
    async loadRules() {
        this.rules = await this.db.getAllRules();
        this.systems = await this.db.getAllSystems();
    }

    /**
     * Setup event listeners for navigation and interactions
     */
    setupEventListeners() {
        // Navigation tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.showView(view);
            });
        });

        // Form submissions will be handled by specific view methods
    }

    /**
     * Show a specific view
     */
    showView(viewName) {
        this.currentView = viewName;
        
        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.view === viewName);
        });

        // Render the view
        this.renderView(viewName);

        // Scroll to top
        window.scrollTo(0, 0);
    }

    /**
     * Render the current view
     */
    renderView(viewName) {
        const container = document.getElementById('app-container');
        
        switch(viewName) {
            case 'dashboard':
                container.innerHTML = this.renderDashboard();
                this.attachDashboardListeners();
                break;
            case 'active':
                container.innerHTML = this.renderActiveRules();
                this.attachRuleListListeners();
                break;
            case 'passed':
                container.innerHTML = this.renderPassedRules();
                this.attachRuleListListeners();
                break;
            case 'proposed':
                container.innerHTML = this.renderProposedRules();
                this.attachProposedListeners();
                break;
            case 'systems':
                container.innerHTML = this.renderSystems();
                this.attachSystemsListeners();
                break;
            case 'create':
                container.innerHTML = this.renderCreateForm();
                this.attachCreateFormListeners();
                break;
            case 'archives':
                container.innerHTML = this.renderArchives();
                this.attachArchiveListeners();
                break;
            case 'devtools':
                this.renderDevTools().then(html => {
                    container.innerHTML = html;
                    this.attachDevToolsListeners();
                });
                break;
            default:
                container.innerHTML = '<div class="empty-state"><p>View not found</p></div>';
        }
    }

    /**
     * Render dashboard view
     */
    renderDashboard() {
        const activeRules = this.rules.filter(r => r.status === 'active' && !r.isArchived);
        const proposedRules = this.rules.filter(r => r.status === 'proposed' && !r.isArchived);
        const expiringSoon = activeRules.filter(r => {
            const daysUntilExpiry = Math.ceil((new Date(r.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
            return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
        });

        // Get unique systems
        const systems = [...new Set(activeRules.map(r => r.system))];

        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${activeRules.length}</div>
                    <div class="stat-label">Active Rules</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${proposedRules.length}</div>
                    <div class="stat-label">Proposed</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${expiringSoon.length}</div>
                    <div class="stat-label">Expiring Soon</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${systems.length}</div>
                    <div class="stat-label">Systems</div>
                </div>
            </div>

            <div class="section">
                <button class="btn btn-primary" data-action="create">+ Create New Rule</button>
                ${proposedRules.length > 0 ? 
                    `<button class="btn btn-secondary" data-action="proposed">Review Proposed Rules</button>` 
                    : ''}
            </div>

            <div class="section">
                <div class="section-title">Data Management</div>
                <button class="btn btn-secondary" data-action="export">📥 Export Backup</button>
                <button class="btn btn-secondary" data-action="import">📤 Import Backup</button>
            </div>

            ${systems.length > 0 ? `
                <div class="section">
                    <div class="section-title">Active Systems</div>
                    ${systems.map(system => {
                        const systemRules = activeRules.filter(r => r.system === system);
                        return `
                            <div class="rule-card" data-action="view-system" data-system="${system}">
                                <div class="rule-title">${system}</div>
                                <div class="rule-meta">${systemRules.length} active ${systemRules.length === 1 ? 'rule' : 'rules'}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            ` : '<div class="empty-state"><div class="empty-state-icon">📋</div><p class="empty-state-text">No active rules yet. Create your first rule to get started!</p></div>'}
        `;
    }

    /**
     * Attach dashboard event listeners
     */
    attachDashboardListeners() {
        // Create new rule button
        const createBtn = document.querySelector('[data-action="create"]');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showView('create'));
        }

        // Review proposed button
        const proposedBtn = document.querySelector('[data-action="proposed"]');
        if (proposedBtn) {
            proposedBtn.addEventListener('click', () => this.showView('proposed'));
        }

        // System cards
        document.querySelectorAll('[data-action="view-system"]').forEach(card => {
            card.addEventListener('click', (e) => {
                const system = e.currentTarget.dataset.system;
                this.showView('active'); // Could filter by system in the future
            });
        });

        // Export button
        const exportBtn = document.querySelector('[data-action="export"]');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        // Import button
        const importBtn = document.querySelector('[data-action="import"]');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importData());
        }
    }

    /**
     * Render active rules view
     */
    renderActiveRules() {
        const activeRules = this.rules.filter(r => r.status === 'active' && !r.isArchived);
        
        if (activeRules.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">✓</div>
                    <p class="empty-state-text">No active rules. Create or pass a proposed rule to get started.</p>
                </div>
            `;
        }

        // Group by system
        const systems = [...new Set(activeRules.map(r => r.system))];

        return systems.map(system => {
            const systemRules = activeRules.filter(r => r.system === system);
            return `
                <div class="system-group">
                    <div class="system-header">${system}</div>
                    ${systemRules.map(rule => this.renderRuleCard(rule)).join('')}
                </div>
            `;
        }).join('');
    }

    /**
     * Render passed rules view (passed but not yet active)
     */
    renderPassedRules() {
        const passedRules = this.rules.filter(r => r.status === 'passed' && !r.isArchived);
        
        if (passedRules.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">📅</div>
                    <p class="empty-state-text">No passed rules awaiting activation. Rules become active on their effective date.</p>
                </div>
            `;
        }

        return `
            <div class="section">
                <div class="section-title">Awaiting Activation</div>
                ${passedRules.map(rule => `
                    <div class="rule-card" data-action="view-detail" data-id="${rule.id}">
                        <div class="rule-header">
                            <div class="rule-id">${rule.id}</div>
                            <div class="rule-status status-${rule.status}">${this.formatStatus(rule.status)}</div>
                        </div>
                        <div class="rule-title">${rule.title}</div>
                        <div class="rule-meta"><strong>System:</strong> ${rule.system}</div>
                        <div class="rule-meta"><strong>Effective Date:</strong> ${this.formatDate(new Date(rule.effectiveDate))}</div>
                        <div class="rule-meta"><strong>Will Expire:</strong> ${rule.expirationDate ? this.formatDate(new Date(rule.expirationDate)) : 'Indefinite'}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render proposed rules view
     */
    renderProposedRules() {
        const proposedRules = this.rules.filter(r => r.status === 'proposed' && !r.isArchived);

        if (proposedRules.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <p class="empty-state-text">No proposed rules. Create a new rule to review.</p>
                </div>
            `;
        }

        return `
            <div class="section">
                <div class="section-title">Awaiting Decision</div>
                ${proposedRules.map(rule => `
                    <div class="rule-card">
                        <div class="rule-header">
                            <div class="rule-id">${rule.id}</div>
                            <div class="rule-status status-${rule.status}">${this.formatStatus(rule.status)}</div>
                        </div>
                        <div class="rule-title">${rule.title}</div>
                        <div class="rule-meta"><strong>System:</strong> ${rule.system}</div>
                        <div class="rule-meta"><strong>Type:</strong> ${rule.clauseType === 'purpose' ? 'Purpose' : 'Hypothesis'}</div>
                        <div class="action-buttons">
                            <button class="btn btn-success btn-small" data-action="pass" data-id="${rule.id}">Pass</button>
                            <button class="btn btn-primary btn-small" data-action="edit-proposed" data-id="${rule.id}">Edit</button>
                            <button class="btn btn-secondary btn-small" data-action="view-detail" data-id="${rule.id}">View</button>
                            <button class="btn btn-danger btn-small" data-action="reject" data-id="${rule.id}">Reject</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render systems management view
     */
    renderSystems() {
        return `
            <div class="section">
                <button class="btn btn-primary" data-action="create-system">+ Create New System</button>
            </div>

            ${this.systems.length > 0 ? `
                <div class="section">
                    <div class="section-title">Existing Systems</div>
                    ${this.systems.map(system => {
                        const systemRules = this.rules.filter(r => r.system === system.name && !r.isArchived);
                        return `
                            <div class="rule-card" data-action="edit-system" data-system="${system.name}">
                                <div class="rule-header">
                                    <div class="rule-id">System ${system.systemId || '?'}</div>
                                </div>
                                <div class="rule-title">${system.name}</div>
                                <div class="rule-meta"><strong>Rules:</strong> ${systemRules.length}</div>
                                ${system.successMetrics ? `
                                    <div class="rule-meta"><strong>Success Metrics:</strong> ${system.successMetrics.substring(0, 100)}${system.successMetrics.length > 100 ? '...' : ''}</div>
                                ` : '<div class="rule-meta" style="color: #666;">No success metrics defined</div>'}
                            </div>
                        `;
                    }).join('')}
                </div>
            ` : '<div class="empty-state"><div class="empty-state-icon">📁</div><p class="empty-state-text">No systems created yet. Create your first system to organize your rules!</p></div>'}
        `;
    }

    /**
     * Attach systems view listeners
     */
    attachSystemsListeners() {
        // Create system button
        const createBtn = document.querySelector('[data-action="create-system"]');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showSystemDialog());
        }

        // Edit system cards
        document.querySelectorAll('[data-action="edit-system"]').forEach(card => {
            card.addEventListener('click', (e) => {
                const systemName = e.currentTarget.dataset.system;
                this.showSystemDialog(systemName);
            });
        });
    }

    /**
     * Show system create/edit dialog
     */
    async showSystemDialog(systemName = null) {
        const isEdit = !!systemName;
        const system = isEdit ? await this.db.getSystem(systemName) : null;
        const nextId = isEdit ? null : await this.db.getNextSystemId();

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>${isEdit ? 'Edit' : 'Create'} System</h3>
                <form id="systemForm">
                    <div class="form-group">
                        <label class="form-label">System ID</label>
                        <input type="text" class="form-input" id="systemIdDisplay" value="${isEdit ? 'System ' + (system?.systemId || '?') : 'System ' + nextId}" readonly style="color: #666; cursor: default;">
                        <div class="form-help">Assigned automatically</div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">System Name *</label>
                        <input type="text" class="form-input" id="systemName" value="${system?.name || ''}" placeholder="e.g., Sunday Routine" ${isEdit ? 'readonly' : ''} required>
                        ${isEdit ? '<div class="form-help">System name cannot be changed</div>' : ''}
                    </div>

                    <div class="form-group">
                        <label class="form-label">Success Metrics</label>
                        <textarea class="form-textarea" id="systemSuccessMetrics" placeholder="How will you measure success for rules in this system?">${system?.successMetrics || ''}</textarea>
                        <div class="form-help">Rules can inherit these metrics or define their own</div>
                    </div>

                    <div class="action-buttons">
                        <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'} System</button>
                        <button type="button" class="btn btn-secondary" id="cancelSystem">Cancel</button>
                        ${isEdit ? '<button type="button" class="btn btn-danger" id="deleteSystem">Delete System</button>' : ''}
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        // Handle form submission
        document.getElementById('systemForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('systemName').value.trim();
            const successMetrics = document.getElementById('systemSuccessMetrics').value.trim();

            if (!name) {
                alert('Please enter a system name');
                return;
            }

            const systemData = {
                name,
                systemId: isEdit ? (system?.systemId || nextId) : nextId,
                successMetrics: successMetrics || null,
                createdAt: system?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            try {
                if (isEdit) {
                    await this.db.updateSystem(systemData);
                    this.showSuccess(`System "${name}" updated successfully!`);
                } else {
                    await this.db.createSystem(systemData);
                    this.showSuccess(`System "${name}" created successfully!`);
                }
                await this.loadRules();
                document.body.removeChild(modal);
                this.renderView('systems');
            } catch (error) {
                console.error('Failed to save system:', error);
                this.showError('Failed to save system. Please try again.');
            }
        });

        // Handle cancel
        document.getElementById('cancelSystem').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // Handle delete
        if (isEdit) {
            document.getElementById('deleteSystem').addEventListener('click', async () => {
                const systemRules = this.rules.filter(r => r.system === systemName);
                if (systemRules.length > 0) {
                    alert(`Cannot delete system "${systemName}" because it has ${systemRules.length} associated rules. Delete or move those rules first.`);
                    return;
                }

                if (confirm(`Are you sure you want to delete the system "${systemName}"?`)) {
                    try {
                        await this.db.deleteSystem(systemName);
                        await this.loadRules();
                        this.showSuccess(`System "${systemName}" deleted successfully!`);
                        document.body.removeChild(modal);
                        this.renderView('systems');
                    } catch (error) {
                        console.error('Failed to delete system:', error);
                        this.showError('Failed to delete system. Please try again.');
                    }
                }
            });
        }
    }

    /**
     * Attach proposed rules listeners
     */
    attachProposedListeners() {
        // Pass buttons
        document.querySelectorAll('[data-action="pass"]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const ruleId = e.target.dataset.id;
                await this.showPassDialog(ruleId);
            });
        });

        // Edit buttons
        document.querySelectorAll('[data-action="edit-proposed"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ruleId = e.target.dataset.id;
                this.showEditProposedForm(ruleId);
            });
        });

        // Reject buttons
        document.querySelectorAll('[data-action="reject"]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const ruleId = e.target.dataset.id;
                if (confirm('Are you sure you want to reject this rule?')) {
                    await this.rejectRule(ruleId);
                }
            });
        });

        // View detail buttons
        document.querySelectorAll('[data-action="view-detail"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ruleId = e.target.dataset.id;
                this.showRuleDetail(ruleId);
            });
        });
    }

    /**
     * Show amendment creation dialog
     */
    async showAmendmentDialog(baseRuleId) {
        const baseRule = this.rules.find(r => r.id === baseRuleId);
        if (!baseRule) return;

        // Get existing amendments to determine next number
        const amendments = await this.db.getAmendments(baseRuleId);
        const nextAmendmentNum = amendments.length + 1;
        const amendmentId = `${baseRuleId}A${nextAmendmentNum}`;

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Create Amendment to ${baseRuleId}</h3>
                <p style="color: #888; margin-bottom: 20px; font-size: 13px;">Amendment ID will be: ${amendmentId}</p>
                
                <form id="amendmentForm">
                    <div class="form-group">
                        <label class="form-label">What changed? *</label>
                        <textarea class="form-textarea" id="amendmentChanges" placeholder="Describe what you're changing about this rule..." required></textarea>
                        <div class="form-help">This will become the amendment's title</div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Updated Purpose/Hypothesis Clause *</label>
                        <textarea class="form-textarea" id="amendmentClauseText" required>${baseRule.clauseText}</textarea>
                        <div class="form-help">Edit the clause to reflect the amendment</div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Updated Body</label>
                        <textarea class="form-textarea" id="amendmentBody">${baseRule.body || ''}</textarea>
                    </div>

                    <div class="action-buttons">
                        <button type="submit" class="btn btn-primary">Create Amendment</button>
                        <button type="button" class="btn btn-secondary" id="cancelAmendment">Cancel</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        // Handle form submission
        document.getElementById('amendmentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const changes = document.getElementById('amendmentChanges').value.trim();
            const clauseText = document.getElementById('amendmentClauseText').value.trim();
            const body = document.getElementById('amendmentBody').value.trim();

            if (!changes || !clauseText) {
                alert('Please fill in required fields');
                return;
            }

            // Create amendment rule
            const amendment = {
                id: amendmentId,
                title: `Amendment ${nextAmendmentNum}: ${changes}`,
                system: baseRule.system,
                status: 'proposed', // Amendments start as proposed
                passedDate: null,
                effectiveDate: null,
                effectiveDateType: null,
                expirationDate: null,
                clauseType: baseRule.clauseType,
                clauseText: clauseText,
                successMetrics: baseRule.successMetrics,
                successMetricsSource: baseRule.successMetricsSource,
                body: body,
                isArchived: false,
                baseRuleId: baseRuleId,
                amendmentNumber: nextAmendmentNum,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            try {
                await this.db.createRule(amendment);
                await this.loadRules();
                this.showSuccess(`Amendment ${amendmentId} created successfully!`);
                document.body.removeChild(modal);
                this.showView('proposed');
            } catch (error) {
                console.error('Failed to create amendment:', error);
                this.showError('Failed to create amendment. Please try again.');
            }
        });

        // Handle cancel
        document.getElementById('cancelAmendment').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    /**
     * Show pass dialog for setting effective date
     */
    async showPassDialog(ruleId) {
        const rule = this.rules.find(r => r.id === ruleId);
        if (!rule) return;

        // Create modal dialog
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Pass Rule: ${rule.title}</h3>
                <div class="form-group">
                    <label class="form-label">Effective Date</label>
                    <div class="form-radio">
                        <label>
                            <input type="radio" name="effectiveDate" value="same" checked>
                            Same as Passed Date (Today)
                        </label>
                        <label>
                            <input type="radio" name="effectiveDate" value="custom">
                            Custom Date
                        </label>
                    </div>
                </div>
                <div class="form-group" id="customDateGroup" style="display: none;">
                    <label class="form-label">Custom Effective Date</label>
                    <input type="date" class="form-input" id="customDate" min="${this.formatDate(new Date())}">
                </div>
                <div class="action-buttons">
                    <button class="btn btn-primary" id="confirmPass">Confirm Pass</button>
                    <button class="btn btn-secondary" id="cancelPass">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Show/hide custom date input
        const radios = modal.querySelectorAll('input[name="effectiveDate"]');
        radios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const customGroup = document.getElementById('customDateGroup');
                customGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
            });
        });

        // Handle confirm
        document.getElementById('confirmPass').addEventListener('click', async () => {
            const effectiveDateType = modal.querySelector('input[name="effectiveDate"]:checked').value;
            let effectiveDate;

            if (effectiveDateType === 'same') {
                effectiveDate = new Date();
            } else {
                const customDateInput = document.getElementById('customDate');
                if (!customDateInput.value) {
                    alert('Please select a custom date');
                    return;
                }
                effectiveDate = new Date(customDateInput.value);
            }

            await this.passRule(ruleId, effectiveDate, effectiveDateType);
            document.body.removeChild(modal);
        });

        // Handle cancel
        document.getElementById('cancelPass').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    /**
     * Pass a rule
     */
    async passRule(ruleId, effectiveDate, effectiveDateType) {
        try {
            const rule = this.rules.find(r => r.id === ruleId);
            if (!rule || rule.status !== 'proposed') {
                throw new Error('Only proposed rules can be passed');
            }

            const passedDate = new Date();

            // Compute expiration based on sunset clause
            let expirationDate = null;
            if (rule.sunsetType === 'indefinite') {
                expirationDate = null; // no expiration
            } else if (rule.sunsetType === 'custom' && rule.customSunsetDays) {
                expirationDate = new Date(effectiveDate);
                expirationDate.setDate(expirationDate.getDate() + rule.customSunsetDays);
            } else {
                // default: 30 days
                expirationDate = new Date(effectiveDate);
                expirationDate.setDate(expirationDate.getDate() + 30);
            }

            // Update rule
            rule.status = effectiveDate <= new Date() ? 'active' : 'passed';
            rule.passedDate = passedDate.toISOString();
            rule.effectiveDate = effectiveDate.toISOString();
            rule.effectiveDateType = effectiveDateType === 'same' ? 'sameAsPassedDate' : 'custom';
            rule.expirationDate = expirationDate ? expirationDate.toISOString() : null;
            rule.updatedAt = new Date().toISOString();

            await this.db.updateRule(rule);
            await this.loadRules();
            
            this.showSuccess(`Rule "${rule.title}" has been passed!`);
            this.renderView(this.currentView);
        } catch (error) {
            console.error('Failed to pass rule:', error);
            this.showError('Failed to pass rule. Please try again.');
        }
    }

    /**
     * Reject a rule
     */
    async rejectRule(ruleId) {
        try {
            const rule = this.rules.find(r => r.id === ruleId);
            if (!rule || rule.status !== 'proposed') {
                throw new Error('Only proposed rules can be rejected');
            }

            rule.status = 'rejected';
            rule.updatedAt = new Date().toISOString();

            await this.db.updateRule(rule);
            await this.loadRules();
            
            this.showSuccess(`Rule "${rule.title}" has been rejected.`);
            this.renderView(this.currentView);
        } catch (error) {
            console.error('Failed to reject rule:', error);
            this.showError('Failed to reject rule. Please try again.');
        }
    }

    /**
     * Render create/edit form
     */
    renderCreateForm(rule = null) {
        const isEdit = !!rule;
        const formData = rule || {
            title: '',
            system: '',
            clauseType: 'purpose',
            clauseText: '',
            successMetricsType: 'none',
            successMetrics: '',
            body: ''
        };

        // Get existing system names for dropdown
        const existingSystems = [...new Set(this.rules.map(r => r.system))];
        const definedSystems = this.systems.map(s => s.name);
        const allSystems = [...new Set([...definedSystems, ...existingSystems])].sort();

        return `
            <form id="ruleForm">
                <div class="form-group">
                    <label class="form-label">Title *</label>
                    <input type="text" class="form-input" id="title" value="${formData.title}" placeholder="e.g., Prepare 3 lunches every Sunday" required>
                </div>

                <div class="form-group">
                    <label class="form-label">System *</label>
                    <select class="form-select" id="systemSelect">
                        <option value="">-- Select Existing or Create New --</option>
                        ${allSystems.map(sys => `<option value="${sys}" ${formData.system === sys ? 'selected' : ''}>${sys}</option>`).join('')}
                        <option value="__new__">+ Create New System</option>
                    </select>
                    <input type="text" class="form-input" id="systemInput" placeholder="Enter new system name" style="display: none; margin-top: 8px;">
                    <div class="form-help">Category or routine this rule belongs to</div>
                </div>

                <div class="form-group">
                    <label class="form-label">Clause Type *</label>
                    <div class="form-radio">
                        <label>
                            <input type="radio" name="clauseType" value="purpose" ${formData.clauseType === 'purpose' ? 'checked' : ''}>
                            Purpose (Confirmed)
                        </label>
                        <label>
                            <input type="radio" name="clauseType" value="hypothesis" ${formData.clauseType === 'hypothesis' ? 'checked' : ''}>
                            Hypothesis (Experimental)
                        </label>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Purpose/Hypothesis Clause *</label>
                    <textarea class="form-textarea" id="clauseText" placeholder="Explain why this rule exists..." required>${formData.clauseText}</textarea>
                </div>

                <div class="form-group">
                    <label class="form-label">Success Metrics</label>
                    <div class="form-radio">
                        <label>
                            <input type="radio" name="successMetricsType" value="none" ${!formData.successMetrics || formData.successMetricsType === 'none' ? 'checked' : ''}>
                            None
                        </label>
                        <label>
                            <input type="radio" name="successMetricsType" value="system" ${formData.successMetricsType === 'system' ? 'checked' : ''}>
                            Follow System
                        </label>
                        <label>
                            <input type="radio" name="successMetricsType" value="custom" ${formData.successMetricsType === 'custom' ? 'checked' : ''}>
                            Custom
                        </label>
                    </div>
                </div>

                <div class="form-group" id="customMetricsGroup" style="${formData.successMetricsType === 'custom' ? '' : 'display: none;'}">
                    <label class="form-label">Custom Success Metrics</label>
                    <textarea class="form-textarea" id="successMetrics" placeholder="How will you measure if this rule works?">${formData.successMetricsType === 'custom' ? formData.successMetrics : ''}</textarea>
                </div>

                <div id="systemMetricsPreview" style="display: none; margin-bottom: 20px;">
                    <div class="detail-label">System Success Metrics (Preview)</div>
                    <div class="detail-clause" id="systemMetricsText"></div>
                </div>

                <div class="form-group">
                    <label class="form-label">Body</label>
                    <textarea class="form-textarea" id="body" placeholder="Additional details or context...">${formData.body}</textarea>
                </div>

                <div class="form-group">
                    <label class="form-label">Sunset Clause</label>
                    <div class="form-radio">
                        <label>
                            <input type="radio" name="sunsetType" value="default" ${(!formData.sunsetType || formData.sunsetType === 'default') ? 'checked' : ''}>
                            Default (30 Days)
                        </label>
                        <label>
                            <input type="radio" name="sunsetType" value="indefinite" ${formData.sunsetType === 'indefinite' ? 'checked' : ''}>
                            Indefinite
                        </label>
                        <label>
                            <input type="radio" name="sunsetType" value="custom" ${formData.sunsetType === 'custom' ? 'checked' : ''}>
                            Custom
                        </label>
                    </div>
                    <div class="form-help">How long the rule stays active after its effective date</div>
                </div>

                <div class="form-group" id="customSunsetGroup" style="${formData.sunsetType === 'custom' ? '' : 'display: none;'}">
                    <label class="form-label">Custom Duration (Days)</label>
                    <input type="number" class="form-input" id="customSunsetDays" min="1" max="365" value="${formData.sunsetType === 'custom' && formData.customSunsetDays ? formData.customSunsetDays : 30}" placeholder="e.g. 60">
                </div>

                <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'} Rule</button>
                ${isEdit ? '<button type="button" class="btn btn-secondary" id="cancelEdit">Cancel</button>' : ''}
            </form>
        `;
    }

    /**
     * Attach create form listeners
     */
    attachCreateFormListeners() {
        const form = document.getElementById('ruleForm');
        const systemSelect = document.getElementById('systemSelect');
        const systemInput = document.getElementById('systemInput');
        
        // System selector logic
        systemSelect.addEventListener('change', async (e) => {
            if (e.target.value === '__new__') {
                systemInput.style.display = 'block';
                systemInput.required = true;
                systemSelect.required = false;
                systemInput.focus();
            } else {
                systemInput.style.display = 'none';
                systemInput.required = false;
                systemSelect.required = true;
                // Update success metrics preview
                await this.updateSystemMetricsPreview(e.target.value);
            }
        });

        // Initial preview if system is selected
        if (systemSelect.value && systemSelect.value !== '__new__' && systemSelect.value !== '') {
            this.updateSystemMetricsPreview(systemSelect.value);
        }

        // Success metrics type change
        const metricsTypeRadios = form.querySelectorAll('input[name="successMetricsType"]');
        metricsTypeRadios.forEach(radio => {
            radio.addEventListener('change', async (e) => {
                const customGroup = document.getElementById('customMetricsGroup');
                const systemPreview = document.getElementById('systemMetricsPreview');
                
                if (e.target.value === 'custom') {
                    customGroup.style.display = 'block';
                    systemPreview.style.display = 'none';
                } else if (e.target.value === 'system') {
                    customGroup.style.display = 'none';
                    systemPreview.style.display = 'block';
                    // Update preview
                    const selectedSystem = systemSelect.value !== '__new__' ? systemSelect.value : systemInput.value;
                    await this.updateSystemMetricsPreview(selectedSystem);
                } else {
                    customGroup.style.display = 'none';
                    systemPreview.style.display = 'none';
                }
            });
        });

        // Sunset clause type toggle
        const sunsetRadios = form.querySelectorAll('input[name="sunsetType"]');
        sunsetRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const customSunsetGroup = document.getElementById('customSunsetGroup');
                customSunsetGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
            });
        });

        // Cancel edit button (when editing a proposed rule)
        const cancelEditBtn = document.getElementById('cancelEdit');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                this.renderView(this.currentView);
            });
        }

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.createRule();
        });
    }

    /**
     * Update system metrics preview
     */
    async updateSystemMetricsPreview(systemName) {
        const systemPreview = document.getElementById('systemMetricsPreview');
        const systemMetricsText = document.getElementById('systemMetricsText');
        
        if (!systemName || systemName === '__new__') {
            systemPreview.style.display = 'none';
            return;
        }

        const system = await this.db.getSystem(systemName);
        const metricsType = document.querySelector('input[name="successMetricsType"]:checked')?.value;
        
        if (metricsType === 'system') {
            if (system && system.successMetrics) {
                systemMetricsText.textContent = system.successMetrics;
                systemPreview.style.display = 'block';
            } else {
                systemMetricsText.textContent = 'This system has no success metrics defined yet.';
                systemPreview.style.display = 'block';
            }
        }
    }

    /**
     * Create a new rule
     */
    async createRule() {
        try {
            const title = document.getElementById('title').value.trim();
            const systemSelect = document.getElementById('systemSelect');
            const systemInput = document.getElementById('systemInput');
            
            let system;
            if (systemSelect.value === '__new__') {
                system = systemInput.value.trim();
                if (!system) {
                    this.showError('Please enter a system name.');
                    return;
                }
            } else if (systemSelect.value) {
                system = systemSelect.value;
            } else {
                this.showError('Please select or create a system.');
                return;
            }

            const clauseType = document.querySelector('input[name="clauseType"]:checked').value;
            const clauseText = document.getElementById('clauseText').value.trim();
            const successMetricsType = document.querySelector('input[name="successMetricsType"]:checked').value;
            const body = document.getElementById('body').value.trim();
            const sunsetType = document.querySelector('input[name="sunsetType"]:checked').value;
            const customSunsetDays = sunsetType === 'custom'
                ? parseInt(document.getElementById('customSunsetDays').value, 10)
                : null;

            // Validation
            if (!title || !system || !clauseText) {
                this.showError('Please fill in all required fields.');
                return;
            }

            if (sunsetType === 'custom' && (!customSunsetDays || customSunsetDays < 1)) {
                this.showError('Please enter a valid number of days (minimum 1).');
                return;
            }

            // Handle success metrics based on type
            let successMetrics = null;
            let successMetricsSource = 'none';

            if (successMetricsType === 'custom') {
                successMetrics = document.getElementById('successMetrics').value.trim();
                if (!successMetrics) {
                    this.showError('Please enter custom success metrics or select a different option.');
                    return;
                }
                successMetricsSource = 'custom';
            } else if (successMetricsType === 'system') {
                const systemData = await this.db.getSystem(system);
                if (systemData && systemData.successMetrics) {
                    successMetrics = systemData.successMetrics;
                    successMetricsSource = 'system';
                } else {
                    this.showError(`The system "${system}" has no success metrics defined. Please add metrics to the system or choose custom metrics.`);
                    return;
                }
            }

            // Create system if it doesn't exist
            const existingSystem = await this.db.getSystem(system);
            if (!existingSystem) {
                const nextId = await this.db.getNextSystemId();
                await this.db.createSystem({
                    name: system,
                    systemId: nextId,
                    successMetrics: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }

            // Generate rule ID
            const currentYear = new Date().getFullYear();
            const baseRulesThisYear = this.rules.filter(r => 
                r.id.startsWith(`PR${currentYear}`) && r.amendmentNumber === 0
            );
            const nextNumber = baseRulesThisYear.length + 1;
            const ruleId = `PR${currentYear}-${String(nextNumber).padStart(2, '0')}`;

            // Create rule object
            const rule = {
                id: ruleId,
                title,
                system,
                status: 'proposed',
                passedDate: null,
                effectiveDate: null,
                effectiveDateType: null,
                expirationDate: null,
                clauseType,
                clauseText,
                successMetrics,
                successMetricsSource, // 'none', 'system', or 'custom'
                sunsetType,           // 'default', 'indefinite', or 'custom'
                customSunsetDays,     // number | null
                body,
                isArchived: false,
                baseRuleId: null,
                amendmentNumber: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await this.db.createRule(rule);
            await this.loadRules();
            
            this.showSuccess(`Rule "${title}" created successfully!`);
            this.showView('proposed');
        } catch (error) {
            console.error('Failed to create rule:', error);
            this.showError('Failed to create rule. Please try again.');
        }
    }

    /**
     * Render archives view
     */
    renderArchives() {
        const archivedRules = this.rules.filter(r => r.isArchived);
        const expiredRules = archivedRules.filter(r => r.status === 'expired');
        const rejectedRules = archivedRules.filter(r => r.status === 'rejected');

        if (archivedRules.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">📦</div>
                    <p class="empty-state-text">No archived rules yet.</p>
                </div>
            `;
        }

        return `
            ${expiredRules.length > 0 ? `
                <div class="section">
                    <div class="section-title">Expired Rules</div>
                    ${expiredRules.map(rule => this.renderArchiveCard(rule)).join('')}
                </div>
            ` : ''}

            ${rejectedRules.length > 0 ? `
                <div class="section">
                    <div class="section-title">Rejected Rules</div>
                    ${rejectedRules.map(rule => this.renderArchiveCard(rule)).join('')}
                </div>
            ` : ''}
        `;
    }

    /**
     * Render archive card
     */
    renderArchiveCard(rule) {
        return `
            <div class="rule-card">
                <div class="rule-header">
                    <div class="rule-id">${rule.id}</div>
                    <div class="rule-status status-${rule.status}">${this.formatStatus(rule.status)}</div>
                </div>
                <div class="rule-title">${rule.title}</div>
                <div class="rule-meta"><strong>System:</strong> ${rule.system}</div>
                <div class="rule-meta"><strong>${rule.status === 'expired' ? 'Expired' : 'Rejected'}:</strong> ${this.formatDate(new Date(rule.updatedAt))}</div>
                <div class="action-buttons">
                    <button class="btn btn-secondary btn-small" data-action="unarchive" data-id="${rule.id}">Unarchive</button>
                    <button class="btn btn-danger btn-small" data-action="delete" data-id="${rule.id}">Delete</button>
                </div>
            </div>
        `;
    }

    /**
     * Attach archive listeners
     */
    attachArchiveListeners() {
        // Unarchive buttons
        document.querySelectorAll('[data-action="unarchive"]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const ruleId = e.target.dataset.id;
                await this.unarchiveRule(ruleId);
            });
        });

        // Delete buttons
        document.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const ruleId = e.target.dataset.id;
                if (confirm('Are you sure you want to permanently delete this rule? This cannot be undone.')) {
                    await this.deleteRule(ruleId);
                }
            });
        });
    }

    /**
     * Unarchive a rule
     */
    async unarchiveRule(ruleId) {
        try {
            const rule = this.rules.find(r => r.id === ruleId);
            if (!rule) return;

            rule.isArchived = false;
            rule.updatedAt = new Date().toISOString();

            await this.db.updateRule(rule);
            await this.loadRules();
            
            this.showSuccess(`Rule "${rule.title}" has been unarchived.`);
            this.renderView(this.currentView);
        } catch (error) {
            console.error('Failed to unarchive rule:', error);
            this.showError('Failed to unarchive rule. Please try again.');
        }
    }

    /**
     * Delete a rule permanently
     */
    async deleteRule(ruleId) {
        try {
            const rule = this.rules.find(r => r.id === ruleId);
            if (!rule) return;

            await this.db.deleteRule(ruleId);
            await this.loadRules();
            
            this.showSuccess(`Rule "${rule.title}" has been permanently deleted.`);
            this.renderView(this.currentView);
        } catch (error) {
            console.error('Failed to delete rule:', error);
            this.showError('Failed to delete rule. Please try again.');
        }
    }

    /**
     * Render Dev Tools view
     */
    async renderDevTools() {
        const orphaned = this.systems.filter(s => !s.systemId);
        const nextId = await this.db.getNextSystemId();

        // Build a preview of what IDs will be assigned
        let previewRows = '';
        orphaned.forEach((sys, i) => {
            previewRows += `
                <div class="rule-card" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; margin-bottom: 8px;">
                    <div>
                        <div class="rule-title" style="margin-bottom: 2px;">${sys.name}</div>
                        <div class="rule-meta">Currently: <span style="color: #ef4444;">System ?</span></div>
                    </div>
                    <div class="rule-meta" style="color: #6ee7b7; font-weight: 600;">→ System ${nextId + i}</div>
                </div>
            `;
        });

        return `
            <div class="section">
                <div class="section-title">Dev Tools</div>
                <div class="rule-card" style="border-color: #333; margin-bottom: 24px;">
                    <div class="rule-title" style="color: #fcd34d; margin-bottom: 6px;">⚠ Patch: Orphaned System IDs</div>
                    <div class="rule-meta" style="margin-bottom: 0;">
                        Systems created before the System ID feature was added have no ID assigned.
                        This tool assigns the next available IDs to each one.
                    </div>
                </div>
            </div>

            ${orphaned.length > 0 ? `
                <div class="section">
                    <div class="section-title">Systems Missing an ID (${orphaned.length})</div>
                    ${previewRows}
                    <button class="btn btn-primary" data-action="patch-system-ids">Assign IDs Now</button>
                </div>
            ` : `
                <div class="empty-state">
                    <div class="empty-state-icon">✓</div>
                    <p class="empty-state-text">All systems have IDs assigned. No patch needed.</p>
                </div>
            `}
        `;
    }

    /**
     * Attach Dev Tools listeners
     */
    attachDevToolsListeners() {
        const patchBtn = document.querySelector('[data-action="patch-system-ids"]');
        if (patchBtn) {
            patchBtn.addEventListener('click', async () => {
                await this.patchOrphanedSystemIds();
            });
        }
    }

    /**
     * Assign sequential IDs to any systems that are missing one
     */
    async patchOrphanedSystemIds() {
        try {
            const orphaned = this.systems.filter(s => !s.systemId);
            if (orphaned.length === 0) {
                this.showSuccess('Nothing to patch — all systems already have IDs.');
                return;
            }

            let nextId = await this.db.getNextSystemId();

            for (const sys of orphaned) {
                sys.systemId = nextId;
                sys.updatedAt = new Date().toISOString();
                await this.db.updateSystem(sys);
                nextId++;
            }

            await this.loadRules();
            this.showSuccess(`Patched ${orphaned.length} system${orphaned.length === 1 ? '' : 's'} with new IDs.`);
            // Re-render the view so the empty state shows up immediately
            this.renderView('devtools');
        } catch (error) {
            console.error('Failed to patch system IDs:', error);
            this.showError('Patch failed. Please try again.');
        }
    }

    /**
     * Show rule detail view
     */
    showRuleDetail(ruleId) {
        const rule = this.rules.find(r => r.id === ruleId);
        if (!rule) return;

        const container = document.getElementById('app-container');
        container.innerHTML = `
            <div class="rule-header" style="margin-bottom: 16px;">
                <div class="rule-id" style="font-size: 13px;">${rule.id}</div>
                <div class="rule-status status-${rule.status}">${this.formatStatus(rule.status)}</div>
            </div>

            <h2 style="font-size: 20px; margin-bottom: 24px; color: #fff;">${rule.title}</h2>

            <div class="detail-section">
                <div class="detail-label">System</div>
                <div class="detail-value">${rule.system}</div>
            </div>

            ${rule.passedDate ? `
                <div class="detail-section">
                    <div class="detail-label">Status Timeline</div>
                    <div class="detail-value">
                        <div style="font-size: 13px; color: #888; margin-bottom: 4px;">Created: ${this.formatDate(new Date(rule.createdAt))}</div>
                        ${rule.passedDate ? `<div style="font-size: 13px; color: #888; margin-bottom: 4px;">Passed: ${this.formatDate(new Date(rule.passedDate))}</div>` : ''}
                        ${rule.effectiveDate ? `<div style="font-size: 13px; color: #888; margin-bottom: 4px;">Effective: ${this.formatDate(new Date(rule.effectiveDate))}</div>` : ''}
                        <div style="font-size: 13px; color: #888;">Expires: ${rule.expirationDate ? this.formatDate(new Date(rule.expirationDate)) : 'Indefinite'}</div>
                    </div>
                </div>
            ` : ''}

            <div class="detail-section">
                <div class="detail-label">Sunset Clause</div>
                <div class="detail-value" style="font-size: 14px;">
                    ${rule.sunsetType === 'indefinite' ? 'Indefinite — this rule does not expire automatically.'
                      : rule.sunsetType === 'custom' && rule.customSunsetDays ? `Custom — ${rule.customSunsetDays} days after effective date.`
                      : 'Default — 30 days after effective date.'}
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-label">${rule.clauseType === 'purpose' ? 'Purpose Clause' : 'Hypothesis Clause'}</div>
                <div class="detail-clause">${rule.clauseText}</div>
            </div>

            ${rule.successMetrics ? `
                <div class="detail-section">
                    <div class="detail-label">Success Metrics ${rule.successMetricsSource === 'system' ? '(From System)' : rule.successMetricsSource === 'custom' ? '(Custom)' : ''}</div>
                    <div class="detail-clause">${rule.successMetrics}</div>
                </div>
            ` : ''}

            ${rule.body ? `
                <div class="detail-section">
                    <div class="detail-label">Body</div>
                    <div class="detail-value" style="font-size: 14px; line-height: 1.6;">${rule.body}</div>
                </div>
            ` : ''}

            <div class="action-buttons">
                <button class="btn btn-secondary btn-small" data-action="back">Back</button>
                ${rule.status === 'proposed' ? `<button class="btn btn-primary btn-small" data-action="edit-proposed">Edit</button>` : ''}
                ${rule.status === 'active' ? `<button class="btn btn-secondary btn-small" data-action="create-amendment">Create Amendment</button>` : ''}
                ${rule.status === 'rejected' || rule.status === 'expired' ? `<button class="btn btn-secondary btn-small" data-action="archive">Archive</button>` : ''}
            </div>
        `;

        // Attach listeners
        const backBtn = container.querySelector('[data-action="back"]');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.renderView(this.currentView);
            });
        }

        const editProposedBtn = container.querySelector('[data-action="edit-proposed"]');
        if (editProposedBtn) {
            editProposedBtn.addEventListener('click', () => {
                this.showEditProposedForm(ruleId);
            });
        }

        const amendmentBtn = container.querySelector('[data-action="create-amendment"]');
        if (amendmentBtn) {
            amendmentBtn.addEventListener('click', () => {
                this.showAmendmentDialog(ruleId);
            });
        }

        const archiveBtn = container.querySelector('[data-action="archive"]');
        if (archiveBtn) {
            archiveBtn.addEventListener('click', async () => {
                await this.archiveRule(ruleId);
            });
        }
    }

    /**
     * Show edit form for a proposed rule
     */
    showEditProposedForm(ruleId) {
        const rule = this.rules.find(r => r.id === ruleId);
        if (!rule) return;

        // Render the create form pre-filled with this rule's data, in edit mode
        const container = document.getElementById('app-container');
        container.innerHTML = this.renderCreateForm(rule);
        this.attachEditProposedListeners(rule);
    }

    /**
     * Attach listeners for the edit-proposed form
     */
    attachEditProposedListeners(rule) {
        const form = document.getElementById('ruleForm');
        const systemSelect = document.getElementById('systemSelect');
        const systemInput = document.getElementById('systemInput');

        // System selector logic (same as create)
        systemSelect.addEventListener('change', async (e) => {
            if (e.target.value === '__new__') {
                systemInput.style.display = 'block';
                systemInput.required = true;
                systemSelect.required = false;
                systemInput.focus();
            } else {
                systemInput.style.display = 'none';
                systemInput.required = false;
                systemSelect.required = true;
                await this.updateSystemMetricsPreview(e.target.value);
            }
        });

        // Success metrics type toggle
        const metricsTypeRadios = form.querySelectorAll('input[name="successMetricsType"]');
        metricsTypeRadios.forEach(radio => {
            radio.addEventListener('change', async (e) => {
                const customGroup = document.getElementById('customMetricsGroup');
                const systemPreview = document.getElementById('systemMetricsPreview');
                if (e.target.value === 'custom') {
                    customGroup.style.display = 'block';
                    systemPreview.style.display = 'none';
                } else if (e.target.value === 'system') {
                    customGroup.style.display = 'none';
                    systemPreview.style.display = 'block';
                    const selectedSystem = systemSelect.value !== '__new__' ? systemSelect.value : systemInput.value;
                    await this.updateSystemMetricsPreview(selectedSystem);
                } else {
                    customGroup.style.display = 'none';
                    systemPreview.style.display = 'none';
                }
            });
        });

        // Sunset clause type toggle
        const sunsetRadios = form.querySelectorAll('input[name="sunsetType"]');
        sunsetRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const customSunsetGroup = document.getElementById('customSunsetGroup');
                customSunsetGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
            });
        });

        // Cancel button
        const cancelEditBtn = document.getElementById('cancelEdit');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                this.showRuleDetail(rule.id);
            });
        }

        // Form submission — update the existing proposed rule in place
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateProposedRule(rule.id);
        });
    }

    /**
     * Update an existing proposed rule in place
     */
    async updateProposedRule(ruleId) {
        try {
            const rule = this.rules.find(r => r.id === ruleId);
            if (!rule || rule.status !== 'proposed') {
                this.showError('Only proposed rules can be edited.');
                return;
            }

            const title = document.getElementById('title').value.trim();
            const systemSelect = document.getElementById('systemSelect');
            const systemInput = document.getElementById('systemInput');

            let system;
            if (systemSelect.value === '__new__') {
                system = systemInput.value.trim();
                if (!system) {
                    this.showError('Please enter a system name.');
                    return;
                }
            } else if (systemSelect.value) {
                system = systemSelect.value;
            } else {
                this.showError('Please select or create a system.');
                return;
            }

            const clauseType = document.querySelector('input[name="clauseType"]:checked').value;
            const clauseText = document.getElementById('clauseText').value.trim();
            const successMetricsType = document.querySelector('input[name="successMetricsType"]:checked').value;
            const body = document.getElementById('body').value.trim();
            const sunsetType = document.querySelector('input[name="sunsetType"]:checked').value;
            const customSunsetDays = sunsetType === 'custom'
                ? parseInt(document.getElementById('customSunsetDays').value, 10)
                : null;

            if (!title || !system || !clauseText) {
                this.showError('Please fill in all required fields.');
                return;
            }

            if (sunsetType === 'custom' && (!customSunsetDays || customSunsetDays < 1)) {
                this.showError('Please enter a valid number of days (minimum 1).');
                return;
            }

            // Resolve success metrics
            let successMetrics = null;
            let successMetricsSource = 'none';
            if (successMetricsType === 'custom') {
                successMetrics = document.getElementById('successMetrics').value.trim();
                if (!successMetrics) {
                    this.showError('Please enter custom success metrics or select a different option.');
                    return;
                }
                successMetricsSource = 'custom';
            } else if (successMetricsType === 'system') {
                const systemData = await this.db.getSystem(system);
                if (systemData && systemData.successMetrics) {
                    successMetrics = systemData.successMetrics;
                    successMetricsSource = 'system';
                } else {
                    this.showError(`The system "${system}" has no success metrics defined. Please add metrics to the system or choose custom metrics.`);
                    return;
                }
            }

            // Create system if it doesn't exist
            const existingSystem = await this.db.getSystem(system);
            if (!existingSystem) {
                const nextId = await this.db.getNextSystemId();
                await this.db.createSystem({
                    name: system,
                    systemId: nextId,
                    successMetrics: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }

            // Apply updates to the rule (keep id, status, timestamps intact)
            rule.title = title;
            rule.system = system;
            rule.clauseType = clauseType;
            rule.clauseText = clauseText;
            rule.successMetrics = successMetrics;
            rule.successMetricsSource = successMetricsSource;
            rule.sunsetType = sunsetType;
            rule.customSunsetDays = customSunsetDays;
            rule.body = body;
            rule.updatedAt = new Date().toISOString();

            await this.db.updateRule(rule);
            await this.loadRules();

            this.showSuccess(`Rule "${title}" updated successfully!`);
            this.showView('proposed');
        } catch (error) {
            console.error('Failed to update proposed rule:', error);
            this.showError('Failed to update rule. Please try again.');
        }
    }

    /**
     * Archive a rule
     */
    async archiveRule(ruleId) {
        try {
            const rule = this.rules.find(r => r.id === ruleId);
            if (!rule) return;

            if (rule.status !== 'rejected' && rule.status !== 'expired') {
                this.showError('Only rejected or expired rules can be archived.');
                return;
            }

            rule.isArchived = true;
            rule.updatedAt = new Date().toISOString();

            await this.db.updateRule(rule);
            await this.loadRules();
            
            this.showSuccess(`Rule "${rule.title}" has been archived.`);
            this.renderView(this.currentView);
        } catch (error) {
            console.error('Failed to archive rule:', error);
            this.showError('Failed to archive rule. Please try again.');
        }
    }

    /**
     * Render a rule card
     */
    renderRuleCard(rule) {
        return `
            <div class="rule-card" data-action="view-detail" data-id="${rule.id}">
                <div class="rule-header">
                    <div class="rule-id">${rule.id}</div>
                    <div class="rule-status status-${rule.status}">${this.formatStatus(rule.status)}</div>
                </div>
                <div class="rule-title">${rule.title}</div>
                <div class="rule-meta"><strong>Expires:</strong> ${rule.expirationDate ? this.formatDate(new Date(rule.expirationDate)) : 'Indefinite'}</div>
            </div>
        `;
    }

    /**
     * Attach rule list listeners
     */
    attachRuleListListeners() {
        document.querySelectorAll('[data-action="view-detail"]').forEach(card => {
            card.addEventListener('click', (e) => {
                const ruleId = e.currentTarget.dataset.id;
                this.showRuleDetail(ruleId);
            });
        });
    }

    /**
     * Daily status check to activate/expire rules
     */
    async dailyStatusCheck() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let updated = false;

            // Activate passed rules whose effective date has arrived
            const passedRules = this.rules.filter(r => r.status === 'passed');
            for (const rule of passedRules) {
                const effectiveDate = new Date(rule.effectiveDate);
                effectiveDate.setHours(0, 0, 0, 0);
                
                if (effectiveDate <= today) {
                    rule.status = 'active';
                    rule.updatedAt = new Date().toISOString();
                    await this.db.updateRule(rule);
                    updated = true;
                }
            }

            // Expire active rules whose expiration date has passed
            const activeRules = this.rules.filter(r => r.status === 'active');
            for (const rule of activeRules) {
                if (!rule.expirationDate) continue; // indefinite rules never expire

                const expirationDate = new Date(rule.expirationDate);
                expirationDate.setHours(0, 0, 0, 0);
                
                if (expirationDate < today) {
                    rule.status = 'expired';
                    rule.updatedAt = new Date().toISOString();
                    await this.db.updateRule(rule);
                    updated = true;
                }
            }

            if (updated) {
                await this.loadRules();
            }
        } catch (error) {
            console.error('Daily status check failed:', error);
        }
    }

    /**
     * Format status for display
     */
    formatStatus(status) {
        const statusMap = {
            'proposed': 'Proposed',
            'passed': 'Passed',
            'active': 'Active',
            'expired': 'Expired',
            'rejected': 'Rejected'
        };
        return statusMap[status] || status;
    }

    /**
     * Format date for display
     */
    formatDate(date) {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }

    /**
     * Export all data as JSON file
     */
    async exportData() {
        try {
            const jsonData = await this.db.exportData();
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `personal-rules-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showSuccess('Backup exported successfully!');
        } catch (error) {
            console.error('Failed to export data:', error);
            this.showError('Failed to export backup. Please try again.');
        }
    }

    /**
     * Import data from JSON file
     */
    async importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const jsonData = event.target.result;
                        
                        // Confirm before importing
                        if (!confirm('This will replace all current rules with the backup. Are you sure?')) {
                            return;
                        }

                        const count = await this.db.importData(jsonData);
                        await this.loadRules();
                        
                        this.showSuccess(`Successfully imported ${count} rules!`);
                        this.renderView(this.currentView);
                    } catch (error) {
                        console.error('Failed to parse import file:', error);
                        this.showError('Invalid backup file. Please check the file and try again.');
                    }
                };
                reader.readAsText(file);
            } catch (error) {
                console.error('Failed to import data:', error);
                this.showError('Failed to import backup. Please try again.');
            }
        };

        input.click();
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showToast(message, 'success');
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showToast(message, 'error');
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new PersonalRulesApp();
    app.init();
});
