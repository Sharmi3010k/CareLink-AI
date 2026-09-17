const mongoose = require("mongoose");

const doseLogSchema = new mongoose.Schema(
  {
    scheduledFor: { type: Date, required: true },
    takenAt: { type: Date }, // null/undefined = missed or not yet due
    status: { type: String, enum: ["taken", "missed", "pending"], default: "pending" },
  },
  { _id: false }
);

const medicationSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    dosage: { type: String, trim: true },
    frequencyPerDay: { type: Number, default: 1, min: 1 },
    preferredTimes: [{ type: String }], // e.g. ["08:00", "20:00"]
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    doseLog: [doseLogSchema],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Medication", medicationSchema);
