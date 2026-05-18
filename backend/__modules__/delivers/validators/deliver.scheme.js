const yup = require("yup");

const deliverSchema = yup.object().shape({
    first_name: yup.string().required("Ady giriziň").max(100),
    last_name:  yup.string().required("Familiýasyny giriziň").max(100),
    avatar:     yup.string().url().nullable().optional(),
    city_id:    yup.number().integer().nullable().optional(),
    status:     yup.number().integer().oneOf([0, 1]).optional(),
    phones:     yup.array().of(yup.string()).nullable().optional(),
});

module.exports = deliverSchema;
