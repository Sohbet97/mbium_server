const yup = require("yup");

const reviewSchema = yup.object().shape({
    product_id: yup.number().integer().required("Haryt saýlaň"),
    order_id: yup.number().integer().nullable().optional(),
    rating: yup.number().integer().required("Baha giriziň").min(1).max(5),
    comment: yup.string().nullable().optional(),
});

module.exports = reviewSchema;
