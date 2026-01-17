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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.manualCrawl = exports.crawlParkGolfCompetitions = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
admin.initializeApp();
const db = admin.firestore();
exports.crawlParkGolfCompetitions = functions.pubsub
    .schedule("every 24 hours")
    .onRun(async (context) => {
    try {
        console.log("Starting competition crawler...");
        const targetUrl = "http://www.kpga7330.com/bbs/board.php?bo_table=contest";
        const { data: html } = await axios_1.default.get(targetUrl);
        const $ = cheerio.load(html);
        const newCompetitions = [];
        $(".td_subject a").each((i, el) => {
            const title = $(el).text().trim();
            const link = $(el).attr("href") || targetUrl;
            if (title.includes("2026") || title.includes("2025")) {
                newCompetitions.push({
                    title,
                    location: "상세내용 참조",
                    applyStartDate: new Date().toISOString().split('T')[0],
                    applyEndDate: new Date().toISOString().split('T')[0],
                    eventDate: new Date().toISOString().split('T')[0],
                    sourceUrl: link,
                    content: "게시판 상세 내용을 확인해주세요.",
                    status: "upcoming",
                    createdAt: new Date().toISOString(),
                });
            }
        });
        console.log(`Found ${newCompetitions.length} items. Checking for new ones...`);
        for (const comp of newCompetitions) {
            const snapshot = await db.collection("competitions")
                .where("title", "==", comp.title)
                .get();
            if (snapshot.empty) {
                const docRef = await db.collection("competitions").add(comp);
                console.log(`Added new competition: ${comp.title}`);
                const message = {
                    notification: {
                        title: "🆕 새로운 파크골프 대회 소식!",
                        body: `${comp.title}\n지금 모집 정보를 확인해보세요!`,
                    },
                    topic: "competitions",
                };
                await admin.messaging().send(message);
                console.log("Notification sent successfully");
            }
        }
        return null;
    }
    catch (error) {
        console.error("Crawler Error:", error);
        return null;
    }
});
exports.manualCrawl = functions.https.onRequest(async (req, res) => {
    await exports.crawlParkGolfCompetitions.run({});
    res.send("Crawler triggered manually.");
});
//# sourceMappingURL=index.js.map