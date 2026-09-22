const { FUNCTIONS } = require("../../../utils/functions");

class CATALOG_CONSTANTS {
    static CATEGORY_SORT = [FUNCTIONS.getSort("order"), FUNCTIONS.getSort("name")];
    static PRODUCT_SORT  = [FUNCTIONS.getSort("-createdAt")];
    // delivery_types.code is free-text (seeded as Turkmen phrases, e.g. "mugt eltip
    // berme", "şäher içi mugt") rather than a fixed enum — "mugt" ("free" in
    // Turkmen) is the substring every free-delivery type currently shares.
    static FREE_DELIVERY_TYPE_CODE_PATTERN = "%mugt%";
}

module.exports = CATALOG_CONSTANTS;
