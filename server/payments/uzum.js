const UZUM_API = 'https://api.uzum.uz'

export class UzumProvider {
  constructor(config) {
    this.merchantId = config.merchantId || process.env.UZUM_MERCHANT_ID
    this.secretKey = config.secretKey || process.env.UZUM_SECRET_KEY
    this.terminalId = config.terminalId || process.env.UZUM_TERMINAL_ID
  }

  get enabled() {
    return !!(this.merchantId && this.secretKey && this.terminalId)
  }

  get name() { return 'Uzum' }
  get logo() { return '/payments/uzum.svg' }

  async createInvoice({ amount, description, orderId, studentId, returnUrl }) {
    const payload = {
      merchantId: this.merchantId,
      terminalId: this.terminalId,
      orderId: String(orderId),
      amount: Number(amount) * 100,
      description: description?.substring(0, 255) || `To'lov #${orderId}`,
      callbackUrl: returnUrl || '',
      extraData: { studentId: String(studentId || ''), orderId: String(orderId) },
    }
    const res = await this._post(`${UZUM_API}/api/v1/orders`, payload)
    if (!res.success) throw new Error(res.message || 'Uzum xatosi')
    return {
      provider: 'uzum',
      transactionId: res.orderId || String(orderId),
      invoiceId: res.paymentId || '',
      paymentUrl: res.paymentUrl || `${UZUM_API}/pay/${res.orderId}`,
      amount: Number(amount),
      status: 'pending',
    }
  }

  async checkPayment(orderId) {
    const res = await this._get(`${UZUM_API}/api/v1/orders/${orderId}`)
    const statusMap = { new: 'pending', processing: 'pending', paid: 'paid', cancelled: 'failed', failed: 'failed' }
    return { status: statusMap[res.status] || 'pending', detail: res.rejectReason || '' }
  }

  verifyWebhook(body, signature) {
    const expected = this._generateSignature(body)
    return signature === expected
  }

  _generateSignature(data) {
    const str = `${data.orderId || ''}|${data.amount || ''}|${this.secretKey}`
    let h = 0
    for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0 }
    return String(Math.abs(h))
  }

  async _post(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Auth': this.secretKey, 'X-Merchant-Id': this.merchantId },
      body: JSON.stringify(body),
    })
    return res.json()
  }

  async _get(url) {
    const res = await fetch(url, {
      headers: { 'X-Auth': this.secretKey, 'X-Merchant-Id': this.merchantId },
    })
    return res.json()
  }
}
