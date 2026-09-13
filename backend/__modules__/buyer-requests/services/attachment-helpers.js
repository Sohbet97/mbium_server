const ApiError = require('../../../exceptions/api-error')
const { ATTACHMENT_FILE_TYPES } = require('../models/BuyerRequestAttachment.model')

const MIME_FILE_TYPE_MAP = [
    [/^image\//, ATTACHMENT_FILE_TYPES.IMAGE],
    [/^video\//, ATTACHMENT_FILE_TYPES.VIDEO],
    [/^application\/pdf$/, ATTACHMENT_FILE_TYPES.PDF],
    [/^application\/(vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml)/, ATTACHMENT_FILE_TYPES.EXCEL],
    [/^application\/(msword|vnd\.openxmlformats-officedocument\.wordprocessingml)/, ATTACHMENT_FILE_TYPES.WORD],
]

const EXT_FILE_TYPE_MAP = {
    jpg: ATTACHMENT_FILE_TYPES.IMAGE, jpeg: ATTACHMENT_FILE_TYPES.IMAGE, png: ATTACHMENT_FILE_TYPES.IMAGE, webp: ATTACHMENT_FILE_TYPES.IMAGE, gif: ATTACHMENT_FILE_TYPES.IMAGE,
    mp4: ATTACHMENT_FILE_TYPES.VIDEO, mov: ATTACHMENT_FILE_TYPES.VIDEO, webm: ATTACHMENT_FILE_TYPES.VIDEO,
    pdf: ATTACHMENT_FILE_TYPES.PDF,
    xls: ATTACHMENT_FILE_TYPES.EXCEL, xlsx: ATTACHMENT_FILE_TYPES.EXCEL,
    doc: ATTACHMENT_FILE_TYPES.WORD, docx: ATTACHMENT_FILE_TYPES.WORD,
}

function inferFileType(mimeType, url) {
    if (mimeType) {
        const hit = MIME_FILE_TYPE_MAP.find(([re]) => re.test(mimeType))
        if (hit) return hit[1]
    }
    const ext = String(url || '').split('.').pop().toLowerCase()
    return EXT_FILE_TYPE_MAP[ext] || null
}

/**
 * Validates and normalizes a client-supplied `attachments` array (files already uploaded
 * elsewhere, e.g. POST /seller/media/upload) into rows ready for bulkCreate.
 */
function normalizeAttachments(attachments, fkName, fkValue) {
    if (!Array.isArray(attachments) || !attachments.length) return []
    return attachments.map((a) => {
        if (!a || !a.url) throw ApiError.BadRequest('Attachment üçin url hökman')
        const file_type = a.file_type || inferFileType(a.mime_type, a.url)
        if (!file_type || !Object.values(ATTACHMENT_FILE_TYPES).includes(file_type)) {
            throw ApiError.BadRequest('Attachment file_type kesgitläp bolmady')
        }
        return {
            [fkName]: fkValue,
            url: a.url,
            file_type,
            mime_type: a.mime_type || null,
            original_name: a.original_name || null,
            size: a.size || null,
        }
    })
}

module.exports = { inferFileType, normalizeAttachments, ATTACHMENT_FILE_TYPES }
