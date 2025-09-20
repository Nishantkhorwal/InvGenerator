import mongoose from "mongoose";

const personSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: false, // not required unless you want it mandatory
      trim: true,
    },
    type: {
      type: String,
      enum: ["Customer", "Broker"],
      required: true,
    },
    image: {
      type: String, // store image URL or file path
      required: true,
    },
    project: {
      type: String, // auto-fill from logged-in user’s project
      required: true,
    },
    remarks: {
      type: String,
      required: false,
    },

    // 👇 New fields for Brokers
    brokerName: {
      type: String,
      required: function () {
        return this.type === "Broker";
      },
      trim: true,
    },
    firmName: {
      type: String,
      required: function () {
        return this.type === "Broker";
      },
      trim: true,
    },
    brokerContactNo: {
      type: String,
      required: function () {
        return this.type === "Broker";
      },
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InvGenUser", // who added this person
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("InvGenEntry", personSchema);
