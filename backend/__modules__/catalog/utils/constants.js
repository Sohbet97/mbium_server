const { FUNCTIONS } = require("../../../utils/functions");

class CATALOG_CONSTANTS {
    static CATEGORY_SORT = [FUNCTIONS.getSort("order"), FUNCTIONS.getSort("name")];
    static PRODUCT_SORT  = [FUNCTIONS.getSort("-createdAt")];
}

module.exports = CATALOG_CONSTANTS;
