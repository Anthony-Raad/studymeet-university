import { Router } from "express";
import { saveResponse } from "../responses.js";

const router = Router();

router.get("/", function (req, res) {
  const meetingCode = req.query.m;
  const email = req.query.e;
  const type = req.query.t;

  if (!meetingCode || !email || !type) {
    res.status(400).send("<p>Invalid link.</p>");
    return;
  }

  const isAttended = type === "attended";
  const formAction =
    "/respond?m=" + encodeURIComponent(meetingCode) + "&e=" + encodeURIComponent(email) + "&t=" + type;

  const typeBackground = isAttended ? "#D1FAE5" : "#FEE2E2";
  const typeColor = isAttended ? "#065F46" : "#991B1B";
  const typeLabel = isAttended ? "Attended" : "Missed";

  let questionsHtml;
  if (isAttended) {
    questionsHtml =
      "<label>Did you understand everything covered in this class?</label>" +
      '<select name="understood" required>' +
      '<option value="">Select...</option>' +
      '<option value="yes">Yes, I understood everything</option>' +
      '<option value="mostly">Mostly, but I have some questions</option>' +
      '<option value="no">No, I need more help</option>' +
      "</select>" +
      "<label>Leave a review for this class (optional)</label>" +
      '<textarea name="review" rows="4" placeholder="What did you think about today\'s class? Any feedback for the teacher?"></textarea>';
  } else {
    questionsHtml =
      "<label>Why were you absent? Please let your teacher know.</label>" +
      '<textarea name="absenceReason" rows="4" placeholder="I was absent because..." required></textarea>';
  }

  const page =
    "<!DOCTYPE html>" +
    '<html lang="en">' +
    "<head>" +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    "<title>StudyMeet Check-in</title>" +
    "<style>" +
    "* { box-sizing: border-box; margin: 0; padding: 0; }" +
    'body { font-family: -apple-system, sans-serif; background: #F3EFFF; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }' +
    ".card { background: #fff; border-radius: 18px; padding: 36px; max-width: 500px; width: 100%; box-shadow: 0 4px 24px rgba(108,77,246,0.10); }" +
    "h1 { color: #6C4DF6; font-size: 26px; margin-bottom: 6px; }" +
    ".badge { display: inline-block; background: #6C4DF6; color: #fff; border-radius: 20px; padding: 4px 14px; font-size: 12px; font-weight: 700; margin-bottom: 20px; }" +
    ".type { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; margin-left: 6px; background: " + typeBackground + "; color: " + typeColor + "; }" +
    "label { display: block; font-size: 14px; font-weight: 600; color: #241B45; margin-top: 20px; margin-bottom: 6px; }" +
    "textarea, select { width: 100%; border: 1px solid #E3DCFB; border-radius: 10px; padding: 12px; font-size: 15px; color: #241B45; font-family: inherit; resize: vertical; }" +
    "select { height: 44px; }" +
    "button { margin-top: 24px; width: 100%; background: #6C4DF6; color: #fff; border: none; border-radius: 10px; padding: 14px; font-size: 16px; font-weight: 700; cursor: pointer; }" +
    "button:hover { background: #5538D6; }" +
    ".email-chip { background: #F3EFFF; border-radius: 8px; padding: 6px 12px; font-size: 13px; color: #6B6580; display: inline-block; margin-bottom: 16px; }" +
    "</style>" +
    "</head>" +
    "<body>" +
    '<div class="card">' +
    "<h1>StudyMeet Check-in</h1>" +
    "<div>" +
    '<span class="badge">Meeting ' + meetingCode + "</span>" +
    '<span class="type">' + typeLabel + "</span>" +
    "</div>" +
    '<div class="email-chip">' + email + "</div>" +
    '<form method="POST" action="' + formAction + '">' +
    questionsHtml +
    '<button type="submit">Submit Check-in</button>' +
    "</form>" +
    "</div>" +
    "</body>" +
    "</html>";

  res.send(page);
});

router.post("/", async function (req, res) {
  const meetingCode = req.query.m;
  const email = req.query.e;
  const type = req.query.t;
  const understood = req.body.understood;
  const review = req.body.review;
  const absenceReason = req.body.absenceReason;

  if (!meetingCode || !email || !type) {
    res.status(400).send("<p>Invalid submission.</p>");
    return;
  }

  try {
    await saveResponse(meetingCode, email, {
      type: type,
      understood: understood,
      review: review,
      absenceReason: absenceReason,
    });
  } catch (err) {
    res.status(500).send("<p>Could not save response.</p>");
    return;
  }

  const page =
    "<!DOCTYPE html>" +
    '<html lang="en">' +
    "<head>" +
    '<meta charset="UTF-8">' +
    "<title>Thank you!</title>" +
    "<style>" +
    'body { font-family: -apple-system, sans-serif; background: #F3EFFF; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }' +
    ".card { background: #fff; border-radius: 18px; padding: 48px; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 4px 24px rgba(108,77,246,0.10); }" +
    "h1 { color: #6C4DF6; font-size: 28px; margin-bottom: 12px; }" +
    "p { color: #6B6580; font-size: 15px; line-height: 24px; }" +
    "</style>" +
    "</head>" +
    "<body>" +
    '<div class="card">' +
    "<h1>Thank you!</h1>" +
    "<p>Your check-in has been recorded. Your teacher can see your response in the class dashboard.</p>" +
    '<p style="margin-top:16px;font-size:13px">You can close this tab now.</p>' +
    "</div>" +
    "</body>" +
    "</html>";

  res.send(page);
});

export default router;
