const { CONSTANTS } = require("../config/constants");
const db = require("../models")
const { FUNCTIONS } = require("../utils/functions")
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { Op } = require("sequelize");
const PATH = path.join(__dirname, '../public/dumps/')

class SystemDumpService {
    static async get(filter = {}, limit = undefined, sort = FUNCTIONS.getSort('createdAt'), skip = 0) {
        const data = await db.SystemDump.findAll({
            where: filter,
            offset: skip,
            order: [sort],
            limit: limit
        })
        return data
    }

    static async getCount(filter = {}) {
        const count = await db.SystemDump.count({
            where: filter
        })
        return count
    }

    static async getById(id) {
        const model = await db.SystemDump.findOne({
            where: { id }
        })
        return model
    }

    static async create() {
        if (!fs.existsSync(PATH)) fs.mkdirSync(PATH, { recursive: true });

        const filename = `${CONSTANTS.DUMP_PREFIX}_dump_${Date.now()}.sql.gz.enc`;
        const dumpFilePath = path.join(PATH, filename);
        const dumpCommand = `PGPASSWORD='${process.env.DB_PASSWORD}' pg_dump -U ${process.env.DB_USERNAME} -h ${process.env.DB_HOST} -p ${process.env.DB_PORT} ${process.env.DB_NAME} | gzip | openssl enc -aes-256-cbc -salt -pbkdf2 -iter 10000 -pass pass:${process.env.DUMP_ENCRYPT_PASSWORD} -out ${dumpFilePath}`;

        exec(dumpCommand, async (error, stdout, stderr) => {
            if (error) {
                console.error(`Error creating dump: ${error.message}`);
                return;
            } else if (stderr) {
                console.error(`Standard error: ${stderr}`);
                return;
            }

            fs.stat(dumpFilePath, async (err, stats) => {
                if (err) {
                    console.error(`Error getting file size: ${err.message}`);
                    return;
                }

                const filesize = stats.size;
                await db.SystemDump.create({ filename, filesize });

                await SystemDumpService.deleteOldDumps();
            });
        });
    }

    static async deleteOldDumps() {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - CONSTANTS.DUMP_RETENTION_DAYS);

        const oldDumps = await db.SystemDump.findAll({
            where: {
                createdAt: { [Op.lt]: cutoffDate }
            }
        });

        for (const dump of oldDumps) {
            const filePath = path.join(PATH, dump.filename);
            if (fs.existsSync(filePath)) {
                fs.unlink(filePath, (err) => {
                    if (err) console.error(`Error deleting file ${dump.filename}: ${err.message}`);
                });
            }

            await dump.destroy();
        }
    }

    static async delete(id) {
        await db.SystemDump.destroy({ where: { id } })
    }
}

module.exports = SystemDumpService