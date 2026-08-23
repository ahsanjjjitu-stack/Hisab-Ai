const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');



// save shop details router
router.post("/shop-save",shopController.createOrUpdateShop);



module.exports = router;