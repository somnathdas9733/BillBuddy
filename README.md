*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 2: Side Hustle](https://dev.to/challenges/hacktoberfest-week2-2026-10-12)*

# BillBuddy 🧾⚡ — Private, Intelligent Invoicing for Modern Side Hustles & Businesses

## What I Built
<!-- What does it do, and who would pay for it?  What problem does it solve for them? -->

**BillBuddy** is a zero-leakage, high-performance billing and invoicing application designed specifically for freelancers, boutique agencies, consultants, and side hustlers.

### What does it do?
- **Intuitive Invoice Creation**: Complete business profile (name, logo, tax/GST/VAT ID, address), client details, auto-generated invoice numbers, custom currencies (`$`, `₹`, `€`, `£`, `A$`, `C$`, `¥`), and dynamic line items with real-time tax, discounts, and totals calculation.
- **Easy Download as PDF for Customer**: One-click, high-resolution A4 PDF download formatted specifically for clients, plus dedicated `@media print` zero-margin print mode.
- **4 Professional Invoice Templates**: Switch instantly between *Modern Minimalist*, *Executive Navy*, *Emerald Luxe*, and *Monochrome Tech*.
- **AI Smart Draft (Prompt to Invoice)**: Users can type or speak in plain English (e.g. *"Bill Acme Corp for 20 hours of dev at $90/hr and $250 setup, 8% tax, Net 14"*) and the AI automatically builds the complete structured invoice.
- **AI Financial Analyzer & Auditor**: Acts as a virtual CFO, auditing profit margins, payment risk, tax compliance, growth upsell recommendations, and generating client delivery emails.

### Who would pay for it?
- **Freelancers & Solopreneurs**: Who waste hours every month creating invoices manually in Word or Excel and want a polished, credible look without paying $15–$50/month for SaaS accounting subscriptions.
- **Agencies & Consultants**: Who need customized branding, quick multi-template switching, and proactive payment risk analysis for client contracts.

### What problem does it solve for them?
1. **Eliminates Costly Recurring SaaS Subscriptions**: Free and open-source alternative to expensive proprietary invoicing platforms that charge monthly fees and lock your data.
2. **Protects Highly Sensitive Financial Data**: Traditional cloud tools send your billing rates, client lists, and profit margins to remote third-party servers. BillBuddy operates with local inference, so not a single byte of sensitive billing data leaves your machine.
3. **Reduces Late Payments**: The AI Analyzer evaluates payment terms, due dates, and invoice size to flag late-payment risks before you send the bill, and drafts professional reminder emails.

## Demo
https://canva.link/jvva0wjyljgzmlo

- **Local App URL**: `http://localhost:3000` (Ready to run locally with `npm start`)
- **Key Features Preview**:
  - 🧾 **Real-Time Invoice Editor & Live A4 Paper Simulation**: Edits on the left reflect instantly on the right.
  - 🎨 **Template Switcher**: 1-click styling changes (*Modern*, *Executive*, *Emerald*, *Monochrome*).
  - 📥 **Customer PDF Download**: Crisp, vector-quality A4 export without awkward page breaks.
  - 🧠 **Gemma 4 Financial Intelligence Audit**: Instant health rating (1–10), payment risk score, tax verification, upsell advice, and client copy-paste email.
  - ✨ **Natural Language Bill Generator**: Instant prompt-to-bill parsing.


## Code
<!-- Show us the code!  You can embed a GitHub repo directly into your post. -->

{% github https://github.com/somnathdas9733/BillBuddy %}



### Tech Stack
- **Frontend**: Vanilla JavaScript (ES6+), Semantic HTML5, bespoke CSS design system (Dark & Light mode, `@media print` stylesheet).
- **Document Engine**: `html2pdf.js` for client-side PDF generation, `marked.js` for structured AI markdown output.
- **Backend & Proxy**: Node.js & Express server acting as a secure local proxy to Ollama to eliminate CORS issues.
- **AI Engine**: Local **Gemma 4** (`gemma4:latest`, 7.5B parameters) running locally via **Ollama**.

## How I Built It
<!-- Which open-source AI did you use (open-weight models, agent harnesses, frameworks, local inference), and how is your project built around it? -->

### Open-Source AI: Gemma 4 via Ollama
BillBuddy is built directly around **Google's Gemma 4** open-weight model (`gemma4:latest`, 7.5B parameters) running through **Ollama** on the user's local machine (`http://127.0.0.1:11434`).

### How the project is built around it:
1. **Natural Language Bill Extraction (`/api/ollama/parse-prompt`)**:
   - The user provides an unstructured billing request in plain English.
   - Gemma 4 is fed a strict JSON schema prompt to parse and return structured data (client name, line items, unit rates, quantities, tax, discounts, and payment terms).
   - The frontend automatically fills all inputs and renders the live bill in one click.

2. **CFO Financial & Risk Auditor (`/api/ollama/analyze-invoice`)**:
   - Sends full invoice metadata to Gemma 4 with a specialized system prompt.
   - Gemma 4 performs a 5-step deep audit:
     - **Executive Financial Summary**: Overall health score (1–10), revenue breakdown, pricing competitiveness.
     - **Payment & Cashflow Risk**: Estimates probability of late payment and suggests early-payment incentives (e.g. 2/10 Net 30).
     - **Line-Item & Tax Compliance**: Audits line items for audit readiness and tax alignment.
     - **Strategic Upsell Opportunities**: Tailored complementary services to offer this client next.
     - **Ready-to-Send Client Message**: A polished delivery email ready to copy and send.

3. **Interactive Financial Q&A Chat**:
   - Users can chat directly with Gemma 4 about pricing negotiations, handling late payments, and tax strategies in real-time.

## Why Does Open Innovation Matter?
<!-- Why does open innovation matter for what you built?  What did it make possible that a closed API wouldn't? -->

1. **Absolute Financial Privacy**: Billing rates, client identities, and profit margins are confidential business secrets. Running open-weight Gemma 4 locally ensures zero sensitive data is transmitted to third-party closed API vendors.
2. **Zero Marginal Token Costs**: Side hustlers and small businesses can audit hundreds of bills, generate invoices, and ask business questions without incurring per-token API charges or subscription tiers.
3. **Offline Autonomy & Resilience**: The billing engine and AI analyzer run 100% offline. Business owners can create bills and analyze finances on planes, in remote locations, or during network disruptions.
4. **Community Adaptability**: Open models allow the developer community to adapt prompts, add regional tax compliance (e.g. GST, VAT), and customize behavior without relying on proprietary API roadmaps.

## My Agent Session
<!-- Optional, but judges love it.  Save your session with DevRelay and embed it with the agent_session tag (see the challenge page), or link to it. -->

{% agent_session 46bebdc5-20aa-4735-938c-1f8f89bee7d8 %}

> *Built using **Antigravity** (Google DeepMind agentic coding assistant). The application architecture, local Ollama API proxy, responsive multi-template CSS, PDF export engine, and Gemma 4 prompts were constructed and verified end-to-end in this session.*


## Prize Categories
<!-- Which partner categories are you entering?  List every one that applies, or remove this section. -->

- **Side Hustle Track**: Specifically engineered to help freelancers, contractors, and side hustlers manage invoicing, prevent late payments, and increase revenue.
- **Local Inference / Best Use of Open-Weight Models**: Powered entirely by on-device **Gemma 4** via **Ollama**, showcasing high-utility local AI with zero external cloud dependencies.
- **Open-Source AI Innovation**: Demonstrates how open-weight AI can disrupt proprietary SaaS tools by providing private, zero-cost financial intelligence.

<!-- Team Submissions: Please pick one member to publish the submission and credit teammates by listing their DEV usernames directly in the body of the post. -->

<!-- Thanks for participating! -->
