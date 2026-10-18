// BillBuddy Real-Time Invoice Engine
class InvoiceEngine {
  constructor() {
    this.currentTemplate = 'modern';
    this.logoBase64 = null;
    this.initElements();
    this.bindEvents();
    this.loadInitialData();
  }

  initElements() {
    // Form inputs
    this.businessName = document.getElementById('businessName');
    this.businessEmail = document.getElementById('businessEmail');
    this.businessPhone = document.getElementById('businessPhone');
    this.businessAddress = document.getElementById('businessAddress');
    this.businessTaxId = document.getElementById('businessTaxId');
    this.logoInput = document.getElementById('logoInput');

    this.clientName = document.getElementById('clientName');
    this.clientEmail = document.getElementById('clientEmail');
    this.clientPhone = document.getElementById('clientPhone');
    this.clientAddress = document.getElementById('clientAddress');

    this.invoiceNumber = document.getElementById('invoiceNumber');
    this.invoiceDate = document.getElementById('invoiceDate');
    this.dueDate = document.getElementById('dueDate');
    this.paymentTerms = document.getElementById('paymentTerms');
    this.currencySelect = document.getElementById('currencySelect');
    this.statusSelect = document.getElementById('statusSelect');

    this.itemsContainer = document.getElementById('itemsContainer');
    this.addItemBtn = document.getElementById('addItemBtn');

    this.shippingInput = document.getElementById('shippingInput');
    this.notesInput = document.getElementById('notesInput');
    this.paymentDetailsInput = document.getElementById('paymentDetailsInput');
    this.termsInput = document.getElementById('termsInput');

    // Live preview elements
    this.previewWrapper = document.getElementById('invoicePreviewWrapper');
    this.paperElement = document.getElementById('invoicePaper');
    this.pLogo = document.getElementById('pLogo');
    this.pCompanyName = document.getElementById('pCompanyName');
    this.pCompanyDetails = document.getElementById('pCompanyDetails');
    this.pInvoiceNumber = document.getElementById('pInvoiceNumber');
    this.pStatus = document.getElementById('pStatus');
    this.pClientName = document.getElementById('pClientName');
    this.pClientDetails = document.getElementById('pClientDetails');
    this.pInvoiceDate = document.getElementById('pInvoiceDate');
    this.pDueDate = document.getElementById('pDueDate');
    this.pPaymentTerms = document.getElementById('pPaymentTerms');
    this.pTableBody = document.getElementById('pTableBody');
    this.pSubtotal = document.getElementById('pSubtotal');
    this.pDiscount = document.getElementById('pDiscount');
    this.pTax = document.getElementById('pTax');
    this.pShipping = document.getElementById('pShipping');
    this.pGrandTotal = document.getElementById('pGrandTotal');
    this.pNotes = document.getElementById('pNotes');
    this.pPaymentDetails = document.getElementById('pPaymentDetails');
    this.pTerms = document.getElementById('pTerms');
  }

  bindEvents() {
    // Re-render preview on any input change
    const inputs = [
      this.businessName, this.businessEmail, this.businessPhone, this.businessAddress, this.businessTaxId,
      this.clientName, this.clientEmail, this.clientPhone, this.clientAddress,
      this.invoiceNumber, this.invoiceDate, this.dueDate, this.paymentTerms, this.currencySelect, this.statusSelect,
      this.shippingInput, this.notesInput, this.paymentDetailsInput, this.termsInput
    ];

    inputs.forEach(input => {
      if (input) {
        input.addEventListener('input', () => this.updatePreview());
      }
    });

    if (this.addItemBtn) {
      this.addItemBtn.addEventListener('click', () => {
        this.addItemRow();
        this.updatePreview();
      });
    }

    if (this.logoInput) {
      this.logoInput.addEventListener('change', (e) => this.handleLogoUpload(e));
    }

    // Auto-calculate due date based on payment terms
    if (this.paymentTerms) {
      this.paymentTerms.addEventListener('change', () => {
        const terms = this.paymentTerms.value;
        const baseDate = new Date(this.invoiceDate.value || Date.now());
        let days = 0;
        if (terms === 'Net 7') days = 7;
        else if (terms === 'Net 14') days = 14;
        else if (terms === 'Net 30') days = 30;
        else if (terms === 'Net 60') days = 60;

        if (days > 0) {
          const due = new Date(baseDate.getTime() + days * 86400000);
          this.dueDate.value = due.toISOString().split('T')[0];
        } else {
          this.dueDate.value = baseDate.toISOString().split('T')[0];
        }
        this.updatePreview();
      });
    }

    // Template switcher buttons
    document.querySelectorAll('.template-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
        const target = e.currentTarget;
        target.classList.add('active');
        this.setTemplate(target.dataset.template);
      });
    });

    // Auto invoice number button
    const autoNumBtn = document.getElementById('autoInvoiceNumBtn');
    if (autoNumBtn) {
      autoNumBtn.addEventListener('click', () => {
        const rand = Math.floor(1000 + Math.random() * 9000);
        this.invoiceNumber.value = `INV-${new Date().getFullYear()}-${rand}`;
        this.updatePreview();
      });
    }
  }

  handleLogoUpload(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        this.logoBase64 = event.target.result;
        this.updatePreview();
      };
      reader.readAsDataURL(file);
    }
  }

  setTemplate(templateName) {
    this.currentTemplate = templateName;
    if (this.paperElement) {
      this.paperElement.className = `invoice-paper template-${templateName}`;
    }
  }

  addItemRow(item = { description: '', quantity: 1, rate: 0, tax: 0, discount: 0 }) {
    const row = document.createElement('tr');
    row.className = 'item-row';
    row.innerHTML = `
      <td><input type="text" class="form-input item-desc" placeholder="Item name or service description" value="${item.description || ''}"></td>
      <td style="width: 70px;"><input type="number" class="form-input item-qty" min="0.1" step="any" value="${item.quantity !== undefined ? item.quantity : 1}"></td>
      <td style="width: 105px;"><input type="number" class="form-input item-rate" min="0" step="any" value="${item.rate !== undefined ? item.rate : 0}"></td>
      <td style="width: 75px;"><input type="number" class="form-input item-tax" min="0" max="100" step="any" value="${item.tax !== undefined ? item.tax : 0}"></td>
      <td style="width: 75px;"><input type="number" class="form-input item-discount" min="0" max="100" step="any" value="${item.discount !== undefined ? item.discount : 0}"></td>
      <td style="width: 110px; font-weight:700; text-align:right; font-family: var(--font-mono); font-size: 0.85rem;" class="item-row-total">0.00</td>
      <td style="width: 38px; text-align: center;">
        <button type="button" class="btn-delete-row" title="Remove Item"><i class="fas fa-trash-alt"></i></button>
      </td>
    `;

    // Row input listeners
    row.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', () => this.updatePreview());
    });

    row.querySelector('.btn-delete-row').addEventListener('click', () => {
      if (this.itemsContainer.children.length > 1) {
        row.remove();
        this.updatePreview();
      } else {
        alert('Your invoice must have at least one line item.');
      }
    });

    this.itemsContainer.appendChild(row);
  }

  getItems() {
    const items = [];
    const rows = this.itemsContainer.querySelectorAll('.item-row');
    rows.forEach(row => {
      const desc = row.querySelector('.item-desc').value;
      const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
      const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
      const tax = parseFloat(row.querySelector('.item-tax').value) || 0;
      const discount = parseFloat(row.querySelector('.item-discount').value) || 0;

      const baseAmount = qty * rate;
      const discountAmount = baseAmount * (discount / 100);
      const taxableAmount = baseAmount - discountAmount;
      const taxAmount = taxableAmount * (tax / 100);
      const lineTotal = taxableAmount + taxAmount;

      items.push({
        description: desc,
        quantity: qty,
        rate: rate,
        tax: tax,
        discount: discount,
        discountAmount: discountAmount,
        taxAmount: taxAmount,
        total: lineTotal
      });
    });
    return items;
  }

  formatCurrency(amount) {
    const curr = this.currencySelect ? this.currencySelect.value : '$';
    const formatted = Number(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `${curr} ${formatted}`;
  }

  updatePreview() {
    const curr = this.currencySelect ? this.currencySelect.value : '$';
    
    // Logo
    if (this.logoBase64) {
      this.pLogo.src = this.logoBase64;
      this.pLogo.style.display = 'block';
    } else {
      this.pLogo.style.display = 'none';
    }

    // Company Header
    this.pCompanyName.textContent = this.businessName.value || 'Your Business Name';
    
    const details = [];
    if (this.businessTaxId.value) details.push(`Tax / VAT ID: ${this.businessTaxId.value}`);
    if (this.businessEmail.value) details.push(this.businessEmail.value);
    if (this.businessPhone.value) details.push(this.businessPhone.value);
    if (this.businessAddress.value) details.push(this.businessAddress.value);
    this.pCompanyDetails.textContent = details.join('\n');

    // Invoice Meta
    this.pInvoiceNumber.textContent = this.invoiceNumber.value || 'INV-DRAFT';
    const statusVal = this.statusSelect.value;
    this.pStatus.className = `inv-status-pill ${statusVal}`;
    this.pStatus.textContent = statusVal;

    // Client Info
    this.pClientName.textContent = this.clientName.value || 'Customer / Client Name';
    const clientDetails = [];
    if (this.clientEmail.value) clientDetails.push(this.clientEmail.value);
    if (this.clientPhone.value) clientDetails.push(this.clientPhone.value);
    if (this.clientAddress.value) clientDetails.push(this.clientAddress.value);
    this.pClientDetails.textContent = clientDetails.join('\n');

    // Dates
    this.pInvoiceDate.textContent = this.invoiceDate.value || 'N/A';
    this.pDueDate.textContent = this.dueDate.value || 'N/A';
    this.pPaymentTerms.textContent = this.paymentTerms.value || 'Due on Receipt';

    // Calculate Items
    const items = this.getItems();
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    this.pTableBody.innerHTML = '';
    const rows = this.itemsContainer.querySelectorAll('.item-row');

    items.forEach((item, index) => {
      subtotal += (item.quantity * item.rate);
      totalDiscount += item.discountAmount;
      totalTax += item.taxAmount;

      // Update row total in editor
      if (rows[index]) {
        rows[index].querySelector('.item-row-total').textContent = `${curr} ${item.total.toFixed(2)}`;
      }

      // Add row to preview table
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="inv-item-desc">${item.description || 'Untitled Item'}</td>
        <td class="col-qty">${item.quantity}</td>
        <td class="col-rate">${curr} ${item.rate.toFixed(2)}</td>
        <td class="col-discount">${item.discount > 0 ? `${item.discount}%` : '-'}</td>
        <td class="col-tax">${item.tax > 0 ? `${item.tax}%` : '-'}</td>
        <td class="col-amount" style="font-weight: 700;">${curr} ${item.total.toFixed(2)}</td>
      `;
      this.pTableBody.appendChild(tr);
    });

    const shipping = parseFloat(this.shippingInput.value) || 0;
    const grandTotal = (subtotal - totalDiscount) + totalTax + shipping;

    // Totals
    this.pSubtotal.textContent = `${curr} ${subtotal.toFixed(2)}`;
    this.pDiscount.textContent = totalDiscount > 0 ? `- ${curr} ${totalDiscount.toFixed(2)}` : `${curr} 0.00`;
    this.pTax.textContent = `${curr} ${totalTax.toFixed(2)}`;
    this.pShipping.textContent = `${curr} ${shipping.toFixed(2)}`;
    this.pGrandTotal.textContent = `${curr} ${grandTotal.toFixed(2)}`;

    // Notes & Payment
    this.pNotes.textContent = this.notesInput.value || 'Thank you for your business!';
    this.pPaymentDetails.textContent = this.paymentDetailsInput.value || 'Payment information not specified.';
    this.pTerms.textContent = this.termsInput.value || '';
  }

  getInvoiceData() {
    const items = this.getItems();
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    items.forEach(it => {
      subtotal += (it.quantity * it.rate);
      totalDiscount += it.discountAmount;
      totalTax += it.taxAmount;
    });

    const shipping = parseFloat(this.shippingInput.value) || 0;
    const grandTotal = (subtotal - totalDiscount) + totalTax + shipping;

    return {
      template: this.currentTemplate,
      businessName: this.businessName.value,
      businessEmail: this.businessEmail.value,
      businessPhone: this.businessPhone.value,
      businessAddress: this.businessAddress.value,
      businessTaxId: this.businessTaxId.value,
      logoBase64: this.logoBase64,
      clientName: this.clientName.value,
      clientEmail: this.clientEmail.value,
      clientPhone: this.clientPhone.value,
      clientAddress: this.clientAddress.value,
      invoiceNumber: this.invoiceNumber.value,
      date: this.invoiceDate.value,
      dueDate: this.dueDate.value,
      paymentTerms: this.paymentTerms.value,
      currency: this.currencySelect.value,
      status: this.statusSelect.value,
      items: items,
      subtotal: subtotal.toFixed(2),
      discountTotal: totalDiscount.toFixed(2),
      taxTotal: totalTax.toFixed(2),
      shipping: shipping.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
      notes: this.notesInput.value,
      paymentDetails: this.paymentDetailsInput.value,
      terms: this.termsInput.value
    };
  }

  loadInvoiceData(data) {
    if (!data) return;

    if (data.template) this.setTemplate(data.template);
    if (data.businessName !== undefined) this.businessName.value = data.businessName;
    if (data.businessEmail !== undefined) this.businessEmail.value = data.businessEmail;
    if (data.businessPhone !== undefined) this.businessPhone.value = data.businessPhone;
    if (data.businessAddress !== undefined) this.businessAddress.value = data.businessAddress;
    if (data.businessTaxId !== undefined) this.businessTaxId.value = data.businessTaxId;
    if (data.logoBase64) this.logoBase64 = data.logoBase64;

    if (data.clientName !== undefined) this.clientName.value = data.clientName;
    if (data.clientEmail !== undefined) this.clientEmail.value = data.clientEmail;
    if (data.clientPhone !== undefined) this.clientPhone.value = data.clientPhone;
    if (data.clientAddress !== undefined) this.clientAddress.value = data.clientAddress;

    if (data.invoiceNumber !== undefined) this.invoiceNumber.value = data.invoiceNumber;
    if (data.date !== undefined) this.invoiceDate.value = data.date;
    if (data.dueDate !== undefined) this.dueDate.value = data.dueDate;
    if (data.paymentTerms !== undefined) this.paymentTerms.value = data.paymentTerms;
    if (data.currency !== undefined) this.currencySelect.value = data.currency;
    if (data.status !== undefined) this.statusSelect.value = data.status;

    if (data.shipping !== undefined) this.shippingInput.value = data.shipping;
    if (data.notes !== undefined) this.notesInput.value = data.notes;
    if (data.paymentDetails !== undefined) this.paymentDetailsInput.value = data.paymentDetails;
    if (data.terms !== undefined) this.termsInput.value = data.terms;

    // Load items
    this.itemsContainer.innerHTML = '';
    if (data.items && data.items.length > 0) {
      data.items.forEach(item => this.addItemRow(item));
    } else {
      this.addItemRow();
    }

    this.updatePreview();
  }

  loadInitialData() {
    const defaultData = window.StorageManager.getPreset('freelance');
    this.loadInvoiceData(defaultData);
  }
}

window.InvoiceEngine = InvoiceEngine;
