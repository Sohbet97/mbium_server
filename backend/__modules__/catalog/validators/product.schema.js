const yup = require("yup");

const productSchema = yup.object().shape({
    shop_id:          yup.number().integer().required("Dükan saýlaň"),
    category_id:      yup.number().integer().required("Kategoriýa saýlaň"),
    name:             yup.string().required("Haryt adyny giriziň").max(500),
    name_ru:          yup.string().nullable().optional().max(500),
    name_eng:         yup.string().nullable().optional().max(500),
    description:      yup.string().nullable().optional(),
    price:            yup.number().required("Bahany giriziň").min(0),
    compare_at_price: yup.number().nullable().optional().min(0),
    currency:         yup.string().optional().max(10),
    sku:              yup.string().nullable().optional().max(100),
    barcode:          yup.string().nullable().optional().max(100),
    weight:           yup.number().integer().nullable().optional().min(0),
    stock:            yup.number().integer().optional().min(0),
    tags:             yup.array().of(yup.string()).nullable().optional(),
    handle:           yup.string().nullable().optional().max(255),
    seo_title:        yup.string().nullable().optional().max(255),
    seo_description:  yup.string().nullable().optional(),
    status:           yup.number().integer().optional(),
    is_active:        yup.boolean().optional(),
});

module.exports = productSchema;
