/**
 * Personal Rules - Core Application Logic
 * Manages rule lifecycle, UI rendering, and user interactions
 */

class PersonalRulesApp {
    constructor() {
        this.db = null;
        this.currentView = 'dashboard';
        this.rules = [];
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
            case 'proposed':
                container.innerHTML = this.renderProposedRules();
                this.attachProposedListeners();
                break;
            case 'create':
                container.innerHTML = this.renderCreateForm();
                this.attachCreateFormListeners();
                break;
            case 'archives':
                container.innerHTML = this.renderArchives();
                this.attachArchiveListeners();
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
                            <button class="btn btn-secondary btn-small" data-action="view-detail" data-id="${rule.id}">View</button>
                            <button class="btn btn-danger btn-small" data-action="reject" data-id="${rule.id}">Reject</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
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
            const expirationDate = new Date(effectiveDate);
            expirationDate.setDate(expirationDate.getDate() + 30);

            // Update rule
            rule.status = effectiveDate <= new Date() ? 'active' : 'passed';
            rule.passedDate = passedDate.toISOString();
            rule.effectiveDate = effectiveDate.toISOString();
            rule.effectiveDateType = effectiveDateType === 'same' ? 'sameAsPassedDate' : 'custom';
            rule.expirationDate = expirationDate.toISOString();
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
            successMetrics: '',
            body: ''
        };

        return `
            <form id="ruleForm">
                <div class="form-group">
                    <label class="form-label">Title *</label>
                    <input type="text" class="form-input" id="title" value="${formData.title}" placeholder="e.g., Prepare 3 lunches every Sunday" required>
                </div>

                <div class="form-group">
                    <label class="form-label">System *</label>
                    <input type="text" class="form-input" id="system" value="${formData.system}" placeholder="e.g., Sunday Routine" required>
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

                <div class="form-group" id="successMetricsGroup" style="${formData.clauseType === 'hypothesis' ? '' : 'display: none;'}">
                    <label class="form-label">Success Metrics</label>
                    <textarea class="form-textarea" id="successMetrics" placeholder="How will you measure if this experimental rule works?">${formData.successMetrics || ''}</textarea>
                    <div class="form-help">Required for experimental rules</div>
                </div>

                <div class="form-group">
                    <label class="form-label">Body</label>
                    <textarea class="form-textarea" id="body" placeholder="Additional details or context...">${formData.body}</textarea>
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
        
        // Show/hide success metrics based on clause type
        const clauseTypeRadios = form.querySelectorAll('input[name="clauseType"]');
        clauseTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const metricsGroup = document.getElementById('successMetricsGroup');
                metricsGroup.style.display = e.target.value === 'hypothesis' ? 'block' : 'none';
            });
        });

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.createRule();
        });
    }

    /**
     * Create a new rule
     */
    async createRule() {
        try {
            const title = document.getElementById('title').value.trim();
            const system = document.getElementById('system').value.trim();
            const clauseType = document.querySelector('input[name="clauseType"]:checked').value;
            const clauseText = document.getElementById('clauseText').value.trim();
            const successMetrics = document.getElementById('successMetrics').value.trim();
            const body = document.getElementById('body').value.trim();

            // Validation
            if (!title || !system || !clauseText) {
                this.showError('Please fill in all required fields.');
                return;
            }

            if (clauseType === 'hypothesis' && !successMetrics) {
                this.showError('Success metrics are required for experimental rules.');
                return;
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
                successMetrics: clauseType === 'hypothesis' ? successMetrics : null,
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
                        ${rule.expirationDate ? `<div style="font-size: 13px; color: #888;">Expires: ${this.formatDate(new Date(rule.expirationDate))}</div>` : ''}
                    </div>
                </div>
            ` : ''}

            <div class="detail-section">
                <div class="detail-label">${rule.clauseType === 'purpose' ? 'Purpose Clause' : 'Hypothesis Clause'}</div>
                <div class="detail-clause">${rule.clauseText}</div>
            </div>

            ${rule.successMetrics ? `
                <div class="detail-section">
                    <div class="detail-label">Success Metrics</div>
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

        const archiveBtn = container.querySelector('[data-action="archive"]');
        if (archiveBtn) {
            archiveBtn.addEventListener('click', async () => {
                await this.archiveRule(ruleId);
            });
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
                <div class="rule-meta"><strong>Expires:</strong> ${this.formatDate(new Date(rule.expirationDate))}</div>
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