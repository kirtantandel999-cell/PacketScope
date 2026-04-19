import mongoose from "mongoose";

const flagsSchema = new mongoose.Schema(
  {
    syn: { type: Boolean, default: false },
    ack: { type: Boolean, default: false },
    fin: { type: Boolean, default: false },
    rst: { type: Boolean, default: false },
    psh: { type: Boolean, default: false }
  },
  { _id: false }
);

const packetSchema = new mongoose.Schema(
  {
    // Store timestamps as Date while accepting ISO strings from the sniffer route.
    timestamp: { type: Date, required: true, index: true },
    src_ip: { type: String, default: null },
    dst_ip: { type: String, default: null },
    src_port: { type: Number, default: null },
    dst_port: { type: Number, default: null },
    protocol: {
      type: String,
      enum: ["TCP", "UDP", "ICMP", "ARP", "OTHER"],
      required: true,
      index: true
    },
    length: { type: Number, default: null },
    ttl: { type: Number, default: null },
    flags: { type: flagsSchema, default: () => ({}) },
    raw_summary: { type: String, required: true },
    payload_preview: { type: String, default: "" }
  },
  {
    timestamps: false,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

packetSchema.index({ timestamp: 1, protocol: 1 });

export default mongoose.models.Packet || mongoose.model("Packet", packetSchema);
