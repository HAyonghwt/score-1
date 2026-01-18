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
exports.unsubscribeFromTopic = exports.subscribeToTopic = exports.manualCrawl = exports.crawlParkGolfCompetitions = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
const messaging = admin.messaging();
function normalizeTitle(title) {
    return title
        .replace(/\s/g, "")
        .replace(/\[.*?\]/g, "")
        .replace(/\(.*?\)/g, "")
        .replace(/제.*?[회회차]/g, "")
        .replace(/모집|안내|공고|요강|참가|일정|소식|전국|초청|기념|배|전|대회|경기|준비|접수|신청/g, "")
        .replace(/열기|고조|집결|개막|연다|개최|활성화|위해|본격|시작|마무리|앞두고|단하루/g, "")
        .replace(/시니어|생활체육|동호인|첫|D-\d+|[0-9]+일|[0-9]+월/g, "")
        .replace(/[^\w\s가-힣]/g, "");
}
exports.crawlParkGolfCompetitions = functions
    .region("us-central1")
    .pubsub.schedule("0 8 * * *")
    .timeZone("Asia/Seoul")
    .onRun(async (context) => {
    await runCrawler();
    return null;
});
exports.manualCrawl = functions
    .region("us-central1")
    .https.onRequest(async (req, res) => {
    try {
        const result = await runCrawler();
        res.status(200).send(`Crawler triggered. Result: ${result}`);
    }
    catch (error) {
        console.error("Manual crawl failed:", error);
        res.status(500).send("Crawl failed.");
    }
});
exports.subscribeToTopic = functions
    .region("us-central1")
    .https.onCall(async (data, context) => {
    const { token, topic } = data || {};
    if (!token || !topic) {
        console.error("Missing token or topic:", { token: !!token, topic: !!topic });
        throw new functions.https.HttpsError("invalid-argument", "Token and topic are required.");
    }
    try {
        console.log(`Subscribing token (...${token.slice(-5)}) to topic: ${topic}`);
        const response = await messaging.subscribeToTopic(token, topic);
        console.log("Subscription success:", response);
        return { success: true, message: `Subscribed to ${topic}`, response };
    }
    catch (error) {
        console.error("Subscription failed:", error);
        throw new functions.https.HttpsError("internal", error.message || "Failed to subscribe.");
    }
});
exports.unsubscribeFromTopic = functions
    .region("us-central1")
    .https.onCall(async (data, context) => {
    const { token, topic } = data || {};
    if (!token || !topic) {
        console.error("Missing token or topic:", { token: !!token, topic: !!topic });
        throw new functions.https.HttpsError("invalid-argument", "Token and topic are required.");
    }
    try {
        console.log(`Unsubscribing token (...${token.slice(-5)}) from topic: ${topic}`);
        const response = await messaging.unsubscribeFromTopic(token, topic);
        console.log("Unsubscription success:", response);
        return { success: true, message: `Unsubscribed from ${topic}`, response };
    }
    catch (error) {
        console.error("Unsubscription failed:", error);
        throw new functions.https.HttpsError("internal", error.message || "Failed to unsubscribe.");
    }
});
const NAVER_CLIENT_ID = "RiNxEzvX2HzMhEycPUmP";
const NAVER_CLIENT_SECRET = "8T3Bm3g78G";
const GOOGLE_API_KEY = "AQ.Ab8RN6KDHFmYk8cIQ5lbVUKiRihIAUby74FKvhsvni5gLaVT6A";
const GOOGLE_CX = "94054eb4630194d53";
async function runCrawler() {
    const axios = (await Promise.resolve().then(() => __importStar(require("axios")))).default;
    const cheerio = (await Promise.resolve().then(() => __importStar(require("cheerio"))));
    const minWriteDate = new Date("2025-11-01");
    let newCompetitionsCount = 0;
    const allCollectedCompetitions = [];
    try {
        const targetUrl = "http://www.kpga7330.com/info/contest.php";
        const { data } = await axios.get(targetUrl, { timeout: 10000 });
        const $ = cheerio.load(data);
        $("table.board_list tbody tr").each((index, element) => {
            const title = $(element).find("td.subject a").text().trim();
            const dateRaw = $(element).find("td.date").text().trim();
            const linkSuffix = $(element).find("td.subject a").attr("href");
            const link = linkSuffix ? `http://www.kpga7330.com/info/${linkSuffix}` : targetUrl;
            if (title && !title.includes("결과") && !title.includes("후기")) {
                if (title.includes("2026") || title.includes("2027")) {
                    allCollectedCompetitions.push({
                        title, normalizedTitle: normalizeTitle(title),
                        location: "전국 (공식협회)", startDate: dateRaw || "", organizer: "대한파크골프협회",
                        link, source: "kpgath", isOfficial: true
                    });
                }
            }
        });
    }
    catch (e) {
        console.error("KPGATH Error", e);
    }
    const searchQueries = ["\"파크골프대회\" 모집 요강", "\"대한파크골프연맹\" 신청", "\"프로파크골프협회\" 공고"];
    for (const q of searchQueries) {
        try {
            const naverNewsUrl = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(q)}&display=15&sort=date`;
            const response = await axios.get(naverNewsUrl, {
                headers: { "X-Naver-Client-Id": NAVER_CLIENT_ID, "X-Naver-Client-Secret": NAVER_CLIENT_SECRET }
            });
            if (response.data?.items) {
                response.data.items.forEach((item) => {
                    const pubDate = new Date(item.pubDate);
                    if (pubDate >= minWriteDate) {
                        const title = item.title.replace(/<[^>]*>?/gm, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
                        allCollectedCompetitions.push({
                            title, normalizedTitle: normalizeTitle(title),
                            description: item.description.replace(/<[^>]*>?/gm, ""),
                            link: item.link, source: "naver_news", organizer: "뉴스 검색"
                        });
                    }
                });
            }
        }
        catch (e) {
            console.error("Naver Search Error", e);
        }
    }
    const keywordGroups = [
        ["신청", "접수", "참가", "모집", "등록", "공고", "요강", "안내"],
        ["참가비", "참가비용", "신청비", "신청비용", "등록비", "비용", "회비", "참가금"],
        ["상금", "시상금", "부상", "포상", "1등", "2등", "3등", "우승", "준우승", "트로피", "상패"],
        ["참가자격", "참가대상", "자격요건", "신청대상"],
        ["신청방법", "접수방법", "신청일시", "신청자", "문의처", "접수처"],
        ["주최", "주관", "후원", "협찬"]
    ];
    const allKeywords = keywordGroups.flat();
    const eventKeywords = ["대회", "배", "경기", "전", "선수권", "대항전", "리그", "마스터즈", "챌린지", "축제", "요강", "공고"];
    const negativeKeywords = ["심판", "관리자", "자격", "지도자", "연수", "강습", "교실", "아카데미", "강사", "강연", "교육", "선교사", "기독교", "교회"];
    const uniqueMap = new Map();
    const filteredCompetitions = allCollectedCompetitions.filter(comp => {
        if (comp.isOfficial) {
            uniqueMap.set(comp.normalizedTitle, comp);
            return true;
        }
        const titleFull = comp.title.replace(/\s/g, "");
        if (!titleFull.includes("파크골프"))
            return false;
        if (negativeKeywords.some(kw => comp.title.includes(kw)))
            return false;
        if (!eventKeywords.some(kw => titleFull.includes(kw)))
            return false;
        const content = (comp.title + " " + (comp.description || "")).replace(/\s/g, "");
        let matchCount = 0;
        for (const kw of allKeywords) {
            if (content.includes(kw))
                matchCount++;
            if (matchCount >= 3) {
                if (uniqueMap.has(comp.normalizedTitle))
                    return false;
                uniqueMap.set(comp.normalizedTitle, comp);
                return true;
            }
        }
        return false;
    });
    const dbRefs = await db.collection("competitions").orderBy("createdAt", "desc").get();
    const seenNormalizedTitles = new Set();
    for (const doc of dbRefs.docs) {
        const data = doc.data();
        const normTitle = normalizeTitle(data.title || "");
        const titleClean = (data.title || "").replace(/\s/g, "");
        const isOfficial = data.source === "kpgath";
        const hasEventWord = eventKeywords.some(kw => titleClean.includes(kw));
        if (seenNormalizedTitles.has(normTitle)) {
            await doc.ref.delete();
            continue;
        }
        const isNegative = negativeKeywords.some(kw => (data.title || "").includes(kw));
        if (isOfficial) {
            if (!titleClean.includes("2026") && !titleClean.includes("2027") || isNegative) {
                await doc.ref.delete();
                continue;
            }
        }
        else {
            if (!titleClean.includes("파크골프") || !hasEventWord || isNegative) {
                await doc.ref.delete();
                continue;
            }
        }
        seenNormalizedTitles.add(normTitle);
    }
    for (const comp of filteredCompetitions) {
        if (seenNormalizedTitles.has(comp.normalizedTitle)) {
            console.log(`Skipping duplicate: ${comp.title} (Normalized: ${comp.normalizedTitle})`);
            continue;
        }
        await db.collection("competitions").add({
            ...comp, status: "active", sourceUrl: comp.link, createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        newCompetitionsCount++;
        seenNormalizedTitles.add(comp.normalizedTitle);
        await messaging.send({
            notification: { title: "🏆 새 파크골프 대회 소식!", body: comp.title },
            topic: "competitions"
        }).catch(e => console.error("FCM Error", e));
    }
    return `Deduplication & Crawling Finished. New: ${newCompetitionsCount}`;
}
//# sourceMappingURL=index.js.map