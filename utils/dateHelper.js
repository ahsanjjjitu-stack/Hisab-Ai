const { fromZonedTime } = require('date-fns-tz');


function getTodayRangeBD() {
    const now = new Date();

    const bdDateString = now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });

    const startOfToday = fromZonedTime(`${bdDateString}T00:00:00.000`, 'Asia/Dhaka');
    const endOfToday = fromZonedTime(`${bdDateString}T23:59:59.999`, 'Asia/Dhaka');

    return { startOfToday, endOfToday };
}

module.exports = { getTodayRangeBD };