import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";
import * as cheerio from "cheerio";

admin.initializeApp();
const db = admin.firestore();

// 대회 정보 인터페이스
interface Competition {
    title: string;
    location: string;
    applyStartDate: string;
    applyEndDate: string;
    eventDate: string;
    sourceUrl: string;
    content: string;
    status: 'active' | 'closed' | 'upcoming';
    createdAt: string;
}

/**
 * 대한 파크골프협회 대회 정보 크롤링 (예시 전문 사이트)
 * 실제 사이트 구조에 맞춰 주기적으로 업데이트가 필요합니다.
 */
export const crawlParkGolfCompetitions = functions.pubsub
    .schedule("every 24 hours")
    .onRun(async (context) => {
        try {
            console.log("Starting competition crawler...");

            // 1. 대한파크골프협회 대회정보 게시판 (예시 URL)
            const targetUrl = "http://www.kpga7330.com/bbs/board.php?bo_table=contest";
            const { data: html } = await axios.get(targetUrl);
            const $ = cheerio.load(html);

            const newCompetitions: Competition[] = [];

            // 게시판 목록 파싱 (사이트 구조에 맞게 셀렉터 수정 필요)
            // 예시: .td_subject a 요소를 찾아서 제목과 링크 추출
            $(".td_subject a").each((i, el) => {
                const title = $(el).text().trim();
                const link = $(el).attr("href") || targetUrl;

                // 간단한 필터링: 이미 지난 대회는 패스 (제목에 연도 등이 있을 경우)
                if (title.includes("2026") || title.includes("2025")) {
                    newCompetitions.push({
                        title,
                        location: "상세내용 참조", // 목록에서 알 수 없는 경우 상세페이지 파싱 필요
                        applyStartDate: new Date().toISOString().split('T')[0], // 샘플
                        applyEndDate: new Date().toISOString().split('T')[0], // 샘플
                        eventDate: new Date().toISOString().split('T')[0], // 샘플
                        sourceUrl: link,
                        content: "게시판 상세 내용을 확인해주세요.",
                        status: "upcoming",
                        createdAt: new Date().toISOString(),
                    });
                }
            });

            console.log(`Found ${newCompetitions.length} items. Checking for new ones...`);

            for (const comp of newCompetitions) {
                // 제목 기반 중복 체크
                const snapshot = await db.collection("competitions")
                    .where("title", "==", comp.title)
                    .get();

                if (snapshot.empty) {
                    // 2. 신규 대회 저장
                    const docRef = await db.collection("competitions").add(comp);
                    console.log(`Added new competition: ${comp.title}`);

                    // 3. 푸시 알림 발송
                    const message = {
                        notification: {
                            title: "🆕 새로운 파크골프 대회 소식!",
                            body: `${comp.title}\n지금 모집 정보를 확인해보세요!`,
                        },
                        topic: "competitions", // 전체 구독자 대상
                    };

                    await admin.messaging().send(message);
                    console.log("Notification sent successfully");
                }
            }

            return null;
        } catch (error) {
            console.error("Crawler Error:", error);
            return null;
        }
    });

/**
 * 테스트용 HTTP 함수 (수동 실행 가능)
 */
export const manualCrawl = functions.https.onRequest(async (req, res) => {
    // 보안을 위해 실제 서비스에서는 인증 로직 추가 권장
    await (crawlParkGolfCompetitions as any).run({});
    res.send("Crawler triggered manually.");
});
