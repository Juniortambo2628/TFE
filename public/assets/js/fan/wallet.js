document.addEventListener('DOMContentLoaded', function() {
    const savingsBalanceEl = document.getElementById('savingsBalance');
    const loanBalanceEl = document.getElementById('loanBalance');
    const depositForm = document.getElementById('depositForm');
    const loanForm = document.getElementById('loanForm');
    const loanResult = document.getElementById('loanResult');

    // Fetch Balance
    function fetchBalance() {
        fetch('../api/finance.php?action=escrow')
            .then(response => response.json())
            .then(data => {
                if (data.success && data.data) {
                    const formatMoney = (amount) => 'KES ' + new Intl.NumberFormat().format(amount || 0);
                    
                    const breakdown = data.data.breakdown || {};
                    if (savingsBalanceEl) savingsBalanceEl.textContent = formatMoney(breakdown.savings);
                    if (loanBalanceEl) loanBalanceEl.textContent = formatMoney(breakdown.loans);
                }
            })
            .catch(error => {
                console.error('Fetch balance error:', error);
                if (savingsBalanceEl) savingsBalanceEl.textContent = 'KES 0';
                if (loanBalanceEl) loanBalanceEl.textContent = 'KES 0';
            });
    }

    fetchBalance();

    // Handle Deposit
    if (depositForm) {
        depositForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const amount = document.getElementById('depositAmount').value;
            const phoneInput = document.getElementById('depositPhone').value;
            
            // Robust phone number sanitization
            // 1. Remove all non-numeric characters
            let cleanPhone = phoneInput.replace(/\D/g, '');
            
            // 2. Normalize to 254 format
            if (cleanPhone.startsWith('254')) {
                // Already has 254, keep it
            } else if (cleanPhone.startsWith('0')) {
                // Starts with 0 (e.g. 07...), replace 0 with 254
                cleanPhone = '254' + cleanPhone.substring(1);
            } else {
                // Assume it's just the number (e.g. 7...), prepend 254
                cleanPhone = '254' + cleanPhone;
            }
            
            const phone = cleanPhone;

            const btn = depositForm.querySelector('button');
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

            fetch('../api/finance.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'deposit',
                    amount: amount,
                    phone: phone
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('✅ STK Push sent! Check your phone to enter your M-Pesa PIN.');
                    fetchBalance();
                    depositForm.reset();
                } else {
                    let errorMsg = data.message || 'Deposit failed';
                    
                    if (errorMsg.includes('400.002.02') || errorMsg.includes('Bad Request')) {
                        errorMsg = '⚠️ M-Pesa Error: Invalid phone number.\n\n' +
                                  'For testing, use: 254708374149\n' +
                                  'For production, ensure you have valid M-Pesa credentials.';
                    }
                    
                    alert(errorMsg);
                }
            })
            .catch(error => {
                console.error('Deposit error:', error);
                alert('An error occurred. Please try again.');
            })
            .finally(() => {
                btn.disabled = false;
                btn.innerHTML = originalText;
            });
        });
    }

    // Handle Loan
    if (loanForm) {
        loanForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const amount = document.getElementById('loanAmount').value;

            const btn = loanForm.querySelector('button');
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking Eligibility...';

            fetch('../api/finance.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'apply_loan',
                    amount: amount
                })
            })
            .then(response => response.json())
            .then(data => {
                if (loanResult) {
                    loanResult.style.display = 'block';
                    if (data.success) {
                        loanResult.innerHTML = `
                            <div class="result-message success">
                                <strong>Approved!</strong><br>
                                Amount: KES ${new Intl.NumberFormat().format(amount)}<br>
                                Interest: ${data.details?.interest_rate || 12}%<br>
                                Monthly: KES ${new Intl.NumberFormat().format(data.details?.monthly_payment || 0)}
                            </div>
                        `;
                        fetchBalance();
                    } else {
                        loanResult.innerHTML = `
                            <div class="result-message error">
                                <strong>Declined</strong><br>
                                ${data.message}
                            </div>
                        `;
                    }
                }
            })
            .catch(error => {
                console.error('Loan error:', error);
                if (loanResult) {
                    loanResult.style.display = 'block';
                    loanResult.innerHTML = `
                        <div class="result-message error">
                            <strong>Error</strong><br>
                            An error occurred. Please try again.
                        </div>
                    `;
                }
            })
            .finally(() => {
                btn.disabled = false;
                btn.innerHTML = originalText;
            });
        });
    }
});
