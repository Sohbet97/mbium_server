const router = require('express').Router()
const { ChatRoom, ChatMessage, ChatRoomParticipant, User } = require('../../models')
const { Op } = require('sequelize')

// Helpers
async function getOrCreateRoom(userId) {
  const participant = await ChatRoomParticipant.findOne({
    where: { user_id: userId },
    include: [{ model: ChatRoom, as: 'room', where: { type: 1 }, required: true }],
  })
  if (participant) return participant.room

  const room = await ChatRoom.create({ name: 'Support', type: 1, status: 0, createdBy: userId })
  await ChatRoomParticipant.create({ chatroom_id: room.id, user_id: userId, role: 1 })
  return room
}

// GET /seller/support/room
router.get('/room', async (req, res, next) => {
  try {
    const room = await getOrCreateRoom(req.user.id)
    res.json({ data: room })
  } catch (e) { next(e) }
})

// GET /seller/support/messages
router.get('/messages', async (req, res, next) => {
  try {
    const room = await getOrCreateRoom(req.user.id)
    const { page = 1, limit = 80 } = req.query

    const { count, rows } = await ChatMessage.findAndCountAll({
      where: { chatroom_id: room.id },
      include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'surname'] }],
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    })
    res.json({ data: rows, total: count })
  } catch (e) { next(e) }
})

// POST /seller/support/messages
router.post('/messages', async (req, res, next) => {
  try {
    const { text } = req.body
    if (!text?.trim()) return res.status(400).json({ message: 'text required' })

    const room = await getOrCreateRoom(req.user.id)
    const msg = await ChatMessage.create({ chatroom_id: room.id, text: text.trim(), createdBy: req.user.id })
    const full = await ChatMessage.findByPk(msg.id, {
      include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'surname'] }],
    })

    // Update room timestamp so it surfaces in admin list
    await room.update({ updatedAt: new Date() })

    // Notify other participants (admins who joined this room)
    const others = await ChatRoomParticipant.findAll({ where: { chatroom_id: room.id, user_id: { [Op.ne]: req.user.id } } })
    const io = req.app.io
    if (io) others.forEach((p) => io.to(String(p.user_id)).emit('support-message', { ...full.toJSON(), room_id: room.id }))

    res.status(201).json({ data: full })
  } catch (e) { next(e) }
})

module.exports = router
