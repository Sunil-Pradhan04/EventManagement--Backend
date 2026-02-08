import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    verificationCode: {
      type: String,
    },
    isVerified: {
      type: Boolean,
    },
    RegistrEvents: {
      type: [String],
      default: []
    },
    expireAt: {
      type: Date,
      default: () => new Date(Date.now() + 10 * 60 * 1000),
      expires: 0,
    },
  },
  { timestamps: true }
);

const AdminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    verificationCode: {
      type: String,
    },
    isVerified: {
      type: Boolean,
    },
    events:{
      type:[String],
      default:[],
    },
    RegistrEvents:{
      type: [String],
      default: [],
    },
    expireAt: {
      type: Date,
      default: () => new Date(Date.now() + 10 * 60 * 1000),
      expires: 0,
    },
  },
  { timestamps: true }
);

const passwordResetSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  resetCode: {
    type: String,
    required: true,
  },
  role:{
    type: String,
  },
  expireAt: {
    type: Date,
    default: () => new Date(Date.now() + 10 * 60 * 1000),
    expires: 0,
  },
})
const configs = new mongoose.Schema({
  password: {
    type: String,
  },
});
export const config = mongoose.model("config", configs);

export const User = mongoose.model("users", UserSchema);
export const Admin = mongoose.model("admins", AdminSchema);
export const PasswordReset = mongoose.model("passwordResets", passwordResetSchema);
