const yup = require("yup");

const shopSchema = yup.object().shape({
    type_id: yup.number().integer().required('Dükan görnüşini saýlaň'),
    name: yup.string().required("Nobat adyny giriziň").max(500),
    name_ru: yup.string().optional().nullable().max(500),
    name_eng: yup.string().optional().nullable().max(500),
    description: yup.string().optional().nullable(),
    description_tm: yup.string().optional().nullable(),
    description_ru: yup.string().optional().nullable(),
    description_en: yup.string().optional().nullable(),
    location: yup.string().optional().nullable(),
    coordinates: yup.object({ lat: yup.number(), lng: yup.number() }).nullable().optional(),
    categories: yup.array().of(yup.number().integer()).nullable().optional(),
    logo: yup.string().optional().nullable(),
    address: yup.string().optional().nullable(),
    phone: yup.string().optional().nullable().max(20),
    email: yup.string().email().optional().nullable().max(100),
    is_active: yup.boolean().optional(),
    order: yup.number().integer().max(1000).nullable(true).optional(),
    createdBy: yup.string().nullable(true).optional(),
});

module.exports = shopSchema;
