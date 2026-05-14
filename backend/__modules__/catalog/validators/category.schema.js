const yup = require("yup");

const categorySchema = yup.object().shape({
    name: yup.string().required("Kategoriýa adyny giriziň").max(255),
    name_ru: yup.string().nullable().optional().max(255),
    name_eng: yup.string().nullable().optional().max(255),
    slug: yup.string().required("Slug talap edilýär").max(255),
    parent_id: yup.number().integer().nullable().optional(),
    icon: yup.string().nullable().optional(),
    order: yup.number().integer().nullable().optional(),
    status: yup.number().integer().optional(),
});

module.exports = categorySchema;
