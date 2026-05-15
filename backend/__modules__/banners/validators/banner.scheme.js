const yup = require("yup");

const PLACEMENTS = ["HOME", "SHOP", "CATEGORY"];

const bannerSchema = yup.object().shape({
    title: yup
        .string()
        .required("Banner adyny giriziň")
        .max(255, "255 harpdan uzyn bolmaly däl"),
    shop_id: yup
        .number()
        .integer("Dükan ID bitin san bolmaly")
        .nullable(true)
        .optional(),
    image_url: yup
        .string()
        .nullable(true)
        .optional(),
    link_url: yup
        .string()
        .nullable(true)
        .optional(),
    placement: yup
        .string()
        .oneOf(PLACEMENTS, `Ýerleşim HOME, SHOP ýa-da CATEGORY bolmaly`)
        .required("Ýerleşimi saýlaň"),
    order: yup
        .number()
        .integer("Tertip belgisi bitin san bolmaly")
        .min(0)
        .max(1000, "Tertip belgisi 1000-den uly bolmaly däl")
        .nullable(true)
        .optional(),
    starts_at: yup
        .date()
        .nullable(true)
        .optional(),
    ends_at: yup
        .date()
        .nullable(true)
        .optional(),
    is_active: yup
        .boolean()
        .typeError("Aktiwlik görnüşi nädogry")
        .optional(),
});

module.exports = bannerSchema;
