const Session = require("../model/model.session");


// আজকের তারিখ ফরম্যাট করার ফাংশন (যেমন: "25 Aug 2026")
const getFormattedDate = () => {
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  return new Date().toLocaleDateString('en-GB', options);
};

// ১. ড্রয়ারের বাটনে চাপ দিলে নতুন সেশন ক্রিয়েট বা এক্সিস্টিং সেশন রিটার্ন
exports.createSession = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID প্রদান করা আবশ্যক!' 
      });
    }

    const todayTitle = getFormattedDate();

    // চেক করব আজকের ডেটে অলরেডি কোনো সেশন আছে কিনা
    let existingSession = await Session.findOne({ 
      userId, 
      sessionName: todayTitle 
    });

    if (existingSession) {
      return res.status(200).json({
        success: true,
        message: 'আজকের সেশন খুঁজে পাওয়া গেছে!',
        sessionId: existingSession._id,
        session: existingSession
      });
    }

    // সেশন না থাকলে নতুন বানাব
    const newSession = new Session({
      userId,
      sessionName: todayTitle
    });

    await newSession.save();

    return res.status(201).json({
      success: true,
      message: 'নতুন সেশন তৈরি হয়েছে!',
      sessionId: newSession._id,
      session: newSession
    });

  } catch (error) {
    console.error('Create Session Error:', error);
    return res.status(500).json({
      success: false,
      message: 'সেশন তৈরি করতে সমস্যা হয়েছে!',
      error: error.message
    });
  }
};









// get user all session 

exports.getUserAllSession = async (req, res) => {

    try {

        const { userId } = req.params;

        // get page number and limit number 

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;

        const skip = (page - 1) * limit;




        // count total session 

        const totalSessions = await Session.countDocuments({ userId });


        // get 15 session per page for pagination 

        const sessions = await Session.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);



    return res.status(200).json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(totalSessions / limit),
      totalSessions,
      hasMore: skip + sessions.length < totalSessions,
      sessions
    });



    }
    catch (error) {
     return res.status(500).json({
      success: false,
      message: 'সেশন লিস্ট আনতে সমস্যা হয়েছে!',
      error: error.message
    });

 }
 
}
