const yup = require("yup");

const flashSaleSchema = yup.object().shape({
    shop_id: yup.number().integer().nullable().optional(),
    product_id: yup.number().integer().required("Haryt saýlaň"),
    variant_id: yup.number().integer().nullable().optional(),
    sale_price: yup
        .number()
        .positive("Arzanladylan baha 0-dan uly bolmaly")
        .required("Arzanladylan bahany giriziň"),
    original_price: yup
        .number()
        .positive("Asyl baha 0-dan uly bolmaly")
        .required("Asyl bahany giriziň"),
    quantity_limit: yup.number().integer().positive().nullable().optional(),
    starts_at: yup.date().nullable().optional(),
    ends_at: yup.date().nullable().optional(),
    is_active: yup.boolean().optional(),
});

module.exports = { flashSaleSchema };
