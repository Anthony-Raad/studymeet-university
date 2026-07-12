export const STUN_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
};

export function initials(name) {
  const safeName = String(name || "?").trim();
  const parts = safeName.split(/\s+/);

  if (parts.length >= 2) {
    const firstLetter = parts[0][0];
    const secondLetter = parts[1][0];
    return (firstLetter + secondLetter).toUpperCase();
  }

  return safeName.slice(0, 2).toUpperCase();
}

export function emailToName(email) {
  const safeEmail = email || "";
  const beforeAt = safeEmail.split("@")[0];
  const withSpaces = beforeAt.replace(/[._-]/g, " ");

  const words = withSpaces.split(" ");
  const capitalizedWords = [];
  for (const word of words) {
    if (word.length === 0) {
      continue;
    }
    capitalizedWords.push(word[0].toUpperCase() + word.slice(1));
  }

  const result = capitalizedWords.join(" ");
  return result || safeEmail;
}

export function createPeerConnection(localStream, onRemoteStream, onIceCandidate, onConnectionBroken) {
  const pc = new RTCPeerConnection(STUN_SERVERS);

  if (localStream) {
    const tracks = localStream.getTracks();
    for (const track of tracks) {
      pc.addTrack(track, localStream);
    }
  }

  pc.ontrack = function (event) {
    let stream = event.streams[0];
    if (!stream) {
      stream = new MediaStream([event.track]);
    }
    onRemoteStream(stream);
  };

  pc.onicecandidate = function (event) {
    if (event.candidate) {
      onIceCandidate(event.candidate);
    }
  };

  pc.onconnectionstatechange = function () {
    if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
      onConnectionBroken();
    }
  };

  return pc;
}
