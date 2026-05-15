require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USERNAME,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
        timezone: '+00:00',
        dialectOptions: { useUTC: false },
    }
);

const catalogPath = path.join(__dirname, '../__modules__/catalog/models');
const shopsPath = path.join(__dirname, '../__modules__/shops/models');

const Category = require(path.join(catalogPath, 'Category.model.js'))(sequelize);
const Product = require(path.join(catalogPath, 'Product.model.js'))(sequelize);
const ProductImage = require(path.join(catalogPath, 'ProductImage.model.js'))(sequelize);
const ProductVariant = require(path.join(catalogPath, 'ProductVariant.model.js'))(sequelize);

const ShopType = require(path.join(shopsPath, 'ShopType.model.js'))(sequelize);
const Shop = require(path.join(shopsPath, 'Shop.model.js'))(sequelize);

module.exports = { sequelize, Sequelize, Category, Product, ProductImage, ProductVariant, ShopType, Shop };
