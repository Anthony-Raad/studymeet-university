import { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, TextInput, ScrollView, Image, StyleSheet, Platform, useWindowDimensions } from "react-native";
import { COLORS, API_URL, ICONS } from "../constants";
import { initials, emailToName, createPeerConnection } from "./meetingRoomHelpers";

function CircleButton(props) {
  const icon = props.icon;
  const label = props.label;
  const active = props.active;
  const off = props.off;
  const onPress = props.onPress;
  const big = props.big;

  return (
    <Pressable onPress={onPress} style={[styles.btn, active && styles.btnActive, off && styles.btnOff]} hitSlop={6}>
      {icon ? (
        <Image source={icon} style={[styles.btnIcon, { tintColor: "#fff" }]} />
      ) : (
        <Text style={[styles.btnLabel, big && styles.btnLabelBig]}>{label}</Text>
      )}
    </Pressable>
  );
}

function PeerTile(props) {
  const peer = props.peer;
  const videoRef = useRef(null);

  useEffect(function () {
    if (videoRef.current) {
      videoRef.current.srcObject = peer.stream || null;
    }
  }, [peer.stream]);

  const name = peer.userName || emailToName(peer.userId) || "Participant";
  const hasVideo = Boolean(peer.stream) && peer.stream.getVideoTracks().length > 0;

  return (
    <View style={tileStyle.wrap}>
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 14, display: "block" }}
        />
      ) : (
        <View style={[tileStyle.fill, tileStyle.center]}>
          <View style={tileStyle.avatar}>
            <Text style={tileStyle.avatarText}>{initials(name)}</Text>
          </View>
        </View>
      )}
      {peer.handRaised && (
        <View style={tileStyle.handBadge}>
          <Text style={tileStyle.handBadgeText}>✋</Text>
        </View>
      )}
      <View style={tileStyle.nameTag}>
        <Text style={tileStyle.nameTagText} numberOfLines={1}>
          {name}
        </Text>
      </View>
    </View>
  );
}

function SelfTile(props) {
  const videoRef = props.videoRef;
  const cameraOn = props.cameraOn;
  const name = props.name;
  const handRaised = props.handRaised;

  return (
    <View style={tileStyle.wrap}>
      {cameraOn ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: 14,
            display: "block",
            transform: "scaleX(-1)",
          }}
        />
      ) : (
        <View style={[tileStyle.fill, tileStyle.center]}>
          <View style={tileStyle.avatar}>
            <Text style={tileStyle.avatarText}>{initials(name)}</Text>
          </View>
        </View>
      )}
      {handRaised && (
        <View style={tileStyle.handBadge}>
          <Text style={tileStyle.handBadgeText}>✋</Text>
        </View>
      )}
      <View style={tileStyle.nameTag}>
        <Text style={tileStyle.nameTagText} numberOfLines={1}>
          {name} (you)
        </Text>
      </View>
    </View>
  );
}

const tileStyle = StyleSheet.create({
  wrap: { width: "100%", height: "100%", borderRadius: 14, overflow: "hidden", backgroundColor: "#241B45", borderWidth: 2, borderColor: "transparent" },
  fill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  center: { alignItems: "center", justifyContent: "center" },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 22 },
  handBadge: { position: "absolute", top: 8, right: 8, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 20, paddingHorizontal: 6, paddingVertical: 2 },
  handBadgeText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  nameTag: { position: "absolute", left: 8, bottom: 8, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  nameTagText: { color: "#fff", fontSize: 11, fontWeight: "600" },
});

function gridColumnCount(totalPeople, isMobile) {
  if (isMobile) {
    if (totalPeople <= 1) {
      return 1;
    }
    return 2;
  }

  if (totalPeople <= 1) {
    return 1;
  }
  if (totalPeople <= 4) {
    return 2;
  }
  if (totalPeople <= 9) {
    return 3;
  }
  if (totalPeople <= 16) {
    return 4;
  }
  return 5;
}

export default function MeetingRoom(props) {
  const meetingCode = props.meetingCode;
  const userEmail = props.userEmail;
  const onLeave = props.onLeave;

  const windowSize = useWindowDimensions();
  const isMobile = windowSize.width < 700;
  const myName = emailToName(userEmail);

  const wsRef = useRef(null);

  const peersRef = useRef({});
  const [peers, setPeers] = useState([]);

  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  const screenStreamRef = useRef(null);
  const [sharingScreen, setSharingScreen] = useState(false);
  const [sharerSocketId, setSharerSocketId] = useState(null);

  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [handRaised, setHandRaised] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);

  const minutesPart = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secondsPart = String(seconds % 60).padStart(2, "0");
  const clockText = minutesPart + ":" + secondsPart;

  useEffect(function () {
    const timer = setInterval(function () {
      setSeconds(function (current) {
        return current + 1;
      });
    }, 1000);
    return function () {
      clearInterval(timer);
    };
  }, []);

  useEffect(function () {
    if (Platform.OS !== "web") {
      return;
    }

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      return;
    }

    const recognizer = new SpeechRecognitionClass();
    recognizer.continuous = true;
    recognizer.interimResults = true;
    recognizer.lang = "en-US";

    recognizer.onresult = function (event) {
      let finishedText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finishedText = finishedText + event.results[i][0].transcript + " ";
        }
      }
      if (finishedText) {
        setTranscript(function (previous) {
          return previous + finishedText;
        });
      }
    };

    recognizer.onend = function () {
      if (recognitionRef.current) {
        try {
          recognizer.start();
        } catch (err) {
        }
      }
    };

    recognizer.onerror = function (event) {
      if (event.error !== "no-speech") {
        console.warn("Speech recognition error:", event.error);
      }
    };

    recognitionRef.current = recognizer;
    try {
      recognizer.start();
    } catch (err) {
    }

    return function () {
      recognitionRef.current = null;
      try {
        recognizer.stop();
      } catch (err) {
      }
    };
  }, []);

  function refreshPeers() {
    setPeers(Object.values(peersRef.current));
  }

  function wsSend(message) {
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify(message));
    }
  }

  function connectToPeer(remoteSocketId) {
    function handleRemoteStream(stream) {
      if (peersRef.current[remoteSocketId]) {
        peersRef.current[remoteSocketId].stream = stream;
        refreshPeers();
      }
    }

    function handleIceCandidate(candidate) {
      wsSend({ type: "signal", to: remoteSocketId, signal: { type: "ice", candidate: candidate } });
    }

    function handleConnectionBroken() {
      delete peersRef.current[remoteSocketId];
      refreshPeers();
    }

    return createPeerConnection(localStreamRef.current, handleRemoteStream, handleIceCandidate, handleConnectionBroken);
  }

  async function drainPendingIce(entry) {
    if (!entry.pendingIce) {
      return;
    }
    for (const candidate of entry.pendingIce) {
      try {
        await entry.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
      }
    }
    entry.pendingIce = [];
  }

  useEffect(function () {
    let ws;
    let destroyed = false;

    async function start() {
      if (Platform.OS === "web" && navigator.mediaDevices) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          if (destroyed) {
            const tracks = stream.getTracks();
            for (const track of tracks) {
              track.stop();
            }
            return;
          }
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.warn("Camera/mic denied:", err.message);
        }
      }

      function toWebSocketUrl(httpUrl) {
        return httpUrl.replace(/^https?:\/\//, function (matchedText) {
          if (matchedText === "https://") {
            return "wss://";
          }
          return "ws://";
        });
      }

      const wsUrl = toWebSocketUrl(API_URL) + "/ws";
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = function () {
        wsSend({ type: "join-room", roomId: meetingCode, userId: userEmail, userName: myName });
      };

      ws.onmessage = async function (event) {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch (err) {
          return;
        }

        if (msg.type === "existing-users") {
          for (const existingPeer of msg.peers) {
            if (!peersRef.current[existingPeer.socketId]) {
              peersRef.current[existingPeer.socketId] = {
                socketId: existingPeer.socketId,
                userId: existingPeer.userId,
                userName: existingPeer.userName,
                pc: null,
                stream: null,
                handRaised: false,
                pendingIce: [],
              };
            }
            const pc = connectToPeer(existingPeer.socketId);
            peersRef.current[existingPeer.socketId].pc = pc;

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            wsSend({ type: "signal", to: existingPeer.socketId, signal: { type: "offer", sdp: offer } });
          }
          refreshPeers();
        }

        else if (msg.type === "user-connected") {
          peersRef.current[msg.socketId] = {
            socketId: msg.socketId,
            userId: msg.userId,
            userName: msg.userName,
            pc: null,
            stream: null,
            handRaised: false,
            pendingIce: [],
          };
          refreshPeers();
        }

        else if (msg.type === "signal") {
          const fromSocketId = msg.from;
          const signal = msg.signal;
          let entry = peersRef.current[fromSocketId];

          if (signal.type === "offer") {
            if (!entry) {
              entry = {
                socketId: fromSocketId,
                userId: msg.userId,
                userName: msg.userName,
                pc: null,
                stream: null,
                handRaised: false,
                pendingIce: [],
              };
              peersRef.current[fromSocketId] = entry;
            }

            const pc = connectToPeer(fromSocketId);
            entry.pc = pc;
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            await drainPendingIce(entry);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            wsSend({ type: "signal", to: fromSocketId, signal: { type: "answer", sdp: answer } });
            refreshPeers();
          } else if (signal.type === "answer") {
            if (entry && entry.pc) {
              await entry.pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
              await drainPendingIce(entry);
            }
          } else if (signal.type === "ice") {
            const remoteDescriptionIsReady =
              entry && entry.pc && entry.pc.remoteDescription && entry.pc.remoteDescription.type;

            if (remoteDescriptionIsReady) {
              try {
                await entry.pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
              } catch (err) {
              }
            } else if (entry) {
              if (!entry.pendingIce) {
                entry.pendingIce = [];
              }
              entry.pendingIce.push(signal.candidate);
            }
          }
        } else if (msg.type === "chat") {
          setMessages(function (previousMessages) {
            return previousMessages.concat([msg.message]);
          });
        } else if (msg.type === "hand-raise") {
          if (peersRef.current[msg.socketId]) {
            peersRef.current[msg.socketId].handRaised = msg.raised;
            refreshPeers();
          }
        } else if (msg.type === "screen-share") {
          if (msg.sharing) {
            setSharerSocketId(msg.socketId);
          } else {
            setSharerSocketId(function (current) {
              if (current === msg.socketId) {
                return null;
              }
              return current;
            });
          }
        } else if (msg.type === "user-disconnected") {
          const entry = peersRef.current[msg.socketId];
          if (entry && entry.pc) {
            try {
              entry.pc.close();
            } catch (err) {
            }
          }
          delete peersRef.current[msg.socketId];
          refreshPeers();
          setSharerSocketId(function (current) {
            if (current === msg.socketId) {
              return null;
            }
            return current;
          });
        }
      };

      ws.onerror = function () {};
      ws.onclose = function () {};
    }

    start();

    return function () {
      destroyed = true;
      recognitionRef.current = null;

      const allPeers = Object.values(peersRef.current);
      for (const peer of allPeers) {
        if (peer.pc) {
          try {
            peer.pc.close();
          } catch (err) {
          }
        }
      }
      peersRef.current = {};

      if (localStreamRef.current) {
        const tracks = localStreamRef.current.getTracks();
        for (const track of tracks) {
          track.stop();
        }
      }
      if (screenStreamRef.current) {
        const tracks = screenStreamRef.current.getTracks();
        for (const track of tracks) {
          track.stop();
        }
      }
      if (ws) {
        ws.close();
      }
    };
  }, []);

  useEffect(function () {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  });

  function toggleMic() {
    const turningOn = !micOn;
    setMicOn(turningOn);
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      for (const track of audioTracks) {
        track.enabled = turningOn;
      }
    }
  }

  function toggleCamera() {
    const turningOn = !cameraOn;
    setCameraOn(turningOn);
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      for (const track of videoTracks) {
        track.enabled = turningOn;
      }
    }
  }

  function sendMessage() {
    const text = chatInput.trim();
    if (!text) {
      return;
    }

    const message = {
      id: Date.now(),
      sender: myName,
      text: text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    wsSend({ type: "chat", roomId: meetingCode, message: message });
    setMessages(function (previousMessages) {
      return previousMessages.concat([message]);
    });
    setChatInput("");
  }

  function toggleHand() {
    const raising = !handRaised;
    setHandRaised(raising);
    wsSend({ type: "raise-hand", roomId: meetingCode, raised: raising });
  }

  function findVideoSender(pc) {
    if (!pc) {
      return null;
    }
    const senders = pc.getSenders();
    for (const sender of senders) {
      if (sender.track && sender.track.kind === "video") {
        return sender;
      }
    }
    return null;
  }

  async function toggleScreenShare() {
    if (sharingScreen) {
      if (screenStreamRef.current) {
        const tracks = screenStreamRef.current.getTracks();
        for (const track of tracks) {
          track.stop();
        }
      }
      screenStreamRef.current = null;
      setSharingScreen(false);
      wsSend({ type: "screen-share", roomId: meetingCode, sharing: false });

      let cameraTrack = null;
      if (localStreamRef.current) {
        const videoTracks = localStreamRef.current.getVideoTracks();
        if (videoTracks.length > 0) {
          cameraTrack = videoTracks[0];
        }
      }

      if (cameraTrack) {
        const allPeers = Object.values(peersRef.current);
        for (const peer of allPeers) {
          const sender = findVideoSender(peer.pc);
          if (sender) {
            sender.replaceTrack(cameraTrack).catch(function () {});
          }
        }
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = stream;
        setSharingScreen(true);
        wsSend({ type: "screen-share", roomId: meetingCode, sharing: true });

        const screenTrack = stream.getVideoTracks()[0];
        const allPeers = Object.values(peersRef.current);
        for (const peer of allPeers) {
          const sender = findVideoSender(peer.pc);
          if (sender) {
            sender.replaceTrack(screenTrack).catch(function () {});
          }
        }

        screenTrack.onended = function () {
          toggleScreenShare();
        };
      } catch (err) {
      }
    }
  }

  const totalPeople = peers.length + 1;
  const sharerPeer = sharerSocketId ? peersRef.current[sharerSocketId] : null;
  const anyScreenShare = sharingScreen || Boolean(sharerPeer && sharerPeer.stream);

  const roomStyle = isMobile
    ? { flex: 1, backgroundColor: "#17122B" }
    : { flex: 1, backgroundColor: "#17122B", padding: 12 };

  const columns = gridColumnCount(totalPeople, isMobile);
  const gridGap = 8;
  const gridPadding = 12;
  const mainAreaWidth = isMobile ? windowSize.width : windowSize.width - 24;
  const tileWidth = (mainAreaWidth - gridPadding * 2 - gridGap * (columns - 1)) / columns;

  function attachScreenShareVideo(el) {
    if (!el) {
      return;
    }
    if (sharingScreen) {
      el.srcObject = screenStreamRef.current;
    } else if (sharerPeer) {
      el.srcObject = sharerPeer.stream || null;
    } else {
      el.srcObject = null;
    }
  }

  return (
    <View style={roomStyle}>
      <View style={[styles.mainArea, isMobile && styles.mainAreaMobile]}>
        {anyScreenShare && (
          <video
            ref={attachScreenShareVideo}
            autoPlay
            playsInline
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              background: "#000",
              display: "block",
              zIndex: 1,
            }}
          />
        )}

        {!anyScreenShare && (
          <View style={styles.grid}>
            <View style={{ width: tileWidth, aspectRatio: 4 / 3 }}>
              <SelfTile videoRef={localVideoRef} cameraOn={cameraOn} name={myName} handRaised={handRaised} />
            </View>
            {peers.map(function (peer) {
              return (
                <View key={peer.socketId} style={{ width: tileWidth, aspectRatio: 4 / 3 }}>
                  <PeerTile peer={peer} />
                </View>
              );
            })}
          </View>
        )}

        <View style={[styles.titleBox, { zIndex: 2 }]}>
          <Text style={styles.titleText}>{meetingCode}</Text>
          <Text style={styles.titleSub}>{totalPeople} in room</Text>
        </View>
      </View>

      {chatOpen && (
        <View style={[styles.panel, isMobile && styles.panelMobile]}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Chat</Text>
            <Pressable
              onPress={function () {
                setChatOpen(false);
              }}
              hitSlop={12}
            >
              <Text style={styles.panelClose}>X</Text>
            </Pressable>
          </View>
          <ScrollView style={{ flex: 1 }}>
            {messages.length === 0 && <Text style={styles.empty}>No messages yet.</Text>}
            {messages.map(function (message) {
              return (
                <View key={message.id} style={styles.msgBubble}>
                  <Text style={styles.msgSender}>
                    {message.sender} - {message.time}
                  </Text>
                  <Text style={styles.msgText}>{message.text}</Text>
                </View>
              );
            })}
          </ScrollView>
          <View style={styles.inputRow}>
            <TextInput
              value={chatInput}
              onChangeText={setChatInput}
              onSubmitEditing={sendMessage}
              placeholder="Type a message..."
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={styles.input}
              returnKeyType="send"
            />
            <Pressable onPress={sendMessage} style={styles.sendBtn}>
              <Text style={styles.sendBtnText}>Send</Text>
            </Pressable>
          </View>
        </View>
      )}

      {participantsOpen && (
        <View style={[styles.panel, isMobile && styles.panelMobile]}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Participants ({totalPeople})</Text>
            <Pressable
              onPress={function () {
                setParticipantsOpen(false);
              }}
              hitSlop={12}
            >
              <Text style={styles.panelClose}>X</Text>
            </Pressable>
          </View>
          <ScrollView style={{ flex: 1 }}>
            <View style={styles.pRow}>
              <View style={styles.pAvatar}>
                <Text style={styles.pAvatarText}>{initials(myName)}</Text>
              </View>
              <Text style={styles.pName} numberOfLines={1}>
                {myName} (you)
              </Text>
              {handRaised && <Text style={styles.pHand}>✋</Text>}
            </View>
            {peers.map(function (peer) {
              return (
                <View key={peer.socketId} style={styles.pRow}>
                  <View style={styles.pAvatar}>
                    <Text style={styles.pAvatarText}>{initials(peer.userName || peer.userId)}</Text>
                  </View>
                  <Text style={styles.pName} numberOfLines={1}>
                    {peer.userName || emailToName(peer.userId)}
                  </Text>
                  {peer.handRaised && <Text style={styles.pHand}>✋</Text>}
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={[styles.barWrap, isMobile && styles.barWrapMobile]}>
        <View style={styles.bar}>
          <CircleButton icon={ICONS.mic} off={!micOn} onPress={toggleMic} />
          <CircleButton icon={ICONS.camera} off={!cameraOn} onPress={toggleCamera} />
          <CircleButton
            icon={ICONS.group}
            active={participantsOpen}
            onPress={function () {
              setParticipantsOpen(!participantsOpen);
              setChatOpen(false);
            }}
          />
          <CircleButton
            icon={ICONS.chat}
            active={chatOpen}
            onPress={function () {
              setChatOpen(!chatOpen);
              setParticipantsOpen(false);
            }}
          />
          <CircleButton label="✋" big={true} active={handRaised} onPress={toggleHand} />

          {Platform.OS === "web" && (
            <View style={styles.moreWrap}>
              {moreOpen && (
                <View style={styles.morePopup}>
                  <Pressable
                    onPress={function () {
                      toggleScreenShare();
                      setMoreOpen(false);
                    }}
                    style={styles.moreItem}
                  >
                    <Text style={styles.moreItemText}>{sharingScreen ? "Stop sharing" : "Share Screen"}</Text>
                  </Pressable>
                </View>
              )}
              <CircleButton
                label="More"
                active={moreOpen}
                onPress={function () {
                  setMoreOpen(!moreOpen);
                }}
              />
            </View>
          )}

          <View style={styles.timer}>
            <View style={styles.timerDot} />
            <Text style={styles.timerText}>{clockText}</Text>
          </View>

          <Pressable
            onPress={function () {
              onLeave(transcript);
            }}
            style={styles.endBtn}
            hitSlop={6}
          >
            <Text style={styles.endBtnText}>End</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainArea: { flex: 1, borderRadius: 16, overflow: "hidden", backgroundColor: "#241B45", position: "relative" },
  mainAreaMobile: { flex: 1, borderRadius: 0 },

  grid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    alignContent: "center",
    padding: 12,
    gap: 8,
  },

  titleBox: { position: "absolute", top: 14, left: 14, backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  titleText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  titleSub: { color: "rgba(255,255,255,0.75)", fontSize: 11 },

  panel: { position: "absolute", top: 0, right: 0, bottom: 0, width: 290, backgroundColor: "#1A1330", borderLeftWidth: 1, borderLeftColor: "#3A2D6B", padding: 14, paddingBottom: 90, zIndex: 25 },
  panelMobile: { left: 0, right: 0, width: "100%", top: "auto", height: "60%", borderLeftWidth: 0, borderTopWidth: 1, borderTopColor: "#3A2D6B", paddingBottom: 90 },
  panelHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  panelTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  panelClose: { color: "rgba(255,255,255,0.6)", fontSize: 18, padding: 4 },
  empty: { color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center", marginTop: 20 },
  msgBubble: { marginBottom: 12 },
  msgSender: { color: COLORS.primary, fontSize: 12, fontWeight: "700", marginBottom: 2 },
  msgText: { color: "#fff", fontSize: 14 },
  inputRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  input: { flex: 1, backgroundColor: "#241B45", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, color: "#fff", fontSize: 14 },
  sendBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, justifyContent: "center" },
  sendBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  pRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12, paddingRight: 8 },
  pAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.primaryDark || "#3A2D6B", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  pAvatarText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  pName: { color: "#fff", fontSize: 14, flex: 1 },
  pHand: { fontSize: 16, marginLeft: 4, color: "#fff", fontWeight: "700" },

  barWrap: { position: "absolute", left: 0, right: 0, bottom: 20, alignItems: "center", zIndex: 20 },
  barWrapMobile: { bottom: 12 },
  bar: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#0F0B1F", borderRadius: 32, paddingHorizontal: 14, paddingVertical: 10, flexWrap: "wrap", justifyContent: "center", maxWidth: "95%" },
  btn: { width: 46, height: 46, borderRadius: 23, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  btnOff: { backgroundColor: "#FF3B30" },
  btnActive: { backgroundColor: COLORS.primary },
  btnIcon: { width: 22, height: 22 },
  btnLabel: { fontSize: 11, fontWeight: "700", color: "#fff" },
  btnLabelBig: { fontSize: 20 },
  timer: { flexDirection: "row", alignItems: "center", gap: 5, marginHorizontal: 4 },
  timerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF4D4D" },
  timerText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  endBtn: { backgroundColor: "#FF3B30", borderRadius: 22, paddingHorizontal: 18, height: 44, alignItems: "center", justifyContent: "center" },
  endBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  moreWrap: { alignItems: "center" },
  morePopup: { position: "absolute", bottom: 56, backgroundColor: "#1A1330", borderRadius: 10, borderWidth: 1, borderColor: "#3A2D6B", paddingVertical: 6, paddingHorizontal: 4, minWidth: 140 },
  moreItem: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  moreItemText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
