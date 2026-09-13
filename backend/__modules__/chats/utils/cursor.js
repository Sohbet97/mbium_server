// Opaque cursor for keyset pagination — base64url of a plain identifier.
// No pagination in this codebase uses a cursor today (everything else is
// page/limit), so this is deliberately the smallest thing that works rather
// than a generic multi-field cursor.

function encode(value) {
    if (value === null || value === undefined) return null;
    return Buffer.from(String(value), "utf8").toString("base64url");
}

function decode(cursor) {
    if (!cursor) return null;
    try {
        return Buffer.from(String(cursor), "base64url").toString("utf8");
    } catch {
        return null;
    }
}

module.exports = { encode, decode };
