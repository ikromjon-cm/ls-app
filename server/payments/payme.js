const PAYME_API = 'https://api.payme.uz'

export class PaymeProvider {
  constructor(config) {
    this.merchantId = config.merchantId || process.env.PAYME_MERCHANT_ID
    this.secretKey = config.secretKey || process.env.PAYME_SECRET_KEY
    this.checkoutUrl = config.checkoutUrl || process.env.PAYME_CHECKOUT_URL
  }

  get enabled() {
    return !!(this.merchantId && this.secretKey)
  }

  get name() { return 'Payme' }
  get logo() { return '/payments/payme.svg' }

  async createInvoice({ amount, description, orderId, studentId, returnUrl }) {
    const id = this._generateId()
    const payload = {
      method: 'CreateTransaction',
      params: {
        id,
        time: Date.now(),
        amount: Number(amount) * 100,
        account: { order_id: String(orderId), student_id: String(studentId || '') },
        description: description?.substring(0, 128) || `To'lov #${orderId}`,
        return_url: returnUrl || '',
      },
    }
    const res = await this._post(`${PAYME_API}/api/checkout/create`, payload)
    if (res.error) throw new Error(res.error.message || 'Payme xatosi')
    return {
      provider: 'payme',
      transactionId: id,
      invoiceId: res.result?.transaction || '',
      paymentUrl: res.result?.checkout_url || `${this.checkoutUrl}/${id}`,
      amount: Number(amount),
      status: 'pending',
    }
  }

  async checkPayment(transactionId) {
    const res = await this._post(`${PAYME_API}/api/transaction/check`, {
      method: 'CheckTransaction',
      params: { id: transactionId },
    })
    const status = res.result?.state === 2 ? 'paid' : res.result?.state === 1 ? 'pending' : 'failed'
    return { status, detail: res.result?.reason || '' }
  }

  verifyWebhook(body) {
    const { id, amount, account, state } = body || {}
    if (!id || !amount) return false
    return state === 2
  }

  _generateId() {
    return 'payme_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8)
  }

  async _post(url, body) {
    const auth = Buffer.from(`Payme:${this.secretKey}`).toString('base64')
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${auth}`, 'X-Auth': this.secretKey },
      body: JSON.stringify(body),
    })
    return res.json()
  }
}
