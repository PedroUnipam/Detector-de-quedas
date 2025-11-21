const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const functions = require("firebase-functions");
const admin = require("firebase-admin");


setGlobalOptions({ maxInstances: 10 });


admin.initializeApp();
const db = admin.firestore();

exports.registrarQueda = functions.https.onRequest(async (req, res) => {
  try {
    const data = req.body;

    await db.collection("quedas").add({
      ...data,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
