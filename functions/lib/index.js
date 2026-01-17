"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.manualCrawl = exports.crawlParkGolfCompetitions = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
let dbRequest = null;
const getDB = () => {
    if (!dbRequest) {
        if (admin.apps.length === 0) {
            admin.initializeApp();
        }
        dbRequest = admin.firestore();
    }
    return dbRequest;
};
let messagingRequest = null;
const getMessaging = () => {
    if (!messagingRequest) {
        if (admin.apps.length === 0) {
            admin.initializeApp();
        }
        messagingRequest = admin.messaging();
    }
    return messagingRequest;
};
exports.crawlParkGolfCompetitions = functions
    .region("us-central1")
    .pubsub.schedule("0 8 * * *")
    .timeZone("Asia/Seoul")
    .onRun(async (context) => {
    console.log("Auto-crawler started at:", new Date().toISOString());
    await runCrawler();
    return null;
});
exports.manualCrawl = functions
    .region("us-central1")
    .https.onRequest(async (req, res) => {
    try {
        const result = await runCrawler();
        res.status(200).send(`Crawler triggered manually. Result: ${result}`);
    }
    catch (error) {
        console.error("Manual crawl failed:", error);
        res.status(500).send("Crawl failed.");
    }
});
async function runCrawler() {
    const axios = (await Promise.resolve().then(() => __importStar(require("axios")))).default;
    const cheerio = (await Promise.resolve().then(() => __importStar(require("cheerio"))));
    const db = getDB();
    const messaging = getMessaging();
    const targetUrl = "http://www.kpgath.com/game/game01.html";
    let newCompetitionsCount = 0;
    try {
        const { data } = await axios.get(targetUrl);
        const $ = cheerio.load(data);
        const competitions = [];
        $("table.tbl_board tbody tr").each((index, element) => {
            const title = $(element).find("td.subject a").text().trim();
            const dateRaw = $(element).find("td.date").text().trim();
            const linkSuffix = $(element).find("td.subject a").attr("href");
            const link = linkSuffix ? `http://www.kpgath.com${linkSuffix}` : targetUrl;
            if (title && dateRaw) {
                competitions.push({
                    title,
                    dateRaw,
                    link,
                });
            }
        });
        console.log(`Found ${competitions.length} items on the page.`);
        for (const comp of competitions) {
            const existingDocs = await db
                .collection("competitions")
                .where("title", "==", comp.title)
                .limit(1)
                .get();
            if (!existingDocs.empty) {
                console.log(`Skipping duplicate: ${comp.title}`);
                continue;
            }
            const newDoc = {
                title: comp.title,
                location: "전국 (자동수집)",
                startDate: comp.dateRaw,
                endDate: comp.dateRaw,
                applicationPeriod: "별도 공지 확인",
                organizer: "대한파크골프협회",
                contact: "",
                link: comp.link,
                status: "접수중",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            await db.collection("competitions").add(newDoc);
            newCompetitionsCount++;
            try {
                const message = {
                    notification: {
                        title: "🏆 새 파크골프 대회 소식!",
                        body: `${comp.title} 정보가 업데이트 되었습니다.`,
                    },
                    topic: "competitions",
                };
                await messaging.send(message);
                console.log(`Notification sent for: ${comp.title}`);
            }
            catch (fcmError) {
                console.error("FCM Send Error:", fcmError);
            }
        }
        return `Crawling Setup Complete. Processed ${competitions.length} items. Added ${newCompetitionsCount} new.`;
    }
    catch (error) {
        console.error("Crawling Error:", error);
        return "Crawling failed, check logs.";
    }
}
//# sourceMappingURL=index.js.map