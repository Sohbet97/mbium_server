// One-off: fill categories.thumbnail for existing rows that have an image.
// Run after migration 080:  node utils/backfill-category-thumbnails.js
require('dotenv').config()
const { Op } = require('sequelize')
const db = require('../models')
const CategoryService = require('../__modules__/catalog/services/categories')

async function main() {
    const rows = await db.Category.findAll({
        where: { image: { [Op.ne]: null }, thumbnail: null },
        attributes: ['id', 'image'],
        paranoid: false,
    })

    let done = 0
    let skipped = 0
    for (const row of rows) {
        const thumbnail = await CategoryService.buildThumbnail(row.image)
        if (!thumbnail) { skipped++; continue }
        await db.Category.update({ thumbnail }, { where: { id: row.id }, paranoid: false })
        done++
    }

    console.log(`[backfill] categories with image: ${rows.length}, updated: ${done}, skipped: ${skipped}`)
    await db.sequelize.close()
}

main().catch((e) => { console.error(e); process.exit(1) })
