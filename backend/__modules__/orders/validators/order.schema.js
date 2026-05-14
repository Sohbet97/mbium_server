const yup = require("yup");

const orderSchema = yup.object().shape({
    shop_id: yup.number().integer().required("Dükan saýlaň"),
    delivery_address: yup.string().nullable().optional(),
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

module.exports = { orderSchema, cartItemSchema };
