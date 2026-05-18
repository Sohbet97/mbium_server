const tag = "Auth";

module.exports = {
    "/auth/register": {
        post: {
            tags: [tag],
            summary: "Register a new user",
            requestBody: {
                required: true,
                content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } } },
            },
            responses: {
                201: { description: "OTP session ID returned for verification", content: { "application/json": { schema: { type: "object", properties: { session_id: { type: "string" } } } } } },
                400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            },
        },
    },
    "/auth/login": {
        post: {
            tags: [tag],
            summary: "Login with phone + password",
            requestBody: {
                required: true,
                content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } },
            },
            responses: {
                200: { description: "OTP session created", content: { "application/json": { schema: { type: "object", properties: { session_id: { type: "string" } } } } } },
                400: { description: "Invalid credentials" },
            },
        },
    },
    "/auth/verify-otp": {
        post: {
            tags: [tag],
            summary: "Verify OTP and receive tokens",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["session_id", "otp"],
                            properties: {
                                session_id: { type: "string" },
                                otp: { type: "string", example: "123456" },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Tokens issued", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
                400: { description: "Invalid or expired OTP" },
            },
        },
    },
    "/auth/resend-otp": {
        post: {
            tags: [tag],
            summary: "Resend OTP for existing session",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { type: "object", required: ["session_id"], properties: { session_id: { type: "string" } } },
                    },
                },
            },
            responses: {
                200: { description: "OTP resent" },
                400: { description: "Session not found" },
            },
        },
    },
    "/auth/refresh": {
        post: {
            tags: [tag],
            summary: "Refresh access token",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { type: "object", required: ["refreshToken"], properties: { refreshToken: { type: "string" } } },
                    },
                },
            },
            responses: {
                200: { description: "New tokens issued", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
                401: { description: "Invalid refresh token" },
            },
        },
    },
    "/auth/logout": {
        post: {
            tags: [tag],
            summary: "Logout (invalidate refresh token)",
            security: [{ BearerAuth: [] }],
            responses: { 200: { description: "Logged out" }, 401: { description: "Unauthorized" } },
        },
    },
    "/auth/change-password": {
        post: {
            tags: [tag],
            summary: "Change password",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["old_password", "new_password"],
                            properties: {
                                old_password: { type: "string" },
                                new_password: { type: "string" },
                            },
                        },
                    },
                },
            },
            responses: { 200: { description: "Password changed" }, 400: { description: "Wrong old password" } },
        },
    },
    "/auth/sessions": {
        get: {
            tags: [tag],
            summary: "List active sessions for current user",
            security: [{ BearerAuth: [] }],
            responses: { 200: { description: "Session list" } },
        },
    },
    "/auth/sessions/{id}": {
        delete: {
            tags: [tag],
            summary: "Revoke a specific session",
            security: [{ BearerAuth: [] }],
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
            responses: { 200: { description: "Session revoked" } },
        },
    },
    "/auth/select-assignment": {
        post: {
            tags: [tag],
            summary: "Switch active position assignment",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { type: "object", required: ["assignment_id"], properties: { assignment_id: { type: "integer" } } },
                    },
                },
            },
            responses: { 200: { description: "Tokens reissued for selected assignment", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } } },
        },
    },
    "/auth/google": {
        post: {
            tags: [tag],
            summary: "Login or register with Google",
            description:
                "Verifies a Google ID token obtained from Google Identity Services (e.g. the `credential` field from `google.accounts.id.initialize`). " +
                "Creates a new account automatically if no user exists with that Google ID or email. " +
                "Returns the same token shape as `POST /auth/login` — no OTP step required.",
            requestBody: {
                required: true,
                content: { "application/json": { schema: { $ref: "#/components/schemas/GoogleLoginRequest" } } },
            },
            responses: {
                200: {
                    description: "Authenticated — access token in body, refresh token in `Set-Cookie`",
                    content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } },
                },
                400: { description: "Missing or invalid `id_token`", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            },
        },
    },
    "/auth/captcha": {
        get: {
            tags: [tag],
            summary: "Get captcha image",
            responses: { 200: { description: "PNG image", content: { "image/png": {} } } },
        },
    },
    "/auth/me": {
        get: {
            tags: [tag],
            summary: "Get current user profile",
            description: "Returns the authenticated user plus their shop (if any). The `shop` field includes `verification_status`, `type.commission_rate`, and `categories`.",
            security: [{ BearerAuth: [] }],
            responses: {
                200: {
                    description: "User with optional shop",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    model: {
                                        allOf: [
                                            { $ref: "#/components/schemas/User" },
                                            {
                                                type: "object",
                                                properties: {
                                                    shop: { oneOf: [{ $ref: "#/components/schemas/Shop" }, { type: "null" }] },
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
                401: { description: "Unauthorized" },
            },
        },
        patch: {
            tags: [tag],
            summary: "Update own profile",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                name:         { type: "string" },
                                surname:      { type: "string" },
                                email:        { type: "string", format: "email" },
                                phone_number: { type: "string" },
                                birth_date:   { type: "string", format: "date" },
                            },
                        },
                    },
                },
            },
            responses: { 200: { description: "Updated profile" }, 400: { description: "Phone/email already in use" } },
        },
    },
    "/auth/me/avatar": {
        post: {
            tags: [tag],
            summary: "Upload own avatar",
            security: [{ BearerAuth: [] }],
            requestBody: {
                required: true,
                content: { "multipart/form-data": { schema: { type: "object", properties: { avatar: { type: "string", format: "binary" } }, required: ["avatar"] } } },
            },
            responses: { 200: { description: "Avatar uploaded" } },
        },
    },
};
