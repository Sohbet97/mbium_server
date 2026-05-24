const router = require('express').Router()
const { ChatRoom, ChatMessage, ChatRoomParticipant, User } = require('../../models')
const { Op } = require('sequelize')

// GET /admin/support/rooms — list all seller support rooms (with optional ?search=)
router.get('/rooms', async (req, res, next) => {
  try {
    const { search } = req.query

    // If search text provided, first find matching user IDs
    let userIdFilter = null
    if (search?.trim()) {
      const term = `%${search.trim()}%`
      const matched = await User.findAll({
        where: {
          [Op.or]: [
            { name:         { [Op.iLike]: term } },
            { surname:      { [Op.iLike]: term } },
            { phone_number: { [Op.iLike]: term } },
          ],
        },
        attributes: ['id'],
      })
      userIdFilter = matched.map((u) => u.id)
      if (!userIdFilter.length) return res.json({ data: [] })
    }

    const participantWhere = { role: 1, ...(userIdFilter ? { user_id: { [Op.in]: userIdFilter } } : {}) }

    const rooms = await ChatRoom.findAll({
      where: { type: 1 },
      include: [
        {
          model: ChatRoomParticipant,
          as: 'participants',
          where: participantWhere,
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'surname', 'phone_number'] }],
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

// POST /admin/support/rooms/start — find or create a room with a given user
router.post('/rooms/start', async (req, res, next) => {
  try {
    const { user_id } = req.body
    if (!user_id) return res.status(400).json({ message: 'user_id required' })

    const target = await User.findByPk(user_id, { attributes: ['id', 'name', 'surname', 'phone_number'] })
    if (!target) return res.status(404).json({ message: 'User not found' })

    // Find existing room where this user is a participant (role=1, type=1)
    const existing = await ChatRoomParticipant.findOne({
      where: { user_id, role: 1 },
      include: [{ model: ChatRoom, as: 'room', where: { type: 1 }, required: true }],
    })

    if (existing) {
      const room = await ChatRoom.findOne({
        where: { id: existing.chatroom_id },
        include: [{
          model: ChatRoomParticipant,
          as: 'participants',
          where: { role: 1 },
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'surname', 'phone_number'] }],
        }],
      })
      return res.json({ data: room })
    }

    // Create a new room
    const room = await ChatRoom.create({ type: 1 })
    await ChatRoomParticipant.create({ chatroom_id: room.id, user_id, role: 1 })

    const full = await ChatRoom.findOne({
      where: { id: room.id },
      include: [{
        model: ChatRoomParticipant,
        as: 'participants',
        where: { role: 1 },
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'surname', 'phone_number'] }],
      }],
    })
    res.status(201).json({ data: full })
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
