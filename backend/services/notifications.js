const fs = require('fs')
const { FUNCTIONS } = require("../utils/functions")
const { CONSTANTS } = require("../config/constants")
const db = require("../models");
const { type } = require('os');
const { where, Op } = require('sequelize');
const STATUSES = require('../utils/statuses');

class NotificationService {
    static async get(filter = {}, limit = undefined, sort = undefined, skip = 0) {
        const data = await db.Notification.findAll({
            where: filter,
            offset: skip,
            order: [sort],
            limit: limit
        });
        return data;
    }

    static async getOne(filter = {}) {
        const model = await db.Notification.findOne({
            where: filter
        });
        return model;
    }

    static async getCount(filter = {}) {
        const count = await db.Notification.count({
            where: filter
        });
        return count;
    }

    static async getById(id) {
        const model = await db.Notification.findOne({
            where: {
                id: id
            }
        });
        return model;
    }

    static async create(req) {
        const model = await db.Notification.create({
            name: req.body?.name,
            order: req.body?.order,
            createdBy: req.user?.id
        });
        return model;
    }

    static async delete(id) {
        db.Notification.destroy({ where: { id } });
    }

    static async createFromVisit(visit) {
        const model = await db.Notification.create({
            type: STATUSES.NOT_VISIT,
            target_id: visit?.id,
            user: visit?.doctor
        })
        return model
    }

    static async createFromAnalysePlan(analysePlan, transaction = null) {
        const model = await db.AnalysePlan.findOne({
            where: {
                id: { [Op.eq]: analysePlan?.id }
            },
            attributes: ['id', 'createdAt'],
            include: [
                {
                    model: db.Patient,
                    as: '_patient',
                    attributes: ['id', 'name', 'surname', 'second_name', 'gender']
                },
                {
                    model: db.Analyse,
                    as: 'analyses',
                    attributes: ['id', 'status'],
                    include: [
                        {
                            model: db.AnalyseType,
                            as: '_type',
                            attributes: ['name', 'department', 'doctor']
                        }
                    ]
                },
                {
                    model: db.RdAnalyse,
                    as: 'rd_analyses',
                    attributes: ['id', 'status'],
                    include: [
                        {
                            model: db.RdType,
                            as: '_type',
                            attributes: ['name', 'department', 'doctor']
                        }
                    ]
                },
                {
                    model: db.SpAnalyse,
                    as: 'sp_analyses',
                    attributes: ['id', 'status'],
                    include: [
                        {
                            model: db.SpType,
                            as: '_type',
                            attributes: ['name', 'department', 'doctor']
                        }
                    ]
                }
            ],
            transaction
        })
        const bulk = []
        const users = {}
        if (model?.analyses && model?.analyses?.length) {
            Array.from(model?.analyses).map((analyse) => {
                const doctor = analyse?._type?.doctor
                bulk.push({
                    type: STATUSES.NOT_LAB,
                    target_id: analyse?.id,
                    user: doctor
                })
                if (!users[analyse?._type?.doctor]) users[doctor] = { lab: [], rad: [], spec: [] }
                users[doctor]['lab'] = [...users[doctor]['lab'], analyse]
            })
        }
        if (model?.rd_analyses && model?.rd_analyses?.length) {
            Array.from(model?.rd_analyses).map((analyse) => {
                const doctor = analyse?._type?.doctor
                bulk.push({
                    type: STATUSES.NOT_RAD,
                    target_id: analyse?.id,
                    user: doctor
                })
                if (!users[doctor]) users[doctor] = { lab: [], rad: [], spec: [] }
                users[doctor]['rad'] = [...users[doctor]['rad'], analyse]
            })
        }
        if (model?.sp_analyses && model?.sp_analyses?.length) {
            Array.from(model?.sp_analyses).map((analyse) => {
                const doctor = analyse?._type?.doctor
                bulk.push({
                    type: STATUSES.NOT_SPEC,
                    target_id: analyse?.id,
                    user: doctor
                })
                if (!users[doctor]) users[doctor] = { lab: [], rad: [], spec: [] }
                users[doctor]['spec'] = [...users[doctor]['spec'], analyse]
            })
        }

        const nots = await db.Notification.bulkCreate(bulk, { transaction })
        return { nots, users }
    }

    static async createFromPayment(payment, transaction = null) {
        // TODO: role_type is deprecated and removed from User table. So rewrite this method
        // const users = await db.User.findAll({
        //     where: {
        //         role_type: { [Op.eq]: STATUSES.USER_CASHIER }
        //     },
        //     attributes: ['id']
        // });
        // const bulk = [];
        // users.map((user) => {
        //     bulk.push({
        //         type: STATUSES.NOT_PAYMENT,
        //         target_id: payment?.id,
        //         user: user?.id
        //     })
        // })
        // const nots = await db.Notification.bulkCreate(bulk, { transaction });
        // return bulk;
        return [];
    }

    static async deleteDaily() {
        // TODO: Implement daily delete logic
    }
}

module.exports = NotificationService