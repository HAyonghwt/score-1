const admin = require("firebase-admin");

if (admin.apps.length === 0) {
    admin.initializeApp({
        projectId: "contestdate"
    });
}

const db = admin.firestore();

function normalizeTitle(title) {
    return title
        .replace(/\s/g, "")
        .replace(/\[.*?\]/g, "")
        .replace(/\(.*?\)/g, "")
        .replace(/제.*?[회회차]/g, "")
        .replace(/모집|안내|공고|요강|참가|일정|소식/g, "")
        .replace(/[^\w\s가-힣]/g, "");
}

async function diagnose() {
    console.log("--- DB Data Diagnosis ---");
    const snapshot = await db.collection("competitions").orderBy("createdAt", "desc").get();
    const map = new Map();

    snapshot.forEach(doc => {
        const data = doc.data();
        const raw = data.title;
        const norm = normalizeTitle(raw || "");

        console.log(`ID: ${doc.id}`);
        console.log(`Raw:  ${raw}`);
        console.log(`Norm: ${norm}`);
        console.log("-------------------------");

        if (!map.has(norm)) map.set(norm, []);
        map.get(norm).push(doc.id);
    });

    console.log("\n--- Duplicate Groups Found ---");
    map.forEach((ids, norm) => {
        if (ids.length > 1) {
            console.log(`Normalized: ${norm}`);
            console.log(`Count: ${ids.length}`);
            console.log(`IDs: ${ids.join(", ")}`);
            console.log("---");
        }
    });
}

diagnose().catch(console.error);
