//#region Start settings
const db = require("../../models");
const { Op, where } = require("sequelize");
const chatroomRouter = require("express").Router();
const Model = db.ChatRoom;
const { CONSTANTS } = require("../../config/constants");
const { FUNCTIONS } = require("../../utils/functions");
const dir = CONSTANTS.CHAT_PATH;
const thumbnailSize = CONSTANTS.CHAT_SIZE_LIMIT;
const multer = require('multer');
const fs = require('fs');
const path = require("path");
const move = require("../../utils/move");
const ApiError = require("../../exceptions/api-error");
//#endregion

//#region Routes
// Get
chatroomRouter.get("/", async (req, res) => {
    try {
        const filter = await getFilter(req.query);
        const { limit, sort, skip } = FUNCTIONS.getQueryParams(req)
        const count = await Model.count({ where: filter })
        const data = await Model.findAll({
            where: filter,
            offset: (skip < count ? skip : 0),
            order: [sort],
            limit: limit,
            include: [
                {
                    model: db.User,
                    as: 'creator',
                    attributes: [
                        'name',
                        'surname',
                        'second_name'
                    ]
                }
            ]
        });
        res.status(200).json({
            data: data,
            count: count
        });
    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: "Sorry it's our mistake!"
        });
    }
});
// Get users
chatroomRouter.get("/users", async (req, res) => {
    try {
        const filter = await getUsersFilter(req.query);
        const { limit, sort, skip } = FUNCTIONS.getQueryParams(req)
        const count = await db.User.count({ where: filter })
        const data = await db.User.findAll({
            where: filter,
            offset: (skip < count ? skip : 0),
            order: [sort],
            limit: limit > 0 ? limit : undefined,
            attributes: ['id', 'name', 'surname', 'second_name', 'region', 'village', 'department'],
            include: [
                {
                    model: db.Region,
                    as: '_region',
                    attributes: ['name']
                },
                {
                    model: db.Village,
                    as: '_village',
                    attributes: ['name']
                },
                {
                    model: db.Department,
                    as: '_department',
                    attributes: ['name']
                }
            ]
        });
        res.status(200).json({
            data: data,
            count: count
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Sorry it's our mistake!"
        });
    }
});

// Get
chatroomRouter.get("/messages", async (req, res) => {
    try {
        const { limit, sort, skip, page } = FUNCTIONS.getQueryParams(req)
        const filter = getMessagesFilter(req.query, req.user);
        const data = await db.ChatMessage.findAll({
            where: filter,
            limit,
            include: [
                {
                    model: db.User,
                    attributes: ['name', 'surname', 'second_name'],
                    as: 'creator'
                },
                {
                    model: db.ChatRoom,
                    as: '_chat'
                }
            ],
            order: [sort],
            offset: skip
        })
        const count = await db.ChatMessage.count({
            where: filter
        })
        if (data?.length) {
            Array.from(data).map((_message) => {
                if (!_message.read.includes(req.user?.id)) {
                    _message.update({
                        read: [..._message.read, req.user?.id]
                    });
                }
            })
        }
        res.status(200).json({
            data,
            count
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Sorry it's our mistake!"
        });
    }
});
// Get
chatroomRouter.get("/own", async (req, res) => {
    try {
        const data = await Model.findAll({
            where: {
                participants: { [Op.contains]: [req.user?.id] },
                status: { [Op.ne]: 99 }
            },
            include: [
                {
                    model: db.User,
                    attributes: ['name', 'surname', 'second_name'],
                    as: 'creator'
                }
            ],
            order: [['updatedAt', "DESC"]]
        });
        res.status(200).json({
            data: data
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Sorry it's our mistake!"
        });
    }
});
// Get
chatroomRouter.get("/:id", async (req, res) => {
    try {
        const model = await Model.findOne({
            where: {
                id: { [Op.eq]: req.params.id }
            },
            include: [
                {
                    model: db.User,
                    attributes: ['name', 'surname', 'second_name'],
                    as: 'creator'
                }
            ],
            order: [['updatedAt', "DESC"]]
        });
        res.status(200).json({
            model
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Sorry it's our mistake!"
        });
    }
});

// Get unread messages
chatroomRouter.get('/message/unread', async (req, res) => {
    try {
        const user = req.user;
        const data = await db.ChatMessage.findAll({
            where: {
                target: {
                    [Op.contains]: [user?.id]
                },
                status: {
                    [Op.eq]: 0
                },
                createdBy: {
                    [Op.ne]: req.user?.id
                },
                [Op.not]: {
                    read: { [Op.contains]: [user?.id] }
                }
            },
            attributes: ['chatroom', [db.sequelize.fn('COUNT', db.sequelize.col('chat_messages.id')), 'unread_count'], 'createdBy'],
            group: ['chatroom', 'createdBy', 'creator.id'],
            include: [
                {
                    model: db.User,
                    attributes: ['name', 'surname', 'second_name'],
                    as: 'creator'
                }
            ]
        });
        res.status(200).json({ data });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Sorry it's our mistake!"
        });
    }
})

// Get unread messages
chatroomRouter.get('/message/unread', async (req, res) => {
    try {
        const user = req.user;
        const data = await db.ChatMessage.findAll({
            where: {
                target: {
                    [Op.contains]: [user?.id]
                },
                status: {
                    [Op.eq]: 0
                },
                createdBy: {
                    [Op.ne]: req.user?.id
                },
                [Op.not]: {
                    read: { [Op.contains]: [user?.id] }
                }
            },
            attributes: ['chatroom', [db.sequelize.fn('COUNT', db.sequelize.col('chat_messages.id')), 'unread_count'], 'createdBy'],
            group: ['chatroom', 'createdBy', 'creator.id'],
            include: [
                {
                    model: db.User,
                    attributes: ['name', 'surname', 'second_name'],
                    as: 'creator'
                }
            ]
        });
        res.status(200).json({ data });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Sorry it's our mistake!"
        });
    }
})

// Get chatroom messages
chatroomRouter.get('/:chatroom/message', async (req, res) => {
    try {
        const user = req.user;
        // const chatroom = await Model.findOne({
        //     where:{
        //         id:{[Op.eq]:req.params.chatroom}
        //     }
        // });
        // if(!chatroom || !user) res.sendStatus(400);
        const data = await db.ChatMessage.findAll({
            where: {
                // target:{
                //     [Op.contains]:[user?.id]
                // },
                chatroom: { [Op.eq]: req.params.chatroom }
            },
            order: [FUNCTIONS.getSort('id')],
            include: [
                {
                    model: db.User,
                    attributes: ['name', 'surname', 'second_name'],
                    as: 'creator'
                }
            ]
        });
        if (data?.length) {
            Array.from(data).map((_message) => {
                if (!_message.read.includes(user?.id)) {
                    _message.update({
                        read: [..._message.read, user?.id]
                    });
                }
            })
        }
        res.status(200).json({ data });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Sorry it's our mistake!"
        });
    }
});

// Get one
chatroomRouter.get("/:id", async (req, res) => {
    try {
        const model = await Model.findOne({
            where: {
                id: req.params.id
            }
        })
        if (model && model != null) {
            res.json({
                model: model
            });
        } else {
            res.status(404).json({
                message: "The given data isn't valid!"
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Sorry it's our mistake!"
        });
    }
});

// Create 
chatroomRouter.post("/simple", async (req, res) => {
    try {
        const owner = req.user?.id;
        const receiver = req.body?.receiver;
        const receiverUser = await db.User.findOne({
            where: {
                id: receiver
            },
            attributes: ['id', 'name', 'surname']
        });
        if (!receiverUser || !owner) res.sendStatus(400);
        let model = await Model.findOne({
            where: {
                participants: { [Op.contains]: [owner, receiver] }
            }
        });
        if (!model) {
            model = await Model.create({
                // id: FUNCTIONS.createId(5),
                participants: [owner, receiver],
                name: `${(receiverUser?.name + '').substring(0, 1)}.${receiverUser?.surname}`,
                createdBy: owner
            });
        }
        res.status(200).json({
            chatroom: model?.id
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Sorry it's our mistake!"
        });
    }
});

chatroomRouter.post("/group", async (req, res) => {
    try {
        const owner = req.user?.id;
        const receivers = req.body?.receivers;
        const name = req.body?.name;
        if (!receivers || !owner) res.sendStatus(400);
        let model = await Model.findOne({
            where: {
                participants: { [Op.contains]: [owner, ...receivers] },
                type: 10
            }
        });
        if (!model) {
            model = await Model.create({
                // id: FUNCTIONS.createId(5),
                participants: [owner, ...receivers],
                name: name,
                type: 10
            });
        }
        res.status(200).json({
            chatroom: model?.id
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Sorry it's our mistake!"
        });
    }
});

chatroomRouter.post('/:chatroom/participant/:userId', async (req, res) => {
    try {
        const user = req.user;
        const chatroom = await Model.findOne({
            where: {
                id: req.params.chatroom,
                participants: { [Op.contains]: user?.id }
            }
        });
        const newUser = await db.User.findOne({
            where: {
                id: { [Op.eq]: req.params?.id }
            }
        });
        if (!chatroom || !newUser || !user) res.sendStatus(400);
        let participants = [...chatroom.participants];
        if (!participants.includes(req.params?.userId)) {
            participants.push(req.params.userId);
        }
        await chatroom.update({
            participants
        });
        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Sorry it's our mistake!"
        });
    }
});

chatroomRouter.post('/:chatroom/message', multer(getOptions()).single("file"), async (req, res, next) => {
    try {
        const user = req.user;
        const message = req.body?.message || '';
        const chatroom = await Model.findOne({
            where: {
                id: req.params.chatroom,
                participants: { [Op.contains]: [user?.id] }
            }
        });
        if (!chatroom || (!message && !req.body?.isVoice) || !user) throw ApiError.BadRequest()
        let model = await db.ChatMessage.create({
            text: String(message || '').trim(),
            isVoice: req.body?.isVoice,
            chatroom: chatroom?.id,
            target: [...chatroom?.participants],
            read: [user?.id],
            file: req.file?.filename || null,
            createdBy: user?.id
        });
        if (model && model?.file) {
            if (!fs.existsSync(`${dir}/${model?.id}`)) fs.mkdirSync(`${dir}/${model?.id}`, { recursive: true })
            move(`${dir}/${model?.file}`, `${dir}/${model?.id}/${model?.file}`, () => { })
        } else if (req.file) {
            fs.unlink(`${dir}/${req.file?.filename}`)
        }
        model = model.get({ plain: true })
        model.user = {
            id: user?.id,
            name: user?.user?.name,
            surname: user?.user?.surname,
            second_name: user?.user?.second_name,
            thumbnail: user?.user?.thumbnail,
        }
        const onlineUsers = req?.app?.onlineUsers;
        const io = req?.app?.io
        if (io && onlineUsers) {
            // const receivers = [...chatroom?.participants]
            const receivers = [...chatroom?.participants].filter((_) => _ != user?.id)
            if (receivers && receivers.length) {
                receivers.map((userId) => {
                    const targetSocketId = onlineUsers[userId]
                    if (targetSocketId) {
                        io.to(targetSocketId).emit('new-message', model)
                    }
                })
            }
        }
        res.status(200).send({
            model
        });
    } catch (e) {
        next(e)
    }
});

chatroomRouter.delete('/:chatroom/participant/:userId', async (req, res) => {
    try {
        const user = req.user;
        const chatroom = await Model.findOne({
            where: {
                id: req.params.chatroom,
                participants: { [Op.contains]: user?.id }
            }
        });
        if (!chatroom || !user) res.sendStatus(400);
        const participants = [...chatroom.participants].filter(_ => _ != req.params?.userId);

        await chatroom.update({
            participants
        });
        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Sorry it's our mistake!"
        });
    }
});

// Delete
chatroomRouter.delete("/:id", async (req, res) => {
    try {
        Model.destroy({ where: { id: req.params.id } });
        res.json({
            message: "Model deleted successfully!"
        })
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "It's occured some errors!"
        })
    }
});
// Delete message
chatroomRouter.delete("/messages/:id", async (req, res) => {
    try {
        const model = await db.ChatMessage.findOne({ where: { id: req.params.id } })
        if (model) {
            const file = model?.file
            if (file && fs.existsSync(`${dir}/${model?.id}/${file}`)) fs.rmdirSync(`${dir}/${model?.id}`, { recursive: true })
            await model.destroy()
        }
        res.json({
            message: "Model deleted successfully!"
        })
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "It's occured some errors!"
        })
    }
});
// Multi delete
chatroomRouter.post("/delete", async (req, res) => {
    try {
        Model.destroy({
            where: {
                id: req.body?.ids
            }
        })
        res.status(200).json({
            message: "Models has been deleted successfully!"
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "It's occured some errors!"
        })
    }
});
//#endregion

//#region  Utils
// get filter json
async function getFilter(params) {
    const filter = {};
    if (params) {
        if (params.text) {
            filter.name = { [Op.iLike]: `%${params.text}%` };
        }
        if (params.short_name) {
            filter.short_name = { [Op.like]: `%${params.short_name}%` };
        }
    }
    return filter;
}

async function getUsersFilter(params) {
    const filter = {};
    if (params) {
        if (params.text) {
            filter[Op.or] = [
                { name: { [Op.iLike]: `%${params.text}%` } },
                { surname: { [Op.iLike]: `%${params.text}%` } },
                { second_name: { [Op.iLike]: `%${params.text}%` } },
            ]
        }
    }
    return filter;
}

function getMessagesFilter(params, user) {
    const filter = {};
    if (params) {
        filter.target = { [Op.contains]: [user?.id] };
        if (params.chatroom) filter.chatroom = { [Op.eq]: params.chatroom };
        if (params.notRead) filter[Op.not] = { read: { [Op.contains]: [user?.id] } }
        if (params.lastId) filter.id = { [Op.gt]: params.lastId };
        if (params.firstId) filter.id = { [Op.lt]: params.firstId };
        if (params.endId) filter.id = { [Op.gt]: params.lastId };
        if (params.notOwn) filter.createdBy = { [Op.ne]: user?.id };
    }

    return filter;
}
// Create disk storage for multer
function getDiskStorage() {
    return multer.diskStorage({
        destination: function (req, file, cb) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, {
                    recursive: true
                });
            }
            cb(null, dir)
        },
        filename: async function (req, file, cb) {
            // console.log(file);

            file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8')
            const arr = String(file?.originalname).split('.')
            const extension = arr[arr.length - 1]
            cb(null, `${(new Date()).getTime()}.${extension}`)
        }
    });
}

// Create multer upload options
function getOptions() {
    return {
        storage: getDiskStorage(),
        fileFilter: function (req, file, cb) {
            // if(!['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/pdf', 'image/png', 'image/jpg', 'image/jpeg', 'image/gif'].includes(file.mimetype)){
            //     cb(new Error("You can upload only pdf and word files!"), false);
            // }else 
            if (file.size > thumbnailSize * 1024 * 1024) {
                cb(new Error("Maximum size of file must be less than " + thumbnailSize + "MB!"), false);
            }
            else {
                cb(null, true)
            }
        },
        limits: {
            fileSize: thumbnailSize * 1024 * 1024,
            files: 20
        }
    }
}
//#endregion

module.exports = chatroomRouter;