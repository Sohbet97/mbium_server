const yup = require("yup");

const shopTypeSchema = yup.object().shape({
    name: yup
        .string()
        .required("Nobat adyny giriziň")
        .max(500, "500 harpdan uzyn bolmaly däl"),
    name_ru: yup
        .string()
        .optional()
        .nullable()
        .max(500, "500 harpdan uzyn bolmaly däl"),
    name_eng: yup
        .string()
        .optional()
        .nullable()
        .max(500, "500 harpdan uzyn bolmaly däl"),
    is_active: yup
        .boolean()
        .typeError("Aktiwlik görnüşi nädogry")
        .optional(),
    order: yup
        .number()
        .integer("Tertip belgisi bitin san bolmaly")
        .max(1000, "Tertip belgisi 1000-den uly bolmaly däl")
        .nullable(true)
        .optional(),
    createdBy: yup
        .string()
        .nullable(true)
        .optional()
});

module.exports = shopTypeSchema;