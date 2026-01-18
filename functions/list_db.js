const admin = require("firebase-admin");

if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();

async function listCompetitions() {
    console.log("--- Current Competitions in DB ---");
    const snapshot = await db.collection("competitions").orderBy("createdAt", "desc").get();
    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`ID: ${doc.id}`);
        console.log(`Title: ${data.title}`);
        console.log(`Source: ${data.source}`);
        console.log(`URL: ${data.sourceUrl}`);
        console.log("-----------------------------------");
    });
}

listCompetitions().catch(console.error);
