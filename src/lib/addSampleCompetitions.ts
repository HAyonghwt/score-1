import { collection, addDoc, getDocs, query, where, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function addSampleCompetitions() {
    const competitionsRef = collection(db, 'competitions');

    const samples = [
        {
            title: "2026 태안국제원예 치유박람회 개최기념 전국 파크골프 대회",
            location: "충남 태안군 파크골프장",
            applyStartDate: "2026-03-01",
            applyEndDate: "2026-03-20",
            eventDate: "2026-04-15",
            sourceUrl: "http://www.kpga7330.com",
            status: "upcoming" as const,
            content: "2026 태안국제원예 치유박람회 개최를 기념하여 열리는 전국 규모의 대회입니다. 태안의 아름다운 자연 속에서 펼쳐지는 이번 대회에 많은 참여 바랍니다.",
            createdAt: new Date().toISOString()
        },
        {
            title: "제1회 엘르 파크골프배 아시안컵 (태국 파타야)",
            location: "태국 파타야 시암 파크골프 리조트",
            applyStartDate: "2026-01-10",
            applyEndDate: "2026-01-31",
            eventDate: "2026-02-25",
            sourceUrl: "https://www.youtube.com/results?search_query=파크골프+아시안컵+파타야",
            status: "active" as const,
            content: "아시아 7개국 선수가 참가하는 국제 대회입니다. 태국 파타야의 환상적인 코스에서 열리는 이번 대회는 선착순 모집 중입니다.",
            createdAt: new Date().toISOString()
        },
        {
            title: "2026 국제 파크골프 한일친선 교류대회",
            location: "추후 공지 (한국 개최 예정)",
            applyStartDate: "2026-04-01",
            applyEndDate: "2026-04-30",
            eventDate: "2026-05-20",
            sourceUrl: "http://kpgf.kr",
            status: "upcoming" as const,
            content: "한국과 일본의 파크골프 동호인들이 실력을 겨루고 친선을 도모하는 교류 대회입니다.",
            createdAt: new Date().toISOString()
        }
    ];

    for (const sample of samples) {
        // Check if title already exists
        const q = query(competitionsRef, where("title", "==", sample.title));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            await addDoc(competitionsRef, sample);
        } else {
            // Update existing seed data to match latest code (fixes broken URLs)
            const docRef = querySnapshot.docs[0].ref;
            await updateDoc(docRef, sample);

            // Clean up any extra duplicates if found
            if (querySnapshot.size > 1) {
                const docs = querySnapshot.docs;
                for (let i = 1; i < docs.length; i++) {
                    await deleteDoc(docs[i].ref);
                }
            }
        }
    }
}
