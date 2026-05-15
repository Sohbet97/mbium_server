const yup = require("yup");

const ROLES = ["OWNER", "DIRECTOR", "MANAGER", "MODERATOR", "STAFF"];

const shopMemberSchema = yup.object().shape({
    shop_id: yup
        .number()
        .integer("Dükan ID bitin san bolmaly")
        .required("Dükan saýlaň"),
    user_id: yup
        .string()
        .uuid("Ulanyjy ID nädogry format")
        .required("Ulanyjy saýlaň"),
    role: yup
        .string()
        .oneOf(ROLES, `Rol OWNER, DIRECTOR, MANAGER, MODERATOR ýa-da STAFF bolmaly`)
        .required("Roly saýlaň"),
    is_active: yup
        .boolean()
        .typeError("Aktiwlik görnüşi nädogry")
        .optional(),
});

module.exports = shopMemberSchema;
