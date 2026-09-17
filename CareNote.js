const mongoose = require("mongoose");

const careNoteSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rawText: { type: String, required: true },
    aiSummary: { type: String },
    summaryGeneratedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CareNote", careNoteSchema);
