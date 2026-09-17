/**
 * CareLink AI Service
 * ---------------------------------------------------------------
 * This module centralizes CareLink's three AI features:
 *   1. summarizeCareNote()   - condenses raw notes into a summary
 *   2. classifyUrgency()     - triage / urgency support (decision support, NOT diagnosis)
 *   3. suggestReminderTime() - personalizes reminder timing from adherence history
 *
 * Design choice: every function works with zero external dependencies
 * (pure JS, rule-based) so the app is fully demoable offline / without
 * any API key. If AI_PROVIDER=openai and OPENAI_API_KEY is set in .env,
 * summarizeCareNote() will instead call a real LLM. This keeps a single
 * clean seam for upgrading from "hackathon prototype" to "production AI".
 * ---------------------------------------------------------------
 */

const USE_LLM = process.env.AI_PROVIDER === "openai" && !!process.env.OPENAI_API_KEY;

// ---- 1. Care summarization -------------------------------------------------

async function summarizeCareNote(rawText) {
  if (USE_LLM) {
    return summarizeWithLLM(rawText);
  }
  return summarizeWithRules(rawText);
}

/**
 * Rule-based fallback summarizer.
 * Strategy: split into sentences, score each by keyword relevance
 * (medical/action terms weighted higher), and keep the top N sentences
 * in original order. This is a simple extractive summarizer -- good
 * enough for demo purposes and fully transparent/explainable.
 */
function summarizeWithRules(rawText, maxSentences = 3) {
  const cleaned = rawText.replace(/\s+/g, " ").trim();
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);

  if (sentences.length <= maxSentences) {
    return cleaned;
  }

  const keywordWeights = {
    diagnosis: 3, prescribed: 3, medication: 2, dosage: 2,
    "follow-up": 3, "follow up": 3, allergy: 3, pain: 2, symptom: 2,
    blood: 2, pressure: 2, surgery: 3, emergency: 4, urgent: 4,
    appointment: 2, referral: 2, test: 1, result: 2, lab: 2,
    discharge: 2, instructions: 2,
  };

  const scored = sentences.map((sentence, index) => {
    const lower = sentence.toLowerCase();
    let score = 0;
    for (const [kw, weight] of Object.entries(keywordWeights)) {
      if (lower.includes(kw)) score += weight;
    }
    // Slight preference for earlier sentences (often contain the main point)
    score += Math.max(0, 2 - index * 0.3);
    return { sentence, score, index };
  });

  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => a.index - b.index)
    .map((s) => s.sentence);

  return top.join(" ");
}

async function summarizeWithLLM(rawText) {
  // Plug-in point for a real LLM call. Kept isolated so swapping providers
  // (OpenAI, Anthropic, etc.) only touches this one function.
  const OpenAI = require("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You summarize clinical/caregiver notes into a short, factual summary " +
          "for a caregiver or provider. Preserve all medically relevant facts " +
          "(diagnoses, medications, dosages, follow-ups, allergies). Do not add " +
          "information that isn't in the source text. Keep it under 4 sentences.",
      },
      { role: "user", content: rawText },
    ],
    temperature: 0.2,
  });

  return response.choices[0].message.content.trim();
}

// ---- 2. Triage / urgency support -------------------------------------------

const URGENCY_RULES = [
  {
    level: "emergency",
    confidence: 0.95,
    keywords: [
      "chest pain", "can't breathe", "cannot breathe", "difficulty breathing",
      "unconscious", "unresponsive", "severe bleeding", "stroke", "seizure",
      "suicidal", "overdose", "anaphylaxis", "not breathing",
    ],
  },
  {
    level: "high",
    confidence: 0.75,
    keywords: [
      "high fever", "severe pain", "vomiting blood", "shortness of breath",
      "confusion", "fainted", "allergic reaction", "broken bone", "severe headache",
    ],
  },
  {
    level: "moderate",
    confidence: 0.6,
    keywords: [
      "fever", "persistent cough", "rash", "swelling", "moderate pain",
      "nausea", "dizziness", "infection",
    ],
  },
  {
    level: "low",
    confidence: 0.55,
    keywords: [
      "mild headache", "runny nose", "sore throat", "minor cut", "tired",
      "mild pain", "cold symptoms",
    ],
  },
];

/**
 * Classifies reported symptoms by relative urgency.
 * IMPORTANT: This is decision support, not a medical diagnosis.
 * Low-confidence or ambiguous cases are always escalated to a human
 * (escalatedToHuman: true) rather than auto-resolved -- see Responsible AI notes.
 */
function classifyUrgency(symptomText) {
  const text = symptomText.toLowerCase();

  for (const rule of URGENCY_RULES) {
    const matched = rule.keywords.some((kw) => text.includes(kw));
    if (matched) {
      return {
        urgencyLevel: rule.level,
        confidence: rule.confidence,
        // Emergency-level and low-confidence results always go to a human.
        escalatedToHuman: rule.level === "emergency" || rule.confidence < 0.65,
        rationale: `Matched pattern associated with "${rule.level}" urgency.`,
      };
    }
  }

  // No keyword match at all -- genuinely ambiguous. Never guess; defer.
  return {
    urgencyLevel: "moderate",
    confidence: 0.4,
    escalatedToHuman: true,
    rationale:
      "No clear pattern matched. Confidence too low for automatic classification -- " +
      "flagged for human review. This is not a diagnosis.",
  };
}

// ---- 3. Smart reminders -----------------------------------------------------

/**
 * Suggests a personalized reminder offset (in minutes, before the scheduled
 * dose time) based on the patient's adherence history for that medication.
 * Logic: if doses are frequently taken late, nudge the reminder earlier.
 * If adherence is consistently good, keep the reminder at a lighter touch.
 */
function suggestReminderTime(doseLog = []) {
  const completed = doseLog.filter((d) => d.status === "taken" && d.takenAt);

  if (completed.length === 0) {
    return { offsetMinutes: 15, reason: "No history yet -- using a standard 15-minute lead time." };
  }

  const lateOffsets = completed.map((d) => {
    const diffMs = new Date(d.takenAt) - new Date(d.scheduledFor);
    return diffMs / 60000; // minutes late (negative = early)
  });

  const avgLateness = lateOffsets.reduce((a, b) => a + b, 0) / lateOffsets.length;
  const missedCount = doseLog.filter((d) => d.status === "missed").length;
  const missedRate = missedCount / doseLog.length;

  let offsetMinutes = 15;
  let reason = "Adherence looks consistent -- keeping the standard reminder lead time.";

  if (avgLateness > 20 || missedRate > 0.3) {
    offsetMinutes = 30;
    reason = "Doses are often taken late or missed -- moving the reminder earlier to 30 minutes ahead.";
  } else if (avgLateness < -10 && missedRate < 0.1) {
    offsetMinutes = 5;
    reason = "Doses are consistently taken early/on time -- a lighter 5-minute reminder is enough.";
  }

  return { offsetMinutes, reason, missedRate: Number(missedRate.toFixed(2)) };
}

module.exports = {
  summarizeCareNote,
  classifyUrgency,
  suggestReminderTime,
};
