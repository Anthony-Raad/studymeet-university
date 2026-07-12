import { WebSocketServer } from "ws";

const rooms = new Map();
let nextSocketId = 1;

function roomBroadcast(roomId, message, skipSocketId) {
  const room = rooms.get(roomId);
  if (!room) {
    return;
  }

  const text = JSON.stringify(message);

  for (const [socketId, peer] of room) {
    if (socketId !== skipSocketId && peer.ws.readyState === 1) {
      peer.ws.send(text);
    }
  }
}

export function setupWebSocket(httpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", function (ws) {
    ws.socketId = String(nextSocketId);
    nextSocketId = nextSocketId + 1;
    ws.currentRoom = null;
    ws.userId = null;
    ws.userName = null;

    ws.on("message", function (raw) {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch (err) {
        return;
      }

      if (msg.type === "join-room") {
        const roomId = msg.roomId;
        ws.currentRoom = roomId;
        ws.userId = msg.userId;
        ws.userName = msg.userName;

        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Map());
        }
        const room = rooms.get(roomId);

        const existingPeers = [];
        for (const [socketId, peer] of room) {
          existingPeers.push({ socketId: socketId, userId: peer.userId, userName: peer.userName });
        }
        ws.send(JSON.stringify({ type: "existing-users", peers: existingPeers }));

        roomBroadcast(roomId, {
          type: "user-connected",
          socketId: ws.socketId,
          userId: msg.userId,
          userName: msg.userName,
        });

        room.set(ws.socketId, { ws: ws, userId: msg.userId, userName: msg.userName });
      }

      else if (msg.type === "signal") {
        if (!ws.currentRoom) {
          return;
        }
        const room = rooms.get(ws.currentRoom);
        if (!room) {
          return;
        }

        const target = room.get(msg.to);
        if (target && target.ws.readyState === 1) {
          target.ws.send(
            JSON.stringify({
              type: "signal",
              from: ws.socketId,
              userId: ws.userId,
              userName: ws.userName,
              signal: msg.signal,
            })
          );
        }
      }

      else if (msg.type === "chat") {
        roomBroadcast(msg.roomId, { type: "chat", message: msg.message }, ws.socketId);
      }

      else if (msg.type === "raise-hand") {
        roomBroadcast(
          msg.roomId,
          { type: "hand-raise", socketId: ws.socketId, raised: msg.raised },
          ws.socketId
        );
      }

      else if (msg.type === "screen-share") {
        roomBroadcast(
          msg.roomId,
          { type: "screen-share", socketId: ws.socketId, sharing: msg.sharing },
          ws.socketId
        );
      }
    });

    ws.on("close", function () {
      if (ws.currentRoom) {
        roomBroadcast(ws.currentRoom, { type: "user-disconnected", socketId: ws.socketId }, ws.socketId);
        const room = rooms.get(ws.currentRoom);
        if (room) {
          room.delete(ws.socketId);
        }
      }
    });
  });
}
