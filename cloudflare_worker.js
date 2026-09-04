/**
 * MAFIA VIP Auto Feedback & Advanced UID Day-Filter Search Engine - Cloudflare Worker
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

      return new Response("MAFIA-XQ VIP Telegram Cloudflare Worker & Search Engine is ONLINE & READY!\n\nTo setup Telegram webhook automatically, visit: ?setup_webhook=1", {
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
                text: 
`[ MAFIA-XQ VIP FEEDBACK SEARCH ENGINE ]
---------------------------------
Commands:
/search <UID>           - View all match feedbacks
/search <UID> <days>    - Filter by number of days (e.g. 1day, 3days, 7days)

Examples:
/search 55763473644
/search 55763473644 1day
/search 55763473644 7days
/search 55763473644 30days

Developer :- @MAFIA_OWNER4 ~ MAFIA-XQ 
Community : 
https://t.me/+NXjr86VVJPg1Y2M1`
              })
            });
            return new Response("OK", { status: 200 });
          }

          // Parse Command: /search <UID> [days] or plain UID [days]
          let searchUid = null;
          let searchDays = null; // null means all history

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
            // Direct UID input (e.g. "55763473644" or "55763473644 7days")
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
            // Retrieve feedbacks from KV or Memory
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
                  text: 
`[ MAFIA-XQ VIP DATABASE SEARCH ]
---------------------------------
UID    : ${searchUid}
Status : No match feedbacks recorded yet for this UID.

Note: Feedbacks are automatically saved to this database as soon as matches are played.

Developer :- @MAFIA_OWNER4 ~ MAFIA-XQ 
Community : 
https://t.me/+NXjr86VVJPg1Y2M1`
                })
              });
              return new Response("OK", { status: 200 });
            }

            // Apply Days Filter if requested
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
                  text: 
`[ MAFIA-XQ VIP DATABASE SEARCH ]
---------------------------------
UID    : ${searchUid}
Filter : ${filterLabel}
Status : No feedbacks found within this time period.

Total Recorded Matches: ${feedbacks.length}
Use "/search ${searchUid}" to view full history.

Developer :- @MAFIA_OWNER4 ~ MAFIA-XQ 
Community : 
https://t.me/+NXjr86VVJPg1Y2M1`
                })
              });
              return new Response("OK", { status: 200 });
            }

            // Send Header Summary
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: userChatId,
                text: 
`[ MAFIA-XQ VIP DATABASE SEARCH ]
---------------------------------
UID        : ${searchUid}
Filter     : ${filterLabel}
Matches    : Found ${filteredFeedbacks.length} Feedback(s)

Sending photos...`
              })
            });

            // Send all matching photos for this UID
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

        // Auto-decode Base64 ASCII if applicable
        const isBase64 = (uint8[0] === 0x2F && uint8[1] === 0x39 && uint8[2] === 0x6A) || // /9j/
                         (uint8[0] === 0x69 && uint8[1] === 0x56 && uint8[2] === 0x42) || // iVBOR
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
          } catch (e) {
            // Keep uint8 as raw if base64 decoding fails
          }
        }

        let mimeType = "image/jpeg";
        let filename = "mafia_shot.jpg";

        // Detect PNG magic bytes vs JPEG
        if (uint8[0] === 0x89 && uint8[1] === 0x50 && uint8[2] === 0x4E && uint8[3] === 0x47) {
          mimeType = "image/png";
          filename = "mafia_shot.png";
        } else if (uint8[0] === 0xFF && uint8[1] === 0xD8) {
          mimeType = "image/jpeg";
          filename = "mafia_shot.jpg";
        }

        // Live In-Game Player Metadata
        const playerName = request.headers.get("x-meta-name") || "Unknown";
        const playerUid = request.headers.get("x-meta-uid") || "Unknown";
        const playerKills = request.headers.get("x-meta-kills") || "0";
        const playerRank = request.headers.get("x-meta-rank") || "Crown";
        const isVictory = request.headers.get("x-meta-chicken") === "true";

        const now = new Date();
        const timeStr = now.toLocaleTimeString("en-US", { hour12: true, timeZone: "Asia/Kolkata" });
        const dateStr = now.toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata" }); // DD/MM/YYYY

        const headerTitle = isVictory ? 
`[ MAFIA-XQ VIP ANTIBAN ENGINE ]
[ MAFIA-XQ VIP MATCH VICTORY ]` :
`[ MAFIA_MODZ VIP AUTO FEEDBACK ]
[ MAFIA-XQ VIP PREMIUM ]`;

        const killDisplay = isVictory ? 
          `${playerKills} (Victory Winner)` : 
          `${playerKills} Kills`;

        // Clean Professional English Layout (Zero Emojis)
        const captionText =
`╭━━━━━━━━━━━━━━━━━━━━━━━━━━╮
       𝙈𝘼𝙁𝙄𝘼-𝙓𝙌 𝙑𝙄𝙋
      𝙈𝘼𝙏𝘾𝙃 𝙁𝙀𝙀𝘿𝘽𝘼𝘾𝙆
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯

𝙍𝙚𝙨𝙪𝙡𝙩  : ${isVictory ? "𝘾𝙝𝙞𝙘𝙠𝙚𝙣 𝘿𝙞𝙣𝙣𝙚𝙧" : "𝙈𝙖𝙩𝙘𝙝 𝘾𝙤𝙢𝙥𝙡𝙚𝙩𝙚𝙙"}
𝙈𝙤𝙙𝙚    : 𝘾𝙡𝙖𝙨𝙨𝙞𝙘
𝙏𝙞𝙢𝙚    : ${dateStr} • ${timeStr}

𝙋𝙡𝙖𝙮𝙚𝙧   : ${playerName}
𝙐𝙄𝘿      : ${playerUid}
𝙆𝙞𝙡𝙡𝙨    : ${killDisplay}
𝘾𝙡𝙖𝙨𝙨𝙞𝙘 𝙍𝙖𝙣𝙠 : ${playerRank}

━━━━━━━━━━━━━━━━━━━━━━━━━━
        𝙑𝙄𝙋 𝙎𝙀𝘾𝙐𝙍𝙄𝙏𝙔
━━━━━━━━━━━━━━━━━━━━━━━━━━
𝘼𝙣𝙩𝙞-𝘽𝙖𝙣       : 𝟭𝟬𝟬% 𝙎𝙀𝘾𝙐𝙍𝙀
𝙑𝙄𝙋 𝙋𝙧𝙤𝙩𝙚𝙘𝙩𝙞𝙤𝙣 : 𝘼𝘾𝙏𝙄𝙑𝙀
𝙑𝙚𝙧𝙞𝙛𝙞𝙘𝙖𝙩𝙞𝙤𝙣   : 𝙑𝙀𝙍𝙄𝙁𝙄𝙀𝘿
━━━━━━━━━━━━━━━━━━━━━━━━━━
      𝙈𝘼𝙁𝙄𝘼-𝙓𝙌 𝙑𝙄𝙋
     𝙋𝙍𝙀𝙈𝙄𝙐𝙈 𝙎𝙔𝙎𝙏𝙀𝙈
━━━━━━━━━━━━━━━━━━━━━━━━━━

𝘿𝙚𝙫𝙚𝙡𝙤𝙥𝙚𝙧 ➜ @MAFIA_OWNER4
𝘾𝙤𝙢𝙢𝙪𝙣𝙞𝙩𝙮 ➜ @MAFIA_ABOUT`;

        // Send as Photo to Primary Channel / Chat
        const photoForm = new FormData();
        photoForm.append("chat_id", CHAT_ID);
        photoForm.append("photo", new Blob([uint8], { type: mimeType }), filename);
        photoForm.append("caption", captionText);

        const photoResp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
          method: "POST",
          body: photoForm
        });

        const photoResult = await photoResp.text();

        // Index the photo under Player UID with Timestamp for /search command
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

              // Save in KV (Persistent across all days)
              if (kv) {
                let existing = [];
                try {
                  const stored = await kv.get(`uid_${playerUid}`, { type: "json" });
                  if (stored && Array.isArray(stored)) existing = stored;
                } catch (e) {}
                existing.push(entry);
                if (existing.length > 200) existing.shift(); // Keep last 200 matches per UID
                await kv.put(`uid_${playerUid}`, JSON.stringify(existing));
              }

              // Save in In-Memory
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

        // If sendPhoto failed, fallback to sendDocument
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

        // Auto-decode Base64 ASCII if applicable
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

        // Detect PNG magic bytes vs JPEG
        if (uint8[0] === 0x89 && uint8[1] === 0x50 && uint8[2] === 0x4E && uint8[3] === 0x47) {
          mimeType = "image/png";
          filename = "mafia_shot.png";
        } else if (uint8[0] === 0xFF && uint8[1] === 0xD8) {
          mimeType = "image/jpeg";
          filename = "mafia_shot.jpg";
        }

        // Live In-Game Player Metadata
        const playerName = request.headers.get("x-meta-name") || "Unknown";
        const playerUid = request.headers.get("x-meta-uid") || "Unknown";
        const playerKills = request.headers.get("x-meta-kills") || "0";
        const playerRank = request.headers.get("x-meta-rank") || "Crown";
        const isVictory = request.headers.get("x-meta-chicken") === "true";

        const now = new Date();
        const timeStr = now.toLocaleTimeString("en-US", { hour12: true, timeZone: "Asia/Kolkata" });
        const dateStr = now.toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata" });

        const headerTitle = isVictory ? 
`[ MAFIA-XQ VIP PREMIUM ]`;

        const killDisplay = isVictory ? 
          `${playerKills} (Victory Winner)` : 
          `${playerKills} Kills`;

        // ====================================================
        // UPDATED FEEDBACK LOOK ONLY
        // ====================================================

        const captionText =
`╭━━━━━━━━━━━━━━━━━━━━━━━━━━╮
       𝙈𝘼𝙁𝙄𝘼-𝙓𝙌 𝙑𝙄𝙋
      𝙈𝘼𝙏𝘾𝙃 𝙁𝙀𝙀𝘿𝘽𝘼𝘾𝙆
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯

𝙍𝙚𝙨𝙪𝙡𝙩  : ${isVictory ? "𝘾𝙝𝙞𝙘𝙠𝙚𝙣 𝘿𝙞𝙣𝙣𝙚𝙧" : "𝙈𝙖𝙩𝙘𝙝 𝘾𝙤𝙢𝙥𝙡𝙚𝙩𝙚𝙙"}
𝙈𝙤𝙙𝙚    : 𝘾𝙡𝙖𝙨𝙨𝙞𝙘
𝙏𝙞𝙢𝙚    : ${dateStr} • ${timeStr}

𝙋𝙡𝙖𝙮𝙚𝙧   : ${playerName}
𝙐𝙄𝘿      : ${playerUid}
𝙆𝙞𝙡𝙡𝙨    : ${killDisplay}
𝘾𝙡𝙖𝙨𝙨𝙞𝙘 𝙍𝙖𝙣𝙠 : ${playerRank}

━━━━━━━━━━━━━━━━━━━━━━━━━━
        𝙑𝙄𝙋 𝙎𝙀𝘾𝙐𝙍𝙄𝙏𝙔
━━━━━━━━━━━━━━━━━━━━━━━━━━
𝘼𝙣𝙩𝙞-𝘽𝙖𝙣       : 𝟭𝟬𝟬% 𝙎𝙀𝘾𝙐𝙍𝙀
𝙑𝙄𝙋 𝙋𝙧𝙤𝙩𝙚𝙘𝙩𝙞𝙤𝙣 : 𝘼𝘾𝙏𝙄𝙑𝙀
𝙑𝙚𝙧𝙞𝙛𝙞𝙘𝙖𝙩𝙞𝙤𝙣   : 𝙑𝙀𝙍𝙄𝙁𝙄𝙀𝘿
━━━━━━━━━━━━━━━━━━━━━━━━━━
      𝙈𝘼𝙁𝙄𝘼-𝙓𝙌 𝙑𝙄𝙋
     𝙋𝙍𝙀𝙈𝙄𝙐𝙈 𝙎𝙔𝙎𝙏𝙀𝙈
━━━━━━━━━━━━━━━━━━━━━━━━━━

𝘿𝙚𝙫𝙚𝙡𝙤𝙥𝙚𝙧 ➜ @MAFIA_OWNER4
𝘾𝙤𝙢𝙢𝙪𝙣𝙞𝙩𝙮 ➜ @MAFIA_ABOUT`;

        // Send as Photo to Primary Channel / Chat
        const photoForm = new FormData();
        photoForm.append("chat_id", CHAT_ID);
        photoForm.append("photo", new Blob([uint8], { type: mimeType }), filename);
        photoForm.append("caption", captionText);

        const photoResp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
          method: "POST",
          body: photoForm
        });

        const photoResult = await photoResp.text();

        // Index the photo under Player UID with Timestamp for /search command
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

              // Save in KV (Persistent across all days)
              if (kv) {
                let existing = [];
                try {
                  const stored = await kv.get(`uid_${playerUid}`, { type: "json" });
                  if (stored && Array.isArray(stored)) existing = stored;
                } catch (e) {}
                existing.push(entry);
                if (existing.length > 200) existing.shift(); // Keep last 200 matches per UID
                await kv.put(`uid_${playerUid}`, JSON.stringify(existing));
              }

              // Save in In-Memory
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

        // If sendPhoto failed, fallback to sendDocument
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
