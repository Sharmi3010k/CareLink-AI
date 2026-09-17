const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    provider: { type: String, trim: true },
    location: { type: String, trim: true },
    dateTime: { type: Date, required: true },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ["upcoming", "completed", "cancelled"],
      default: "upcoming",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

appointmentSchema.index({ patient: 1, dateTime: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
