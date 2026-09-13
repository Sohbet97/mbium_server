const yup = require("yup");

const priceTierSchema = yup.object().shape({
    min_qty: yup.number().integer().min(1).required("min_qty giriziň"),
    max_qty: yup.number().integer().nullable().optional()
        .test("max-gt-min", "max_qty min_qty-den uly bolmaly", function (value) {
            return value == null || value > this.parent.min_qty;
        }),
    unit_price: yup.number().min(0).required("unit_price giriziň"),
});

module.exports = priceTierSchema;
