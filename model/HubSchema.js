import mongoose, { isObjectIdOrHexString, isValidObjectId } from "mongoose";

const EventSchema = new mongoose.Schema(
  {
    EventAdmin: {
      type: [String],
      default: [],
    },
    Ename: {
      type: String,
      required: true,
      trim: true,
    },
    coordinators: {
      type: [String],
      default: [],
      required: true,
    },
    rules: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    contactNumber: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^[0-9]{10}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid contact number!`,
      },
    },
    eventDate: {
      type: Date,
    },
    eventTime: {
      type: String,
    },
    venue: {
      type: String,
    },
    visibility: {
      type: Boolean,
      default: true,
    },
    winners: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["upcoming", "finished"],
      default: "upcoming",
    },
  },
  { timestamps: true }
);

const EventRegistration = new mongoose.Schema({
  eventName: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
});

const EventAnoussmentSchema = new mongoose.Schema(
  {
    Ename: {
      type: String,
      required: true,
    },
    Aheader: {
      type: String,
      required: true,
    },
    Adescription: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const EnrollmentSchema = new mongoose.Schema({
  EventName: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  UserEmail: {
    type: String,
    required: true,
  },
}, { timestamps: true });

export const Event = mongoose.model("Event", EventSchema);
export const ERegistration = mongoose.model(
  "EventRegistration",
  EventRegistration
);
export const EventAnoussment = mongoose.model(
  "EventAnoussment",
  EventAnoussmentSchema
);

export const EnrollmentModel = mongoose.model(
  "Enrollment",
  EnrollmentSchema
);