import prisma from '../config/database.js'
import { sendEmail, emailTemplates } from './email.service.js'
import { sendToMultipleDevices, PushNotificationPayload } from './firebase.service.js'

type NotificationType = 'info' | 'success' | 'warning' | 'error'

interface NotificationPayload {
  organizationId: string
  userId?: string
  title: string
  message: string
  type?: NotificationType
}

interface EmailPayload {
  to: string | string[]
  subject: string
  html: string
}

interface PushPayload {
  deviceTokens: string[]
  title: string
  body: string
  data?: Record<string, string>
}

export async function createNotification(data: NotificationPayload): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        organizationId: data.organizationId,
        userId: data.userId || null,
        title: data.title,
        message: data.message,
        type: data.type || 'info',
      },
    })
  } catch (err) {
    console.error('[Notification] DB create failed:', err)
  }
}

export async function sendEmailNotification(data: EmailPayload): Promise<void> {
  await sendEmail({ to: data.to, subject: data.subject, html: data.html })
}

export async function sendPushNotification(data: PushPayload): Promise<void> {
  const payload: PushNotificationPayload = {
    title: data.title,
    body: data.body,
    data: data.data,
  }
  await sendToMultipleDevices(data.deviceTokens, payload)
}

export async function notifyPaymentDue(
  organizationId: string,
  studentName: string,
  amount: number,
  dueDate: string,
  parentEmail?: string,
  parentPhone?: string,
  deviceTokens?: string[]
): Promise<void> {
  const debtDays = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  await createNotification({
    organizationId,
    title: "To'lov muddati yaqin",
    message: `${studentName} uchun ${amount.toLocaleString()} so'm to'lov muddati ${dueDate}`,
    type: 'warning',
  })

  if (parentEmail) {
    await sendEmail({
      to: parentEmail,
      subject: "To'lov muddati eslatmasi - OpenCode CRM",
      html: emailTemplates.paymentReminder(studentName, amount, dueDate, debtDays),
    })
  }

  if (deviceTokens?.length) {
    await sendPushNotification({
      deviceTokens,
      title: "To'lov eslatmasi",
      body: `${studentName} uchun ${amount.toLocaleString()} so'm to'lov muddati ${dueDate}`,
      data: { type: 'payment_due', studentName, amount: amount.toString() },
    })
  }
}

export async function notifyAttendanceIssue(
  organizationId: string,
  studentName: string,
  month: string,
  present: number,
  absent: number,
  late: number,
  parentEmail?: string,
  deviceTokens?: string[]
): Promise<void> {
  const message = `${studentName}: ${month} oyida ${absent} kun kelmagan, ${late} marta kechikkan`

  await createNotification({
    organizationId,
    title: 'Davomat hisoboti',
    message,
    type: absent > 3 ? 'error' : 'info',
  })

  if (parentEmail) {
    await sendEmail({
      to: parentEmail,
      subject: 'Davomat hisoboti - OpenCode CRM',
      html: emailTemplates.attendanceReport(studentName, month, present, absent, late),
    })
  }

  if (deviceTokens?.length) {
    await sendPushNotification({
      deviceTokens,
      title: 'Davomat',
      body: message,
      data: { type: 'attendance', studentName },
    })
  }
}

export async function notifyStudentAccepted(
  organizationId: string,
  studentName: string,
  groupName: string,
  teacherName: string,
  startDate: string,
  parentEmail?: string,
  deviceTokens?: string[]
): Promise<void> {
  const message = `${studentName} ${groupName} guruhiga qabul qilindi`

  await createNotification({
    organizationId,
    title: 'Yangi o\'quvchi',
    message,
    type: 'success',
  })

  if (parentEmail) {
    await sendEmail({
      to: parentEmail,
      subject: 'Farzandingiz guruhga qabul qilindi - OpenCode CRM',
      html: emailTemplates.studentAccepted(studentName, groupName, teacherName, startDate),
    })
  }

  if (deviceTokens?.length) {
    await sendPushNotification({
      deviceTokens,
      title: 'Farzandingiz qabul qilindi 🎉',
      body: `${studentName} ${groupName} guruhiga qo'shildi`,
      data: { type: 'student_accepted', studentName, groupName },
    })
  }
}

export async function notifyGradeAdded(
  organizationId: string,
  studentName: string,
  subject: string,
  score: number,
  parentEmail?: string,
  deviceTokens?: string[]
): Promise<void> {
  const message = `${studentName}ga ${subject} fanidan ${score} ball qo'yildi`

  await createNotification({
    organizationId,
    title: 'Baho qo\'yildi',
    message,
    type: 'info',
  })

  if (parentEmail) {
    await sendEmail({
      to: parentEmail,
      subject: 'Baho qo\'yildi - OpenCode CRM',
      html: emailTemplates.gradeNotification(studentName, subject, score),
    })
  }

  if (deviceTokens?.length) {
    await sendPushNotification({
      deviceTokens,
      title: '📊 Baho qo\'yildi',
      body: message,
      data: { type: 'grade', studentName, subject, score: score.toString() },
    })
  }
}

export async function notifyPaymentReceipt(
  organizationId: string,
  studentName: string,
  amount: number,
  method: string,
  date: string,
  receiptNumber: string,
  parentEmail?: string,
  deviceTokens?: string[]
): Promise<void> {
  const message = `${studentName} uchun ${amount.toLocaleString()} so'm to'lov qabul qilindi`

  await createNotification({
    organizationId,
    title: 'To\'lov qabul qilindi',
    message,
    type: 'success',
  })

  if (parentEmail) {
    await sendEmail({
      to: parentEmail,
      subject: 'To\'lov cheki - OpenCode CRM',
      html: emailTemplates.paymentReceipt(studentName, amount, method, date, receiptNumber),
    })
  }

  if (deviceTokens?.length) {
    await sendPushNotification({
      deviceTokens,
      title: '💳 To\'lov qabul qilindi',
      body: message,
      data: { type: 'payment_receipt', studentName, amount: amount.toString() },
    })
  }
}

export async function notifyHomework(
  organizationId: string,
  studentName: string,
  title: string,
  groupName: string,
  deadline: string,
  description?: string,
  parentEmail?: string,
  deviceTokens?: string[]
): Promise<void> {
  const message = `${title} - ${groupName}`

  await createNotification({
    organizationId,
    title: 'Yangi uy vazifasi',
    message,
    type: 'info',
  })

  if (parentEmail) {
    await sendEmail({
      to: parentEmail,
      subject: 'Uy vazifasi - OpenCode CRM',
      html: emailTemplates.homeworkReminder(studentName, title, groupName, deadline, description),
    })
  }

  if (deviceTokens?.length) {
    await sendPushNotification({
      deviceTokens,
      title: '📚 Uy vazifasi',
      body: message,
      data: { type: 'homework', title, groupName, deadline },
    })
  }
}
