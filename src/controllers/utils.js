const { google } = require("googleapis");
const path = require("path");
const fs = require("fs");

// ✅ Load Service Account JSON
const SERVICE_ACCOUNT_PATH = path.join(__dirname, "../config/service-account.json");
if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error("❌ Missing service-account.json file in /config folder");
  process.exit(1);
}
const serviceAccount = require(SERVICE_ACCOUNT_PATH);

// ✅ Shared account email (the account under which Meet links are created)
const SHARED_EMAIL ="lms@techfreak.info";

// ✅ Google Calendar auth using service account
const auth = new google.auth.JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key.replace(/\\n/g, "\n"), // preserve line breaks
  scopes: ["https://www.googleapis.com/auth/calendar"],
  subject: SHARED_EMAIL, // impersonate shared account
});

const calendar = google.calendar({ version: "v3", auth });

// ✅ Create Google Meet link
async function createGoogleMeet(trainer, student, classData, date, time) {
  try {
    await auth.authorize();

    const startTime = new Date(`${date}T${time}`);
    const endTime = new Date(startTime.getTime() + 60 * 60000); // +1 hour

    const event = {
      summary: `${classData.title} - ${student.name}`,
      description: `Training class with ${student.name} by ${trainer.name}`,
      start: { dateTime: startTime.toISOString(), timeZone: "Asia/Kolkata" },
      end: { dateTime: endTime.toISOString(), timeZone: "Asia/Kolkata" },
      attendees: [{ email: trainer.email }, { email: student.email }],
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      conferenceDataVersion: 1,
    });

    return {
      meetLink: response.data.hangoutLink,
      eventId: response.data.id,
    };
  } catch (err) {
    console.error("❌ Failed to create Google Meet:", err.message);
    return { meetLink: null, eventId: null };
  }
}

module.exports = { createGoogleMeet };
