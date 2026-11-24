// Static pages (privacy policy, …): edited in the admin panel, read by the app as JSON or opened in a WebView.
const json = (schema) => ({ content: { "application/json": { schema } } });
const security = [{ BearerAuth: [] }];
const slugParam = { in: "path", name: "slug", required: true, schema: { type: "string", example: "privacy" } };
const langParam = { in: "query", name: "lang", schema: { type: "string", enum: ["tk", "ru", "en"] }, description: "Defaults to the Accept-Language header, then tk. An empty translation falls back to tk." };

const adminPage = {
    type: "object",
    properties: {
        id: { type: "integer" }, slug: { type: "string" },
        title: { type: "string" }, title_ru: { type: "string", nullable: true }, title_eng: { type: "string", nullable: true },
        content: { type: "string", nullable: true, description: "Markdown (tk)" },
        content_ru: { type: "string", nullable: true }, content_eng: { type: "string", nullable: true },
        is_published: { type: "boolean" },
        updatedAt: { type: "string", format: "date-time" },
    },
};

module.exports = {
    "/buyer/pages/{slug}": {
        get: {
            tags: ["Buyer — Pages"],
            summary: "Published page for the app (e.g. privacy policy)",
            description: "Public. Returns one language. Render `html` natively, or open `url` in a WebView. "
                + "Markdown supported in `content`: # headings, paragraphs, - and 1. lists, **bold**, *italic*, [links](https://…), ---.",
            parameters: [slugParam, langParam],
            responses: {
                200: {
                    description: "Page",
                    ...json({ type: "object", properties: { model: { type: "object", properties: {
                        slug: { type: "string" }, lang: { type: "string" }, title: { type: "string" },
                        content: { type: "string", description: "Markdown" },
                        html: { type: "string", description: "Rendered, HTML-escaped content (no <html>/<body>)" },
                        url: { type: "string", description: "Full web view URL, e.g. https://…/pages/privacy?lang=tk" },
                        updatedAt: { type: "string", format: "date-time" },
                    } } } }),
                },
                404: { description: "No such page, or not published yet" },
            },
        },
    },
    "/pages/{slug}": {
        get: {
            tags: ["Buyer — Pages"],
            summary: "Web view: page as a standalone mobile-friendly HTML document",
            description: "Public, also at /api/pages/{slug}. `/privacy` is a short alias for `/pages/privacy`. Follows the system dark mode.",
            parameters: [slugParam, langParam],
            responses: { 200: { description: "HTML", content: { "text/html": {} } }, 404: { description: "Not found or not published" } },
        },
    },
    "/admin/pages": {
        get: {
            tags: ["Admin — Pages"], summary: "List static pages", security,
            responses: { 200: { description: "Pages", ...json({ type: "object", properties: { data: { type: "array", items: adminPage } } }) } },
        },
    },
    "/admin/pages/preview": {
        post: {
            tags: ["Admin — Pages"], summary: "Render Markdown to HTML without saving", security,
            requestBody: { required: true, ...json({ type: "object", properties: { content: { type: "string" } } }) },
            responses: { 200: { description: "Rendered", ...json({ type: "object", properties: { html: { type: "string" } } }) } },
        },
    },
    "/admin/pages/{slug}": {
        get: {
            tags: ["Admin — Pages"], summary: "Get a page with all languages", security, parameters: [slugParam],
            responses: { 200: { description: "Page", ...json({ type: "object", properties: { model: adminPage } }) }, 404: { description: "Not found" } },
        },
        put: {
            tags: ["Admin — Pages"], summary: "Save a page (creates it if the slug is new)", security, parameters: [slugParam],
            requestBody: { required: true, ...json({ type: "object", properties: {
                title: { type: "string", description: "Required when creating" }, title_ru: { type: "string" }, title_eng: { type: "string" },
                content: { type: "string" }, content_ru: { type: "string" }, content_eng: { type: "string" },
                is_published: { type: "boolean" },
            } }) },
            responses: { 200: { description: "Saved", ...json({ type: "object", properties: { model: adminPage } }) }, 400: { description: "Bad slug or missing title" } },
        },
    },
};
