import env from '../config/env.js'

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  cc?: string | string[]
  bcc?: string | string[]
  replyTo?: string
}

let resendClient: any = null

async function getResendClient() {
  if (resendClient) return resendClient
  if (!env.RESEND_API_KEY) return null
  try {
    const { Resend } = await import('resend')
    resendClient = new Resend(env.RESEND_API_KEY)
    return resendClient
  } catch {
    console.warn('[Email] Resend client initialization failed')
    return null
  }
}

function wrapHtml(body: string): string {
  return `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #f4f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px; }
    .content { background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .content h2 { color: #1e293b; font-size: 20px; margin: 0 0 16px; }
    .content p { color: #475569; line-height: 1.6; margin: 8px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0; }
    .btn:hover { opacity: 0.9; }
    .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .info-box p { margin: 4px 0; }
    .footer { text-align: center; padding: 20px; color: #94a3b8; font-size: 12px; }
    .footer a { color: #4f46e5; text-decoration: none; }
    .code { font-size: 32px; font-weight: 700; color: #4f46e5; text-align: center; letter-spacing: 8px; padding: 16px; background: #f0f0ff; border-radius: 8px; margin: 16px 0; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status-paid { background: #dcfce7; color: #166534; }
    .status-debt { background: #fef2f2; color: #991b1b; }
    .status-risk { background: #fff3cd; color: #856404; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th { background: #f8fafc; padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; }
    td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #475569; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${env.EMAIL_FROM_NAME}</h1>
      <p>O'quv markazi boshqaruv tizimi</p>
    </div>
    <div class="content">
      ${body}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${env.EMAIL_FROM_NAME}. Barcha huquqlar himoyalangan.</p>
      <p>Bu xabar avtomatik tarzda yuborildi, iltimos javob bermang.</p>
      <p><a href="mailto:${env.EMAIL_FROM}">${env.EMAIL_FROM}</a></p>
    </div>
  </div>
</body>
</html>`
}

export const emailTemplates = {
  loginConfirmation(name: string, ip: string, time: string): string {
    return wrapHtml(`
      <h2>🔐 Xavfsizlik: Tizimga kirish</h2>
      <p>Hurmatli <strong>${name}</strong>,</p>
      <p>Sizning hisobingizga quyidagi ma'lumotlar bilan kirish amalga oshirildi:</p>
      <div class="info-box">
        <p><strong>📍 IP manzil:</strong> ${ip}</p>
        <p><strong>🕐 Vaqt:</strong> ${time}</p>
      </div>
      <p>Agar bu siz bo'lmasangiz, darhol parolingizni o'zgartiring.</p>
    `)
  },

  passwordReset(name: string, resetLink: string): string {
    return wrapHtml(`
      <h2>🔑 Parolni tiklash</h2>
      <p>Hurmatli <strong>${name}</strong>,</p>
      <p>Parolingizni tiklash uchun quyidagi tugmani bosing:</p>
      <div style="text-align: center;">
        <a href="${resetLink}" class="btn">Parolni tiklash</a>
      </div>
      <p>Bu havola <strong>1 soat</strong> davomida amal qiladi.</p>
      <p>Agar parol tiklashni so'ramagan bo'lsangiz, bu xabarni e'tiborsiz qoldiring.</p>
    `)
  },

  studentAccepted(studentName: string, groupName: string, teacherName: string, startDate: string): string {
    return wrapHtml(`
      <h2>🎉 O'quvchi qabul qilindi</h2>
      <p>Hurmatli ota-ona,</p>
      <p>Farzandingiz <strong>${studentName}</strong> quyidagi guruhga qabul qilindi:</p>
      <div class="info-box">
        <p><strong>📚 Guruh:</strong> ${groupName}</p>
        <p><strong>👨‍🏫 O'qituvchi:</strong> ${teacherName}</p>
        <p><strong>📅 Boshlanish vaqti:</strong> ${startDate}</p>
      </div>
      <p>Batafsil ma'lumot uchun tizimga kiring.</p>
    `)
  },

  paymentReminder(studentName: string, amount: number, dueDate: string, debtDays: number): string {
    return wrapHtml(`
      <h2>💳 To'lov muddati eslatmasi</h2>
      <p>Hurmatli ota-ona,</p>
      <p>Farzandingiz <strong>${studentName}</strong> uchun to'lov muddati yaqinlashmoqda:</p>
      <div class="info-box">
        <p><strong>💰 Summa:</strong> ${amount.toLocaleString()} so'm</p>
        <p><strong>📅 Muddat:</strong> ${dueDate}</p>
        ${debtDays > 1 ? `<p><strong>⏰ Qolgan kun:</strong> ${debtDays} kun</p>` : ''}
      </div>
      <p>Iltimos, to'lovni o'z vaqtida amalga oshiring.</p>
    `)
  },

  attendanceReport(studentName: string, month: string, present: number, absent: number, late: number): string {
    return wrapHtml(`
      <h2>📋 Davomat hisoboti</h2>
      <p>Hurmatli ota-ona,</p>
      <p>Farzandingiz <strong>${studentName}</strong>ning <strong>${month}</strong> oyidagi davomati:</p>
      <table>
        <tr><th>Holat</th><th>Soni</th></tr>
        <tr><td>✅ Kelgan</td><td>${present}</td></tr>
        <tr><td>❌ Kelmagan</td><td>${absent}</td></tr>
        <tr><td>⏰ Kech qolgan</td><td>${late}</td></tr>
        <tr><td><strong>Jami</strong></td><td><strong>${present + absent + late}</strong></td></tr>
      </table>
      ${absent > 3 ? '<p style="color: #dc2626;">⚠️ Farzandingiz darslarga muntazam qatnashmayapti. Iltimos, sababini aniqlang.</p>' : ''}
    `)
  },

  paymentReceipt(studentName: string, amount: number, method: string, date: string, receiptNumber: string): string {
    return wrapHtml(`
      <h2>🧾 To'lov cheki</h2>
      <p>Quyidagi to'lov muvaffaqiyatli amalga oshirildi:</p>
      <div class="info-box">
        <p><strong>👤 O'quvchi:</strong> ${studentName}</p>
        <p><strong>💰 Summa:</strong> ${amount.toLocaleString()} so'm</p>
        <p><strong>💳 Usul:</strong> ${method}</p>
        <p><strong>📅 Sana:</strong> ${date}</p>
        <p><strong>🔢 Chek №:</strong> ${receiptNumber}</p>
      </div>
      <p>Rahmat! 🎉</p>
    `)
  },

  homeworkReminder(studentName: string, title: string, groupName: string, deadline: string, description?: string): string {
    return wrapHtml(`
      <h2>📚 Uy vazifasi eslatmasi</h2>
      <p>Hurmatli ota-ona,</p>
      <p>Farzandingiz <strong>${studentName}</strong>ga quyidagi uy vazifasi berilgan:</p>
      <div class="info-box">
        <p><strong>📝 Mavzu:</strong> ${title}</p>
        <p><strong>📖 Guruh:</strong> ${groupName}</p>
        <p><strong>⏰ Topshirish muddati:</strong> ${deadline}</p>
        ${description ? `<p><strong>📄 Tavsif:</strong> ${description}</p>` : ''}
      </div>
      <p>Iltimos, farzandingizga vazifani o'z vaqtida bajarishida yordam bering.</p>
    `)
  },

  gradeNotification(studentName: string, subject: string, score: number, maxScore?: number): string {
    return wrapHtml(`
      <h2>📊 Baho qo'yildi</h2>
      <p>Farzandingiz <strong>${studentName}</strong>ga quyidagi baho qo'yildi:</p>
      <div class="info-box">
        <p><strong>📖 Fan:</strong> ${subject}</p>
        <p><strong>🎯 Baho:</strong> ${score}${maxScore ? ` / ${maxScore}` : ''}</p>
      </div>
    `)
  },
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const client = await getResendClient()
    if (!client) {
      console.log(`[Email] Resend not configured. Would send: ${options.subject} to ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`)
      return { success: false, error: 'Resend not configured' }
    }

    const { data, error } = await client.emails.send({
      from: `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM}>`,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined,
      reply_to: options.replyTo,
    })

    if (error) {
      console.error('[Email] Send failed:', error)
      return { success: false, error: error.message }
    }

    console.log(`[Email] Sent: ${options.subject} (id: ${data?.id})`)
    return { success: true, id: data?.id }
  } catch (err: any) {
    console.error('[Email] Error:', err.message)
    return { success: false, error: err.message }
  }
}
