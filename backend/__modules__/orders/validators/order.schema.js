const yup = require("yup");

const orderSchema = yup.object().shape({
    shop_id: yup.number().integer().required("Dükan saýlaň"),
    delivery_address: yup.string().nullable().optional(),
    delivery_address_id: yup.number().integer().nullable().optional(),
    note: yup.string().nullable().optional(),
    items: yup
        .array()
        .of(
            yup.object().shape({
                product_id: yup.number().integer().required("Haryt saýlaň"),
                variant_id: yup.number().integer().nullable().optional(),
                quantity: yup.number().integer().required("Mukdary giriziň").min(1),
            })
        )
        .min(1, "Azyndan bir haryt saýlaň")
        .required(),
});

const cartItemSchema = yup.object().shape({
    product_id: yup.number().integer().required("Haryt saýlaň"),
    variant_id: yup.number().integer().nullable().optional(),
    quantity: yup.number().integer().required("Mukdary giriziň").min(1),
});

const SHIPMENT_STATUSES = ["PENDING", "IN_TRANSIT", "DELIVERED", "RETURNED"];

const shipmentSchema = yup.object().shape({
    carrier: yup.string().max(100).nullable().optional(),
    tracking_number: yup.string().max(100).nullable().optional(),
    status: yup
        .string()
        .oneOf(SHIPMENT_STATUSES, "Status nädogry")
        .optional(),
    shipped_at: yup.date().nullable().optional(),
    delivered_at: yup.date().nullable().optional(),
    notes: yup.string().nullable().optional(),
});

module.exports = { orderSchema, cartItemSchema, shipmentSchema };
