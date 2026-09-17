const mongoose = require("mongoose");

const triageRecordSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    symptomText: { type: String, required: true },
    urgencyLevel: {
      type: String,
      enum: ["low", "moderate", "high", "emergency"],
      required: true,
    },
    confidence: { type: Number, min: 0, max: 1, required: true },
    escalatedToHuman: { type: Boolean, default: false },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewNotes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TriageRecord", triageRecordSchema);
