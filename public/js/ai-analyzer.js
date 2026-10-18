// BillBuddy AI Intelligence Engine (Powered by Gemma 4 via Ollama)
class AIAnalyzer {
  constructor() {
    this.statusPill = document.getElementById('aiStatusPill');
    this.statusText = document.getElementById('aiStatusText');
    this.modelSelect = document.getElementById('aiModelSelect');
    this.activeModel = 'gemma4:latest';
    this.isOnline = false;
    
    this.init();
  }

  async init() {
    await this.checkStatus();
    // Re-check status periodically (every 45s)
    setInterval(() => this.checkStatus(), 45000);
  }

  async checkStatus() {
    try {
      const startTime = performance.now();
      const res = await fetch('/api/ollama/status');
      const data = await res.json();
      const latency = Math.round(performance.now() - startTime);

      if (data.online) {
        this.isOnline = true;
        this.activeModel = data.activeModel || 'gemma4:latest';

        if (this.statusPill) {
          this.statusPill.className = 'ai-status-pill';
          this.statusText.innerHTML = `<span>Gemma 4 Online</span> <small style="opacity:0.75; font-size:0.72rem;">(${latency}ms)</small>`;
        }

        if (this.modelSelect && data.models) {
          this.modelSelect.innerHTML = '';
          data.models.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = m;
            if (m === this.activeModel) opt.selected = true;
            this.modelSelect.appendChild(opt);
          });
        }
      } else {
        this.isOnline = false;
        if (this.statusPill) {
          this.statusPill.className = 'ai-status-pill offline';
          this.statusText.textContent = 'Ollama Offline';
        }
      }
    } catch (err) {
      this.isOnline = false;
      if (this.statusPill) {
        this.statusPill.className = 'ai-status-pill offline';
        this.statusText.textContent = 'Ollama Disconnected';
      }
    }
  }

  async analyzeInvoice(invoiceData) {
    const selectedModel = this.modelSelect ? this.modelSelect.value : this.activeModel;
    const response = await fetch('/api/ollama/analyze-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoice: invoiceData,
        model: selectedModel
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to analyze invoice');
    }

    const data = await response.json();
    return data.analysis;
  }

  async parsePromptToInvoice(promptText) {
    const selectedModel = this.modelSelect ? this.modelSelect.value : this.activeModel;
    const response = await fetch('/api/ollama/parse-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: promptText,
        model: selectedModel
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to parse billing prompt');
    }

    const data = await response.json();
    return data.invoiceData;
  }

  async chatWithGemma(userQuery, invoiceContext = null) {
    const selectedModel = this.modelSelect ? this.modelSelect.value : this.activeModel;
    let fullPrompt = userQuery;
    
    if (invoiceContext) {
      fullPrompt = `
CURRENT INVOICE CONTEXT:
Invoice #: ${invoiceContext.invoiceNumber}
Client: ${invoiceContext.clientName}
Total: ${invoiceContext.currency} ${invoiceContext.grandTotal}
Status: ${invoiceContext.status}
Due Date: ${invoiceContext.dueDate}

USER QUESTION: ${userQuery}
`;
    }

    const response = await fetch('/api/ollama/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: fullPrompt,
        model: selectedModel,
        system: 'You are BillBuddy Financial Advisor powered by Gemma 4. Answer business owners clearly, accurately, and concisely.'
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to get answer');
    }

    const data = await response.json();
    return data.response;
  }
}

window.AIAnalyzer = AIAnalyzer;
