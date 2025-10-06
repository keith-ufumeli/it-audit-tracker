/**
 * IT Audit Tracker - Main JavaScript
 * Handles client-side interactions, animations, and API calls
 */

// Global app object
window.AuditTracker = {
    // Configuration
    config: {
        apiBaseUrl: '/api',
        csrfToken: null,
        currentUser: null
    },
    
    // Initialize the application
    init: function() {
        this.setupCSRF();
        this.setupEventListeners();
        this.setupModals();
        this.setupForms();
        this.setupTables();
        this.setupCharts();
        this.setupNotifications();
        this.setupSidebar();
        this.setupTooltips();
        this.initializeComponents();
    },
    
    // Setup CSRF token
    setupCSRF: function() {
        const csrfMeta = document.querySelector('meta[name="csrf-token"]');
        if (csrfMeta) {
            this.config.csrfToken = csrfMeta.getAttribute('content');
        }
    },
    
    // Setup global event listeners
    setupEventListeners: function() {
        // Handle form submissions
        document.addEventListener('submit', this.handleFormSubmit.bind(this));
        
        // Handle button clicks
        document.addEventListener('click', this.handleButtonClick.bind(this));
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
        
        // Handle window resize
        window.addEventListener('resize', this.handleWindowResize.bind(this));
        
        // Handle page visibility change
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    },
    
    // Setup modal functionality
    setupModals: function() {
        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
        
        // Close modal on backdrop click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });
    },
    
    // Setup form functionality
    setupForms: function() {
        // Auto-save forms
        const autoSaveForms = document.querySelectorAll('[data-auto-save]');
        autoSaveForms.forEach(form => {
            this.setupAutoSave(form);
        });
        
        // Form validation
        const forms = document.querySelectorAll('form[data-validate]');
        forms.forEach(form => {
            this.setupFormValidation(form);
        });
    },
    
    // Setup table functionality
    setupTables: function() {
        // Sortable tables
        const sortableTables = document.querySelectorAll('table[data-sortable]');
        sortableTables.forEach(table => {
            this.setupTableSorting(table);
        });
        
        // Searchable tables
        const searchableTables = document.querySelectorAll('table[data-searchable]');
        searchableTables.forEach(table => {
            this.setupTableSearch(table);
        });
    },
    
    // Setup chart functionality
    setupCharts: function() {
        // Initialize charts if Chart.js is available
        if (typeof Chart !== 'undefined') {
            this.initializeCharts();
        }
    },
    
    // Setup notification system
    setupNotifications: function() {
        // Auto-dismiss notifications
        const notifications = document.querySelectorAll('.alert[data-auto-dismiss]');
        notifications.forEach(notification => {
            const delay = parseInt(notification.dataset.autoDismiss) || 5000;
            setTimeout(() => {
                this.dismissNotification(notification);
            }, delay);
        });
    },
    
    // Setup sidebar functionality
    setupSidebar: function() {
        const sidebarToggle = document.querySelector('[data-sidebar-toggle]');
        const sidebar = document.querySelector('.sidebar');
        
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }
    },
    
    // Setup tooltips
    setupTooltips: function() {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        tooltipElements.forEach(element => {
            this.setupTooltip(element);
        });
    },
    
    // Initialize components
    initializeComponents: function() {
        // Initialize progress bars
        this.initializeProgressBars();
        
        // Initialize date pickers
        this.initializeDatePickers();
        
        // Initialize file uploads
        this.initializeFileUploads();
        
        // Initialize search functionality
        this.initializeSearch();
    },
    
    // Handle form submissions
    handleFormSubmit: function(e) {
        const form = e.target;
        
        // Prevent default submission for AJAX forms
        if (form.dataset.ajax) {
            e.preventDefault();
            this.submitFormAjax(form);
        }
        
        // Handle file uploads
        if (form.enctype === 'multipart/form-data') {
            this.handleFileUpload(form);
        }
    },
    
    // Handle button clicks
    handleButtonClick: function(e) {
        const button = e.target.closest('button, .btn');
        if (!button) return;
        
        // Handle modal triggers
        if (button.dataset.modal) {
            e.preventDefault();
            this.openModal(button.dataset.modal);
        }
        
        // Handle delete confirmations
        if (button.dataset.confirm) {
            e.preventDefault();
            this.confirmAction(button);
        }
        
        // Handle AJAX actions
        if (button.dataset.ajax) {
            e.preventDefault();
            this.handleAjaxAction(button);
        }
    },
    
    // Handle keyboard shortcuts
    handleKeyboardShortcuts: function(e) {
        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.focusSearch();
        }
        
        // Ctrl/Cmd + S for save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.saveCurrentForm();
        }
    },
    
    // Handle window resize
    handleWindowResize: function() {
        // Update chart sizes
        if (window.charts) {
            window.charts.forEach(chart => {
                chart.resize();
            });
        }
        
        // Update sidebar visibility
        this.updateSidebarVisibility();
    },
    
    // Handle page visibility change
    handleVisibilityChange: function() {
        if (document.hidden) {
            // Page is hidden, pause updates
            this.pauseUpdates();
        } else {
            // Page is visible, resume updates
            this.resumeUpdates();
        }
    },
    
    // API Methods
    api: {
        // Make API request
        request: function(url, options = {}) {
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            };
            
            // Add CSRF token if available
            if (AuditTracker.config.csrfToken) {
                defaultOptions.headers['X-CSRF-Token'] = AuditTracker.config.csrfToken;
            }
            
            const finalOptions = { ...defaultOptions, ...options };
            
            return fetch(url, finalOptions)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .catch(error => {
                    console.error('API request failed:', error);
                    AuditTracker.showNotification('An error occurred. Please try again.', 'error');
                    throw error;
                });
        },
        
        // GET request
        get: function(url, params = {}) {
            const queryString = new URLSearchParams(params).toString();
            const fullUrl = queryString ? `${url}?${queryString}` : url;
            return this.request(fullUrl, { method: 'GET' });
        },
        
        // POST request
        post: function(url, data = {}) {
            return this.request(url, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },
        
        // PUT request
        put: function(url, data = {}) {
            return this.request(url, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },
        
        // DELETE request
        delete: function(url) {
            return this.request(url, { method: 'DELETE' });
        }
    },
    
    // Modal Methods
    openModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            
            // Focus first input
            const firstInput = modal.querySelector('input, textarea, select');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    },
    
    closeModal: function(modal) {
        if (typeof modal === 'string') {
            modal = document.getElementById(modal);
        }
        
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    },
    
    closeAllModals: function() {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            this.closeModal(modal);
        });
    },
    
    // Form Methods
    submitFormAjax: function(form) {
        const formData = new FormData(form);
        const url = form.action || window.location.href;
        const method = form.method || 'POST';
        
        // Show loading state
        this.setFormLoading(form, true);
        
        fetch(url, {
            method: method,
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showNotification(data.message || 'Success!', 'success');
                
                // Close modal if form is in modal
                const modal = form.closest('.modal');
                if (modal) {
                    this.closeModal(modal);
                }
                
                // Reload page or update content
                if (data.reload) {
                    window.location.reload();
                } else if (data.redirect) {
                    window.location.href = data.redirect;
                }
            } else {
                this.showNotification(data.message || 'An error occurred', 'error');
            }
        })
        .catch(error => {
            console.error('Form submission error:', error);
            this.showNotification('An error occurred. Please try again.', 'error');
        })
        .finally(() => {
            this.setFormLoading(form, false);
        });
    },
    
    setFormLoading: function(form, loading) {
        const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
        if (submitButton) {
            if (loading) {
                submitButton.disabled = true;
                submitButton.dataset.originalText = submitButton.textContent;
                submitButton.innerHTML = '<span class="spinner"></span> Loading...';
            } else {
                submitButton.disabled = false;
                submitButton.textContent = submitButton.dataset.originalText || 'Submit';
            }
        }
    },
    
    // Notification Methods
    showNotification: function(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} notification-toast`;
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add to notification container
        let container = document.querySelector('.notification-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 3000;
                max-width: 400px;
            `;
            document.body.appendChild(container);
        }
        
        container.appendChild(notification);
        
        // Auto-dismiss
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, duration);
        }
    },
    
    dismissNotification: function(notification) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    },
    
    // Sidebar Methods
    toggleSidebar: function() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('show');
        }
    },
    
    updateSidebarVisibility: function() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('show');
            if (mainContent) {
                mainContent.style.marginLeft = '0';
            }
        } else {
            if (mainContent) {
                mainContent.style.marginLeft = '250px';
            }
        }
    },
    
    // Table Methods
    setupTableSorting: function(table) {
        const headers = table.querySelectorAll('th[data-sortable]');
        headers.forEach(header => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => {
                this.sortTable(table, header);
            });
        });
    },
    
    sortTable: function(table, header) {
        const column = header.dataset.sortable;
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        
        const isAscending = header.dataset.sortDirection !== 'asc';
        header.dataset.sortDirection = isAscending ? 'asc' : 'desc';
        
        rows.sort((a, b) => {
            const aValue = a.querySelector(`[data-sort="${column}"]`)?.textContent || '';
            const bValue = b.querySelector(`[data-sort="${column}"]`)?.textContent || '';
            
            if (isAscending) {
                return aValue.localeCompare(bValue);
            } else {
                return bValue.localeCompare(aValue);
            }
        });
        
        rows.forEach(row => tbody.appendChild(row));
    },
    
    setupTableSearch: function(table) {
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search...';
        searchInput.className = 'form-input mb-4';
        
        const tableContainer = table.parentElement;
        tableContainer.insertBefore(searchInput, table);
        
        searchInput.addEventListener('input', (e) => {
            this.filterTable(table, e.target.value);
        });
    },
    
    filterTable: function(table, searchTerm) {
        const tbody = table.querySelector('tbody');
        const rows = tbody.querySelectorAll('tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const matches = text.includes(searchTerm.toLowerCase());
            row.style.display = matches ? '' : 'none';
        });
    },
    
    // Chart Methods
    initializeCharts: function() {
        const chartElements = document.querySelectorAll('[data-chart]');
        window.charts = [];
        
        chartElements.forEach(element => {
            const config = JSON.parse(element.dataset.chart);
            const chart = new Chart(element, config);
            window.charts.push(chart);
        });
    },
    
    // Utility Methods
    confirmAction: function(button) {
        const message = button.dataset.confirm;
        if (confirm(message)) {
            // Execute the action
            if (button.dataset.ajax) {
                this.handleAjaxAction(button);
            } else if (button.form) {
                button.form.submit();
            } else if (button.href) {
                window.location.href = button.href;
            }
        }
    },
    
    handleAjaxAction: function(button) {
        const url = button.dataset.ajax;
        const method = button.dataset.method || 'POST';
        
        this.api.request(url, { method: method })
            .then(data => {
                if (data.success) {
                    this.showNotification(data.message || 'Action completed successfully', 'success');
                    if (data.reload) {
                        window.location.reload();
                    }
                } else {
                    this.showNotification(data.message || 'Action failed', 'error');
                }
            })
            .catch(error => {
                this.showNotification('An error occurred', 'error');
            });
    },
    
    focusSearch: function() {
        const searchInput = document.querySelector('[data-search]');
        if (searchInput) {
            searchInput.focus();
        }
    },
    
    saveCurrentForm: function() {
        const activeForm = document.querySelector('form:focus-within');
        if (activeForm && activeForm.dataset.ajax) {
            this.submitFormAjax(activeForm);
        }
    },
    
    pauseUpdates: function() {
        // Pause any auto-updating components
        if (window.updateInterval) {
            clearInterval(window.updateInterval);
        }
    },
    
    resumeUpdates: function() {
        // Resume auto-updating components
        this.startAutoUpdates();
    },
    
    startAutoUpdates: function() {
        // Start auto-updating components like notifications, activities, etc.
        if (window.updateInterval) {
            clearInterval(window.updateInterval);
        }
        
        window.updateInterval = setInterval(() => {
            this.updateNotifications();
            this.updateActivities();
        }, 30000); // Update every 30 seconds
    },
    
    updateNotifications: function() {
        // Update notification count and list
        this.api.get('/api/notifications/unread')
            .then(data => {
                this.updateNotificationBadge(data.count);
            })
            .catch(error => {
                console.error('Failed to update notifications:', error);
            });
    },
    
    updateActivities: function() {
        // Update recent activities
        const activitiesContainer = document.querySelector('[data-activities]');
        if (activitiesContainer) {
            this.api.get('/api/activities/recent')
                .then(data => {
                    this.updateActivitiesList(activitiesContainer, data);
                })
                .catch(error => {
                    console.error('Failed to update activities:', error);
                });
        }
    },
    
    updateNotificationBadge: function(count) {
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline' : 'none';
        }
    },
    
    updateActivitiesList: function(container, activities) {
        // Update activities list with new data
        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-content">
                    <div class="activity-user">${activity.user_name}</div>
                    <div class="activity-description">${activity.description}</div>
                    <div class="activity-time">${this.formatRelativeTime(activity.timestamp)}</div>
                </div>
            </div>
        `).join('');
    },
    
    formatRelativeTime: function(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    AuditTracker.init();
});

// Export for use in other scripts
window.AuditTracker = AuditTracker;
