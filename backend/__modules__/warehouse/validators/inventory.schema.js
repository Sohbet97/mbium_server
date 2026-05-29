const yup = require("yup");

const TYPES = ["INBOUND", "OUTBOUND", "ADJUSTMENT", "RETURN"];

const upsertLevelSchema = yup.object({
    warehouse_id: yup.number().integer().required(),
    product_id: yup.number().integer().required(),
    variant_id: yup.number().integer().nullable().optional(),
    quantity: yup.number().integer().required().min(0),
});

const adjustStockSchema = yup.object({
    warehouse_id: yup.number().integer().required(),
    product_id: yup.number().integer().required(),
    variant_id: yup.number().integer().nullable().optional(),
    quantity: yup.number().integer().required().min(1),
    type: yup.string().oneOf(TYPES).required(),
    note: yup.string().nullable().optional(),
});

module.exports = { upsertLevelSchema, adjustStockSchema };
