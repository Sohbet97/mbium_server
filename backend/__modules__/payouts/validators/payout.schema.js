const yup = require("yup");

const PAYOUT_REQUEST_STATUSES = ["PENDING", "APPROVED", "REJECTED", "PROCESSED"];

const payoutRequestSchema = yup.object().shape({
    shop_id: yup.number().integer().required("Dükan saýlaň"),
    amount: yup
        .number()
        .positive("Mukdar 0-dan uly bolmaly")
        .required("Mukdary giriziň"),
    currency: yup.string().max(10).optional(),
    bank_details: yup.string().nullable().optional(),
    notes: yup.string().nullable().optional(),
});

const payoutStatusSchema = yup.object().shape({
    status: yup
        .string()
        .oneOf(PAYOUT_REQUEST_STATUSES, "Status nädogry")
        .required("Statusy saýlaň"),
    notes: yup.string().nullable().optional(),
});

module.exports = { payoutRequestSchema, payoutStatusSchema };
