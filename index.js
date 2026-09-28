const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const qrcode = require("qrcode-terminal");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("Scan this QR code with WhatsApp:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log("🤖 WhatsApp Bot is connected!");
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

      console.log("Connection closed.");

      if (shouldReconnect) {
        startBot();
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    if (!msg.message || msg.key.fromMe) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    if (text.toLowerCase() === "!menu") {
      await sock.sendMessage(msg.key.remoteJid, {
        text:
          "🤖 *BOT MENU*\n\n" +
          "📜 !rules\n" +
          "👋 !welcome\n" +
          "ℹ️ !groupinfo\n" +
          "🤖 !menu"
      });
    }

    if (text.toLowerCase() === "!rules") {
      await sock.sendMessage(msg.key.remoteJid, {
        text:
          "📜 *GROUP RULES*\n\n" +
          "1. Respect everyone.\n" +
          "2. No spam.\n" +
          "3. No unnecessary links.\n" +
          "4. Follow the admins' instructions."
      });
    }

    if (text.toLowerCase() === "!welcome") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "👋 Welcome to the group! Enjoy your stay 🤖🔥"
      });
    }

    if (text.toLowerCase() === "!groupinfo") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `🤖 This bot is online and working!\n\nGroup ID: ${msg.key.remoteJid}`
      });
    }
  });
}

startBot();
