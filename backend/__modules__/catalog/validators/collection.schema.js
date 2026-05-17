const yup = require("yup");

const collectionSchema = yup.object().shape({
    name:            yup.string().required("Kolleksiýa adyny giriziň").max(500),
    name_ru:         yup.string().nullable().optional().max(500),
    name_eng:        yup.string().nullable().optional().max(500),
    description:     yup.string().nullable().optional(),
    image_url:       yup.string().nullable().optional().max(1000),
    handle:          yup.string().nullable().optional().max(255),
    seo_title:       yup.string().nullable().optional().max(255),
    seo_description: yup.string().nullable().optional(),
    sort_order:      yup.number().integer().optional().min(0),
    is_active:       yup.boolean().optional(),
});

module.exports = collectionSchema;
