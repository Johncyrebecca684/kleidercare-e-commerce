export async function sendInvoiceEmail(order, formData = {}) {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID ? import.meta.env.VITE_EMAILJS_SERVICE_ID.trim() : '';
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID ? import.meta.env.VITE_EMAILJS_TEMPLATE_ID.trim() : '';
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY ? import.meta.env.VITE_EMAILJS_PUBLIC_KEY.trim() : '';

  if (!serviceId || !templateId || !publicKey || serviceId.includes('your_') || templateId.includes('your_')) {
    console.warn('[EmailJS] Credentials missing in .env file (VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY). Email sending skipped.');
    return { success: false, message: 'EmailJS credentials not configured in .env' };
  }

  try {
    const orderId = order.orderId || order.id || order._id || 'ORD-' + Math.floor(Math.random() * 1000000);
    const customerName = order.customerName || formData.name || 'Valued Customer';
    const customerEmail = order.userEmail || formData.email || '';
    const customerPhone = order.phone || formData.phone || 'N/A';
    const companyName = order.companyName || formData.companyName || '';
    const gstNumber = order.gstNumber || formData.gstNumber || '';

    const shipping = order.shippingAddress || {};
    const addressParts = [
      shipping.address || formData.address,
      shipping.city || formData.city,
      shipping.state || formData.state,
      (shipping.pincode || formData.pincode) ? `PIN: ${shipping.pincode || formData.pincode}` : ''
    ].filter(Boolean);

    const formattedAddress = addressParts.length > 0 ? addressParts.join(', ') : 'N/A';

    const orderDate = order.date || (order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) : new Date().toLocaleDateString('en-IN'));

    // Format HTML items table rows
    const items = order.items || [];
    const ordersTableHtml = items.map((item, idx) => {
      const itemName = item.name || 'Product';
      const warrantyInfo = item.extendedWarranty && item.extendedWarranty.title && item.extendedWarranty.title !== 'Standard (1-Yr Included)'
        ? `<br/><small style="color:#0056b3; font-size: 11px;">+ Extended Warranty: ${item.extendedWarranty.title} (₹${item.extendedWarranty.price || 0})</small>`
        : '';
      const price = Number(item.price || 0);
      const qty = Number(item.quantity || 1);
      const itemTotal = price * qty;

      return `
        <tr style="border-bottom: 1px solid #eeeeee;">
          <td style="padding: 10px 12px; font-size: 13px; color: #333333;">
            <strong>${idx + 1}. ${itemName}</strong>
            ${warrantyInfo}
          </td>
          <td style="padding: 10px 12px; font-size: 13px; text-align: center; color: #555555;">${qty}</td>
          <td style="padding: 10px 12px; font-size: 13px; text-align: right; color: #555555;">₹${price.toLocaleString('en-IN')}</td>
          <td style="padding: 10px 12px; font-size: 13px; text-align: right; font-weight: 600; color: #222222;">₹${itemTotal.toLocaleString('en-IN')}</td>
        </tr>
      `;
    }).join('');

    // Summary calculation
    const summaryBreakdown = order.summaryBreakdown || {};
    const subtotal = summaryBreakdown.subtotal !== undefined
      ? summaryBreakdown.subtotal
      : items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);

    const grandTotal = order.totalAmount || order.total || 0;
    const installationFee = summaryBreakdown.installationFee || (order.installationAddon?.selected ? (order.installationAddon.fee || 999) : 0);

    const taxAmount = Math.round(subtotal * 0.18);
    const shippingFee = (subtotal > 500) ? 0 : 50;

    const templateParams = {
      to_name: customerName,
      to_email: customerEmail,
      email: customerEmail,
      user_email: customerEmail,
      customer_email: customerEmail,
      recipient_email: customerEmail,
      reply_to: 'support@kleidercare.com',
      customer_phone: customerPhone,
      order_id: orderId,
      order_date: orderDate,
      company_name: companyName,
      gst_number: gstNumber,
      shipping_address: formattedAddress,
      payment_method: order.paymentMethod || 'Card / Online',
      payment_status: order.paymentStatus || 'Paid',
      warranty_status: order.warranty || 'Active (1 Year)',
      orders_table_html: ordersTableHtml,
      subtotal: `₹${subtotal.toLocaleString('en-IN')}`,
      tax: `₹${taxAmount.toLocaleString('en-IN')}`,
      shipping: 'Pay Freight on Delivery',
      installation_fee: installationFee > 0 ? `₹${installationFee.toLocaleString('en-IN')}` : '',
      grand_total: `₹${grandTotal.toLocaleString('en-IN')}`
    };

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: templateParams
      })
    });

    if (response.ok) {
      console.log('[EmailJS] Order invoice email dispatched successfully to:', customerEmail);
      return { success: true };
    } else {
      const errText = await response.text();
      console.error('[EmailJS] Error sending email via API:', errText);
      return { success: false, error: errText };
    }
  } catch (error) {
    console.error('[EmailJS] Exception sending email:', error);
    return { success: false, error: error.message };
  }
}
