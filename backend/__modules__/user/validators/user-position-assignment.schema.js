const yup = require("yup");
const { POSITION_ASSIGNMENT_TYPES_ENUM } = require("../utils/position_assignments");

const userPositionAssignmentSchema = yup.object().shape({
    user_id: yup
        .string()
        .required("Ulanyjy ID-si girizilmeli")
        .max(100, "Ulanyjy ID-si 100 harpdan uzyn bolmaly däl"),
    position_id: yup
        .number()
        .integer("Wezipäniň ID-si bitin san bolmaly")
        .required("Wezipäniň ID-si girizilmeli"),
    assignment_type: yup
        .string()
        .oneOf(POSITION_ASSIGNMENT_TYPES_ENUM, "Bellenen görnüşi nädogry")
        .optional(),
    replaced_assignment_id: yup
        .number()
        .integer("Çalşyrylan belligiň ID-si bitin san bolmaly")
        .nullable(true)
        .optional(),
    started_at: yup
        .date()
        .typeError("Başlaýan wagty dogry formatda bolmaly")
        .required("Başlaýan wagty girizilmeli"),
    ended_at: yup
        .date()
        .typeError("Gutarýan wagty dogry formatda bolmaly")
        .nullable(true)
        .optional(),
    is_active: yup
        .boolean()
        .typeError("Aktiwlik görnüşi nädogry")
        .optional()
});

module.exports = userPositionAssignmentSchema;