const { FUNCTIONS } = require("../../../utils/functions");

class SHOP_CONSTANTS {
    static DEFAULT_SORT = [FUNCTIONS.getSort("order"), FUNCTIONS.getSort('name')]
}

module.exports = SHOP_CONSTANTS;