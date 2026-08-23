const Shop = require("../model/model.shop");



exports.createOrUpdateShop = async (req, res) => {

    try {

     const { userId, shopName, shopCategory, ownerName, phone, location } = req.body;


     if (!userId || !shopName || !shopCategory || !ownerName || !phone || !location) {
       return res.status(400).json({ 
        success: false, 
        message: 'সকল ফিল্ড পূরণ করা আবশ্যক!' 
      });
    }





    // already shop is created 

    const shop = await Shop.findOneAndUpdate({ userId }, { shopName, shopCategory, ownerName, phone, location }, 
        { new: true, upsert: true });




    return res.status(200).json({
      success: true,
      message: 'দোকানের সেটআপ সফলভাবে সম্পন্ন হয়েছে!',
      shop
    });








    }

    catch (error) {

    console.error('Shop Setup Error:', error);
    return res.status(500).json({
      success: false,
      message: 'দোকানের তথ্য সেভ করতে সমস্যা হয়েছে!',
      error: error.message
    });
}





}