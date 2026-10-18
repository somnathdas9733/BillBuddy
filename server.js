const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const DEFAULT_MODEL = 'gemma4:latest';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// 1. Health check & Ollama status
app.get('/api/ollama/status', async (req, res) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    
    const response = await fetch(`${OLLAMA_HOST}/api/tags`, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!response.ok) {
      return res.status(502).json({ 
        online: false, 
        error: `Ollama returned HTTP ${response.status}`,
        host: OLLAMA_HOST
      });
    }

    const data = await response.json();
    const models = (data.models || []).map(m => m.name);
    const hasGemma4 = models.some(m => m.toLowerCase().includes('gemma4'));
    
    res.json({
      online: true,
      host: OLLAMA_HOST,
      models,
      recommendedModel: hasGemma4 ? models.find(m => m.toLowerCase().includes('gemma4')) : (models[0] || DEFAULT_MODEL),
      activeModel: hasGemma4 ? models.find(m => m.toLowerCase().includes('gemma4')) : DEFAULT_MODEL
    });
  } catch (err) {
    res.json({
      online: false,
      error: err.message,
      host: OLLAMA_HOST,
      recommendedModel: DEFAULT_MODEL
    });
  }
});

// 2. Generic Ollama generate proxy
app.post('/api/ollama/generate', async (req, res) => {
  const { prompt, system, model = DEFAULT_MODEL, stream = false } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  try {
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        system: system || 'You are BillBuddy AI, an expert business, invoicing, and financial advisor.',
        stream
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Ollama generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Specialized AI Invoice Analyzer
app.post('/api/ollama/analyze-invoice', async (req, res) => {
  const { invoice, model = DEFAULT_MODEL } = req.body;

  if (!invoice) {
    return res.status(400).json({ error: 'No invoice data provided' });
  }

  const invoiceSummary = `
INVOICE DETAILS:
- Invoice #: ${invoice.invoiceNumber || 'Draft'}
- Business: ${invoice.businessName || 'N/A'} (${invoice.businessEmail || ''})
- Customer: ${invoice.clientName || 'N/A'} (${invoice.clientEmail || ''})
- Issue Date: ${invoice.date || 'N/A'}, Due Date: ${invoice.dueDate || 'N/A'}
- Payment Terms: ${invoice.paymentTerms || 'Due on Receipt'}
- Payment Status: ${invoice.status || 'Pending'}
- Currency: ${invoice.currency || 'USD'}
- Line Items (${(invoice.items || []).length} items):
${(invoice.items || []).map((it, idx) => `  ${idx + 1}. ${it.description || 'Item'}: Qty ${it.quantity}, Price ${invoice.currency}${it.rate}, Tax ${it.tax || 0}%, Discount ${it.discount || 0}%, Total ${invoice.currency}${it.total}`).join('\n')}
- Subtotal: ${invoice.currency} ${invoice.subtotal || 0}
- Tax Total: ${invoice.currency} ${invoice.taxTotal || 0}
- Discount Total: ${invoice.currency} ${invoice.discountTotal || 0}
- Grand Total: ${invoice.currency} ${invoice.grandTotal || 0}
- Notes: ${invoice.notes || 'None'}
`;

  const prompt = `You are BillBuddy's Financial Intelligence Engine powered by Gemma 4.
Perform an in-depth financial & business audit of the following invoice:

${invoiceSummary}

Provide a structured, comprehensive analysis in clean markdown format with the following exact sections:

### 1. 📊 Executive Financial Summary
- Health Rating (Score from 1 to 10 with brief justification)
- Revenue Breakdown & Average Item Value
- Profitability & Pricing Evaluation

### 2. ⚠️ Payment & Cashflow Risk Assessment
- Risk Level: [Low / Moderate / High]
- Risk factors based on Due Date, Payment Terms (${invoice.paymentTerms || 'N/A'}), and total amount
- Estimated probability of on-time payment and recommended early-payment discount (e.g. 2/10 Net 30)

### 3. 🔍 Line-Item & Tax Audit
- Check if descriptions are clear, professional, and audit-ready
- Calculation & Tax compliance check
- Value-add suggestions (are rates competitive or underpriced?)

### 4. 💡 Strategic Upsell & Growth Recommendations
- 2-3 specific complementary services or add-ons to offer this client in future invoices
- Cashflow acceleration tip

### 5. ✉️ Ready-to-Send Client Message
A polite, persuasive, and professional email message that the business owner can copy and paste to send this invoice to the client.

Be direct, insightful, and practical.`;

  try {
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        system: 'You are an elite business CFO and billing auditor. Respond with actionable, structured insights in markdown.',
        stream: false
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    res.json({ analysis: data.response });
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Natural Language to Invoice Parser
app.post('/api/ollama/parse-prompt', async (req, res) => {
  const { text, model = DEFAULT_MODEL } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'No text prompt provided' });
  }

  const prompt = `Convert the following natural language billing request into valid JSON for an invoice.

REQUEST: "${text}"

Respond ONLY with a valid JSON object (no markdown code blocks, no preamble, just raw JSON) matching this structure:
{
  "clientName": "string",
  "clientEmail": "string or empty",
  "clientAddress": "string or empty",
  "paymentTerms": "e.g. Net 15, Net 30, Due on Receipt",
  "dueDateDays": number (e.g. 14, 30, 0),
  "currency": "USD, EUR, GBP, INR, etc. (currency code symbol like $ or ₹ or €)",
  "items": [
    {
      "description": "string",
      "quantity": number,
      "rate": number,
      "tax": number,
      "discount": number
    }
  ],
  "notes": "string or empty"
}

If any detail is not specified in the text, provide a sensible default (quantity: 1, tax: 0, discount: 0, terms: "Due on Receipt").`;

  try {
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        format: 'json',
        system: 'You are a strict JSON parser. Output only valid JSON.',
        stream: false
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    let parsed;
    try {
      parsed = JSON.parse(data.response);
    } catch (e) {
      // Clean possible markdown code fences
      const cleaned = data.response.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }
    res.json({ invoiceData: parsed });
  } catch (err) {
    console.error('Parse error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fallback to index.html for SPA routes (Express 5 compatible)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 BillBuddy server running at http://localhost:${PORT}`);
  console.log(`🤖 Connected Ollama target: ${OLLAMA_HOST} with default model: ${DEFAULT_MODEL}`);
});
