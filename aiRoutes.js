const express = require("express");
const { requireAuth } = require("../middleware/auth");
const ai = require("../controllers/aiController");

const router = express.Router();
router.use(requireAuth);

// Care summarization
router.post("/summarize", ai.summarizeNote);
router.get("/notes", ai.listNotes);

// Triage / urgency support
router.post("/triage", ai.classifySymptom);
router.patch("/triage/:id/review", ai.reviewTriage);
router.get("/triage", ai.listTriage);

// Smart reminders
router.get("/medications/:id/reminder-suggestion", ai.suggestReminder);

module.exports = router;
