// Wheel Animation - DOM manipulation and visual effects only
// Waits for DOM to be ready before doing any layout operations

class WheelAnimation {
    constructor() {
        this.spinning = false;
        this.currentBet = 1;
        this.maxBet = 10;
        this.minBet = 1;
        
        console.log('🎨 Wheel Animation loaded');
    }
    
    // Initialize only after DOM is fully ready
    init() {
        // Wait for next frame to ensure CSS is applied
        requestAnimationFrame(() => {
            this.updateBetDisplay();
            console.log('✅ Animation system ready');
        });
    }
    
    // Animate the wheel rotation (Step 6 from the 9-step process)
    animateRotation(totalDegrees) {
        if (this.spinning) {
            console.log('Already spinning!');
            return Promise.reject('Already spinning');
        }
        
        return new Promise((resolve) => {
            this.spinning = true;
            
            const wheelImage = document.getElementById('wheel-image');
            if (!wheelImage) {
                console.log('⚠️ Wheel image not found');
                this.spinning = false;
                resolve();
                return;
            }
            
            // Get current CSS rotation (avoid layout calculations if possible)
            const currentTransform = wheelImage.style.transform || 'rotate(0deg)';
            const currentCSSRotation = parseFloat(
                currentTransform.match(/rotate\(([^)]+)deg\)/) ? 
                currentTransform.match(/rotate\(([^)]+)deg\)/)[1] : '0'
            );
            
            // Calculate new CSS rotation
            const newCSSRotation = currentCSSRotation + totalDegrees;
            
            console.log(`🎡 Step 6: Animating ${totalDegrees}° (CSS: ${currentCSSRotation}° → ${newCSSRotation}°)`);
            
            // Apply animation
            wheelImage.style.transition = 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
            wheelImage.style.transform = `rotate(${newCSSRotation}deg)`;
            
            // Mark as not spinning after animation
            setTimeout(() => {
                this.spinning = false;
                console.log('✅ Animation complete');
                resolve();
            }, 3000);
        });
    }
    
    // Update UI with spin result
    showResult(outcome, finalPosition, payout) {
        console.log(`🏆 Displaying result: ${outcome} at ${finalPosition}° (payout: ${payout}x)`);
        
        // Update UI status
        const statusElement = document.querySelector('.status-text');
        if (statusElement) {
            statusElement.textContent = `Result: ${outcome}`;
        }
        
        // Update last win display
        const lastWinElement = document.getElementById('last-win');
        if (lastWinElement) {
            lastWinElement.textContent = payout;
        }
        
        // Add visual effects based on outcome
        this.addResultEffects(outcome);
    }
    
    // Add visual effects for different outcomes
    addResultEffects(outcome) {
        const wheelImage = document.getElementById('wheel-image');
        if (!wheelImage) return;
        
        // Remove existing effect classes
        wheelImage.classList.remove('result-win', 'result-lose', 'result-jackpot');
        
        // Add appropriate effect
        if (outcome === 'LOSE') {
            wheelImage.classList.add('result-lose');
        } else if (outcome === '50X' || outcome === '20X') {
            wheelImage.classList.add('result-jackpot');
        } else if (outcome !== 'LOSE') {
            wheelImage.classList.add('result-win');
        }
        
        // Remove effect after 2 seconds
        setTimeout(() => {
            wheelImage.classList.remove('result-win', 'result-lose', 'result-jackpot');
        }, 2000);
    }
    
    // Bet control methods
    increaseBet() {
        if (this.spinning) return;
        if (this.currentBet < this.maxBet) {
            this.currentBet++;
            this.updateBetDisplay();
        }
    }
    
    decreaseBet() {
        if (this.spinning) return;
        if (this.currentBet > this.minBet) {
            this.currentBet--;
            this.updateBetDisplay();
        }
    }
    
    updateBetDisplay() {
        const betElement = document.getElementById('current-bet');
        if (betElement) {
            betElement.textContent = this.currentBet;
        }
    }
    
    // Flip machine for payouts display
    flipMachine() {
        const machine = document.getElementById('wheel-machine');
        if (machine) {
            machine.classList.toggle('flipped');
        }
    }
    
    // Check if animation is in progress
    isSpinning() {
        return this.spinning;
    }
}

// Export for use in other files
window.WheelAnimation = WheelAnimation;
