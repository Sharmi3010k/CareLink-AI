const Appointment = require("../models/Appointment");
const Medication = require("../models/Medication");
const CareTask = require("../models/CareTask");

// ---------------- Appointments ----------------

async function listAppointments(req, res) {
  const { patientId } = req.query;
  const filter = patientId ? { patient: patientId } : { patient: req.user.id };
  const appointments = await Appointment.find(filter).sort({ dateTime: 1 });
  res.json({ appointments });
}

async function createAppointment(req, res) {
  const { patient, title, provider, location, dateTime, notes } = req.body;
  if (!title || !dateTime) {
    return res.status(400).json({ message: "title and dateTime are required" });
  }
  const appointment = await Appointment.create({
    patient: patient || req.user.id,
    title,
    provider,
    location,
    dateTime,
    notes,
    createdBy: req.user.id,
  });
  res.status(201).json({ appointment });
}

async function updateAppointment(req, res) {
  const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!appointment) return res.status(404).json({ message: "Appointment not found" });
  res.json({ appointment });
}

async function deleteAppointment(req, res) {
  const deleted = await Appointment.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: "Appointment not found" });
  res.json({ message: "Appointment deleted" });
}

// ---------------- Medications ----------------

async function listMedications(req, res) {
  const { patientId } = req.query;
  const filter = patientId ? { patient: patientId } : { patient: req.user.id };
  const medications = await Medication.find(filter).sort({ createdAt: -1 });
  res.json({ medications });
}

async function createMedication(req, res) {
  const { patient, name, dosage, frequencyPerDay, preferredTimes, startDate, endDate } = req.body;
  if (!name) return res.status(400).json({ message: "name is required" });

  const medication = await Medication.create({
    patient: patient || req.user.id,
    name,
    dosage,
    frequencyPerDay,
    preferredTimes,
    startDate,
    endDate,
  });
  res.status(201).json({ medication });
}

async function logDose(req, res) {
  const { status, scheduledFor, takenAt } = req.body;
  const medication = await Medication.findById(req.params.id);
  if (!medication) return res.status(404).json({ message: "Medication not found" });

  medication.doseLog.push({
    scheduledFor: scheduledFor || new Date(),
    takenAt: status === "taken" ? takenAt || new Date() : undefined,
    status: status || "taken",
  });
  await medication.save();
  res.json({ medication });
}

// ---------------- Care Tasks ----------------

async function listTasks(req, res) {
  const { patientId } = req.query;
  const filter = patientId ? { patient: patientId } : { patient: req.user.id };
  const tasks = await CareTask.find(filter).sort({ dueDate: 1 });
  res.json({ tasks });
}

async function createTask(req, res) {
  const { patient, title, description, dueDate, assignedTo, priority } = req.body;
  if (!title) return res.status(400).json({ message: "title is required" });

  const task = await CareTask.create({
    patient: patient || req.user.id,
    title,
    description,
    dueDate,
    assignedTo,
    priority,
  });
  res.status(201).json({ task });
}

async function toggleTask(req, res) {
  const task = await CareTask.findById(req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });
  task.completed = !task.completed;
  await task.save();
  res.json({ task });
}

module.exports = {
  listAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  listMedications,
  createMedication,
  logDose,
  listTasks,
  createTask,
  toggleTask,
};
