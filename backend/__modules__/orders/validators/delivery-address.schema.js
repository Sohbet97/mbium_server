const yup = require("yup");

const deliveryAddressSchema = yup.object().shape({
    user_id: yup.string().uuid().required("Ulanyjy saýlaň"),
    label: yup.string().max(50).nullable().optional(),
    region_id: yup.number().integer().nullable().optional(),
    city_id: yup.number().integer().nullable().optional(),
    district_id: yup.number().integer().nullable().optional(),
    street: yup.string().max(255).nullable().optional(),
    apartment: yup.string().max(100).nullable().optional(),
    postal_code: yup.string().max(20).nullable().optional(),
    is_default: yup.boolean().optional(),
});

module.exports = { deliveryAddressSchema };
