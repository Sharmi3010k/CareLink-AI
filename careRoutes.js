const express = require("express");
const { requireAuth } = require("../middleware/auth");
const care = require("../controllers/careController");

const router = express.Router();
router.use(requireAuth);

// Appointments
router.get("/appointments", care.listAppointments);
router.post("/appointments", care.createAppointment);
router.put("/appointments/:id", care.updateAppointment);
router.delete("/appointments/:id", care.deleteAppointment);

// Medications
router.get("/medications", care.listMedications);
router.post("/medications", care.createMedication);
router.post("/medications/:id/log-dose", care.logDose);

// Care tasks
router.get("/tasks", care.listTasks);
router.post("/tasks", care.createTask);
router.patch("/tasks/:id/toggle", care.toggleTask);

module.exports = router;
