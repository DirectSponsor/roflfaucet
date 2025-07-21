// ===================================
// SLOT MACHINE TEST CREDITS SCRIPT
// ===================================
//
// This script adds test credits to your slot machine balance
// for development and testing purposes.
//
// Usage: Run this in your browser console while on the slots page,
// or include it as a script tag to automatically add credits.

function addTestCredits(amount = 1000) {
    try {
        // Get current game state from localStorage
        const saved = localStorage.getItem('roflfaucet_slots_state');
        let state;
        
        if (saved) {
            state = JSON.parse(saved);
            console.log('📊 Current balance:', state.credits);
        } else {
            // Create new state if none exists
            state = {
                credits: 0,
                totalSpins: 0,
                totalWagered: 0,
                totalWon: 0
            };
            console.log('📊 No existing state found, creating new state');
        }
        
        // Add test credits
        const oldCredits = state.credits;
        state.credits += amount;
        state.lastSaved = new Date().toISOString();
        
        // Save back to localStorage
        localStorage.setItem('roflfaucet_slots_state', JSON.stringify(state));
        
        console.log(`💰 Added ${amount} test credits!`);
        console.log(`💳 Balance: ${oldCredits} → ${state.credits}`);
        
        // If slot machine is running, update the display
        if (window.slotMachine) {
            window.slotMachine.credits = state.credits;
            window.slotMachine.updateDisplay();
            console.log('🎰 Slot machine display updated!');
        } else {
            console.log('🔄 Refresh the page to see the new balance');
        }
        
        return state.credits;
    } catch (error) {
        console.error('❌ Error adding test credits:', error);
        return null;
    }
}

function resetCredits() {
    try {
        localStorage.removeItem('roflfaucet_slots_state');
        console.log('🔄 Credits reset! Refresh the page to start fresh.');
        
        if (window.slotMachine) {
            window.slotMachine.credits = 100; // Default starting credits
            window.slotMachine.updateDisplay();
        }
    } catch (error) {
        console.error('❌ Error resetting credits:', error);
    }
}

function showCurrentBalance() {
    try {
        const saved = localStorage.getItem('roflfaucet_slots_state');
        if (saved) {
            const state = JSON.parse(saved);
            console.log('💰 Current balance:', state.credits);
            console.log('🎲 Total spins:', state.totalSpins);
            console.log('💸 Total wagered:', state.totalWagered);
            console.log('💎 Total won:', state.totalWon);
            console.log('📅 Last saved:', state.lastSaved);
            return state.credits;
        } else {
            console.log('📊 No game state found');
            return 0;
        }
    } catch (error) {
        console.error('❌ Error reading balance:', error);
        return null;
    }
}

// Auto-run if this script is loaded
if (typeof window !== 'undefined') {
    console.log('🎰 Slot Machine Test Credits Script loaded!');
    console.log('💡 Available functions:');
    console.log('   addTestCredits(1000) - Add 1000 test credits');
    console.log('   showCurrentBalance() - Show current balance');
    console.log('   resetCredits() - Reset to default');
    
    // Automatically add 1000 credits for testing
    addTestCredits(1000);
}
