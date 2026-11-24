const StaticPageService = require("../services/StaticPageService");
const { normLang } = require("../services/StaticPageService");
const ApiError = require("../../../exceptions/api-error");
const { escapeHtml, renderMarkdown } = require("../utils/markdown");

// Language from ?lang=, else the Accept-Language header, else Turkmen
const pickLang = (req) => req.query.lang || req.acceptsLanguages("tk", "ru", "en") || "tk";

// Absolute URL of the web view, for the app to open in a WebView. Behind nginx the request
// may arrive as /api/buyer/…, so the web view link keeps the same /api prefix and forwarded host.
const webUrl = (req, slug, lang) => {
    const proto = (req.get("x-forwarded-proto") || req.protocol).split(",")[0].trim();
    const host = (req.get("x-forwarded-host") || req.get("host")).split(",")[0].trim();
    const prefix = req.originalUrl.startsWith("/api/") ? "/api" : "";
    return `${proto}://${host}${prefix}/pages/${slug}?lang=${lang}`;
};

const UPDATED = { tk: "Soňky täzelenen senesi", ru: "Последнее обновление", en: "Last updated" };

function htmlDocument(page) {
    const date = new Date(page.updatedAt).toISOString().slice(0, 10);
    return `<!doctype html>
<html lang="${page.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(page.title)}</title>
<style>
  :root { color-scheme: light dark; --fg: #1e293b; --muted: #64748b; --bg: #ffffff; --link: #2563eb; --rule: #e2e8f0; }
  @media (prefers-color-scheme: dark) { :root { --fg: #e2e8f0; --muted: #94a3b8; --bg: #0f172a; --link: #60a5fa; --rule: #1e293b; } }
  body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  main { max-width: 760px; margin: 0 auto; padding: 24px 16px 48px; overflow-wrap: break-word; }
  h1 { font-size: 1.6rem; line-height: 1.25; margin: 0 0 4px; }
  h2 { font-size: 1.25rem; margin: 28px 0 8px; } h3 { font-size: 1.05rem; margin: 20px 0 6px; } h4 { font-size: 1rem; margin: 16px 0 4px; }
  .updated { color: var(--muted); font-size: .875rem; margin: 0 0 24px; }
  a { color: var(--link); } ul, ol { padding-left: 1.4em; } hr { border: 0; border-top: 1px solid var(--rule); margin: 24px 0; }
</style>
</head>
<body>
<main>
<h1>${escapeHtml(page.title)}</h1>
<p class="updated">${UPDATED[page.lang]}: ${date}</p>
${page.html}
</main>
</body>
</html>`;
}

class StaticPageController {
    // ── admin ──
    static async list(req, res, next) {
        try { res.json({ data: await StaticPageService.list() }); } catch (e) { next(e); }
    }

    static async get(req, res, next) {
        try {
            const model = await StaticPageService.getBySlug(req.params.slug);
            if (!model) throw ApiError.NotFound("Sahypa tapylmady");
            res.json({ model });
        } catch (e) { next(e); }
    }

    static async upsert(req, res, next) {
        try {
            res.json({ model: await StaticPageService.upsert(req.params.slug, req.body, req.user?.id) });
        } catch (e) { next(e); }
    }

    // Renders unsaved Markdown with the same renderer the app sees
    static async preview(req, res, next) {
        try { res.json({ html: renderMarkdown(String(req.body?.content ?? "")) }); } catch (e) { next(e); }
    }

    // ── app (JSON) ──
    static async getForApp(req, res, next) {
        try {
            const page = await StaticPageService.getPublished(req.params.slug, pickLang(req));
            res.json({ model: { ...page, url: webUrl(req, page.slug, page.lang) } });
        } catch (e) { next(e); }
    }

    // ── web view (HTML) ──
    static async renderHtml(req, res, next) {
        try {
            const page = await StaticPageService.getPublished(req.params.slug || req.pageSlug, normLang(pickLang(req)));
            res.set("Cache-Control", "public, max-age=300").type("html").send(htmlDocument(page));
        } catch (e) {
            if (e.status === 404) return res.status(404).type("html").send("<!doctype html><meta name=viewport content='width=device-width'><p style='font-family:sans-serif;padding:16px'>404</p>");
            next(e);
        }
    }
}

module.exports = StaticPageController;
