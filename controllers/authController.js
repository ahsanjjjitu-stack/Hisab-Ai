const User = require("../model/model.user");
const Otp = require("../model/model.otp");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SibApiV3Sdk = require("@getbrevo/brevo");


// brevo api config 

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
let apiKey = apiInstance.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY;




// 1. send otp user verification 

exports.sendOtp = async (req, res) => {

    try {

     const { email } = req.body;


     if (!email) {
        return res.status(400).json({ success: false, message: 'ইমেইল দেওয়া প্রয়োজন!' });
     }




     // check user allready verified or not

     const existingUser = await User.findOne({ email, isVerified: true });
     if (existingUser) {
      return res.status(400).json({ success: false, message: 'এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট খোলা হয়েছে!' });
    }




    // make random otp 

    const generateOtp = Math.floor(1000 + Math.random() * 9000).toString();
   

    // finish old otp

    await Otp.deleteMany({ email });
    await Otp.create({ email, otp: generateOtp });




    // brevo send email

    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = "আপনার ভেরিফিকেশন কোড";
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>আপনার অ্যাকাউন্ট ভেরিফিকেশন কোড</h2>
        <h1 style="color: #0F52BA; letter-spacing: 2px;">${generateOtp}</h1>
        <p>কোডটির মেয়াদ থাকবে ৫ মিনিট। কারো সাথে কোডটি শেয়ার করবেন না।</p>
      </div>
    `;




    sendSmtpEmail.sender = { "name": "Hisab Ai", "email": process.env.SENDER_EMAIL };
    sendSmtpEmail.to = [{ "email": email }]



    await apiInstance.sendTransacEmail(sendSmtpEmail);



    return res.status(200).json({
        success: true,
        message: "আপনার ইমেইলে ভেরিফিকেশন কোড পাঠানো হয়েছে!",
    });


    }
    catch (error) {
    console.error("Brevo Error:", error);
    return res.status(500).json({ 
        success: false,
         message: 'OTP পাঠাতে ব্যর্থ হয়েছে!', 
         error: error.message 
        
   });


   }




};










// ২. OTP যাচাই ও অ্যাকাউন্ট ক্রিয়েট (Verify OTP & Register)

exports.verifyOtpAndRegister = async (req, res) => {

  try {


    const { email, password, otp } = req.body;

    if (!email || !password || !otp) {
      return res.status(400).json({ success: false, message: 'সবগুলো ফিল্ড পুরণ করুন!' });
    }


    

    // check otp valid or not 

    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'ভুল OTP অথবা OTP-র মেয়াদ শেষ হয়ে গেছে!' });
    }





    // password hash 

    const hashedPassword = await bcrypt.hash(password, 10);





    // make user / update user

    let user = await User.findOne({ email });
    if (user){
      user.password = hashedPassword;
      user.isVerified = true;
      await user.save();
    }
    else {
      user = await User.create({
        email,
        password: hashedPassword,
        isVerified: true
      });
    }







    // finish verification and cleann otp

    await Otp.deleteMany({ email });







    // generate jwt token

    const token = jwt.sign(
      { userId: user._id, email: user.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: '30d' }
    );




    return res.status(201).json({
      success: true,
      message: "আপনার অ্যাকাউন্ট সফলভাবে খোলা হয়েছে!",
      token,
      userId: user._id
    });






  }
  catch (error) {
    return res.status(500).json({
       success: false,
        message: 'ভেরিফিকেশনে সমস্যা হয়েছে!',
         error: error.message 
        
    });
  }


};















    
