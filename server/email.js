const MJ_API_KEY = "02873083572b796d5d4c39c35f5a8b42";
const MJ_SECRET_KEY = "b409d222abb9c79c338651634974e5d3";
const SENDER_EMAIL = process.env.SENDER_EMAIL || "studymeet.university@example.com";
const SENDER_NAME = "StudyMeet";
const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000";

const canSend = Boolean(MJ_API_KEY && MJ_SECRET_KEY);
console.log("[email] canSend=" + canSend + " sender=" + SENDER_EMAIL);

async function mjSend(toEmail, subject, html) {
  const authText = MJ_API_KEY + ":" + MJ_SECRET_KEY;
  const authBase64 = Buffer.from(authText).toString("base64");

  const response = await fetch("https://api.mailjet.com/v3.1/send", {
    method: "POST",
    headers: {
      Authorization: "Basic " + authBase64,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      Messages: [
        {
          From: { Email: SENDER_EMAIL, Name: SENDER_NAME },
          To: [{ Email: toEmail }],
          Subject: subject,
          HTMLPart: html,
        },
      ],
    }),
  });

  const data = await response.json();

  let firstMessageStatus = null;
  if (data.Messages && data.Messages[0]) {
    firstMessageStatus = data.Messages[0].Status;
  }

  if (!response.ok || firstMessageStatus === "error") {
    throw new Error(JSON.stringify(data));
  }

  return data;
}

function attendedHtml(student, meetingCode) {
  const link =
    SERVER_URL + "/respond?m=" + meetingCode + "&e=" + encodeURIComponent(student.email) + "&t=attended";

  return {
    subject: "Quick check-in about today's class (" + meetingCode + ")",
    html:
      '<div style="font-family:sans-serif;max-width:540px;margin:auto;padding:32px">' +
      '<h2 style="color:#6C4DF6">Hi ' + student.name + '</h2>' +
      "<p>Thanks for joining today's class! We'd love to hear how it went for you.</p>" +
      "<p>Please click the button below to leave a quick check-in:</p>" +
      '<a href="' + link + '" ' +
      'style="display:inline-block;background:#6C4DF6;color:#fff;padding:14px 28px;' +
      'border-radius:10px;text-decoration:none;font-weight:700;margin:16px 0">' +
      "Fill in check-in form" +
      "</a>" +
      '<p style="color:#888;font-size:13px">' +
      "It only takes 30 seconds, two quick questions about whether you understood the material " +
      "and a short review of the class." +
      "</p>" +
      '<hr style="border:none;border-top:1px solid #E3DCFB;margin:24px 0">' +
      '<p style="color:#888;font-size:12px">StudyMeet - automated check-in for meeting ' + meetingCode + "</p>" +
      "</div>",
  };
}

function missedHtml(student, meetingCode) {
  const link =
    SERVER_URL + "/respond?m=" + meetingCode + "&e=" + encodeURIComponent(student.email) + "&t=missed";

  return {
    subject: "We missed you in today's class (" + meetingCode + ")",
    html:
      '<div style="font-family:sans-serif;max-width:540px;margin:auto;padding:32px">' +
      '<h2 style="color:#6C4DF6">Hi ' + student.name + '</h2>' +
      "<p>We noticed you weren't in today's class. We hope everything is okay!</p>" +
      "<p>Could you take a moment to let us know what happened?</p>" +
      '<a href="' + link + '" ' +
      'style="display:inline-block;background:#6C4DF6;color:#fff;padding:14px 28px;' +
      'border-radius:10px;text-decoration:none;font-weight:700;margin:16px 0">' +
      "Tell us why you were absent" +
      "</a>" +
      '<p style="color:#888;font-size:13px">' +
      "It only takes a moment, one quick question. You can also read the class summary " +
      "to catch up on what was covered." +
      "</p>" +
      '<hr style="border:none;border-top:1px solid #E3DCFB;margin:24px 0">' +
      '<p style="color:#888;font-size:12px">StudyMeet - automated check-in for meeting ' + meetingCode + "</p>" +
      "</div>",
  };
}

export async function sendTestEmail(toEmail) {
  if (!canSend) {
    throw new Error("canSend=false - MAILJET_API_KEY or MAILJET_SECRET_KEY not set");
  }
  const data = await mjSend(
    toEmail,
    "StudyMeet - test email",
    "<p>This is a test email from StudyMeet. If you see this, email sending is working.</p>"
  );
  console.log("[email] test sent to " + toEmail + ":", JSON.stringify(data));
  return data;
}

export async function sendCheckInEmails(report) {
  console.log(
    "[email] sendCheckInEmails: meeting=" + report.meetingCode +
      " attended=" + report.attended.length + " missed=" + report.missed.length
  );

  if (!canSend) {
    console.log("[email] dry-run - set MAILJET_API_KEY + MAILJET_SECRET_KEY to actually send emails");
    return { meetingCode: report.meetingCode, attendedEmailed: 0, missedEmailed: 0, mode: "dry-run" };
  }

  for (const student of report.attended) {
    try {
      const emailContent = attendedHtml(student, report.meetingCode);
      await mjSend(student.email, emailContent.subject, emailContent.html);
      console.log("[email] sent attended email to " + student.email);
    } catch (err) {
      console.error("[email] failed for " + student.email + ":", err.message);
    }
  }

  for (const student of report.missed) {
    try {
      const emailContent = missedHtml(student, report.meetingCode);
      await mjSend(student.email, emailContent.subject, emailContent.html);
      console.log("[email] sent missed email to " + student.email);
    } catch (err) {
      console.error("[email] failed for " + student.email + ":", err.message);
    }
  }

  return {
    meetingCode: report.meetingCode,
    attendedEmailed: report.attended.length,
    missedEmailed: report.missed.length,
    mode: "sent",
  };
}
