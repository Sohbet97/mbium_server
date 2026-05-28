const yup = require("yup");

const warehouseSchema = yup.object({
    shop_id: yup.number().integer().required(),
    name: yup.string().trim().required().max(255),
    address: yup.string().nullable().optional(),
    city: yup.string().nullable().optional().max(100),
    contact_phone: yup.string().nullable().optional().max(20),
    is_active: yup.boolean().optional(),
    is_default: yup.boolean().optional(),
});

const warehouseUpdateSchema = yup.object({
    name: yup.string().trim().optional().max(255),
    address: yup.string().nullable().optional(),
    city: yup.string().nullable().optional().max(100),
    contact_phone: yup.string().nullable().optional().max(20),
    is_active: yup.boolean().optional(),
    is_default: yup.boolean().optional(),
});

module.exports = { warehouseSchema, warehouseUpdateSchema };
