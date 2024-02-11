const FajrAdhanIqamaOffsetMins = 25
const AsrAdhanIqamaOffsetMins = 20
const MaghribAdhanIqamaOffsetMins = 5
const IshaAdhanIqamaOffsetMins = 10

function getDateNow() {
    return new Date(new Date().toLocaleString('en', {timeZone: 'America/Detroit'}))
}

function convertToTwoDigitString(num) {
    return (num).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false })
}

function get12HrTimeStr(time24hrStr) { // Example input str 13:43 -> 01:43 PM
    let [hours, minutes] = time24hrStr.split(":")
    suffix = (hours >= 12) ? 'PM' : 'AM';
    newHours = convertToTwoDigitString((parseInt(hours) + 11) % 12 + 1)
    newMinutes = convertToTwoDigitString(parseInt(minutes))
    return newHours + ":" + newMinutes + " " + suffix;
}

function addMinsToTime(time24hrStr, minsToAdd) {
    const [hours, minutes] = time24hrStr.split(":")
    let dateNow = getDateNow();
    dateNow.setHours(hours);
    dateNow.setMinutes(parseInt(minutes) + minsToAdd)

    return dateNow.getHours() + ":" + dateNow.getMinutes();
}

// Is Daylight Saving
function isDstNow() {
    let dateNow = getDateNow();
    let jan = new Date(dateNow.getFullYear(), 0, 1);
    let jul = new Date(dateNow.getFullYear(), 6, 1);
    return dateNow.getTimezoneOffset() < Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
}

// Special case since we want 1PM during Winter (No DST) and 2PM during summer(DST)
function getDhuhrIqamaTime() {
    const hourStr = isDstNow() ? "02" : "01"
    return hourStr + ":00 PM"
}

async function fetchPrayerTimes() {
    try {
        const response = await fetch('https://api.aladhan.com/v1/timingsByCity?' + new URLSearchParams({
            city: 'Ann Arbor',
            country: 'United States',
            state: 'MI',
            method: 2,
        }), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch prayer times');
        }

        const data = await response.json();
        return data.data.timings;
    } catch (error) {
        console.error('Error fetching prayer times:', error);
    }
}

async function updatePrayerTimes() {
    document.getElementById('todays-date').innerText = new Date().toDateString();
    
    const prayerTimings = await fetchPrayerTimes();
    if (prayerTimings) {
        document.getElementById('FajrAdhan').innerText = get12HrTimeStr(prayerTimings.Fajr);
        document.getElementById('Sunrise').innerText = get12HrTimeStr(prayerTimings.Sunrise);
        document.getElementById('DhuhrAdhan').innerText = get12HrTimeStr(prayerTimings.Dhuhr);
        document.getElementById('AsrAdhan').innerText = get12HrTimeStr(prayerTimings.Asr);
        document.getElementById('MaghribAdhan').innerText = get12HrTimeStr(prayerTimings.Maghrib);
        document.getElementById('IshaAdhan').innerText = get12HrTimeStr(prayerTimings.Isha);

        let addMinsAndConvertTo12HrTime = (adhanTime, minsToAdd) => {
            return get12HrTimeStr(addMinsToTime(adhanTime, minsToAdd));
        }

        // Iqama Times
        document.getElementById('FajrIqama').innerText = addMinsAndConvertTo12HrTime(prayerTimings.Fajr, FajrAdhanIqamaOffsetMins);
        document.getElementById('DhuhrIqama').innerText = getDhuhrIqamaTime();
        document.getElementById('AsrIqama').innerText = addMinsAndConvertTo12HrTime(prayerTimings.Asr, AsrAdhanIqamaOffsetMins);
        document.getElementById('MaghribIqama').innerText = addMinsAndConvertTo12HrTime(prayerTimings.Maghrib, MaghribAdhanIqamaOffsetMins);
        document.getElementById('IshaIqama').innerText = addMinsAndConvertTo12HrTime(prayerTimings.Isha, IshaAdhanIqamaOffsetMins);
    }
}

updatePrayerTimes();

setInterval(updatePrayerTimes, 60000); // Update every 1 minute (adjust as needed)