// models/Enrollment.js
const mongoose = require("mongoose");

const EnrollmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    // optional fields – add if your form has them:
    profession: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    hasMainCourse: { type: Boolean, default: false },
    bonuses: { type: [String], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model("enrollments", EnrollmentSchema);
