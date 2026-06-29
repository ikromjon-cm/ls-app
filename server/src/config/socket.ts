import { Server as HttpServer } from 'http'
import { Server } from 'socket.io'
import { verifyAccessToken } from '../core/auth/auth.service.js'
import redis from '../config/redis.js'

let io

export function getIO() {
  if (!io) throw new Error('Socket.io not initialized')
  return io
}

export function setupSocketIO(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.CORS_ORIGIN || '*', methods: ['GET', 'POST'] },
    pingInterval: 25000,
    pingTimeout: 20000,
    transports: ['websocket', 'polling'],
  })

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token
    if (!token) return next(new Error('Token talab qilinadi'))

    const payload = verifyAccessToken(token)
    if (!payload) return next(new Error('Yaroqsiz token'))

    socket.user = payload
    socket.join(`org:${payload.organizationId}`)
    socket.join(`user:${payload.userId}`)

    await redis.sadd(`online:${payload.organizationId}`, payload.userId)
    io.to(`org:${payload.organizationId}`).emit('user:online', { userId: payload.userId })

    next()
  })

  io.on('connection', (socket) => {
    const user = socket.user
    console.log(`[Socket] ${user.userId} (${user.role}) connected`)

    socket.on('join:chat', ({ otherId }) => {
      const roomId = [user.userId, otherId].sort().join(':')
      socket.join(`chat:${roomId}`)
    })

    socket.on('message:send', (data) => {
      const roomId = [user.userId, data.receiverId].sort().join(':')
      io.to(`chat:${roomId}`).emit('message:new', {
        ...data, senderId: user.userId, senderRole: user.role, createdAt: new Date().toISOString(),
      })
    })

    socket.on('typing:start', ({ receiverId }) => {
      socket.to(`user:${receiverId}`).emit('typing:update', { userId: user.userId, typing: true })
    })

    socket.on('typing:stop', ({ receiverId }) => {
      socket.to(`user:${receiverId}`).emit('typing:update', { userId: user.userId, typing: false })
    })

    socket.on('disconnect', async () => {
      await redis.srem(`online:${user.organizationId}`, user.userId)
      io.to(`org:${user.organizationId}`).emit('user:offline', { userId: user.userId })
      console.log(`[Socket] ${user.userId} disconnected`)
    })
  })

  return io
}

export function emitToOrganization(orgId, event, data) {
  if (io) io.to(`org:${orgId}`).emit(event, data)
}

export function emitToUser(userId, event, data) {
  if (io) io.to(`user:${userId}`).emit(event, data)
}
