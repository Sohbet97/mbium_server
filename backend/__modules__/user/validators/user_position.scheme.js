import * as yup from 'yup';

const positionSchema = yup.object().shape({
    name: yup
        .string()
        .required("Wezipäniň adyny giriziň")
        .max(100, "Wezipäniň ady 100 harpdan uzyn bolmaly däl"),
    
    department: yup
        .number()
        .transform((value, originalValue) => (originalValue === "" ? null : value))
        .integer("Bölüm ID bitin san bolmaly")
        .nullable(true)
        .optional(),
    
    role_id: yup
        .number()
        .transform((value, originalValue) => (originalValue === "" ? null : value))
        .integer("Rol ID bitin san bolmaly")
        .nullable(true)
        .optional(),
    
    seats: yup
        .number()
        .transform((value, originalValue) => (originalValue === "" ? 1 : value))
        .integer("Orun sany bitin san bolmaly")
        .min(0, "Orun sany 0-dan kiçi bolmaly däl")
        .optional(),
    
    room: yup
        .string()
        .max(100, "Otajyk belgisi 100 harpdan uzyn bolmaly däl")
        .nullable(true)
        .optional(),
    
    type: yup
        .number()
        .transform((value, originalValue) => (originalValue === "" ? null : value))
        .integer("Görnüşi bitin san bolmaly")
        .nullable(true)
        .optional(),
    
    order: yup
        .number()
        .transform((value, originalValue) => (originalValue === "" ? null : value))
        .integer("Tertip belgisi bitin san bolmaly")
        .nullable(true)
        .optional(),
    
    status: yup
        .number()
        .transform((value, originalValue) => (originalValue === "" ? null : value))
        .integer("Status bitin san bolmaly")
        .optional()
});

export default positionSchema;