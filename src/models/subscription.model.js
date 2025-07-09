import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, // one who is subscribing us user ki _id
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId, // one to whom is 'subscriber' is subscribing us user ki _id 
      ref: "User",
    },
  },
  { timestamps: true }
);


export const Subscription = mongoose.model("Subscription",subscriptionSchema)
