// BillBuddy Storage & Preset Manager
const STORAGE_KEY_INVOICES = 'billbuddy_saved_invoices_v1';
const STORAGE_KEY_SETTINGS = 'billbuddy_settings_v1';

const PRESET_TEMPLATES = {
  freelance: {
    businessName: 'Apex Cloud Solutions',
    businessEmail: 'billing@apexcloud.io',
    businessPhone: '+1 (555) 382-9011',
    businessAddress: '742 Evergreen Terrace, Suite 400\nSan Francisco, CA 94107',
    businessTaxId: 'US-EIN: 94-8839210',
    clientName: 'NovaTech Enterprises',
    clientEmail: 'accounts@novatech.co',
    clientPhone: '+1 (555) 789-2341',
    clientAddress: '100 Silicon Blvd, Floor 12\nAustin, TX 78701',
    invoiceNumber: 'INV-2026-0042',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    paymentTerms: 'Net 14',
    currency: '$',
    status: 'pending',
    items: [
      { description: 'Cloud Infrastructure Architecture & Kubernetes Migration', quantity: 35, rate: 120, tax: 8.25, discount: 5 },
      { description: 'Automated CI/CD Pipeline Implementation & Security Hardening', quantity: 15, rate: 110, tax: 8.25, discount: 0 },
      { description: 'DevOps Maintenance & 24/7 SLA Support (Monthly)', quantity: 1, rate: 850, tax: 0, discount: 10 }
    ],
    notes: 'Thank you for your partnership! Please remit payment via ACH or wire transfer within 14 days.',
    paymentDetails: 'Bank: Silicon Valley Bank\nAccount: 9028-1123-8874\nRouting: 121000358\nWire / SWIFT: SVBUS6S',
    terms: 'Payment due within 14 calendar days. A 1.5% late fee per month applies to overdue balances.',
    shipping: 0
  },
  retail: {
    businessName: 'Urban Artisans Co.',
    businessEmail: 'sales@urbanartisans.store',
    businessPhone: '+1 (555) 412-8800',
    businessAddress: '450 Fashion Avenue\nNew York, NY 10018',
    businessTaxId: 'NY-TAX-1029482',
    clientName: 'Sarah Jenkins',
    clientEmail: 'sarah.j@lifestyle.org',
    clientPhone: '+1 (555) 902-1133',
    clientAddress: '230 Elm Street, Apt 4B\nBrooklyn, NY 11201',
    invoiceNumber: 'BILL-8841',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    paymentTerms: 'Due on Receipt',
    currency: '$',
    status: 'paid',
    items: [
      { description: 'Handcrafted Oak Minimalist Desk', quantity: 1, rate: 450, tax: 8.875, discount: 10 },
      { description: 'Ergonomic Leather Desk Pad (Cognac)', quantity: 2, rate: 65, tax: 8.875, discount: 0 },
      { description: 'Custom Ceramic Ambient Lamp', quantity: 1, rate: 120, tax: 8.875, discount: 0 }
    ],
    notes: 'Thank you for shopping at Urban Artisans! All handcrafted furniture includes a 2-year warranty.',
    paymentDetails: 'Card: Visa ending in 4092\nTransaction Auth: #TX-998124',
    terms: 'Items may be exchanged within 30 days with original receipt.',
    shipping: 35
  },
  agency: {
    businessName: 'Lumina Digital Media',
    businessEmail: 'hello@luminamedia.agency',
    businessPhone: '+91 98765 43210',
    businessAddress: 'Sector 5, Salt Lake Cyber Hub\nKolkata, WB 700091, India',
    businessTaxId: 'GSTIN: 19AAACL1234F1Z5',
    clientName: 'Globex Healthtech Ltd',
    clientEmail: 'finance@globexhealth.in',
    clientPhone: '+91 91234 56789',
    clientAddress: '7th Floor, Tech Park One\nBengaluru, KA 560001, India',
    invoiceNumber: 'INV-LM-2601',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    paymentTerms: 'Net 30',
    currency: '₹',
    status: 'pending',
    items: [
      { description: 'Brand Identity Design System & Guidelines', quantity: 1, rate: 85000, tax: 18, discount: 5 },
      { description: 'Full-Stack Web App UI/UX Prototyping (Figma)', quantity: 1, rate: 120000, tax: 18, discount: 0 },
      { description: 'SEO Strategy & Quarterly Content Sprint', quantity: 1, rate: 45000, tax: 18, discount: 0 }
    ],
    notes: 'Payment can be made via NEFT/RTGS or UPI. Thank you for trusting Lumina Digital.',
    paymentDetails: 'Bank: HDFC Bank Ltd\nA/C No: 50200019283746\nIFSC: HDFC0000123\nUPI ID: lumina@okhdfcbank',
    terms: 'Standard GST invoice. 18% GST applicable. Net 30 payment terms.',
    shipping: 0
  }
};

const StorageManager = {
  getSavedInvoices() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_INVOICES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load saved invoices', e);
      return [];
    }
  },

  saveInvoice(invoice) {
    try {
      const list = this.getSavedInvoices();
      const existingIdx = list.findIndex(i => i.invoiceNumber === invoice.invoiceNumber);
      const invoiceToSave = {
        ...invoice,
        savedAt: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        list[existingIdx] = invoiceToSave;
      } else {
        list.unshift(invoiceToSave);
      }

      localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(list));
      return true;
    } catch (e) {
      console.error('Failed to save invoice', e);
      return false;
    }
  },

  deleteInvoice(invoiceNumber) {
    try {
      let list = this.getSavedInvoices();
      list = list.filter(i => i.invoiceNumber !== invoiceNumber);
      localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(list));
      return true;
    } catch (e) {
      console.error('Failed to delete invoice', e);
      return false;
    }
  },

  getPreset(name) {
    return PRESET_TEMPLATES[name] || PRESET_TEMPLATES.freelance;
  }
};

window.StorageManager = StorageManager;
