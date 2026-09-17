/**
 * Seeds the database with a demo patient, caregiver, appointments,
 * medications (with dose history), and care tasks -- so you can
 * demo CareLink immediately without manually creating data.
 *
 * Run with: npm run seed
 */
require("dotenv").config();
const connectDB = require("../config/db");
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const Medication = require("../models/Medication");
const CareTask = require("../models/CareTask");

async function seed() {
  await connectDB();

  console.log("Clearing existing demo data...");
  await Promise.all([
    User.deleteMany({ email: { $in: ["patient@demo.com", "caregiver@demo.com"] } }),
    Appointment.deleteMany({}),
    Medication.deleteMany({}),
    CareTask.deleteMany({}),
  ]);

  console.log("Creating demo users...");
  const patient = await User.create({
    name: "Aarav Patient",
    email: "patient@demo.com",
    password: "password123",
    role: "patient",
  });

  const caregiver = await User.create({
    name: "Meera Caregiver",
    email: "caregiver@demo.com",
    password: "password123",
    role: "caregiver",
    linkedPatients: [patient._id],
  });

  console.log("Creating appointments...");
  await Appointment.create([
    {
      patient: patient._id,
      title: "Cardiology Follow-up",
      provider: "Dr. Rao",
      location: "City Hospital, Room 4B",
      dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      createdBy: caregiver._id,
    },
    {
      patient: patient._id,
      title: "General Checkup",
      provider: "Dr. Iyer",
      location: "Community Clinic",
      dateTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      createdBy: caregiver._id,
    },
  ]);

  console.log("Creating medications with dose history...");
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  await Medication.create({
    patient: patient._id,
    name: "Metformin",
    dosage: "500mg",
    frequencyPerDay: 2,
    preferredTimes: ["08:00", "20:00"],
    doseLog: [
      { scheduledFor: new Date(now - 3 * day), takenAt: new Date(now - 3 * day + 25 * 60000), status: "taken" },
      { scheduledFor: new Date(now - 2 * day), takenAt: new Date(now - 2 * day + 40 * 60000), status: "taken" },
      { scheduledFor: new Date(now - 1 * day), status: "missed" },
    ],
  });

  console.log("Creating care tasks...");
  await CareTask.create([
    {
      patient: patient._id,
      title: "Refill blood pressure medication",
      dueDate: new Date(Date.now() + 2 * day),
      assignedTo: caregiver._id,
      priority: "high",
    },
    {
      patient: patient._id,
      title: "Share lab results with Dr. Rao",
      dueDate: new Date(Date.now() + 5 * day),
      assignedTo: caregiver._id,
      priority: "medium",
    },
  ]);

  console.log("\nSeed complete. Demo logins:");
  console.log("  Patient:   patient@demo.com   / password123");
  console.log("  Caregiver: caregiver@demo.com / password123");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
