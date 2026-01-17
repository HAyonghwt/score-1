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

// --- [1] Scheduled Crawler (Runs every day at 8:00 AM KST) ---
export const crawlParkGolfCompetitions = functions
    .region("us-central1")
    .pubsub.schedule("0 8 * * *")
    .timeZone("Asia/Seoul")
    .onRun(async (context) => {
        console.log("Auto-crawler started at:", new Date().toISOString());
        await runCrawler();
        return null;
    });

// --- [2] Manual Trigger for Testing (HTTP) ---
export const manualCrawl = functions
    .region("us-central1")
    .https.onRequest(async (req, res) => {
        try {
            const result = await runCrawler();
            res.status(200).send(`Crawler triggered manually. Result: ${result}`);
        } catch (error) {
            console.error("Manual crawl failed:", error);
            res.status(500).send("Crawl failed.");
        }
    });

// --- Shared Crawler Logic ---
async function runCrawler() {
    // Dynamic imports to reduce cold start time
    const axios = (await import("axios")).default;
    const cheerio = (await import("cheerio"));
    // const { format, addDays } = await import("date-fns");

    const db = getDB();
    const messaging = getMessaging();

    // 예시 URL: 대한파크골프협회 (실제 크롤링 대상에 맞춰 수정 필요)
    // 현재는 예시로 기존 URL을 유지하거나, 실제 작동하는지 확인이 필요한 URL을 넣습니다.
    // 여기서는 구조상 오류가 없도록 일반적인 요청으로 처리합니다.
    const targetUrl = "http://www.kpgath.com/game/game01.html";
    let newCompetitionsCount = 0;

    try {
        // 실제 사이트 구조가 바뀌었을 수 있으므로 예외 처리를 강화합니다.
        const { data } = await axios.get(targetUrl);
        const $ = cheerio.load(data);

        const competitions: any[] = [];

        // 예시 선택자입니다. 실제 사이트 HTML 구조에 맞춰야 합니다.
        $("table.tbl_board tbody tr").each((index, element) => {
            const title = $(element).find("td.subject a").text().trim();
            const dateRaw = $(element).find("td.date").text().trim(); // 예: 2023.10.25
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
            // Duplicate Check (by title)
            const existingDocs = await db
                .collection("competitions")
                .where("title", "==", comp.title)
                .limit(1)
                .get();

            if (!existingDocs.empty) {
                console.log(`Skipping duplicate: ${comp.title}`);
                continue;
            }

            // Add New Competition
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

            // Send FCM Notification
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
            } catch (fcmError) {
                console.error("FCM Send Error:", fcmError);
            }
        }

        return `Crawling Setup Complete. Processed ${competitions.length} items. Added ${newCompetitionsCount} new.`;
    } catch (error) {
        console.error("Crawling Error:", error);
        // 크롤링 실패하더라도 전체 기능이 멈추지 않도록 로그만 남기고 종료
        return "Crawling failed, check logs.";
    }
}
