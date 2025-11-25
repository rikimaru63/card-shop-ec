import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export type OrderItem = {
  name: string
  quantity: number
  price: number
}

export type InvoiceEmailData = {
  to: string
  orderNumber: string
  customerName: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  total: number
  currency: string
}

function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

function generateInvoiceHTML(data: InvoiceEmailData): string {
  const itemsHTML = data.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">${formatPrice(item.price, data.currency)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">${formatPrice(item.price * item.quantity, data.currency)}</td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice for Order #${data.orderNumber}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #333;">
    <h1 style="margin: 0; font-size: 28px; color: #333;">Card Shop</h1>
    <p style="margin: 5px 0 0; color: #666;">Premium Trading Cards</p>
  </div>

  <!-- Invoice Title -->
  <div style="padding: 30px 0 20px;">
    <h2 style="margin: 0; color: #333;">Invoice</h2>
    <p style="margin: 5px 0 0; color: #666;">Order #${data.orderNumber}</p>
    <p style="margin: 5px 0 0; color: #666;">Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>

  <!-- Customer Info -->
  <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
    <p style="margin: 0;"><strong>Bill To:</strong></p>
    <p style="margin: 5px 0 0;">${data.customerName}</p>
    <p style="margin: 5px 0 0;">${data.to}</p>
  </div>

  <!-- Order Items -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    <thead>
      <tr style="background: #333; color: white;">
        <th style="padding: 12px; text-align: left;">Item</th>
        <th style="padding: 12px; text-align: center;">Qty</th>
        <th style="padding: 12px; text-align: right;">Price</th>
        <th style="padding: 12px; text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML}
    </tbody>
  </table>

  <!-- Totals -->
  <div style="text-align: right; margin-bottom: 30px;">
    <p style="margin: 5px 0;"><strong>Subtotal:</strong> ${formatPrice(data.subtotal, data.currency)}</p>
    <p style="margin: 5px 0;"><strong>Shipping:</strong> ${data.shipping === 0 ? 'FREE' : formatPrice(data.shipping, data.currency)}</p>
    <p style="margin: 10px 0; font-size: 20px; color: #333;"><strong>Total Due: ${formatPrice(data.total, data.currency)}</strong></p>
  </div>

  <!-- Payment Instructions -->
  <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #4caf50;">
    <h3 style="margin: 0 0 15px; color: #2e7d32;">💳 Payment Instructions (Wise)</h3>
    <p style="margin: 0 0 10px;">Please transfer the total amount to the following account:</p>
    <div style="background: white; padding: 15px; border-radius: 4px; margin: 10px 0;">
      <p style="margin: 5px 0;"><strong>Account Holder:</strong> ${process.env.WISE_ACCOUNT_HOLDER || 'Card Shop LLC'}</p>
      <p style="margin: 5px 0;"><strong>IBAN:</strong> ${process.env.WISE_IBAN || 'Your IBAN here'}</p>
      <p style="margin: 5px 0;"><strong>BIC/SWIFT:</strong> ${process.env.WISE_BIC || 'TRWIBEB1XXX'}</p>
      <p style="margin: 5px 0;"><strong>Bank:</strong> Wise Europe SA</p>
    </div>
    <p style="margin: 10px 0 0; font-size: 14px; color: #666;">
      <strong>Reference:</strong> Please include your order number <strong>#${data.orderNumber}</strong> in the payment reference.
    </p>
  </div>

  <!-- Alternative Payment -->
  <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ff9800;">
    <h3 style="margin: 0 0 10px; color: #e65100;">📧 Need Help?</h3>
    <p style="margin: 0;">
      If you have any questions about this invoice or prefer a different payment method,
      please contact us via Instagram DM:
      <a href="https://ig.me/m/cardshop_official" style="color: #1976d2;">@cardshop_official</a>
    </p>
  </div>

  <!-- Shipping Info Request -->
  <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2196f3;">
    <h3 style="margin: 0 0 10px; color: #1565c0;">📦 Shipping Address</h3>
    <p style="margin: 0;">
      Please reply to this email with your complete shipping address, including:
    </p>
    <ul style="margin: 10px 0; padding-left: 20px;">
      <li>Full Name</li>
      <li>Street Address</li>
      <li>City, State/Province, Postal Code</li>
      <li>Country</li>
      <li>Phone Number (for delivery)</li>
    </ul>
  </div>

  <!-- Footer -->
  <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e5e5; color: #666; font-size: 14px;">
    <p style="margin: 0;">Thank you for your order!</p>
    <p style="margin: 10px 0 0;">Card Shop - Premium Trading Cards</p>
    <p style="margin: 5px 0 0;">
      <a href="https://instagram.com/cardshop_official" style="color: #1976d2;">Instagram</a>
    </p>
  </div>

</body>
</html>
`
}

export async function sendInvoiceEmail(data: InvoiceEmailData): Promise<{
  success: boolean
  messageId?: string
  error?: string
}> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured, skipping email send')
      return { success: true, messageId: 'skipped-no-api-key' }
    }

    const fromEmail = process.env.EMAIL_FROM || 'noreply@cardshop.com'
    const fromName = process.env.EMAIL_FROM_NAME || 'Card Shop'

    const { data: result, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: data.to,
      subject: `Invoice for Order #${data.orderNumber}`,
      html: generateInvoiceHTML(data),
    })

    if (error) {
      console.error('Failed to send invoice email:', error)
      return { success: false, error: error.message }
    }

    console.log('Invoice email sent successfully:', result?.id)
    return { success: true, messageId: result?.id }
  } catch (error) {
    console.error('Error sending invoice email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
