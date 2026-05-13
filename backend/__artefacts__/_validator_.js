class Validator {
    /**
     * @param {yup.Schema} schema - Yup schema
     * @param {Object} form - Data to validate
     * @param {Object} options - Yup validation options (e.g., context, abortEarly)
     */
    static async validate(schema, form, options = {}) {
        try {
            await schema.validate(form, { abortEarly: false, ...options });
            return { isError: false, errors: {} };
        } catch (err) {
            const errors = {};
            err.inner.forEach((e) => {
                errors[e.path] = e.message;
            });
            return { isError: true, errors };
        }
    }
}

module.exports = Validator;