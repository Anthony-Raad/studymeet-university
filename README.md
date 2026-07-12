# StudyMeet (university version)

This is a video meeting app for classes. A teacher can make a class, add
students, and start a video meeting. Students can join the meeting, and
after it ends the app tracks who showed up, emails everyone a quick
check-in form, and uses AI to write a short summary of what was talked
about.

This project has two parts that both need to run at the same time:

- `server/` - the backend, a Node.js + Express app. It talks to MySQL and
  also runs the video call signaling over WebSocket.
- `client/` - the frontend, a React Native (Expo) app that runs in a web
  browser.

## What you need installed first

1. **Node.js** (version 18 or newer) - https://nodejs.org
2. **MySQL** - https://dev.mysql.com/downloads/installer/ (or use something
   like XAMPP if that is easier for you)

## Step 1: set up the database

Open a MySQL command line (or a tool like MySQL Workbench) and run:

```sql
CREATE DATABASE studymeet;
```

That is it, you do not need to make any tables by hand. The server makes
all the tables itself the first time it starts.

## Step 2: set up your .env file

In the main folder (`studymeet university/`), copy `.env.example` to a new
file named `.env`, then open it and fill in your MySQL password.

The email and AI summary settings are optional. If you leave them blank
the app still works, it just skips sending real emails and skips the AI
summary (it will print a message to the terminal saying so instead).

## Step 3: install the packages

Open a terminal in the `studymeet university` folder and run:

```
npm install
cd client
npm install
cd ..
```

## Step 4: run the server

From the main folder:

```
npm run dev
```

You should see something like `Backend running at http://localhost:3000`
in the terminal. Leave this terminal open.

## Step 5: run the client

Open a **second** terminal, go into the `client` folder, and run:

```
cd client
npm run web
```

This opens the app in your browser. If it does not open by itself, the
terminal will print a link you can click (usually
`http://localhost:8081` or similar).

## Trying it out on your phone (optional)

If you want to test on a real phone on the same WiFi network, open
`client/constants.js` and change the fallback IP address in `API_URL` to
your computer's own LAN IP address (you can find this with `ipconfig` on
Windows, look for "IPv4 Address"). Then run `npm run start` instead of
`npm run web` and scan the QR code with the Expo Go app.

## How the code is organized

Every file starts with a short comment explaining what it is for. Nothing
fancy is used on purpose - no TypeScript, no extra frameworks for state
management, just plain JavaScript functions, so it is easier to read and
change.

- `server/db.js` - connects to MySQL and creates the tables
- `server/users.js`, `classes.js`, `attendance.js`, `responses.js`,
  `summaries.js` - the actual logic for each part of the app (this is
  where the SQL queries live)
- `server/email.js` - sends the check-in emails
- `server/gemini.js` - asks Google's AI to summarize the meeting
- `server/websocket.js` - passes video-call connection messages between
  students so their browsers can connect to each other directly
- `server/routes/` - the web addresses (like `/api/classes`) that the app
  can be asked for, these mostly just call the files above
- `client/App.jsx` - decides which screen is currently shown
- `client/screens/` - one file per screen in the app
- `client/constants.js` - shared settings like colors and the server address
- `client/styles.js` - shared styling used by more than one screen

## Admin dashboard

While the server is running, you can view a simple admin page at:

```
http://localhost:3000/admin?pw=admin123
```

(Change `admin123` to whatever you set `ADMIN_PASSWORD` to in your `.env`
file.) This lets you see and delete users, classes, and meetings directly.
