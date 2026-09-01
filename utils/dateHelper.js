
function getTodayRangeBD() {
    const now = new Date();

    // BD সময় অনুযায়ী আজকের তারিখ বের করা (YYYY-MM-DD ফরম্যাটে)
    const bdDateString = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });

    // Bangladesh সবসময় UTC+6 (কোনো Daylight Saving নাই), 
    // তাই সরাসরি offset সহ ISO string বানালেই সঠিক UTC instant পাওয়া যাবে
    const startOfToday = new Date(`${bdDateString}T00:00:00.000+06:00`);
    const endOfToday = new Date(`${bdDateString}T23:59:59.999+06:00`);

    return { startOfToday, endOfToday };
}

module.exports = { getTodayRangeBD };