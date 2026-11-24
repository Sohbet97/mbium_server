const router = require('express').Router();
const StaticPageController = require('../../__modules__/pages/controllers/StaticPageController');

// GET /buyer/pages/:slug?lang=tk|ru|en — published page for the app (title, Markdown, HTML, web view url)
router.get('/:slug', StaticPageController.getForApp);

module.exports = router;
