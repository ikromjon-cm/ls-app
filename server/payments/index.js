import { ClickProvider } from './click.js'
import { PaymeProvider } from './payme.js'
import { UzumProvider } from './uzum.js'

export function getProviders(config = {}) {
  return {
    click: new ClickProvider(config.click || {}),
    payme: new PaymeProvider(config.payme || {}),
    uzum: new UzumProvider(config.uzum || {}),
  }
}

export async function createPayment({ provider, amount, description, orderId, studentId, returnUrl, config }) {
  const providers = getProviders(config)
  const p = providers[provider]
  if (!p) throw new Error(`Noto'g'ri to'lov provayderi: ${provider}`)
  if (!p.enabled) throw new Error(`${p.name} provayderi sozlanmagan`)
  return p.createInvoice({ amount, description, orderId, studentId, returnUrl })
}

export async function checkPayment({ provider, transactionId, config }) {
  const providers = getProviders(config)
  const p = providers[provider]
  if (!p) throw new Error(`Noto'g'ri to'lov provayderi: ${provider}`)
  return p.checkPayment(transactionId)
}

export function getEnabledProviders(config) {
  const providers = getProviders(config)
  const list = []
  for (const [key, p] of Object.entries(providers)) {
    if (p.enabled) list.push({ id: key, name: p.name })
  }
  return list
}
