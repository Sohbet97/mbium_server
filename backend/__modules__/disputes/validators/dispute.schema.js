const yup = require("yup");

const DISPUTE_STATUSES = ["OPEN", "UNDER_REVIEW", "RESOLVED", "CLOSED"];

const disputeSchema = yup.object().shape({
    order_id: yup.number().integer().required("Sargyt saýlaň"),
    reason: yup.string().required("Sebäbi giriziň"),
});

const disputeStatusSchema = yup.object().shape({
    status: yup
        .string()
        .oneOf(DISPUTE_STATUSES, "Status nädogry")
        .required("Statusy saýlaň"),
    resolution: yup.string().nullable().optional(),
});

module.exports = { disputeSchema, disputeStatusSchema };
