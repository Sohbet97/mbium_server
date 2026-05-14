const yup = require("yup");

const productSchema = yup.object().shape({
    shop_id: yup.number().integer().required("Dükan saýlaň"),
    category_id: yup.number().integer().required("Kategoriýa saýlaň"),
    name: yup.string().required("Haryt adyny giriziň").max(500),
    name_ru: yup.string().nullable().optional().max(500),
    name_eng: yup.string().nullable().optional().max(500),
    description: yup.string().nullable().optional(),
    price: yup.number().required("Bahany giriziň").min(0),
    currency: yup.string().optional().max(10),
    sku: yup.string().nullable().optional().max(100),
    stock: yup.number().integer().optional().min(0),
    status: yup.number().integer().optional(),
    is_active: yup.boolean().optional(),
});

module.exports = productSchema;
