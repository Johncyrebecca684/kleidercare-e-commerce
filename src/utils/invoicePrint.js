// Utility to print Kleider Care Tax Invoice cleanly in a dedicated single-page iframe
export function printInvoiceElement(elementId = 'invoice-print-area', docTitle = 'Invoice_KC') {
  const sourceElement = document.getElementById(elementId);
  if (!sourceElement) {
    window.print();
    return;
  }

  // Remove any previous print iframe
  const existingFrame = document.getElementById('invoice-print-iframe');
  if (existingFrame) {
    existingFrame.remove();
  }

  // Create an invisible iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'invoice-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${docTitle}</title>
<style>
  @page {
    size: A4 portrait;
    margin: 8mm 10mm 8mm 10mm;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  html, body {
    width: 100%;
    height: 100%;
    background: #ffffff;
    color: #111827;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 9.5pt;
    line-height: 1.45;
  }

  .invoice-sheet {
    width: 100%;
    max-width: 100%;
    min-height: 275mm;
    max-height: 280mm;
    margin: 0 auto;
    background: #ffffff;
    padding: 16px 14px 10px;
    position: relative;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .top-strip {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 7px;
    background: #073b78;
  }

  /* HEADER */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-top: 6px;
    padding-bottom: 12px;
    border-bottom: 1.5px solid #073b78;
  }

  .company-section {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    flex: 1 1 54%;
  }

  .logo {
    width: 95px;
    height: 95px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .company-info h1 {
    font-size: 16.5pt;
    font-weight: 800;
    color: #073b78;
    margin-bottom: 3px;
    line-height: 1.2;
    letter-spacing: 0.3px;
  }

  .tagline {
    font-size: 10pt;
    font-weight: 700;
    color: #073b78;
    margin-bottom: 6px;
    padding-bottom: 4px;
    border-bottom: 1px solid #b7c8da;
    display: inline-block;
    width: 100%;
  }

  .company-details {
    font-size: 8.8pt;
    line-height: 1.5;
    color: #334155;
  }

  .company-details strong {
    color: #073b78;
  }

  .invoice-info {
    flex: 1 1 44%;
    border-left: 1px solid #cbd5e1;
    padding-left: 16px;
  }

  .invoice-title {
    font-size: 20pt;
    font-weight: 900;
    color: #073b78;
    margin-bottom: 8px;
    text-align: right;
    letter-spacing: 0.8px;
  }

  .invoice-meta {
    display: grid;
    grid-template-columns: 135px 8px 1fr;
    row-gap: 4px;
    font-size: 8.8pt;
    line-height: 1.4;
    align-items: center;
  }

  .invoice-meta .label {
    font-weight: 700;
    color: #1e293b;
  }

  /* CUSTOMER BOXES */
  .customer-grid {
    display: flex;
    gap: 16px;
    margin-top: 12px;
    margin-bottom: 12px;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .customer-box {
    flex: 1 1 50%;
    border: 1.5px solid #073b78;
    border-radius: 5px;
    position: relative;
    padding: 24px 12px 10px;
    min-height: 110px;
    background: #ffffff;
  }

  .box-title {
    position: absolute;
    left: -1px;
    top: -1px;
    background: #073b78;
    color: #ffffff;
    padding: 4px 14px;
    font-size: 9pt;
    font-weight: 800;
    letter-spacing: 0.5px;
  }

  .customer-box-inner {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }

  .customer-icon-wrap {
    width: 28px;
    height: 28px;
    border: 1.5px solid #073b78;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 3px;
  }

  .customer-content {
    display: grid;
    grid-template-columns: 50px 8px 1fr;
    row-gap: 3px;
    font-size: 8.8pt;
    line-height: 1.4;
    width: 100%;
  }

  .customer-content .label {
    font-weight: 700;
    color: #334155;
  }

  /* ITEMS TABLE */
  .items-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
    border: 1.5px solid #073b78;
    font-size: 8.8pt;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .items-table th {
    background: #073b78;
    color: #ffffff;
    border: 1px solid #ffffff;
    padding: 7px 5px;
    font-size: 8.5pt;
    font-weight: 700;
    text-align: center;
    letter-spacing: 0.3px;
  }

  .items-table td {
    border: 1px solid #94a3b8;
    padding: 7px 8px;
    font-size: 8.8pt;
    vertical-align: middle;
  }

  .items-table td:not(:nth-child(2)) {
    text-align: center;
  }

  .description {
    font-size: 9pt;
    line-height: 1.35;
    font-weight: 700;
    color: #0f172a;
    text-align: left;
  }

  /* TOTALS SECTION */
  .total-section {
    display: flex;
    border: 1.5px solid #073b78;
    border-top: none;
    background: #ffffff;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .amount-words {
    flex: 1 1 54%;
    padding: 10px 14px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .amount-words h4 {
    font-size: 9pt;
    font-weight: 800;
    margin: 0 0 4px;
    color: #073b78;
  }

  .amount-words p {
    font-size: 8.8pt;
    font-weight: 600;
    line-height: 1.4;
    color: #334155;
    margin: 0;
  }

  .totals {
    flex: 1 1 46%;
    border-left: 1.5px solid #073b78;
  }

  .total-row {
    display: flex;
    justify-content: space-between;
    min-height: 24px;
    border-bottom: 1px solid #94a3b8;
    align-items: center;
  }

  .total-row:last-child {
    border-bottom: none;
  }

  .total-row span {
    padding: 4px 10px;
    font-size: 8.8pt;
    font-weight: 600;
  }

  .total-row span:first-child {
    flex: 1 1 auto;
  }

  .total-row span:last-child {
    flex: 0 0 115px;
    text-align: right;
    border-left: 1px solid #94a3b8;
  }

  .total-row.highlight {
    background: #f1f5f9;
    color: #073b78;
    font-weight: 800;
  }

  .grand-total {
    background: #073b78 !important;
    color: #ffffff !important;
    font-size: 9.5pt !important;
    font-weight: 800 !important;
  }

  /* LOWER SECTION */
  .lower-grid {
    display: flex;
    gap: 14px;
    margin-top: 12px;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .info-box {
    flex: 1 1 50%;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    padding: 8px 12px;
  }

  .info-box h3 {
    font-size: 8.8pt;
    font-weight: 800;
    margin: 0 0 4px;
    color: #073b78;
    letter-spacing: 0.3px;
  }

  .bank-row {
    display: grid;
    grid-template-columns: 96px 8px 1fr;
    font-size: 8.2pt;
    line-height: 1.5;
    color: #334155;
  }

  .bank-row strong {
    color: #073b78;
  }

  .notes {
    padding-left: 16px;
    margin: 0;
  }

  .notes li {
    font-size: 8.2pt;
    margin-bottom: 3px;
    line-height: 1.35;
    color: #334155;
  }

  /* SEAL & SIGNATURE */
  .approval-section {
    margin-top: 10px;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 6px 0;
    background: #ffffff;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .approval-box {
    text-align: center;
    padding: 2px 14px;
    flex: 1 1 45%;
  }

  .divider {
    width: 1px;
    height: 44px;
    background: #cbd5e1;
  }

  .approval-title {
    font-size: 8.8pt;
    font-weight: 800;
    margin-bottom: 4px;
    color: #073b78;
    letter-spacing: 0.3px;
  }

  .blank-box {
    width: 160px;
    height: 42px;
    border: 1px dashed #94a3b8;
    border-radius: 4px;
    background: #f8fafc;
    margin: 0 auto;
  }

  /* FOOTER */
  .footer {
    margin-top: 10px;
    border-top: 1.5px solid #073b78;
    padding-top: 6px;
    text-align: center;
    font-size: 8pt;
    font-weight: 600;
    color: #073b78;
    letter-spacing: 0.3px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
</style>
</head>
<body>
  ${sourceElement.outerHTML}
</body>
</html>
  `;

  doc.open();
  doc.write(htmlContent);
  doc.close();

  // Trigger print after iframe renders images & fonts
  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      window.print();
    }
  }, 400);
}
