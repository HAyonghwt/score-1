import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

// Lazy initialization of Firestore
let dbRequest: admin.firestore.Firestore | null = null;
const getDB = (): admin.firestore.Firestore => {
    if (!dbRequest) {
        if (admin.apps.length === 0) {
            admin.initializeApp();
        }
        dbRequest = admin.firestore();
    }
    return dbRequest;
};

// Lazy initialization of Messaging
let messagingRequest: admin.messaging.Messaging | null = null;
const getMessaging = (): admin.messaging.Messaging => {
    if (!messagingRequest) {
        if (admin.apps.length === 0) {
            admin.initializeApp();
        }
        messagingRequest = admin.messaging();
    }
    return messagingRequest;
};

// --- Utils: 제목 정규화 (유사성 판단용) ---
function normalizeTitle(title: string): string {
    return title
        .replace(/\s/g, "") // 공백 제거
        .replace(/\[.*?\]/g, "") // 대괄호 내용 제거
        .replace(/\(.*?\)/g, "") // 소괄호 내용 제거
        .replace(/제.*?[회회차]/g, "") // 회차 정보 제거
        // 대회 관련 핵심어 및 뉴스 수식어/동사구 대거 제거
        .replace(/모집|안내|공고|요강|참가|일정|소식|전국|초청|기념|배|전|대회|경기|준비|접수|신청/g, "")
        .replace(/열기|고조|집결|개막|연다|개최|활성화|위해|본격|시작|마무리|앞두고|단하루/g, "")
        .replace(/시니어|생활체육|동호인|첫|D-\d+|[0-9]+일|[0-9]+월/g, "") // 숫자 관련 수식어 제거
        .replace(/[^\w\s가-힣]/g, ""); // 특수문자 제거
}

// --- [1] Scheduled Crawler ---
export const crawlParkGolfCompetitions = functions
    .region("us-central1")
    .pubsub.schedule("0 8 * * *")
    .timeZone("Asia/Seoul")
    .onRun(async (context) => {
        await runCrawler();
        return null;
    });

// --- [2] Manual Trigger ---
export const manualCrawl = functions
    .region("us-central1")
    .https.onRequest(async (req, res) => {
        try {
            const result = await runCrawler();
            res.status(200).send(`Crawler triggered. Result: ${result}`);
        } catch (error) {
            console.error("Manual crawl failed:", error);
            res.status(500).send("Crawl failed.");
        }
    });

// --- [3] Topic Management ---
export const subscribeToTopic = functions
    .region("us-central1")
    .https.onCall(async (data, context) => {
        const { token, topic } = data;
        if (!token || !topic) {
            throw new functions.https.HttpsError("invalid-argument", "Token and topic are required.");
        }
        try {
            await getMessaging().subscribeToTopic(token, topic);
            return { success: true, message: `Subscribed to ${topic}` };
        } catch (error) {
            console.error("Subscription failed:", error);
            throw new functions.https.HttpsError("internal", "Failed to subscribe.");
        }
    });

export const unsubscribeFromTopic = functions
    .region("us-central1")
    .https.onCall(async (data, context) => {
        const { token, topic } = data;
        if (!token || !topic) {
            throw new functions.https.HttpsError("invalid-argument", "Token and topic are required.");
        }
        try {
            await getMessaging().unsubscribeFromTopic(token, topic);
            return { success: true, message: `Unsubscribed from ${topic}` };
        } catch (error) {
            console.error("Unsubscription failed:", error);
            throw new functions.https.HttpsError("internal", "Failed to unsubscribe.");
        }
    });

// --- Constants ---
const NAVER_CLIENT_ID = "RiNxEzvX2HzMhEycPUmP";
const NAVER_CLIENT_SECRET = "8T3Bm3g78G";
const GOOGLE_API_KEY = "AQ.Ab8RN6KDHFmYk8cIQ5lbVUKiRihIAUby74FKvhsvni5gLaVT6A";
const GOOGLE_CX = "94054eb4630194d53";

// --- Shared Crawler Logic ---
async function runCrawler() {
    const axios = (await import("axios")).default;
    const cheerio = (await import("cheerio"));
    const db = getDB();
    const messaging = getMessaging();
    const minWriteDate = new Date("2025-11-01");

    let newCompetitionsCount = 0;
    const allCollectedCompetitions: any[] = [];

    // [1] 공식 협회 (KPGA7330)
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
    } catch (e) { console.error("KPGATH Error", e); }

    // [2] 외부 검색 (네이버, 구글)
    const searchQueries = ["\"파크골프대회\" 모집 요강", "\"대한파크골프연맹\" 신청", "\"프로파크골프협회\" 공고"];
    for (const q of searchQueries) {
        try {
            const naverNewsUrl = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(q)}&display=15&sort=date`;
            const response = await axios.get(naverNewsUrl, {
                headers: { "X-Naver-Client-Id": NAVER_CLIENT_ID, "X-Naver-Client-Secret": NAVER_CLIENT_SECRET }
            });
            if (response.data?.items) {
                response.data.items.forEach((item: any) => {
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
        } catch (e) { console.error("Naver Search Error", e); }
    }

    // [Filter & Internal Deduplication]
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
        if (!titleFull.includes("파크골프")) return false;

        // 1. [필수] 블랙리스트 확인: 심판, 관리자, 교육 등 비대회성 정보 차단
        if (negativeKeywords.some(kw => comp.title.includes(kw))) return false;

        // 2. [필수] 대회 지칭어 확인
        if (!eventKeywords.some(kw => titleFull.includes(kw))) return false;

        const content = (comp.title + " " + (comp.description || "")).replace(/\s/g, "");
        let matchCount = 0;
        for (const kw of allKeywords) {
            if (content.includes(kw)) matchCount++;
            if (matchCount >= 3) {
                // 수집 단계 중복 제거: 이미 유사한 제목이 있으면 스킵
                if (uniqueMap.has(comp.normalizedTitle)) return false;
                uniqueMap.set(comp.normalizedTitle, comp);
                return true;
            }
        }
        return false;
    });

    // [Cleanup & Global Deduplication] 기 수집 데이터 정제
    const dbRefs = await db.collection("competitions").orderBy("createdAt", "desc").get();
    const seenNormalizedTitles = new Set();
    for (const doc of dbRefs.docs) {
        const data = doc.data();
        const normTitle = normalizeTitle(data.title || "");

        // 1. 유효성 체크
        const titleClean = (data.title || "").replace(/\s/g, "");
        const isOfficial = data.source === "kpgath";
        const hasEventWord = eventKeywords.some(kw => titleClean.includes(kw));

        // 2. 중복 체크 (가장 최신 것만 남김)
        if (seenNormalizedTitles.has(normTitle)) {
            await doc.ref.delete();
            continue;
        }

        // 3. 삭제 조건 (공식 외: 파크골프/행사어 미포함 또는 블랙리스트 포함)
        const isNegative = negativeKeywords.some(kw => (data.title || "").includes(kw));

        if (isOfficial) {
            if (!titleClean.includes("2026") && !titleClean.includes("2027") || isNegative) {
                await doc.ref.delete();
                continue;
            }
        } else {
            if (!titleClean.includes("파크골프") || !hasEventWord || isNegative) {
                await doc.ref.delete();
                continue;
            }
        }

        seenNormalizedTitles.add(normTitle);
    }

    // [Save]
    for (const comp of filteredCompetitions) {
        // 이미 DB에 유사 제목이 있는지 체크 (Set 활용)
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
