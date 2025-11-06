/**
 * ROFLFaucet Totals Display System
 * 
 * Universal system for displaying financial totals anywhere on the site
 * Uses CSS classes to inject real-time values
 * 
 * Usage: Add CSS classes to any element:
 * .charity-current-total  - Current charity fund total
 * .charity-received-total - Total ever received
 * .charity-distributed-total - Total ever distributed  
 * .user-coins-total - Total user coins across all users
 * .active-users-total - Number of active users
 */

class TotalsDisplay {
    constructor() {
        this.totalsData = null;
        this.updateInterval = 30000; // 30 seconds
        this.apiEndpoint = '/api/financial-totals.php';
        this.init();
    }

    async init() {
        if (this.hasTotalsElements()) {
            console.log('📊 Totals Display: Found elements, initializing...');
            await this.fetchTotals();
            this.displayTotals();
            this.setupAutoUpdate();
        } else {
            console.log('📊 Totals Display: No elements found, skipping initialization');
        }
    }

    hasTotalsElements() {
        return document.querySelector('.charity-current-total, .charity-received-total, .charity-distributed-total, .user-coins-total, .active-users-total');
    }

    async fetchTotals() {
        try {
            console.log('📊 Totals Display: Fetching financial totals...');
            const response = await fetch(this.apiEndpoint);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            this.totalsData = await response.json();
            console.log('📊 Totals Display: Fetched totals:', this.totalsData);
        } catch (error) {
            console.warn('📊 Totals Display: Could not fetch financial totals:', error);
            this.totalsData = null;
        }
    }

    displayTotals() {
        if (!this.totalsData) {
            console.warn('📊 Totals Display: No data available to display');
            return;
        }

        const { charity_fund, user_coins, monthly_summary } = this.totalsData;

        // Charity fund totals
        this.updateElements('.charity-current-total', this.formatSats(charity_fund.current_total_sats));
        this.updateElements('.charity-received-total', this.formatSats(charity_fund.total_received_sats));
        this.updateElements('.charity-distributed-total', this.formatSats(charity_fund.total_distributed_sats));
        
        // Monthly stats
        this.updateElements('.charity-month-donations', this.formatSats(monthly_summary.donations_this_month));
        this.updateElements('.charity-month-distributions', this.formatSats(monthly_summary.distributions_this_month));
        
        // User coin stats
        this.updateElements('.user-coins-total', this.formatCoins(user_coins.total_active_coins));
        this.updateElements('.active-users-total', user_coins.active_users.toString());

        console.log('📊 Totals Display: Updated all elements');
    }

    updateElements(selector, text) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            elements.forEach(el => {
                el.textContent = text;
                el.classList.add('totals-loaded');
                el.setAttribute('data-last-update', new Date().toISOString());
            });
            console.log(`📊 Totals Display: Updated ${elements.length} elements with selector "${selector}"`);
        }
    }

    formatSats(sats) {
        if (sats === 0) return '0 sats';
        return new Intl.NumberFormat().format(sats) + ' sats';
    }

    formatCoins(coins) {
        if (coins === 0) return '0 coins';
        return new Intl.NumberFormat().format(coins) + ' coins';
    }

    setupAutoUpdate() {
        console.log(`📊 Totals Display: Setting up auto-update every ${this.updateInterval/1000} seconds`);
        setInterval(async () => {
            await this.fetchTotals();
            this.displayTotals();
        }, this.updateInterval);
    }
}

// Auto-start when DOM is ready if page has totals elements
document.addEventListener('DOMContentLoaded', () => {
    new TotalsDisplay();
});

// Also expose globally for manual initialization
window.TotalsDisplay = TotalsDisplay;