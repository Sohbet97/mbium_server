// Minimal Markdown → HTML for admin-written pages shown in the app's WebView.
// Everything is HTML-escaped first, so raw HTML in the text is shown as text, never run.
// Supports: # / ## / ### headings, paragraphs, - or * lists, 1. lists, **bold**, *italic*,
// [text](https://… | mailto: | tel:) links, and --- rules.

const escapeHtml = (s) => s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function inline(text) {
    return escapeHtml(text)
        .replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:|tel:)[^\s)]+)\)/g, '<a href="$2">$1</a>')
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
}

function renderMarkdown(src = "") {
    const out = [];
    let para = [];
    let list = null; // { tag, items }

    const flushPara = () => { if (para.length) out.push(`<p>${para.map(inline).join("<br>")}</p>`); para = []; };
    const flushList = () => { if (list) out.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${list.tag}>`); list = null; };

    for (const raw of String(src).replace(/\r\n?/g, "\n").split("\n")) {
        const line = raw.trim();
        let m;
        if (!line) { flushPara(); flushList(); continue; }
        if ((m = line.match(/^(#{1,3})\s+(.*)$/))) {
            flushPara(); flushList();
            const level = m[1].length + 1; // # → h2; the page title is the h1
            out.push(`<h${level}>${inline(m[2])}</h${level}>`);
        } else if (/^(-{3,}|\*{3,})$/.test(line)) {
            flushPara(); flushList(); out.push("<hr>");
        } else if ((m = line.match(/^[-*]\s+(.*)$/)) || (m = line.match(/^\d+[.)]\s+(.*)$/))) {
            flushPara();
            const tag = /^\d/.test(line) ? "ol" : "ul";
            if (list && list.tag !== tag) flushList();
            if (!list) list = { tag, items: [] };
            list.items.push(m[1]);
        } else {
            flushList(); para.push(line);
        }
    }
    flushPara(); flushList();
    return out.join("\n");
}

module.exports = { renderMarkdown, escapeHtml };
