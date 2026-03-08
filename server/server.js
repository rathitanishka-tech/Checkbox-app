import express from "express";
import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import cors from "cors";
import { pub, sub, client } from "./redis.js";
import { rateLimit } from "./rateLimiter.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const SECRET = "secret123";

// LOGIN
app.post("/login", (req, res) => {
  const { username } = req.body;
  const token = jwt.sign({ userId: username }, SECRET);
  res.json({ token });
});

// STATE
app.get("/state", async (req, res) => {
  const bits = await Promise.all(
    Array.from({ length: 1000 }, (_, i) =>
      client.getbit("checkboxes", i)
    )
  );

  res.json(bits);
});

const server = app.listen(3000, () =>
  console.log("Server running on 3000")
);

// WEBSOCKET
const wss = new WebSocketServer({ server });
const clients = new Set();

wss.on("connection", (ws, req) => {
  const token = new URL(req.url, "http://localhost").searchParams.get("token");

  try {
    const user = jwt.verify(token, SECRET);
    ws.userId = user.userId;
  } catch {
    ws.close();
    return;
  }

  clients.add(ws);

  ws.on("message", async (msg) => {
    const data = JSON.parse(msg);

    if (data.type === "TOGGLE") {
      const allowed = await rateLimit(client, ws.userId);

      if (!allowed) {
        ws.send(JSON.stringify({
          type: "RATE_LIMIT"
        }));
        return;
      }

      const current = await client.getbit("checkboxes", data.index);
      const newVal = current === 1 ? 0 : 1;

      await client.setbit("checkboxes", data.index, newVal);

      await pub.publish(
        "updates",
        JSON.stringify({ index: data.index, value: newVal })
      );
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
  });
});

// PUB SUB
sub.subscribe("updates");

sub.on("message", (_, message) => {
  const data = JSON.parse(message);

  clients.forEach((ws) => {
    ws.send(JSON.stringify(data));
  });
});