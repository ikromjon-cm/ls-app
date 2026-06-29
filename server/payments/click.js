const CLICK_API = 'https://api.click.uz/v2/merchant'

export class ClickProvider {
  constructor(config) {
    this.merchantId = config.merchantId || process.env.CLICK_MERCHANT_ID
    this.secretKey = config.secretKey || process.env.CLICK_SECRET_KEY
    this.serviceId = config.serviceId || process.env.CLICK_SERVICE_ID
    this.merchantUserId = config.merchantUserId || process.env.CLICK_MERCHANT_USER_ID
  }

  get enabled() {
    return !!(this.merchantId && this.secretKey && this.serviceId)
  }

  get name() { return 'Click' }
  get logo() { return '/payments/click.svg' }

  async createInvoice({ amount, description, orderId, studentId, returnUrl }) {
    const payload = {
      service_id: Number(this.serviceId),
      merchant_id: Number(this.merchantId),
      amount: Number(amount),
      transaction_parameter: String(orderId),
      description: description?.substring(0, 128) || `To'lov #${orderId}`,
      return_url: returnUrl || '',
    }
    const sign = this._sign(payload)
    const res = await this._post(`${CLICK_API}/card_token/create_invoice`, { ...payload, sign_time: sign.time, sign_string: sign.hash })
    if (!res.success) throw new Error(res.message || 'Click xatosi')
    return {
      provider: 'click',
      transactionId: String(res.service_id),
      invoiceId: String(res.invoice_id),
      paymentUrl: res.url?.replace('{service_id}', this.serviceId)?.replace('{invoice_id}', res.invoice_id) || '',
      amount,
      status: 'pending',
    }
  }

  async checkPayment(invoiceId) {
    const res = await this._post(`${CLICK_API}/payment/status`, {
      service_id: Number(this.serviceId),
      invoice_id: Number(invoiceId),
      merchant_id: Number(this.merchantId),
    })
    return { status: res.status === 0 ? 'paid' : 'pending', detail: res.status_note || '' }
  }

  verifyWebhook(body, signature) {
    const sign = this._generateSign(body)
    return signature === sign
  }

  _sign(payload) {
    const time = String(Math.round(Date.now() / 1000))
    const hash = this._generateSign(payload, time)
    return { time, hash }
  }

  _generateSign(payload, time) {
    const str = `${payload.service_id}|${this.secretKey}|${payload.amount}|${payload.transaction_parameter || ''}|${time}`
    let h = 0
    for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0 }
    return String(Math.abs(h))
  }

  async _post(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body),
    })
    return res.json()
  }
}
