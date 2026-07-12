export const APP_NAME = "StudyMeet";

export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export const COLORS = {
  primary: "#6C4DF6",
  primaryDark: "#5538D6",
  hero: "#F3EFFF",
  text: "#241B45",
  muted: "#6B6580",
  white: "#FFFFFF",
  surface: "#FFFFFF",
  border: "#E3DCFB",
  overlay: "rgba(36, 27, 69, 0.45)",
};

export const COLORS_DARK = {
  primary: "#8A6FFF",
  primaryDark: "#6C4DF6",
  hero: "#241B38",
  text: "#F1EDFB",
  muted: "#A79FC4",
  white: "#FFFFFF",
  surface: "#1E1836",
  border: "#3A2D5C",
  overlay: "rgba(0, 0, 0, 0.6)",
};

export const ICONS = {
  mic: require("./assets/mic.png"),
  camera: require("./assets/video-camera.png"),
  group: require("./assets/group.png"),
  chat: require("./assets/chat.png"),
};

export const SLIDES = [
  require("./assets/feature-meet.png"),
  require("./assets/feature-attendance.png"),
  require("./assets/feature-checkins.png"),
];
