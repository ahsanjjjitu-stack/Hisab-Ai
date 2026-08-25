const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');



// save shop details router
router.post("/shop-save",shopController.createOrUpdateShop);

// get shop details 
router.get("/shop-details/:userId",shopController.getShopDetails);



module.exports = router;