// Resend is imported dynamically to avoid build-time errors

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

function formatPrice(amount: number, currency: string = 'JPY'): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(amount)
}

function generateInvoiceHTML(data: InvoiceEmailData): string {
  const itemsHTML = data.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">${item.name}</td>
      <td style="padding: 12px; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; text-align: right;">${formatPrice(item.price, data.currency)}</td>
      <td style="padding: 12px; text-align: right;">${formatPrice(item.price * item.quantity, data.currency)}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Invoice #${data.orderNumber}</title></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1>Card Shop - Invoice</h1>
  <p>Order #${data.orderNumber}</p>
  <p>Bill To: ${data.customerName} (${data.to})</p>
  <table style="width: 100%; border-collapse: collapse;">
    <thead><tr style="background: #333; color: white;">
      <th style="padding: 12px;">Item</th><th>Qty</th><th>Price</th><th>Total</th>
    </tr></thead>
    <tbody>${itemsHTML}</tbody>
  </table>
  <p style="text-align: right; font-size: 20px;"><strong>Total: ${formatPrice(data.total, data.currency)}</strong></p>
  <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3>Payment Instructions (Wise)</h3>
    <p>Account Holder: ${process.env.WISE_ACCOUNT_HOLDER || 'Card Shop'}</p>
    <p>IBAN: ${process.env.WISE_IBAN || 'Your IBAN'}</p>
    <p>Reference: #${data.orderNumber}</p>
  </div>
</body>
</html>`
}

export async function sendInvoiceEmail(data: InvoiceEmailData): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    console.error('RESEND_API_KEY is not set')
    return { success: false, error: 'Email service not configured' }
  }
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(resendApiKey)
    const fromEmail = process.env.EMAIL_FROM || 'noreply@cardshop.com'
    const fromName = process.env.EMAIL_FROM_NAME || 'CardShop'
    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: data.to,
      subject: `Invoice for Order #${data.orderNumber}`,
      html: generateInvoiceHTML(data),
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send invoice email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

// ==================== Email Verification ====================

interface VerificationEmailData {
  to: string
  name: string
  verificationUrl: string
}

function generateVerificationEmailHTML(data: VerificationEmailData): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>メールアドレスの確認</title></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">CardShop</h1>
    <p style="color: rgba(255,255,255,0.9);">メールアドレスの確認</p>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p>${data.name} 様</p>
    <p>CardShopへのご登録ありがとうございます。以下のボタンをクリックして確認してください。</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.verificationUrl}" style="display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        メールアドレスを確認する
      </a>
    </div>
    <p style="font-size: 14px; color: #666;">このリンクは24時間有効です。</p>
    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 20px 0;">
    <p style="font-size: 12px; color: #999;">リンク: <a href="${data.verificationUrl}">${data.verificationUrl}</a></p>
  </div>
</body>
</html>`
}

export async function sendVerificationEmail(data: VerificationEmailData): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    console.error('RESEND_API_KEY is not set')
    return { success: false, error: 'Email service not configured' }
  }
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(resendApiKey)
    const fromEmail = process.env.EMAIL_FROM || 'noreply@cardshop.com'
    const fromName = process.env.EMAIL_FROM_NAME || 'CardShop'
    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: data.to,
      subject: '【CardShop】メールアドレスの確認',
      html: generateVerificationEmailHTML(data),
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send verification email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}
