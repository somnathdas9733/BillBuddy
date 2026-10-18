// BillBuddy Main Application Controller
document.addEventListener('DOMContentLoaded', () => {
  // Toast notification helper
  window.showToast = function(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}" style="color:${type === 'error' ? '#f43f5e' : '#10b981'}"></i>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  };

  // Initialize Core Engines
  const invoiceEngine = new window.InvoiceEngine();
  const aiAnalyzer = new window.AIAnalyzer();

  // Elements
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const aiAnalyzeBtn = document.getElementById('aiAnalyzeBtn');
  const aiDraftBtn = document.getElementById('aiDraftBtn');
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  const printInvoiceBtn = document.getElementById('printInvoiceBtn');
  const saveInvoiceBtn = document.getElementById('saveInvoiceBtn');
  const historyBtn = document.getElementById('historyBtn');
  const copySummaryBtn = document.getElementById('copySummaryBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const newInvoiceBtn = document.getElementById('newInvoiceBtn');

  // Modals
  const analyzerModal = document.getElementById('analyzerModal');
  const draftModal = document.getElementById('draftModal');
  const historyModal = document.getElementById('historyModal');
  const closeButtons = document.querySelectorAll('.modal-close-btn');

  // Preset Buttons (Freelancer, Retail, Agency)
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const presetKey = e.currentTarget.dataset.preset;
      const presetData = window.StorageManager.getPreset(presetKey);
      if (confirm(`Load sample ${presetKey.toUpperCase()} bill? Any unsaved edits will be replaced.`)) {
        invoiceEngine.loadInvoiceData(presetData);
        window.showToast(`Loaded ${presetKey} invoice sample!`);
      }
    });
  });

  // Modal Closers
  closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    });
  });

  // Close modals on outside click or ESC key
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    }
  });

  // Theme Toggle (Dark / Light)
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      const isLight = document.body.classList.contains('light-theme');
      themeToggleBtn.innerHTML = isLight ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
      localStorage.setItem('billbuddy_theme', isLight ? 'light' : 'dark');
    });

    if (localStorage.getItem('billbuddy_theme') === 'light') {
      document.body.classList.add('light-theme');
      themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
    }
  }

  // 1. AI Analyzer Trigger
  if (aiAnalyzeBtn) {
    aiAnalyzeBtn.addEventListener('click', async () => {
      analyzerModal.classList.add('active');
      const container = document.getElementById('analyzerContent');
      container.innerHTML = `
        <div class="ai-thinking">
          <div class="spinner"></div>
          <div>
            <h4 style="font-family: var(--font-heading); margin-bottom: 0.35rem;">Gemma 4 is Auditing Your Invoice...</h4>
            <p style="color: var(--text-muted); font-size: 0.88rem;">Analyzing line items, calculating payment risk, and checking tax optimization.</p>
          </div>
        </div>
      `;

      try {
        const invData = invoiceEngine.getInvoiceData();
        const markdown = await aiAnalyzer.analyzeInvoice(invData);
        
        // Render markdown with marked library if available, otherwise basic format
        let htmlContent = '';
        if (window.marked) {
          htmlContent = window.marked.parse(markdown);
        } else {
          htmlContent = `<pre style="white-space: pre-wrap; font-family: inherit;">${markdown}</pre>`;
        }

        container.innerHTML = `
          <div class="ai-output-box">
            ${htmlContent}
          </div>
        `;
      } catch (err) {
        container.innerHTML = `
          <div style="text-align: center; padding: 2.5rem 1rem;">
            <i class="fas fa-exclamation-triangle" style="font-size: 2.5rem; color: var(--accent-rose); margin-bottom: 1rem;"></i>
            <h4 style="margin-bottom: 0.5rem;">AI Analysis Failed</h4>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">${err.message}</p>
            <p style="font-size: 0.82rem; color: var(--text-dim);">Ensure Ollama is running and model <code>gemma4:latest</code> is accessible.</p>
          </div>
        `;
      }
    });
  }

  // 2. AI Smart Draft Trigger
  if (aiDraftBtn) {
    aiDraftBtn.addEventListener('click', () => {
      draftModal.classList.add('active');
      const input = document.getElementById('draftPromptInput');
      if (input) input.focus();
    });
  }

  const submitDraftBtn = document.getElementById('submitDraftBtn');
  if (submitDraftBtn) {
    submitDraftBtn.addEventListener('click', async () => {
      const promptInput = document.getElementById('draftPromptInput');
      const text = promptInput ? promptInput.value.trim() : '';

      if (!text) {
        alert('Please write a prompt describing what you want to bill.');
        return;
      }

      submitDraftBtn.disabled = true;
      submitDraftBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gemma 4 is drafting...';

      try {
        const generatedInvoice = await aiAnalyzer.parsePromptToInvoice(text);
        if (generatedInvoice) {
          // Merge with current business info so business header is preserved
          const currentData = invoiceEngine.getInvoiceData();
          
          let dueDate = currentData.dueDate;
          if (generatedInvoice.dueDateDays !== undefined && generatedInvoice.dueDateDays > 0) {
            const d = new Date(Date.now() + generatedInvoice.dueDateDays * 86400000);
            dueDate = d.toISOString().split('T')[0];
          }

          const merged = {
            ...currentData,
            clientName: generatedInvoice.clientName || currentData.clientName,
            clientEmail: generatedInvoice.clientEmail || currentData.clientEmail,
            clientAddress: generatedInvoice.clientAddress || currentData.clientAddress,
            paymentTerms: generatedInvoice.paymentTerms || currentData.paymentTerms,
            dueDate: dueDate,
            currency: generatedInvoice.currency || currentData.currency,
            items: generatedInvoice.items || currentData.items,
            notes: generatedInvoice.notes || currentData.notes
          };

          invoiceEngine.loadInvoiceData(merged);
          draftModal.classList.remove('active');
          window.showToast('✨ Bill generated by Gemma 4 successfully!');
        }
      } catch (err) {
        alert('AI Draft error: ' + err.message);
      } finally {
        submitDraftBtn.disabled = false;
        submitDraftBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Generate Invoice';
      }
    });
  }

  // Draft Sample Prompt Chips
  document.querySelectorAll('.draft-preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const input = document.getElementById('draftPromptInput');
      if (input) {
        input.value = chip.dataset.prompt;
        input.focus();
      }
    });
  });

  // 3. Download PDF Trigger
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', () => {
      const invNum = invoiceEngine.invoiceNumber.value || 'INVOICE';
      window.PDFExporter.downloadPDF(invNum);
    });
  }

  // 4. Print Invoice Trigger
  if (printInvoiceBtn) {
    printInvoiceBtn.addEventListener('click', () => {
      window.PDFExporter.printInvoice();
    });
  }

  // 5. Save Invoice Trigger
  if (saveInvoiceBtn) {
    saveInvoiceBtn.addEventListener('click', () => {
      const data = invoiceEngine.getInvoiceData();
      const ok = window.StorageManager.saveInvoice(data);
      if (ok) {
        window.showToast(`Saved invoice #${data.invoiceNumber} to local storage! 💾`);
      }
    });
  }

  // 6. History Modal Trigger
  if (historyBtn) {
    historyBtn.addEventListener('click', () => {
      renderHistoryModal();
      historyModal.classList.add('active');
    });
  }

  function renderHistoryModal() {
    const list = window.StorageManager.getSavedInvoices();
    const container = document.getElementById('historyListContainer');
    if (!container) return;

    if (list.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
          <i class="fas fa-folder-open" style="font-size: 2.5rem; margin-bottom: 0.85rem; opacity: 0.4;"></i>
          <p>No saved invoices yet.</p>
          <small>Click "Save Bill" anytime to keep an archive of your invoices.</small>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map((inv, idx) => `
      <div style="display:flex; align-items:center; justify-content:space-between; background:var(--bg-surface-elevated); padding: 1rem 1.25rem; border-radius:var(--radius-md); margin-bottom: 0.75rem; border:1px solid var(--border-subtle);">
        <div>
          <div style="font-weight:700; font-family:var(--font-heading); font-size:1.05rem;">
            ${inv.invoiceNumber || 'Untitled'}
            <span class="inv-status-pill ${inv.status}" style="font-size:0.68rem; margin-left:0.5rem;">${inv.status}</span>
          </div>
          <div style="font-size:0.84rem; color:var(--text-muted); margin-top:2px;">
            ${inv.clientName || 'Unknown Client'} • <strong>${inv.currency} ${inv.grandTotal}</strong> • Due: ${inv.dueDate || 'N/A'}
          </div>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn btn-secondary btn-sm load-hist-btn" data-index="${idx}">
            <i class="fas fa-edit"></i> Open
          </button>
          <button class="btn btn-outline btn-sm delete-hist-btn" data-number="${inv.invoiceNumber}" style="color:var(--accent-rose);">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.load-hist-btn').forEach(b => {
      b.addEventListener('click', (e) => {
        const idx = e.currentTarget.dataset.index;
        invoiceEngine.loadInvoiceData(list[idx]);
        historyModal.classList.remove('active');
        window.showToast(`Opened ${list[idx].invoiceNumber}`);
      });
    });

    container.querySelectorAll('.delete-hist-btn').forEach(b => {
      b.addEventListener('click', (e) => {
        const num = e.currentTarget.dataset.number;
        if (confirm(`Delete invoice ${num}?`)) {
          window.StorageManager.deleteInvoice(num);
          renderHistoryModal();
          window.showToast(`Deleted invoice ${num}`);
        }
      });
    });
  }

  // 7. Copy Summary & Export JSON
  if (copySummaryBtn) {
    copySummaryBtn.addEventListener('click', () => {
      window.PDFExporter.copySummary(invoiceEngine.getInvoiceData());
    });
  }

  if (exportJsonBtn) {
    exportJsonBtn.addEventListener('click', () => {
      window.PDFExporter.exportJSON(invoiceEngine.getInvoiceData());
    });
  }

  // 8. New Blank Invoice
  if (newInvoiceBtn) {
    newInvoiceBtn.addEventListener('click', () => {
      if (confirm('Start a fresh blank invoice? Unsaved changes will be lost.')) {
        const currentData = invoiceEngine.getInvoiceData();
        const rand = Math.floor(1000 + Math.random() * 9000);
        invoiceEngine.loadInvoiceData({
          businessName: currentData.businessName,
          businessEmail: currentData.businessEmail,
          businessPhone: currentData.businessPhone,
          businessAddress: currentData.businessAddress,
          businessTaxId: currentData.businessTaxId,
          logoBase64: currentData.logoBase64,
          clientName: '',
          clientEmail: '',
          clientPhone: '',
          clientAddress: '',
          invoiceNumber: `INV-${new Date().getFullYear()}-${rand}`,
          date: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          paymentTerms: 'Net 14',
          currency: currentData.currency || '$',
          status: 'pending',
          items: [{ description: '', quantity: 1, rate: 0, tax: 0, discount: 0 }],
          notes: 'Thank you for your business! Please make payment by the due date.',
          paymentDetails: currentData.paymentDetails,
          terms: currentData.terms,
          shipping: 0
        });
        window.showToast('Created new blank bill template!');
      }
    });
  }

  // Interactive AI Assistant Chat
  const chatInput = document.getElementById('aiChatInput');
  const chatSendBtn = document.getElementById('aiChatSendBtn');
  const chatMessages = document.getElementById('aiChatMessages');

  if (chatSendBtn && chatInput) {
    const handleChat = async () => {
      const q = chatInput.value.trim();
      if (!q) return;

      chatInput.value = '';
      const userMsg = document.createElement('div');
      userMsg.style.cssText = 'background: rgba(99, 102, 241, 0.2); padding: 0.6rem 0.9rem; border-radius: 8px; margin-bottom: 0.6rem; align-self: flex-end; max-width: 85%; font-size: 0.88rem;';
      userMsg.textContent = q;
      chatMessages.appendChild(userMsg);

      const botMsg = document.createElement('div');
      botMsg.style.cssText = 'background: var(--bg-surface-elevated); padding: 0.6rem 0.9rem; border-radius: 8px; margin-bottom: 0.6rem; max-width: 85%; font-size: 0.88rem; border: 1px solid var(--border-subtle);';
      botMsg.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gemma 4 is thinking...';
      chatMessages.appendChild(botMsg);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      try {
        const invContext = invoiceEngine.getInvoiceData();
        const ans = await aiAnalyzer.chatWithGemma(q, invContext);
        botMsg.innerHTML = window.marked ? window.marked.parse(ans) : ans;
      } catch (err) {
        botMsg.innerHTML = `<span style="color:var(--accent-rose);">Error: ${err.message}</span>`;
      }
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    chatSendBtn.addEventListener('click', handleChat);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleChat();
    });
  }
});
