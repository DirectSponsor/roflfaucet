        let currentAmount = 0;
        let currentDonationId = null;
        let paymentCheckInterval = null;
        let useUsername = false;
        let donationType = 'site';
        let currentProjectId = null;
        let isUSDMode = false; // Start with sats mode
        let btcPrice = 65000; // Approximate BTC price for conversion

        // Open donation modal
        function openDonationModal(type = 'site', projectId = null) {
            donationType = type;
            currentProjectId = projectId;
            
            // Set modal title
            const titleElement = document.getElementById('modal-title');
            const subtitleElement = document.getElementById('modal-subtitle');
            
            if (type === 'project' && projectId) {
                titleElement.textContent = '⚡ Lightning Donation';
                subtitleElement.textContent = `Support Project ${projectId}`;
            } else {
                titleElement.textContent = '⚡ Lightning Donation';
                subtitleElement.textContent = 'Support ROFLFaucet';
            }
            
            // Reset and show modal
            resetDonationModal();
            document.getElementById('donation-modal').style.display = 'block';
            document.body.style.overflow = 'hidden';
        }

        // Close donation modal
        function closeDonationModal() {
            document.getElementById('donation-modal').style.display = 'none';
            document.body.style.overflow = '';
            resetDonationModal();
        }

        // Reset modal to initial state
        function resetDonationModal() {
            currentAmount = 0;
            updateAmountDisplay();
            document.getElementById('payment-status').style.display = 'none';
            document.getElementById('success-interface').style.display = 'none';
            
            // Reset button state
            const continueBtn = document.getElementById('continue-btn');
            continueBtn.style.display = 'inline-block';
            continueBtn.disabled = true;
            continueBtn.textContent = 'Create Invoice';
            
            // Reset donor input
            document.getElementById('donor-name').value = '';
            document.getElementById('donation-message').value = '';
        }

        // Amount calculation functions
        function inputDigit(digit) {
            if (isUSDMode) {
                // Handle USD input (with decimals)
                const currentUSD = (currentAmount / 100000000) * btcPrice;
                const usdStr = currentUSD.toFixed(2);
                
                let newUSDStr;
                if (digit === '.' && usdStr.includes('.')) {
                    return; // Already has decimal
                }
                
                if (usdStr === '0.00') {
                    newUSDStr = digit === '.' ? '0.' : '0.0' + digit;
                } else {
                    newUSDStr = usdStr === '0.00' ? digit : usdStr + digit;
                }
                
                const newUSD = parseFloat(newUSDStr) || 0;
                const newSats = Math.round((newUSD / btcPrice) * 100000000);
                
                if (newSats <= 100000000 && newUSD <= 1000) { // Max $1000
                    currentAmount = newSats;
                    updateAmountDisplay();
                } else if (newUSD > 1000) {
                    // Easter egg for large amounts
                    alert('That\'s a lot! 🛩️\n\nWould you like me to fly over to your place to discuss a deal?\n\n(Contact us for large donations)');
                }
            } else {
                // Handle sats input (integers only)
                const newAmount = currentAmount * 10 + parseInt(digit);
                if (newAmount <= 100000000) { // Max 1 BTC
                    currentAmount = newAmount;
                    updateAmountDisplay();
                } else {
                    // Easter egg for large amounts in sats mode too
                    const usdValue = (newAmount / 100000000) * btcPrice;
                    if (usdValue > 1000) {
                        alert('That\'s a lot! 🛩️\n\nWould you like me to fly over to your place to discuss a deal?\n\n(Contact us for large donations)');
                    }
                }
            }
            
            // Enable continue button
            document.getElementById('continue-btn').disabled = currentAmount <= 0;
        }

        function backspaceAmount() {
            currentAmount = Math.floor(currentAmount / 10);
            updateAmountDisplay();
            
            // Donor section always visible now
            
            // Enable/disable continue button
            document.getElementById('continue-btn').disabled = currentAmount <= 0;
        }

        function clearAmount() {
            currentAmount = 0;
            updateAmountDisplay();
            
            // Donor section always visible now
            
            // Disable continue button
            document.getElementById('continue-btn').disabled = true;
        }

        function toggleCurrency() {
            isUSDMode = !isUSDMode;
            updateAmountDisplay();
        }

        function updateAmountDisplay() {
            const display = document.getElementById('amount-display');
            
            if (isUSDMode) {
                // Show USD first, sats second
                const usdValue = (currentAmount / 100000000) * btcPrice;
                const satsFormatted = new Intl.NumberFormat().format(currentAmount);
                display.innerHTML = `<strong>$${usdValue.toFixed(2)}</strong> <span style="color: #666;">(${satsFormatted} sats)</span>`;
            } else {
                // Show sats first, USD second  
                const usdValue = (currentAmount / 100000000) * btcPrice;
                const satsFormatted = new Intl.NumberFormat().format(currentAmount);
                display.innerHTML = `<strong>${satsFormatted} sats</strong> <span style="color: #666;">($${usdValue.toFixed(2)})</span>`;
            }
        }

        // Test functions
        function testCalculator() {
            openDonationModal('site');
            
            setTimeout(() => {
                inputDigit('1');
                setTimeout(() => inputDigit('0'), 300);
                setTimeout(() => inputDigit('0'), 600);
                setTimeout(() => inputDigit('0'), 900);
            }, 500);
        }

        function toggleCustomDonor() {
            alert('Demo: Toggle to custom donor input');
        }

        function handleLogin() {
            alert('Demo: Would redirect to login');
        }

        function proceedToDonation() {
            alert('Demo mode: Would create Lightning invoice here!\n\nAmount: ' + currentAmount + ' sats\nType: ' + donationType + (currentProjectId ? ' (Project ' + currentProjectId + ')' : ''));
        }
        
        function showMessageTooltip() {
            // Remove any existing tooltip
            const existingTooltip = document.querySelector('.tooltip-popup');
            if (existingTooltip) {
                existingTooltip.remove();
                return; // Toggle off if already showing
            }
            
            // Create tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip-popup';
            tooltip.textContent = 'Add a personal message to motivate the community';
            
            // Position tooltip
            const icon = event.target;
            const rect = icon.getBoundingClientRect();
            tooltip.style.position = 'fixed';
            tooltip.style.top = (rect.top - 40) + 'px';
            tooltip.style.left = (rect.left - 100) + 'px';
            
            document.body.appendChild(tooltip);
            
            // Auto-remove after 3 seconds
            setTimeout(() => {
                if (tooltip.parentNode) {
                    tooltip.remove();
                }
            }, 3000);
        }

        function copyInvoice() {
            alert('Demo: Invoice copied!');
        }

        function backToCalculator() {
            document.getElementById('payment-status').style.display = 'none';
            document.getElementById('continue-btn').style.display = 'inline-block';
        }

        // Close modal when clicking outside
        document.getElementById('donation-modal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeDonationModal();
            }
        });
    </script>
</body>
