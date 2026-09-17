const CareNote = require("../models/CareNote");
const TriageRecord = require("../models/TriageRecord");
const Medication = require("../models/Medication");
const aiService = require("../services/aiService");

// ---- Care summarization ----

async function summarizeNote(req, res) {
  try {
    const { patient, rawText } = req.body;
    if (!rawText || rawText.trim().length < 10) {
      return res.status(400).json({ message: "rawText is required (min 10 characters)" });
    }

    const aiSummary = await aiService.summarizeCareNote(rawText);

    const note = await CareNote.create({
      patient: patient || req.user.id,
      author: req.user.id,
      rawText,
      aiSummary,
      summaryGeneratedAt: new Date(),
    });

    res.status(201).json({ note });
  } catch (err) {
    res.status(500).json({ message: "Summarization failed", error: err.message });
  }
}

async function listNotes(req, res) {
  const { patientId } = req.query;
  const filter = patientId ? { patient: patientId } : { patient: req.user.id };
  const notes = await CareNote.find(filter).sort({ createdAt: -1 });
  res.json({ notes });
}

// ---- Triage / urgency support ----

async function classifySymptom(req, res) {
  try {
    const { patient, symptomText } = req.body;
    if (!symptomText || symptomText.trim().length < 3) {
      return res.status(400).json({ message: "symptomText is required" });
    }

    const result = aiService.classifyUrgency(symptomText);

    const record = await TriageRecord.create({
      patient: patient || req.user.id,
      reportedBy: req.user.id,
      symptomText,
      urgencyLevel: result.urgencyLevel,
      confidence: result.confidence,
      escalatedToHuman: result.escalatedToHuman,
    });

    res.status(201).json({
      record,
      rationale: result.rationale,
      disclaimer:
        "This is AI-generated decision support, not a medical diagnosis. " +
        "If this may be an emergency, seek immediate professional care.",
    });
  } catch (err) {
    res.status(500).json({ message: "Triage classification failed", error: err.message });
  }
}

async function reviewTriage(req, res) {
  // Human-in-the-loop review step -- required before any action is taken
  // on escalated or high/emergency-urgency triage results.
  const { reviewNotes } = req.body;
  const record = await TriageRecord.findById(req.params.id);
  if (!record) return res.status(404).json({ message: "Triage record not found" });

  record.reviewedBy = req.user.id;
  record.reviewNotes = reviewNotes || "Reviewed, no additional notes.";
  record.escalatedToHuman = false;
  await record.save();

  res.json({ record });
}

async function listTriage(req, res) {
  const { patientId } = req.query;
  const filter = patientId ? { patient: patientId } : { patient: req.user.id };
  const records = await TriageRecord.find(filter).sort({ createdAt: -1 });
  res.json({ records });
}

// ---- Smart reminders ----

async function suggestReminder(req, res) {
  const medication = await Medication.findById(req.params.id);
  if (!medication) return res.status(404).json({ message: "Medication not found" });

  const suggestion = aiService.suggestReminderTime(medication.doseLog);
  res.json({ medicationId: medication._id, name: medication.name, ...suggestion });
}

module.exports = {
  summarizeNote,
  listNotes,
  classifySymptom,
  reviewTriage,
  listTriage,
  suggestReminder,
};
