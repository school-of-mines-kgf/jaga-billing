// Password for login
const CORRECT_PASSWORD = 'jaga@143';

// Items array to store bill items
let items = [];
let itemIdCounter = 1;
let currentBillData = null; // Store current bill data for saving

// DOM Elements
const loginPage = document.getElementById('loginPage');
const billingPage = document.getElementById('billingPage');
const loginForm = document.getElementById('loginForm');
const passwordInput = document.getElementById('password');
const errorMsg = document.getElementById('errorMsg');
const currentDateEl = document.getElementById('currentDate');
const itemsTableBody = document.getElementById('itemsTableBody');
const subtotalEl = document.getElementById('subtotal');
const courierChargesEl = document.getElementById('courierCharges');
const grandTotalEl = document.getElementById('grandTotal');
const billModal = document.getElementById('billModal');
const billContent = document.getElementById('billContent');
const historyModal = document.getElementById('historyModal');
const historyContent = document.getElementById('historyContent');

// Number to Words conversion for Indian currency
function numberToWords(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
        'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (num === 0) return 'Zero';
    if (num < 0) return 'Minus ' + numberToWords(-num);

    let words = '';

    if (Math.floor(num / 10000000) > 0) {
        words += numberToWords(Math.floor(num / 10000000)) + ' Crore ';
        num %= 10000000;
    }

    if (Math.floor(num / 100000) > 0) {
        words += numberToWords(Math.floor(num / 100000)) + ' Lakh ';
        num %= 100000;
    }

    if (Math.floor(num / 1000) > 0) {
        words += numberToWords(Math.floor(num / 1000)) + ' Thousand ';
        num %= 1000;
    }

    if (Math.floor(num / 100) > 0) {
        words += numberToWords(Math.floor(num / 100)) + ' Hundred ';
        num %= 100;
    }

    if (num > 0) {
        if (num < 20) {
            words += ones[num];
        } else {
            words += tens[Math.floor(num / 10)];
            if (num % 10 > 0) {
                words += ' ' + ones[num % 10];
            }
        }
    }

    return words.trim();
}

// Get next bill number from localStorage
function getNextBillNumber() {
    let lastBillNumber = parseInt(localStorage.getItem('lastBillNumber')) || 0;
    return lastBillNumber + 1;
}

// Save bill number to localStorage
function saveLastBillNumber(billNumber) {
    const numericPart = parseInt(billNumber) || 0;
    localStorage.setItem('lastBillNumber', numericPart);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    setCurrentDate();

    // Set initial bill number
    const billNumberInput = document.getElementById('billNumber');
    if (billNumberInput) {
        billNumberInput.value = getNextBillNumber();
    }

    // Add enter key support for adding items
    document.getElementById('itemPrice').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addItem();
        }
    });
});

// Check if user is already logged in
function checkSession() {
    const isLoggedIn = sessionStorage.getItem('billingLoggedIn');
    if (isLoggedIn === 'true') {
        showBillingPage();
    }
}

// Set current date
function setCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = now.toLocaleDateString('en-IN', options);

    // Set default bill date
    const billDateInput = document.getElementById('billDate');
    billDateInput.value = now.toISOString().split('T')[0];
}

// Toggle password visibility
function togglePassword() {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
}

// Handle login form submission
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const enteredPassword = passwordInput.value;

    if (enteredPassword === CORRECT_PASSWORD) {
        sessionStorage.setItem('billingLoggedIn', 'true');
        showBillingPage();
        errorMsg.textContent = '';
    } else {
        errorMsg.textContent = 'Incorrect password. Please try again.';
        passwordInput.value = '';
        passwordInput.focus();

        // Shake animation
        const loginCard = document.querySelector('.login-card');
        loginCard.style.animation = 'shake 0.5s';
        setTimeout(() => {
            loginCard.style.animation = '';
        }, 500);
    }
});

// Show billing page
function showBillingPage() {
    loginPage.classList.add('hidden');
    billingPage.classList.remove('hidden');
}

// Logout function
function logout() {
    sessionStorage.removeItem('billingLoggedIn');
    billingPage.classList.add('hidden');
    loginPage.classList.remove('hidden');
    passwordInput.value = '';
    clearBill();
}

// Add item to the bill
function addItem() {
    const itemName = document.getElementById('itemName').value.trim();
    const itemQty = parseInt(document.getElementById('itemQty').value) || 0;
    const itemPrice = parseFloat(document.getElementById('itemPrice').value) || 0;

    if (!itemName) {
        alert('Please enter an item name');
        document.getElementById('itemName').focus();
        return;
    }

    if (itemQty <= 0) {
        alert('Please enter a valid quantity');
        document.getElementById('itemQty').focus();
        return;
    }

    if (itemPrice <= 0) {
        alert('Please enter a valid price');
        document.getElementById('itemPrice').focus();
        return;
    }

    const itemCourier = parseFloat(document.getElementById('itemCourier').value) || 0;

    const item = {
        id: itemIdCounter++,
        name: itemName,
        qty: itemQty,
        price: itemPrice,
        courier: itemCourier,
        total: (itemQty * itemPrice) + itemCourier
    };

    items.push(item);
    renderItems();
    updateTotals();
    clearItemInputs();
}

// Render items in table
function renderItems() {
    itemsTableBody.innerHTML = '';

    if (items.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
                No items added yet. Add items using the form above.
            </td>
        `;
        itemsTableBody.appendChild(emptyRow);
        return;
    }

    items.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.name}</td>
            <td>${item.qty}</td>
            <td>₹${item.price.toFixed(2)}</td>
            <td>₹${(item.courier || 0).toFixed(2)}</td>
            <td>₹${item.total.toFixed(2)}</td>
            <td>
                <button class="delete-btn" onclick="deleteItem(${item.id})">Delete</button>
            </td>
        `;
        itemsTableBody.appendChild(row);
    });
}

// Delete item
function deleteItem(id) {
    items = items.filter(item => item.id !== id);
    renderItems();
    updateTotals();
}

// Update totals
function updateTotals() {
    const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
    const totalCourier = items.reduce((sum, item) => sum + (item.courier || 0), 0);
    const grandTotal = subtotal + totalCourier;

    subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
    if (courierChargesEl) {
        courierChargesEl.value = totalCourier;
    }
    grandTotalEl.textContent = `₹${grandTotal.toFixed(2)}`;
}

// Clear item inputs
function clearItemInputs() {
    document.getElementById('itemName').value = '';
    document.getElementById('itemQty').value = '1';
    document.getElementById('itemPrice').value = '';
    document.getElementById('itemCourier').value = '0';
    document.getElementById('itemName').focus();
}

// Clear entire bill
function clearBill() {
    items = [];
    itemIdCounter = 1;
    renderItems();
    updateTotals();

    // Clear customer details
    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('customerAddress').value = '';
    setCurrentDate();
}

// Generate bill preview
function generateBill() {
    if (items.length === 0) {
        alert('Please add items to generate a bill');
        return;
    }

    const customerName = document.getElementById('customerName').value || 'Guest Customer';
    const customerPhone = document.getElementById('customerPhone').value || 'N/A';
    const customerAddress = document.getElementById('customerAddress').value || 'N/A';
    const billDate = document.getElementById('billDate').value;

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const courierCharges = parseFloat(courierChargesEl.value) || 0;
    const grandTotal = subtotal + courierCharges;

    const formattedDate = new Date(billDate).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Get bill number from input or generate new one
    const billNumberInput = document.getElementById('billNumber');
    const billNumber = billNumberInput ? billNumberInput.value : getNextBillNumber();

    // Store current bill data for saving
    currentBillData = {
        billNumber,
        customerName,
        customerPhone,
        customerAddress,
        billDate,
        formattedDate,
        items: [...items],
        subtotal,
        courierCharges,
        grandTotal,
        createdAt: new Date().toISOString()
    };

    let itemsHtml = '';
    items.forEach((item, index) => {
        itemsHtml += `
            <tr>
                <td>${index + 1}</td>
                <td class="item-desc">${item.name}</td>
                <td>${item.qty}</td>
                <td>₹${item.price.toFixed(2)}</td>
                <td>₹${item.total.toFixed(2)}</td>
            </tr>
        `;
    });

    billContent.innerHTML = `
        <div class="classic-bill">
            <!-- Company Header -->
            <div class="company-header">
                <div class="logo-section">
                    <img src="logo.jpeg" alt="Logo" class="bill-logo">
                </div>
                <div class="company-info">
                    <h1 class="company-name">JAGA SILK PRODUCTS</h1>
                    <p class="company-email">jagafarmer99@gmail.com</p>
                </div>
                <div class="bill-title-section">
                    <h2 class="bill-title">BILL</h2>
                </div>
            </div>

            <!-- Bill Info Row -->
            <div class="bill-details-row">
                <div class="bill-detail-left">
                    <p><strong>Bill No:</strong> ${billNumber}</p>
                    <p><strong>Date:</strong> ${formattedDate}</p>
                </div>
            </div>

            <!-- FROM and TO Section -->
            <div class="from-to-section">
                <div class="from-box">
                    <div class="section-label">FROM:</div>
                    <div class="section-details">
                        <p class="seller-name">Jagadhis Gowda</p>
                        <p>M.Kothur(V), N.G.Hulkur(P)</p>
                        <p>KGF(T), Kolar(D)</p>
                    </div>
                </div>
                <div class="to-box">
                    <div class="section-label">BILL TO:</div>
                    <div class="section-details">
                        <p class="customer-name">${customerName}</p>
                        <p>${customerAddress}</p>
                        <p>Phone: ${customerPhone}</p>
                    </div>
                </div>
            </div>

            <!-- Items Table -->
            <table class="classic-table">
                <thead>
                    <tr>
                        <th width="8%">S.No</th>
                        <th width="42%">Description</th>
                        <th width="12%">Qty</th>
                        <th width="18%">Rate</th>
                        <th width="20%">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <!-- Totals Section -->
            <div class="classic-totals">
                <table class="totals-table">
                    <tr>
                        <td class="totals-label">Sub Total:</td>
                        <td class="totals-value">₹${subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td class="totals-label">Courier Charges:</td>
                        <td class="totals-value">₹${courierCharges.toFixed(2)}</td>
                    </tr>
                    <tr class="grand-total-row">
                        <td class="totals-label"><strong>Grand Total:</strong></td>
                        <td class="totals-value"><strong>₹${grandTotal.toFixed(2)}</strong></td>
                    </tr>
                </table>
            </div>

            <!-- Amount in Words -->
            <div class="amount-words">
                <p><strong>Amount in Words:</strong> ${numberToWords(Math.round(grandTotal))} Rupees Only</p>
            </div>

            <!-- Signature -->
            <div class="bill-bottom">
                <div class="signature">
                    <p>For, JAGA SILK PRODUCTS</p>
                    <div class="sign-line"></div>
                    <p class="sign-text">Authorized Signatory</p>
                </div>
            </div>

            <!-- Thank You -->
            <div class="thank-you">
                <p>Thank You for Your Business!</p>
            </div>
        </div>
    `;

    billModal.classList.remove('hidden');
}

// Close modal
function closeModal() {
    billModal.classList.add('hidden');
}

// Print bill content - opens in new window for reliable printing
function printBillContent() {
    const billHtml = document.getElementById('billContent').innerHTML;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Bill - JAGA SILK PRODUCTS</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Poppins', Arial, sans-serif; padding: 20px; background: white; }
                .classic-bill { background: white; color: black; }
                .company-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px double #333; padding-bottom: 15px; margin-bottom: 20px; }
                .logo-section .bill-logo { width: 80px; height: 80px; object-fit: contain; }
                .company-info { text-align: center; flex: 1; }
                .company-name { font-size: 24px; font-weight: 700; margin: 0 0 5px 0; }
                .company-email { font-size: 13px; color: #666; margin: 0; }
                .bill-title-section { text-align: right; }
                .bill-title { font-size: 28px; font-weight: 700; color: #6366f1; margin: 0; }
                .bill-details-row { display: flex; justify-content: flex-start; margin-bottom: 15px; padding: 10px; background: #f9f9f9; border: 1px solid #ddd; }
                .bill-detail-left p { margin: 4px 0; font-size: 14px; }
                .from-to-section { display: flex; gap: 20px; margin-bottom: 20px; }
                .from-box, .to-box { flex: 1; border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #fafafa; }
                .section-label { font-weight: 700; font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
                .section-details p { margin: 3px 0; font-size: 13px; }
                .seller-name, .customer-name { font-size: 16px; font-weight: 600; }
                .classic-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .classic-table th { background: #333; color: white; padding: 12px; text-align: left; font-weight: 600; }
                .classic-table td { padding: 10px 12px; border: 1px solid #ddd; }
                .classic-table tbody tr:nth-child(even) { background: #f9f9f9; }
                .classic-totals { display: flex; justify-content: flex-end; margin: 20px 0; }
                .totals-table { width: 300px; border-collapse: collapse; }
                .totals-table td { padding: 8px 12px; border: 1px solid #000; font-size: 14px; }
                .totals-table .totals-label { text-align: right; background: #f5f5f5; }
                .totals-table .totals-value { text-align: right; font-weight: 500; }
                .grand-total-row td { background: #333 !important; color: white !important; font-size: 16px; }
                .amount-words { border: 1px solid #ddd; padding: 12px; margin: 15px 0; background: #fffef0; }
                .bill-bottom { display: flex; justify-content: flex-end; margin-top: 30px; padding-top: 20px; }
                .signature { text-align: center; min-width: 200px; }
                .signature p { font-size: 13px; margin: 0 0 40px 0; font-weight: 500; }
                .sign-text { margin-top: 5px !important; font-size: 11px !important; color: #666; }
                .sign-line { border-top: 1px solid #000; width: 180px; margin: 0 auto; }
                .thank-you { text-align: center; margin-top: 30px; padding: 15px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; font-size: 18px; font-weight: bold; border-radius: 8px; }
                .thank-you p { margin: 0; }
                @media print { body { padding: 0; } }
            </style>
        </head>
        <body>
            ${billHtml}
        </body>
        </html>
    `);
    printWindow.document.close();

    // Wait for content to load then print
    setTimeout(() => {
        printWindow.print();
    }, 500);
}

// Print bill (quick print without preview)
function printBill() {
    if (items.length === 0) {
        alert('Please add items to print a bill');
        return;
    }
    generateBill();
    setTimeout(() => {
        printBillContent();
    }, 500);
}

// ==================== HISTORY FUNCTIONS ====================

// Get bill history from localStorage
function getBillHistory() {
    const history = localStorage.getItem('billHistory');
    return history ? JSON.parse(history) : [];
}

// Save bill history to localStorage
function saveBillHistory(history) {
    localStorage.setItem('billHistory', JSON.stringify(history));
}

// Save current bill to history
function saveBillToHistory() {
    if (!currentBillData) {
        alert('No bill to save');
        return;
    }

    const history = getBillHistory();

    // Check if bill already exists
    const exists = history.some(bill => bill.billNumber === currentBillData.billNumber);
    if (exists) {
        alert('This bill is already saved in history');
        return;
    }

    // Save to localStorage first
    history.unshift(currentBillData);
    saveBillHistory(history);

    // Save the bill number for next bill
    saveLastBillNumber(currentBillData.billNumber);

    // Update the bill number input for next bill
    const billNumberInput = document.getElementById('billNumber');
    if (billNumberInput) {
        billNumberInput.value = getNextBillNumber();
    }

    // Try to save to server (database.json file)
    saveBillToServer(currentBillData);

    // Show success notification
    showNotification('✓ Bill saved to database!');

    // Clear the form after saving
    closeModal();
    clearBill();
}

// Save bill to server (database.json)
async function saveBillToServer(billData) {
    try {
        const response = await fetch('/api/save-bill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(billData)
        });
        const result = await response.json();
        if (result.success) {
            console.log('Bill saved to database.json');
        }
    } catch (error) {
        console.log('Server not running - using localStorage only');
    }
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'save-success';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Show history modal
function showHistory() {
    renderHistory();
    historyModal.classList.remove('hidden');
}

// Close history modal
function closeHistoryModal() {
    historyModal.classList.add('hidden');
}

// Render history
function renderHistory() {
    const history = getBillHistory();

    if (history.length === 0) {
        historyContent.innerHTML = `
            <div class="history-empty">
                <p>📋 No bills saved yet</p>
                <span>Generate and save bills to see them here</span>
            </div>
        `;
        return;
    }

    let html = '';
    history.forEach((bill, index) => {
        let itemsHtml = '';
        bill.items.slice(0, 3).forEach(item => {
            itemsHtml += `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.qty}</td>
                    <td>₹${item.price.toFixed(2)}</td>
                    <td>₹${item.total.toFixed(2)}</td>
                </tr>
            `;
        });

        if (bill.items.length > 3) {
            itemsHtml += `
                <tr>
                    <td colspan="4" style="text-align: center; color: var(--text-muted);">
                        ... and ${bill.items.length - 3} more items
                    </td>
                </tr>
            `;
        }

        html += `
            <div class="history-card">
                <div class="history-card-header">
                    <div class="history-card-info">
                        <h3>${bill.customerName}</h3>
                        <p>📞 ${bill.customerPhone} | 📅 ${bill.formattedDate}</p>
                    </div>
                    <div class="history-card-amount">
                        <div class="amount">₹${bill.grandTotal.toFixed(2)}</div>
                        <div class="bill-no">${bill.billNumber}</div>
                    </div>
                </div>
                <div class="history-card-items">
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>
                </div>
                <div class="history-card-actions">
                    <button class="btn-view" onclick="viewHistoryBill(${index})">👁️ View Bill</button>
                    <button class="btn-delete" onclick="deleteHistoryBill(${index})">🗑️ Delete</button>
                </div>
            </div>
        `;
    });

    historyContent.innerHTML = html;
}

// View a bill from history
function viewHistoryBill(index) {
    const history = getBillHistory();
    const bill = history[index];

    if (!bill) return;

    let itemsHtml = '';
    bill.items.forEach((item, i) => {
        itemsHtml += `
            <tr>
                <td>${i + 1}</td>
                <td class="item-desc">${item.name}</td>
                <td>${item.qty}</td>
                <td>₹${item.price.toFixed(2)}</td>
                <td>₹${item.total.toFixed(2)}</td>
            </tr>
        `;
    });

    billContent.innerHTML = `
        <div class="classic-bill">
            <!-- Company Header -->
            <div class="company-header">
                <div class="logo-section">
                    <img src="logo.jpeg" alt="Logo" class="bill-logo">
                </div>
                <div class="company-info">
                    <h1 class="company-name">JAGA SILK PRODUCTS</h1>
                    <p class="company-email">jagafarmer99@gmail.com</p>
                </div>
                <div class="bill-title-section">
                    <h2 class="bill-title">BILL</h2>
                </div>
            </div>

            <!-- Bill Info Row -->
            <div class="bill-details-row">
                <div class="bill-detail-left">
                    <p><strong>Bill No:</strong> ${bill.billNumber}</p>
                    <p><strong>Date:</strong> ${bill.formattedDate}</p>
                </div>
            </div>

            <!-- FROM and TO Section -->
            <div class="from-to-section">
                <div class="from-box">
                    <div class="section-label">FROM:</div>
                    <div class="section-details">
                        <p class="seller-name">Jagadhis Gowda</p>
                        <p>M.Kothur(V), N.G.Hulkur(P)</p>
                        <p>KGF(T), Kolar(D)</p>
                    </div>
                </div>
                <div class="to-box">
                    <div class="section-label">BILL TO:</div>
                    <div class="section-details">
                        <p class="customer-name">${bill.customerName}</p>
                        <p>${bill.customerAddress}</p>
                        <p>Phone: ${bill.customerPhone}</p>
                    </div>
                </div>
            </div>

            <!-- Items Table -->
            <table class="classic-table">
                <thead>
                    <tr>
                        <th width="8%">S.No</th>
                        <th width="42%">Description</th>
                        <th width="12%">Qty</th>
                        <th width="18%">Rate</th>
                        <th width="20%">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <!-- Totals Section -->
            <div class="classic-totals">
                <table class="totals-table">
                    <tr>
                        <td class="totals-label">Sub Total:</td>
                        <td class="totals-value">₹${bill.subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td class="totals-label">Courier Charges:</td>
                        <td class="totals-value">₹${(bill.courierCharges || 0).toFixed(2)}</td>
                    </tr>
                    <tr class="grand-total-row">
                        <td class="totals-label"><strong>Grand Total:</strong></td>
                        <td class="totals-value"><strong>₹${bill.grandTotal.toFixed(2)}</strong></td>
                    </tr>
                </table>
            </div>

            <!-- Amount in Words -->
            <div class="amount-words">
                <p><strong>Amount in Words:</strong> ${numberToWords(Math.round(bill.grandTotal))} Rupees Only</p>
            </div>

            <!-- Signature -->
            <div class="bill-bottom">
                <div class="signature">
                    <p>For, JAGA SILK PRODUCTS</p>
                    <div class="sign-line"></div>
                    <p class="sign-text">Authorized Signatory</p>
                </div>
            </div>

            <!-- Thank You -->
            <div class="thank-you">
                <p>Thank You for Your Business!</p>
            </div>
        </div>
    `;

    closeHistoryModal();
    billModal.classList.remove('hidden');
}

// Delete a bill from history
function deleteHistoryBill(index) {
    if (!confirm('Are you sure you want to delete this bill from history?')) {
        return;
    }

    const history = getBillHistory();
    history.splice(index, 1);
    saveBillHistory(history);
    renderHistory();
    showNotification('Bill deleted from history');
}

// Clear all history
function clearAllHistory() {
    if (!confirm('Are you sure you want to clear ALL bill history? This cannot be undone.')) {
        return;
    }

    localStorage.removeItem('billHistory');
    renderHistory();
    showNotification('All history cleared');
}

// Export database to JSON file
function exportDatabase() {
    const history = getBillHistory();
    const lastBillNumber = parseInt(localStorage.getItem('lastBillNumber')) || 0;

    const database = {
        lastBillNumber: lastBillNumber,
        bills: history,
        exportedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(database, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'database.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('📥 Database exported to database.json');
}

// Import database from JSON file
function importDatabase(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const database = JSON.parse(e.target.result);

            // Validate the database structure
            if (!database.bills || !Array.isArray(database.bills)) {
                alert('Invalid database file format');
                return;
            }

            // Import bills
            saveBillHistory(database.bills);

            // Import last bill number
            if (database.lastBillNumber !== undefined) {
                localStorage.setItem('lastBillNumber', database.lastBillNumber);
                const billNumberInput = document.getElementById('billNumber');
                if (billNumberInput) {
                    billNumberInput.value = getNextBillNumber();
                }
            }

            renderHistory();
            showNotification('📤 Database imported successfully! (' + database.bills.length + ' bills)');

        } catch (error) {
            alert('Error reading database file: ' + error.message);
        }
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
}

// ==================== EVENT LISTENERS ====================

// Close modal on outside click
billModal.addEventListener('click', (e) => {
    if (e.target === billModal) {
        closeModal();
    }
});

// Close history modal on outside click
historyModal.addEventListener('click', (e) => {
    if (e.target === historyModal) {
        closeHistoryModal();
    }
});

// Keyboard shortcut - Escape to close modals
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (!billModal.classList.contains('hidden')) {
            closeModal();
        }
        if (!historyModal.classList.contains('hidden')) {
            closeHistoryModal();
        }
    }
});

// Add shake animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Initialize items table with empty state
renderItems();

