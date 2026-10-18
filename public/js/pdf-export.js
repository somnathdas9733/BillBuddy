// BillBuddy PDF Export & Document Tools
const PDFExporter = {
  async downloadPDF(invoiceNumber, elementId = 'invoicePaper') {
    const element = document.getElementById(elementId);
    if (!element) {
      alert('Invoice paper element not found');
      return;
    }

    const sanitizedNum = (invoiceNumber || 'BILL').replace(/[^a-zA-Z0-9_-]/g, '_');
    const opt = {
      margin: [10, 10, 10, 10], // top, left, bottom, right in mm
      filename: `BillBuddy_${sanitizedNum}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2, // 2x scale for crisp sharp text and logos
        useCORS: true,
        letterRendering: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      if (window.html2pdf) {
        // Show subtle loader
        const btn = document.getElementById('downloadPdfBtn');
        const originalHtml = btn ? btn.innerHTML : '';
        if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';

        await window.html2pdf().set(opt).from(element).save();

        if (btn) btn.innerHTML = originalHtml;
        window.showToast && window.showToast('PDF downloaded successfully! 🎉');
      } else {
        // Fallback to native print dialog
        window.print();
      }
    } catch (err) {
      console.error('PDF Generation failed', err);
      // Fallback
      window.print();
    }
  },

  printInvoice() {
    window.print();
  },

  exportJSON(invoiceData) {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(invoiceData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `BillBuddy_${invoiceData.invoiceNumber || 'invoice'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    window.showToast && window.showToast('Invoice JSON exported!');
  },

  copySummary(invoiceData) {
    const lines = [
      `🧾 INVOICE SUMMARY: ${invoiceData.invoiceNumber}`,
      `From: ${invoiceData.businessName}`,
      `To: ${invoiceData.clientName}`,
      `Amount Due: ${invoiceData.currency} ${invoiceData.grandTotal}`,
      `Due Date: ${invoiceData.dueDate} (${invoiceData.paymentTerms})`,
      `Status: ${invoiceData.status.toUpperCase()}`,
      `---------------------------------`,
      `Payment Details:`,
      invoiceData.paymentDetails || 'Contact business for payment instructions'
    ];
    const text = lines.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      window.showToast && window.showToast('Summary copied to clipboard! 📋');
    }).catch(err => {
      alert('Could not copy to clipboard: ' + err);
    });
  }
};

window.PDFExporter = PDFExporter;
