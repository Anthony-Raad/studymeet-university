import { StyleSheet } from "react-native";

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
}

export default function getStyles(colors) {
  return StyleSheet.create({
    app: { flex: 1, backgroundColor: colors.surface },
    page: { backgroundColor: colors.surface },
    pageContent: { alignItems: "center", paddingBottom: 48 },

    topBar: {
      width: "100%",
      maxWidth: 960,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 24,
      paddingVertical: 18,
    },
    logo: { fontSize: 24, fontWeight: "700", color: colors.text },
    logoAccent: { color: colors.primary },
    loginButton: { borderWidth: 1, borderColor: colors.primary, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 9 },
    loginButtonPressed: { backgroundColor: colors.hero },
    loginButtonText: { color: colors.primary, fontWeight: "600" },

    hero: {
      width: "100%",
      maxWidth: 960,
      backgroundColor: colors.hero,
      borderRadius: 20,
      marginHorizontal: 24,
      marginTop: 8,
      padding: 32,
      alignItems: "center",
    },
    title: { fontSize: 34, fontWeight: "800", color: colors.text, textAlign: "center", maxWidth: 620 },
    subtitle: { fontSize: 16, lineHeight: 24, color: colors.muted, textAlign: "center", maxWidth: 560, marginTop: 16 },

    joinButton: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 22, paddingVertical: 12, justifyContent: "center", marginTop: 8 },
    joinButtonPressed: { backgroundColor: colors.primaryDark },
    joinButtonText: { color: colors.white, fontWeight: "700", fontSize: 15, textAlign: "center" },
    fullWidth: { alignSelf: "stretch" },
    joinRow: { flexDirection: "row", marginTop: 12, gap: 10, flexWrap: "wrap", justifyContent: "center" },
    input: {
      minWidth: 200,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
    },

    carousel: { width: "100%", maxWidth: 760, alignItems: "center", marginTop: 36, paddingHorizontal: 24 },
    clip: { alignSelf: "center", alignItems: "center", justifyContent: "center", overflow: "hidden", paddingVertical: 50 },
    stage: { width: "100%" },
    centerAbs: { position: "absolute", left: "50%", top: "50%" },
    glow: { zIndex: 2, borderRadius: 12, boxShadow: "0px 0px 38px " + hexToRgba(colors.primary, 0.9), elevation: 20 },
    slide: { borderRadius: 12 },
    dots: { flexDirection: "row", gap: 8, marginTop: 16 },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border },
    dotActive: { backgroundColor: colors.primary, width: 22 },

    featureTitle: { fontSize: 17, fontWeight: "700", color: colors.text, marginBottom: 6 },
    featureText: { fontSize: 14, lineHeight: 20, color: colors.muted },
    status: { marginTop: 18, fontSize: 15, fontWeight: "600", color: colors.primaryDark, textAlign: "center" },
    attHeading: { marginTop: 12, fontSize: 14, fontWeight: "700", color: colors.text },
    attItem: { fontSize: 14, color: colors.muted, marginTop: 4 },

    overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: "center", justifyContent: "center", padding: 24 },
    card: { width: 360, maxWidth: "100%", backgroundColor: colors.surface, borderRadius: 18, padding: 28 },
    cardTitle: { fontSize: 26, fontWeight: "800", color: colors.primary, textAlign: "center" },
    cardSubtitle: { fontSize: 14, color: colors.muted, textAlign: "center", marginTop: 4, marginBottom: 18 },
    label: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 6, marginTop: 12 },
    cancel: { marginTop: 14, alignItems: "center" },
    cancelText: { color: colors.muted, fontSize: 14 },
    reqList: { marginTop: 10, gap: 5 },
    authError: { marginTop: 10, fontSize: 13, fontWeight: "600", color: "#c0392b", textAlign: "center" },

    footer: { width: "100%", maxWidth: 960, alignItems: "center", paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24, marginTop: 16 },
    footerDivider: { width: "100%", height: 1, backgroundColor: colors.border, marginBottom: 24 },
    footerContact: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 6 },
    footerEmail: { fontSize: 14, color: colors.primary, marginBottom: 16 },
    footerCopy: { fontSize: 13, color: colors.muted },

    classCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 18,
      marginTop: 14,
    },
    className: { fontSize: 16, fontWeight: "700", color: colors.text },
    classRole: { fontSize: 13, color: colors.muted, marginTop: 3 },
    classArrow: { fontSize: 26, color: colors.primary, fontWeight: "700", marginLeft: 8 },

    sessionRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginTop: 4,
    },
    sessionCode: { fontSize: 14, fontWeight: "700", color: colors.text },
    sessionDate: { fontSize: 12, color: colors.muted, marginTop: 2 },

    summaryBadge: { backgroundColor: colors.primary, color: colors.white, fontSize: 12, fontWeight: "700", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, alignSelf: "flex-start" },
    summaryLine: { marginTop: 10 },
    summaryHeading: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 6 },
    summaryText: { fontSize: 15, lineHeight: 23, color: colors.text },

    lobbyCard: {
      width: "100%",
      maxWidth: 520,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 20,
      marginTop: 20,
    },

    SummaryBtn: { backgroundColor: colors.hero, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
    SummaryBtnText: { fontSize: 13, fontWeight: "700", color: colors.primary },

    liveBanner: { backgroundColor: "#1a7f4b", borderRadius: 14, padding: 18, marginTop: 16 },
    liveBannerTitle: { color: "#fff", fontWeight: "800", fontSize: 16 },
    liveBannerSub: { color: "rgba(255,255,255,0.85)", fontSize: 14, marginTop: 4 },
    liveBannerBtn: { backgroundColor: "#fff", borderRadius: 10, padding: 12, marginTop: 14, alignItems: "center" },
    liveBannerBtnText: { color: "#1a7f4b", fontWeight: "700", fontSize: 15 },

    sessionAttended: { fontSize: 13, fontWeight: "700", color: "#27ae60", marginTop: 4 },
    sessionMissed: { fontSize: 13, fontWeight: "700", color: "#c0392b", marginTop: 4 },
    sessionEmail: { fontSize: 12, color: colors.muted, marginLeft: 10, marginTop: 2 },

    chatBubble: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 14,
      marginTop: 12,
    },
    chatQuestionText: { fontSize: 14, fontWeight: "700", color: colors.text },
    chatAnswerText: { fontSize: 14, lineHeight: 21, color: colors.muted, marginTop: 6 },
    chatButtonsRow: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginTop: 10 },
    savedLabel: { fontSize: 12, fontWeight: "700", color: "#27ae60" },

    noteCard: {
      width: "100%",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      marginTop: 12,
    },
    noteTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
    noteMeta: { fontSize: 12, color: colors.muted, marginTop: 2 },
    noteContent: { fontSize: 14, lineHeight: 20, color: colors.text, marginTop: 8 },
    noteDeleteText: { color: "#FF3B30", fontWeight: "700", fontSize: 13 },
  });
}
