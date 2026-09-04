/**
 * SHIVM Auto Feedback & Advanced UID Day-Filter Search Engine - Cloudflare Worker
 * Professional English Ultra-VIP Clean Layout (Zero Emojis)
 * Developer:- @MAFIA_OWNER4 ~ MAFIA-XQ | Community:- @MAFIA_OWNER4 ~ MAFIA-XQ 
 * 
 * Features:
 * 1. Auto-stores every match feedback & photo indexed by Player UID in KV with exact timestamp.
 * 2. Instant Bot Command: 
 *    - /search <UID>          -> Returns all available match feedbacks
 *    - /search <UID> 7days    -> Returns feedbacks from the last 7 days
 *    - /search <UID> 1day     -> Returns feedbacks from the last 24 hours
 *    - /search <UID> 3d       -> Returns feedbacks from the last 3 days
 */

const BOT_TOKEN = "8200826888:AAHKnIAxqYelsDtc1f7o1OGkrz7FlQ4xSFw";
const CHAT_ID = "5588211446";

// In-Memory Fallback Store in case KV is not bound
const IN_MEMORY_FEEDBACKS = new Map();

// Helper to get KV instance regardless of uppercase/lowercase binding name
function getKV(env) {
  if (!env) return null;
  return env.FEEDBACK_STORE || env.feedback_store || env.FEEDBACKS || env.feedbacks || env.KV || null;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;
    const kv = getKV(env);

    // CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "*"
        }
      });
    }

    // Health check & Webhook Auto-Setter
    if (method === "GET") {
      if (url.searchParams.get("setup_webhook") === "1") {
        const webhookUrl = `${url.origin}/webhook`;
        const setupResp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
        const setupJson = await setupResp.text();
        return new Response(setupJson, {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      return new Response("╔══════════════════════════════╗\n║   𝐌𝐀𝐅𝐈𝐀-𝐗𝐐 | 𝐕𝐈𝐏 𝐂𝐋𝐎𝐔𝐃   ║\n╚══════════════════════════════╝\n\n⚡ 𝐒𝐘𝐒𝐓𝐄𝐌 𝐎𝐍𝐋𝐈𝐍𝐄 & 𝐑𝐄𝐀𝐃𝐘\n🔎 𝐕𝐈𝐏 𝐓𝐄𝐋𝐄𝐆𝐑𝐀𝐌 𝐒𝐄𝐀𝐑𝐂𝐇 𝐄𝐍𝐆𝐈𝐍𝐄\n☁️ 𝐂𝐋𝐎𝐔𝐃𝐅𝐋𝐀𝐑𝐄 𝐖𝐎𝐑𝐊𝐄𝐑 𝐀𝐂𝐓𝐈𝐕𝐄\n\n➤ 𝐒𝐄𝐓𝐔𝐏 𝐖𝐄𝐁𝐇𝐎𝐎𝐊 : ?𝐬𝐞𝐭𝐮𝐩_𝐰𝐞𝐛𝐡𝐨𝐨𝐤=𝟏", {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // Telegram Bot Webhook Handler (Processes /search <UID> [days])
    if (method === "POST" && (url.pathname === "/webhook" || url.pathname.endsWith("/webhook"))) {
      try {
        const update = await request.json();
        if (update && update.message && update.message.text) {
          const userChatId = update.message.chat.id;
          const rawText = update.message.text.trim();

          if (rawText === "/start" || rawText === "/help") {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: userChatId,
                text: `╭━━━━〔 👑 𝗠𝗔𝗙𝗜𝗔-𝗫𝗤 〕━━━━╮
┃ ⚡ 𝗩𝗜𝗣 𝗙𝗘𝗘𝗗𝗕𝗔𝗖𝗞 𝗦𝗘𝗔𝗥𝗖𝗛
┃ 🔥 𝗦𝗬𝗦𝗧𝗘𝗠 𝗢𝗡𝗟𝗜𝗡𝗘 & 𝗥𝗘𝗔𝗗𝗬
╰━━━━━━━━━━━━━━━━━━━━━━╯

📌 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦:

🔎 /search <UID>
➜ 𝗩𝗶𝗲𝘄 𝗮𝗹𝗹 𝗺𝗮𝘁𝗰𝗵 𝗳𝗲𝗲𝗱𝗯𝗮𝗰𝗸𝘀

⏱️ /search <UID> <days>
➜ 𝗙𝗶𝗹𝘁𝗲𝗿 𝗯𝘆 𝗻𝘂𝗺𝗯𝗲𝗿 𝗼𝗳 𝗱𝗮𝘆𝘀

💠 𝗘𝗫𝗔𝗠𝗣𝗟𝗘𝗦:

▫️ /search 55763473644
▫️ /search 55763473644 1day
▫️ /search 55763473644 7days
▫️ /search 55763473644 30days

👑 𝗗𝗘𝗩𝗘𝗟𝗢𝗣𝗘𝗥 :- @MAFIA_OWNER4 ~ MAFIA-XQ
🌐 𝗖𝗢𝗠𝗠𝗨𝗡𝗜𝗧𝗬 :- @MAFIA_ABOUT

⚡ 𝗠𝗔𝗙𝗜𝗔-𝗫𝗤 | 𝗩𝗜𝗣 𝗦𝗬𝗦𝗧𝗘𝗠`
              })
            });
            return new Response("OK", { status: 200 });
          }

          // Parse Command: /search <UID> [days] or plain UID [days]
          let searchUid = null;
          let searchDays = null;

          if (rawText.startsWith("/search")) {
            const clean = rawText.replace("/search", "").trim();
            const parts = clean.split(/\s+/);
            if (parts.length >= 1 && parts[0] !== "") {
              searchUid = parts[0];
            }
            if (parts.length >= 2) {
              const dayStr = parts[1].toLowerCase().replace(/[^0-9]/g, "");
              if (dayStr) searchDays = parseInt(dayStr, 10);
            }
          } else {
            const parts = rawText.split(/\s+/);
            if (/^\d{6,15}$/.test(parts[0])) {
              searchUid = parts[0];
              if (parts.length >= 2) {
                const dayStr = parts[1].toLowerCase().replace(/[^0-9]/g, "");
                if (dayStr) searchDays = parseInt(dayStr, 10);
              }
            }
          }

          if (searchUid) {
            let feedbacks = [];
            if (kv) {
              try {
                const stored = await kv.get(`uid_${searchUid}`, { type: "json" });
                if (stored && Array.isArray(stored)) {
                  feedbacks = stored;
                }
              } catch (e) {}
            }

            if (feedbacks.length === 0 && IN_MEMORY_FEEDBACKS.has(searchUid)) {
              feedbacks = IN_MEMORY_FEEDBACKS.get(searchUid);
            }

            if (feedbacks.length === 0) {
              await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: userChatId,
                  text: `[ 𝗠𝗔𝗙𝗜𝗔-𝗫𝗤 𝗩𝗜𝗣 𝗗𝗔𝗧𝗔𝗕𝗔𝗦𝗘 𝗦𝗘𝗔𝗥𝗖𝗛 ]
---------------------------------
UID    : ${searchUid}
Status : No match feedbacks recorded yet for this UID.

Note: Feedbacks are automatically saved to this database as soon as matches are played.

Developer :- @MAFIA_OWNER4 ~ MAFIA-XQ 
Community : @MAFIA_ABOUT`
                })
              });
              return new Response("OK", { status: 200 });
            }

            let filteredFeedbacks = feedbacks;
            let filterLabel = "All History";

            if (searchDays && searchDays > 0) {
              const cutoff = Date.now() - (searchDays * 24 * 60 * 60 * 1000);
              filteredFeedbacks = feedbacks.filter(fb => (fb.timestamp || 0) >= cutoff);
              filterLabel = `Last ${searchDays} Day(s)`;
            }

            if (filteredFeedbacks.length === 0) {
              await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: userChatId,
                  text: `[ 𝗠𝗔𝗙𝗜𝗔-𝗫𝗤 𝗩𝗜𝗣 𝗗𝗔𝗧𝗔𝗕𝗔𝗦𝗘 𝗦𝗘𝗔𝗥𝗖𝗛 ]
---------------------------------
UID    : ${searchUid}
Filter : ${filterLabel}
Status : No feedbacks found within this time period.

Total Recorded Matches: ${feedbacks.length}
Use "/search ${searchUid}" to view full history.

Developer :- @MAFIA_OWNER4 ~ MAFIA-XQ 
Community : @MAFIA_ABOUT`
                })
              });
              return new Response("OK", { status: 200 });
            }

            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: userChatId,
                text: `[ 𝗠𝗔𝗙𝗜𝗔-𝗫𝗤 𝗩𝗜𝗣 𝗗𝗔𝗧𝗔𝗕𝗔𝗦𝗘 𝗦𝗘𝗔𝗥𝗖𝗛 ]
---------------------------------
UID        : ${searchUid}
Filter     : ${filterLabel}
Matches    : Found ${filteredFeedbacks.length} Feedback(s)

Sending photos...`
              })
            });

            for (let i = 0; i < filteredFeedbacks.length; i++) {
              const fb = filteredFeedbacks[i];
              if (fb.file_id) {
                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    chat_id: userChatId,
                    photo: fb.file_id,
                    caption: fb.caption || `Feedback #${i+1} | UID: ${searchUid}`
                  })
                });
              }
            }

            return new Response("OK", { status: 200 });
          }
        }
        return new Response("OK", { status: 200 });
      } catch (err) {
        return new Response("Webhook error: " + err.toString(), { status: 200 });
      }
    }

    // Heartbeat Text Message
    if (method === "POST" && (url.pathname === "/heartbeat" || url.pathname.endsWith("/heartbeat"))) {
      try {
        const text = await request.text();
        const msg = text || "[MAFIA-XQ VIP] Auto Feedback is active in game!";
        
        const tgResp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: CHAT_ID,
            text: msg
          })
        });
        const result = await tgResp.text();
        return new Response(result, {
          status: tgResp.status,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      } catch (err) {
        return new Response("Heartbeat error: " + err.toString(), { status: 500 });
      }
    }

    // Screenshot Photo Upload (Zero Emojis - Universal All-Map VIP Layout + UID Storage)
    if (method === "POST" && (url.pathname === "/screenshot" || url.pathname.endsWith("/screenshot") || url.pathname === "/")) {
      try {
        let rawBuffer = await request.arrayBuffer();
        let uint8 = new Uint8Array(rawBuffer);

        if (!uint8 || uint8.length < 10) {
          return new Response("Invalid payload: data too small", { status: 400 });
        }

        const isBase64 = (uint8[0] === 0x2F && uint8[1] === 0x39 && uint8[2] === 0x6A) ||
                         (uint8[0] === 0x69 && uint8[1] === 0x56 && uint8[2] === 0x42) ||
                         (request.headers.get("content-type") || "").includes("text");

        if (isBase64) {
          try {
            const textDecoder = new TextDecoder();
            const b64Text = textDecoder.decode(uint8).trim();
            const binaryStr = atob(b64Text);
            uint8 = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
              uint8[i] = binaryStr.charCodeAt(i);
            }
          } catch (e) {}
        }

        let mimeType = "image/jpeg";
        let filename = "mafia_shot.jpg";

        if (uint8[0] === 0x89 && uint8[1] === 0x50 && uint8[2] === 0x4E && uint8[3] === 0x47) {
          mimeType = "image/png";
          filename = "mafia_shot.png";
        } else if (uint8[0] === 0xFF && uint8[1] === 0xD8) {
          mimeType = "image/jpeg";
          filename = "mafia_shot.jpg";
        }

        const playerName = request.headers.get("x-meta-name") || "Unknown";
        const playerUid = request.headers.get("x-meta-uid") || "Unknown";
        const playerKills = request.headers.get("x-meta-kills") || "0";
        const playerRank = request.headers.get("x-meta-rank") || "Crown";
        const isVictory = request.headers.get("x-meta-chicken") === "true";

        const now = new Date();
        const timeStr = now.toLocaleTimeString("en-US", { hour12: true, timeZone: "Asia/Kolkata" });
        const dateStr = now.toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata" });

        const headerTitle = isVictory ? 
`[ 𝗠𝗔𝗙𝗜𝗔-𝗫𝗤 𝗔𝗡𝗧𝗜𝗕𝗔𝗡 𝗘𝗡𝗚𝗜𝗡𝗘 ]
[ 𝗠𝗔𝗙𝗜𝗔-𝗫𝗤  𝗠𝗔𝗧𝗖𝗛 𝗩𝗜𝗖𝗧𝗢𝗥𝗬 ]` :
`[ 𝗠𝗔𝗙𝗜𝗔 𝗠𝗢𝗗𝗭 𝗔𝗨𝗧𝗢 𝗙𝗘𝗘𝗗𝗕𝗔𝗖𝗞 ]
[ 𝗠𝗔𝗙𝗜𝗔-𝗫𝗤 𝗩𝗜𝗣 𝗣𝗥𝗘𝗠𝗜𝗨𝗠 ]`;

        const killDisplay = isVictory ? 
          `${playerKills} (Victory Winner)` : 
          `${playerKills} Kills`;

        const captionText = 
`${headerTitle}

╭━━━━━━━━━━━━━━━━━━━━━━━━━━╮
    𝐌𝐀𝐅𝐈𝐀-𝐗𝐐 |  𝐒𝐄𝐂𝐔𝐑𝐄 𝐕𝐄𝐑𝐒𝐈𝐎𝐍
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯

🎮 𝐏𝐋𝐀𝐘𝐄𝐑 ➜ "${playerName}"
🆔 𝐔𝐈𝐃 ➜ "${playerUid}"
📅 𝐓𝐈𝐌𝐄 ➜ "${timeStr} | ${dateStr}"
💀 𝐊𝐈𝐋𝐋𝐒 ➜ "${killDisplay}"
🏆 𝐑𝐀𝐍𝐊 ➜ "${playerRank}"
💎 𝐒𝐓𝐀𝐓𝐔𝐒 ➜ 𝐖𝐈𝐍𝐍𝐄𝐑 𝐖𝐈𝐍𝐍𝐄𝐑 𝐂𝐇𝐈𝐂𝐊𝐄𝐍 𝐃𝐈𝐍𝐍𝐄𝐑 

━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 𝐒𝐘𝐒𝐓𝐄𝐌 𝐒𝐓𝐀𝐓𝐔𝐒
━━━━━━━━━━━━━━━━━━━━━━━━━━

🛡️ 𝐒𝐓𝐀𝐓𝐔𝐒 ➜ 𝐀𝐂𝐓𝐈𝐕𝐄 ✓
⚡ 𝐏𝐄𝐑𝐅𝐎𝐑𝐌𝐀𝐍𝐂𝐄 ➜ 𝐒𝐓𝐀𝐁𝐋𝐄 ✓
👁️ 𝐕𝐈𝐒𝐔𝐀𝐋𝐒 ➜ 𝐑𝐄𝐀𝐃𝐘 ✓
🔐 𝐕𝐄𝐑𝐈𝐅𝐈𝐂𝐀𝐓𝐈𝐎𝐍 ➜ 𝐒𝐄𝐂𝐔𝐑𝐄 ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━
✦ 𝐅𝐑𝐄𝐄 𝐀𝐂𝐂𝐄𝐒𝐒 ✦
━━━━━━━━━━━━━━━━━━━━━━━━━━

👨‍💻 𝐃𝐄𝐕𝐄𝐋𝐎𝐏𝐄𝐑 ➜ @MAFIA_OWNER4 ~ 𝐌𝐀𝐅𝐈𝐀-𝐗𝐐
🌐 𝐂𝐎𝐌𝐌𝐔𝐍𝐈𝐓𝐘 ➜ @MAFIA_ABOUT`;

        const photoForm = new FormData();
        photoForm.append("chat_id", CHAT_ID);
        photoForm.append("photo", new Blob([uint8], { type: mimeType }), filename);
        photoForm.append("caption", captionText);

        const photoResp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
          method: "POST",
          body: photoForm
        });

        const photoResult = await photoResp.text();

        if (photoResp.ok && playerUid && playerUid !== "Unknown") {
          try {
            const photoJson = JSON.parse(photoResult);
            if (photoJson && photoJson.result && photoJson.result.photo) {
              const photoArray = photoJson.result.photo;
              const largestFileId = photoArray[photoArray.length - 1].file_id;

              const entry = {
                file_id: largestFileId,
                caption: captionText,
                timestamp: Date.now()
              };

              if (kv) {
                let existing = [];
                try {
                  const stored = await kv.get(`uid_${playerUid}`, { type: "json" });
                  if (stored && Array.isArray(stored)) existing = stored;
                } catch (e) {}
                existing.push(entry);
                if (existing.length > 200) existing.shift();
                await kv.put(`uid_${playerUid}`, JSON.stringify(existing));
              }

              if (!IN_MEMORY_FEEDBACKS.has(playerUid)) {
                IN_MEMORY_FEEDBACKS.set(playerUid, []);
              }
              const memList = IN_MEMORY_FEEDBACKS.get(playerUid);
              memList.push(entry);
              if (memList.length > 200) memList.shift();
            }
          } catch (e) {}

          return new Response(photoResult, {
            status: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }

        const docForm = new FormData();
        docForm.append("chat_id", CHAT_ID);
        docForm.append("document", new Blob([uint8], { type: mimeType }), filename);
        docForm.append("caption", captionText);

        const docResp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
          method: "POST",
          body: docForm
        });

        const docResult = await docResp.text();
        return new Response(docResult, {
          status: docResp.status,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      } catch (err) {
        return new Response("Screenshot error: " + err.toString(), { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};
