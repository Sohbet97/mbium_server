const router = require('express').Router()
const { ChatRoom, ChatMessage, ChatRoomParticipant, User } = require('../../models')
const { Op } = require('sequelize')

// GET /admin/support/rooms — list all seller support rooms
router.get('/rooms', async (req, res, next) => {
  try {
    const rooms = await ChatRoom.findAll({
      where: { type: 1 },
      include: [
        {
          model: ChatRoomParticipant,
          as: 'participants',
          where: { role: 1 },
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'surname'] }],
        },
        {
          model: ChatMessage,
          as: 'messages',
          separate: true,
          order: [['createdAt', 'DESC']],
          limit: 1,
        },
      ],
      order: [['updatedAt', 'DESC']],
    })
    res.json({ data: rooms })
  } catch (e) { next(e) }
})

// GET /admin/support/rooms/:id/messages
router.get('/rooms/:id/messages', async (req, res, next) => {
  try {
    const roomId = parseInt(req.params.id)
    const room = await ChatRoom.findOne({ where: { id: roomId, type: 1 } })
    if (!room) return res.status(404).json({ message: 'Room not found' })

    const { page = 1, limit = 80 } = req.query
    const { count, rows } = await ChatMessage.findAndCountAll({
      where: { chatroom_id: roomId },
      include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'surname'] }],
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    })
    res.json({ data: rows, total: count })
  } catch (e) { next(e) }
})

// POST /admin/support/rooms/:id/messages — admin reply
router.post('/rooms/:id/messages', async (req, res, next) => {
  try {
    const roomId = parseInt(req.params.id)
    const { text } = req.body
    if (!text?.trim()) return res.status(400).json({ message: 'text required' })

    const room = await ChatRoom.findOne({ where: { id: roomId, type: 1 } })
    if (!room) return res.status(404).json({ message: 'Room not found' })

    // Add admin as participant if not already
    await ChatRoomParticipant.findOrCreate({
      where: { chatroom_id: roomId, user_id: req.user.id },
      defaults: { role: 2 },
    })

    const msg = await ChatMessage.create({ chatroom_id: roomId, text: text.trim(), createdBy: req.user.id })
    const full = await ChatMessage.findByPk(msg.id, {
      include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'surname'] }],
    })

    await room.update({ updatedAt: new Date() })

    // Notify all participants
    const others = await ChatRoomParticipant.findAll({ where: { chatroom_id: roomId, user_id: { [Op.ne]: req.user.id } } })
    const io = req.app.io
    if (io) others.forEach((p) => io.to(String(p.user_id)).emit('support-message', { ...full.toJSON(), room_id: roomId }))

    res.status(201).json({ data: full })
  } catch (e) { next(e) }
})

module.exports = router
