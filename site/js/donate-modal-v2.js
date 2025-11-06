/**
 * ROFLFaucet Modal Donation System - V2
 * Based on the working project-001.html modal
 */

// Global state (simplified like the working version)
let currentAmount = 0;
let currentDonationId = null;
let paymentCheckInterval = null;
let useUsername = false;
let donationType = 'site'; // 'site' or 'project'
let currentProjectId = null;

// Load modal HTML into page if not already present
async function ensureModalLoaded() {
    if (document.getElementById('donation-modal')) {
        return; // Already loaded
    }
    
    try {
        const response = await fetch('./donate-modal-v2.html');
        const html = await response.text();
        document.body.insertAdjacentHTML('beforeend', html);
    } catch (error) {
        console.error('Failed to load donation modal:', error);
        throw new Error('Could not load donation interface');
    }
}

// Open donation modal
async function openDonationModal(type = 'site', projectId = null) {
    try {
        await ensureModalLoaded();
        
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
        
        setupDonorInput(); // Setup based on login status
    } catch (error) {
        console.error('Failed to open donation modal:', error);
        alert('Failed to load donation interface. Please try again.');
    }
}

// Close donation modal
function closeDonationModal() {
    const modal = document.getElementById('donation-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        resetDonationModal();
    }
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
    if (document.getElementById('donor-name')) {
        document.getElementById('donor-name').value = '';
    }
    if (document.getElementById('donation-message')) {
        document.getElementById('donation-message').value = '';
    }
    
    // Clear any payment checking interval
    if (paymentCheckInterval) {
        clearInterval(paymentCheckInterval);
        paymentCheckInterval = null;
    }
}

// Setup donor input based on login status
function setupDonorInput() {
    const username = getValidUsername(); // This function should be available from site-utils.js
    const loggedInDiv = document.getElementById('logged-in-donor');
    const customDiv = document.getElementById('custom-donor');
    
    if (username && loggedInDiv && customDiv) {
        document.getElementById('current-username').textContent = username;
        loggedInDiv.style.display = 'block';
        customDiv.style.display = 'none';
        useUsername = true;
    } else if (loggedInDiv && customDiv) {
        loggedInDiv.style.display = 'none';
        customDiv.style.display = 'block';
        useUsername = false;
    }
}

// Toggle between username and custom donor input
function toggleCustomDonor() {
    const loggedInDiv = document.getElementById('logged-in-donor');
    const customDiv = document.getElementById('custom-donor');
    
    if (loggedInDiv && customDiv) {
        loggedInDiv.style.display = 'none';
        customDiv.style.display = 'block';
        useUsername = false;
    }
}

// Handle login (placeholder - integrate with your auth system)
function handleLogin() {
    const currentUrl = window.location.origin + window.location.pathname;
    const authUrl = `https://auth.directsponsor.org/jwt-login.php?redirect_uri=${encodeURIComponent(currentUrl)}`;
    window.location.href = authUrl;
}

// Fallback for getValidUsername if not available
function getValidUsername() {
    // This should be provided by site-utils.js in the actual implementation
    // For testing, return null
    return null;
}

// Amount calculation functions (matching the working version)
function inputDigit(digit) {
    const newAmount = currentAmount * 10 + parseInt(digit);
    if (newAmount <= 100000000) { // Max 1 BTC
        currentAmount = newAmount;
        updateAmountDisplay();
        
        // Show donor section when amount > 0
        const donorInput = document.getElementById('donor-input');
        if (donorInput) {
            donorInput.style.display = currentAmount > 0 ? 'block' : 'none';
        }
        
        // Enable/disable continue button
        const continueBtn = document.getElementById('continue-btn');
        if (continueBtn) {
            continueBtn.disabled = currentAmount <= 0;
        }
    }
}

function backspaceAmount() {
    currentAmount = Math.floor(currentAmount / 10);
    updateAmountDisplay();
    
    // Hide donor section if amount is 0
    const donorInput = document.getElementById('donor-input');
    if (donorInput) {
        donorInput.style.display = currentAmount > 0 ? 'block' : 'none';
    }
    
    // Enable/disable continue button
    const continueBtn = document.getElementById('continue-btn');
    if (continueBtn) {
        continueBtn.disabled = currentAmount <= 0;
    }
}

function clearAmount() {
    currentAmount = 0;
    updateAmountDisplay();
    
    // Hide donor section
    const donorInput = document.getElementById('donor-input');
    if (donorInput) {
        donorInput.style.display = 'none';
    }
    
    // Disable continue button
    const continueBtn = document.getElementById('continue-btn');
    if (continueBtn) {
        continueBtn.disabled = true;
    }
}

function toggleCurrency() {
    // For now, just show both USD and sats in the display
    // Could implement USD/sats toggle later if needed
}

function updateAmountDisplay() {
    const usdValue = (currentAmount * 0.0007).toFixed(2); // Approximate conversion
    const display = document.getElementById('amount-display');
    if (display) {
        display.textContent = `${new Intl.NumberFormat().format(currentAmount)} sats ($${usdValue})`;
    }
}

// Create donation (matching the working API call pattern)
async function proceedToDonation() {
    if (currentAmount < 1) {
        alert('Please enter an amount of at least 1 sat');
        return;
    }
    
    const donorNameInput = document.getElementById('donor-name');
    const donationMessageInput = document.getElementById('donation-message');
    
    const donorName = useUsername ? getValidUsername() : (donorNameInput ? donorNameInput.value.trim() || 'Anonymous' : 'Anonymous');
    const donorMessage = donationMessageInput ? donationMessageInput.value.trim() : '';
    
    const continueBtn = document.getElementById('continue-btn');
    continueBtn.disabled = true;
    continueBtn.textContent = 'Creating...';
    
    try {
        let apiEndpoint, requestData;
        
        if (donationType === 'project' && currentProjectId) {
            // Project donation
            apiEndpoint = '/api/project-donations-api.php';
            requestData = {
                action: 'create_invoice',
                project_id: currentProjectId,
                amount: currentAmount,
                donor_name: donorName,
                donor_message: donorMessage
            };
        } else {
            // Site income donation
            apiEndpoint = '/api/site-income-api.php';
            requestData = {
                action: 'create_invoice',
                amount_sats: currentAmount,
                donor_name: donorName,
                donor_message: donorMessage
            };
        }
        
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(requestData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentDonationId = data.data.donation_id || data.data.payment_id;
            displayPaymentInfo(data.data);
            startPaymentCheck();
        } else {
            alert('Failed to create donation: ' + (data.error || 'Unknown error'));
            continueBtn.disabled = false;
            continueBtn.textContent = 'Create Invoice';
        }
    } catch (error) {
        console.error('Donation creation failed:', error);
        alert('Failed to create donation. Please try again.');
        continueBtn.disabled = false;
        continueBtn.textContent = 'Create Invoice';
    }
}

// Display payment info (matching the working version)
function displayPaymentInfo(data) {
    const qrContainer = document.getElementById('qr-code-container');
    const invoiceText = document.getElementById('invoice-text');
    
    // Handle different API response formats
    const qrCode = data.qr_code || data.qr_url;
    const invoice = data.invoice || data.payment_request;
    
    if (qrContainer && qrCode) {
        qrContainer.innerHTML = `<img src="${qrCode}" alt="QR Code" style="max-width: 300px; width: 100%;"/>`;
    }
    
    if (invoiceText && invoice) {
        invoiceText.textContent = invoice;
    }
    
    document.getElementById('continue-btn').style.display = 'none';
    document.getElementById('payment-status').style.display = 'block';
}

// Copy invoice to clipboard
function copyInvoice() {
    const invoiceText = document.getElementById('invoice-text');
    if (!invoiceText) return;
    
    const invoice = invoiceText.textContent;
    
    navigator.clipboard.writeText(invoice).then(() => {
        alert('Invoice copied to clipboard!');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = invoice;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Invoice copied to clipboard!');
    });
}

// Go back to calculator
function backToCalculator() {
    document.getElementById('payment-status').style.display = 'none';
    document.getElementById('continue-btn').style.display = 'inline-block';
    document.getElementById('continue-btn').disabled = currentAmount <= 0;
    
    // Clear payment checking
    if (paymentCheckInterval) {
        clearInterval(paymentCheckInterval);
        paymentCheckInterval = null;
    }
}

// Start payment checking (matching the working version)
function startPaymentCheck() {
    if (paymentCheckInterval) {
        clearInterval(paymentCheckInterval);
    }
    
    paymentCheckInterval = setInterval(async () => {
        try {
            let apiEndpoint, requestData;
            
            if (donationType === 'project' && currentProjectId) {
                apiEndpoint = '/api/project-donations-api.php';
                requestData = {
                    action: 'check_payment',
                    donation_id: currentDonationId
                };
            } else {
                apiEndpoint = '/api/site-income-api.php';
                requestData = {
                    action: 'check_payment',
                    payment_id: currentDonationId
                };
            }
            
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(requestData)
            });
            
            const data = await response.json();
            
            if (data.success && (data.data.status === 'paid' || data.paid)) {
                clearInterval(paymentCheckInterval);
                showSuccessInterface();
            }
        } catch (error) {
            console.error('Payment check failed:', error);
        }
    }, 5000); // Check every 5 seconds
    
    // Stop checking after 5 minutes
    setTimeout(() => {
        if (paymentCheckInterval) {
            clearInterval(paymentCheckInterval);
            paymentCheckInterval = null;
            const statusText = document.getElementById('status-text');
            if (statusText) {
                statusText.textContent = 'Payment timeout. Please try again.';
            }
        }
    }, 300000);
}

// Show success interface
function showSuccessInterface() {
    document.getElementById('payment-status').style.display = 'none';
    document.getElementById('success-interface').style.display = 'block';
    
    // Update success message link based on donation type
    const viewBtn = document.querySelector('.view-donations-btn');
    if (viewBtn) {
        if (donationType === 'project' && currentProjectId) {
            viewBtn.href = '#recent-donations';
            viewBtn.innerHTML = '📋 View in Donations List';
        } else {
            viewBtn.href = '#donations';
            viewBtn.innerHTML = '📋 View Recent Donations';
        }
    }
}

// Close modal when clicking outside (matching working version)
document.addEventListener('click', function(e) {
    const modal = document.getElementById('donation-modal');
    if (modal && e.target === modal) {
        closeDonationModal();
    }
});

// Export functions for global use
window.openDonationModal = openDonationModal;
window.closeDonationModal = closeDonationModal;
window.inputDigit = inputDigit;
window.clearAmount = clearAmount;
window.backspaceAmount = backspaceAmount;
window.toggleCurrency = toggleCurrency;
window.toggleCustomDonor = toggleCustomDonor;
window.handleLogin = handleLogin;
window.proceedToDonation = proceedToDonation;
window.copyInvoice = copyInvoice;
window.backToCalculator = backToCalculator;