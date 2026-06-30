import { Router } from 'express'
import authRoutes from '../modules/auth/routes.js'
import organizationRoutes from '../modules/organization/routes.js'
import userRoutes from '../modules/user/routes.js'
import groupRoutes from '../modules/group/routes.js'
import studentRoutes from '../modules/student/routes.js'
import paymentRoutes from '../modules/payment/routes.js'
import expenseRoutes from '../modules/expense/routes.js'
import attendanceRoutes from '../modules/attendance/routes.js'
import homeworkRoutes from '../modules/homework/routes.js'
import gradeRoutes from '../modules/grade/routes.js'
import scheduleRoutes from '../modules/schedule/routes.js'
import libraryRoutes from '../modules/library/routes.js'
import examRoutes from '../modules/exam/routes.js'
import certificateRoutes from '../modules/certificate/routes.js'
import auditRoutes from '../modules/audit/routes.js'
import reportRoutes from '../modules/report/routes.js'
import teacherRoutes from '../modules/teacher/routes.js'
import settingRoutes from '../modules/setting/routes.js'
import paymentProviderRoutes from '../modules/payment-provider/routes.js'
import parentRoutes from '../modules/parent/routes.js'
import notificationRoutes from '../modules/notification/routes.js'
import messageRoutes from '../modules/message/routes.js'
import emailRoutes from '../modules/email/routes.js'
import fcmRoutes from '../modules/fcm/routes.js'
import healthRoutes from '../modules/health/routes.js'
import docsRoutes from '../modules/docs/routes.js'
import dashboardRoutes from '../modules/dashboard/routes.js'

const router = Router()

// Public routes (no authentication required)
router.use('/auth', authRoutes)
router.use('/organizations', organizationRoutes)
router.use('/health', healthRoutes)
router.use('/', docsRoutes)

// Protected routes (authentication required)
router.use('/users', userRoutes)
router.use('/groups', groupRoutes)
router.use('/students', studentRoutes)
router.use('/payments', paymentRoutes)
router.use('/expenses', expenseRoutes)
router.use('/attendance', attendanceRoutes)
router.use('/homework', homeworkRoutes)
router.use('/grades', gradeRoutes)
router.use('/schedule', scheduleRoutes)
router.use('/library', libraryRoutes)
router.use('/exams', examRoutes)
router.use('/certificates', certificateRoutes)
router.use('/audit-logs', auditRoutes)
router.use('/reports', reportRoutes)
router.use('/teachers', teacherRoutes)
router.use('/settings', settingRoutes)
router.use('/payments/providers', paymentProviderRoutes)
router.use('/parent', parentRoutes)
router.use('/notifications', notificationRoutes)
router.use('/messages', messageRoutes)
router.use('/email', emailRoutes)
router.use('/fcm', fcmRoutes)
router.use('/dashboard', dashboardRoutes)

// 404 handler for API routes
router.use((_, res) => res.status(404).json({ success: false, message: 'API endpoint topilmadi', errors: ['NOT_FOUND'] }))

export default router