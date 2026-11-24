const db = require("../../../models");
const ApiError = require("../../../exceptions/api-error");
const { renderMarkdown } = require("../utils/markdown");

const FIELDS = ["title", "title_ru", "title_eng", "content", "content_ru", "content_eng", "is_published"];
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
// Column suffix per app language; an empty translation falls back to Turkmen
const LANG_SUFFIX = { tk: "", ru: "_ru", en: "_eng" };

const normLang = (lang) => (LANG_SUFFIX[String(lang || "").slice(0, 2).toLowerCase()] !== undefined
    ? String(lang).slice(0, 2).toLowerCase() : "tk");

class StaticPageService {
    static async list() {
        return db.StaticPage.findAll({ order: [["id", "ASC"]] });
    }

    static async getBySlug(slug) {
        return db.StaticPage.findOne({ where: { slug } });
    }

    // Admin save; creates the page on first save so new slugs (e.g. "terms") need no migration
    static async upsert(slug, body = {}, userId = null) {
        if (!SLUG_RE.test(slug)) throw ApiError.BadRequest("Nädogry slug");
        const data = { updatedBy: userId };
        for (const f of FIELDS) if (body[f] !== undefined) data[f] = body[f] === "" ? null : body[f];
        if (data.is_published !== undefined) data.is_published = Boolean(data.is_published);
        const page = await this.getBySlug(slug);
        if (page) return page.update(data);
        if (!data.title) throw ApiError.BadRequest("Sahypanyň adyny giriziň");
        return db.StaticPage.create({ slug, ...data });
    }

    // What the app and the web view show: one language, Markdown rendered to safe HTML
    static async getPublished(slug, lang) {
        const page = await this.getBySlug(slug);
        if (!page || !page.is_published) throw ApiError.NotFound("Sahypa tapylmady");
        const l = normLang(lang);
        const sfx = LANG_SUFFIX[l];
        const content = page[`content${sfx}`] || page.content || "";
        return {
            slug: page.slug,
            lang: l,
            title: page[`title${sfx}`] || page.title,
            content,
            html: renderMarkdown(content),
            updatedAt: page.updatedAt,
        };
    }
}

module.exports = StaticPageService;
module.exports.normLang = normLang;
