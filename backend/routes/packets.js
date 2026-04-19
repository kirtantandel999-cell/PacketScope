import { Router } from "express";
import Packet from "../models/Packet.js";

const router = Router();
let packetIO = null;

export function setPacketSocket(io) {
  packetIO = io;
}

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizePagination = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const buildPacketQuery = (query) => {
  const filters = {};

  if (query.protocol) {
    filters.protocol = String(query.protocol).toUpperCase();
  }

  if (query.src_ip) {
    filters.src_ip = query.src_ip;
  }

  if (query.startDate || query.endDate) {
    filters.timestamp = {};

    if (query.startDate) {
      const start = new Date(query.startDate);
      if (!Number.isNaN(start.getTime())) {
        filters.timestamp.$gte = start;
      }
    }

    if (query.endDate) {
      const end = new Date(query.endDate);
      if (!Number.isNaN(end.getTime())) {
        filters.timestamp.$lte = end;
      }
    }

    if (Object.keys(filters.timestamp).length === 0) {
      delete filters.timestamp;
    }
  }

  if (query.search) {
    const regex = new RegExp(escapeRegex(String(query.search)), "i");
    filters.$or = [
      { src_ip: regex },
      { dst_ip: regex },
      { raw_summary: regex },
      { payload_preview: regex }
    ];
  }

  return filters;
};

const packetToCsvRow = (packet) => {
  const values = [
    packet.timestamp instanceof Date ? packet.timestamp.toISOString() : packet.timestamp,
    packet.src_ip,
    packet.dst_ip,
    packet.src_port,
    packet.dst_port,
    packet.protocol,
    packet.length,
    packet.ttl,
    packet.flags?.syn ?? false,
    packet.flags?.ack ?? false,
    packet.flags?.fin ?? false,
    packet.flags?.rst ?? false,
    packet.flags?.psh ?? false,
    packet.raw_summary,
    packet.payload_preview
  ];

  return values
    .map((value) => {
      if (value === null || value === undefined) {
        return "";
      }

      const stringValue = String(value).replace(/"/g, "\"\"");
      return `"${stringValue}"`;
    })
    .join(",");
};

router.post("/packets", async (req, res) => {
  const {
    raw_summary,
    protocol,
    timestamp,
    src_ip = "",
    dst_ip = "",
    src_port = null,
    dst_port = null,
    length = null,
    ttl = null,
    flags = {},
    payload_preview = ""
  } = req.body || {};

  const missingFields = ["raw_summary", "protocol", "timestamp"].filter((field) => {
    const value = req.body?.[field];
    return value === undefined || value === null || value === "";
  });

  if (missingFields.length) {
    return res.status(400).json({
      error: `Missing required fields: ${missingFields.join(", ")}`
    });
  }

  const normalizedProtocol = ["TCP", "UDP", "ICMP", "ARP"].includes(String(protocol).toUpperCase())
    ? String(protocol).toUpperCase()
    : "OTHER";

  const parsedTimestamp = new Date(timestamp);
  if (Number.isNaN(parsedTimestamp.getTime())) {
    return res.status(400).json({
      error: "Invalid timestamp. Expected a valid ISO date string."
    });
  }

  try {
    const packetPayload = {
      raw_summary,
      protocol: normalizedProtocol,
      timestamp: parsedTimestamp.toISOString(),
      src_ip,
      dst_ip,
      src_port,
      dst_port,
      length,
      ttl,
      flags: {
        syn: Boolean(flags.syn ?? flags.SYN),
        ack: Boolean(flags.ack ?? flags.ACK),
        fin: Boolean(flags.fin ?? flags.FIN),
        rst: Boolean(flags.rst ?? flags.RST),
        psh: Boolean(flags.psh ?? flags.PSH)
      },
      payload_preview
    };

    console.log("Incoming packet:", {
      protocol: packetPayload.protocol,
      src_ip: packetPayload.src_ip,
      dst_ip: packetPayload.dst_ip,
      timestamp: packetPayload.timestamp,
      raw_summary: packetPayload.raw_summary
    });

    const savedPacket = await Packet.create(packetPayload);

    if (packetIO) {
      packetIO.emit("new_packet", savedPacket.toJSON());
    }

    return res.status(201).json({
      status: "stored",
      packet: savedPacket
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
});

router.get("/packets/export", async (req, res) => {
  try {
    const filters = buildPacketQuery(req.query);
    const packets = await Packet.find(filters).sort({ timestamp: -1 }).lean();

    const header = [
      "timestamp",
      "src_ip",
      "dst_ip",
      "src_port",
      "dst_port",
      "protocol",
      "length",
      "ttl",
      "syn",
      "ack",
      "fin",
      "rst",
      "psh",
      "raw_summary",
      "payload_preview"
    ].join(",");

    const csv = [header, ...packets.map(packetToCsvRow)].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=\"packetscope-export.csv\"");
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ message: "Failed to export packets.", error: error.message });
  }
});

router.get("/packets/stats", async (req, res) => {
  try {
    const filters = buildPacketQuery(req.query);

    const [total, byProtocolAgg, topSrcIPsAgg, topDstIPsAgg, avgSizeAgg, packetsPerMinuteAgg] =
      await Promise.all([
        Packet.countDocuments(filters),
        Packet.aggregate([
          { $match: filters },
          { $group: { _id: "$protocol", count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        Packet.aggregate([
          { $match: { ...filters, src_ip: { ...(filters.src_ip ? { $eq: filters.src_ip } : { $ne: null }) } } },
          { $group: { _id: "$src_ip", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 }
        ]),
        Packet.aggregate([
          { $match: { ...filters, dst_ip: { $ne: null } } },
          { $group: { _id: "$dst_ip", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 }
        ]),
        Packet.aggregate([
          { $match: filters },
          { $group: { _id: null, avgSize: { $avg: "$length" } } }
        ]),
        Packet.aggregate([
          { $match: filters },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%dT%H:%M:00.000Z",
                  date: "$timestamp"
                }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ])
      ]);

    const byProtocol = byProtocolAgg.reduce((accumulator, item) => {
      accumulator[item._id || "OTHER"] = item.count;
      return accumulator;
    }, {});

    res.json({
      total,
      byProtocol,
      topSrcIPs: topSrcIPsAgg.map((item) => ({ ip: item._id, count: item.count })),
      topDstIPs: topDstIPsAgg.map((item) => ({ ip: item._id, count: item.count })),
      avgSize: avgSizeAgg[0]?.avgSize ?? 0,
      packetsPerMinute: packetsPerMinuteAgg.map((item) => ({
        minute: item._id,
        count: item.count
      }))
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to compute packet statistics.", error: error.message });
  }
});

router.get("/packets", async (req, res) => {
  try {
    const page = normalizePagination(req.query.page, 1);
    const limit = Math.min(normalizePagination(req.query.limit, 25), 100);
    const filters = buildPacketQuery(req.query);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Packet.find(filters).sort({ timestamp: -1 }).skip(skip).limit(limit),
      Packet.countDocuments(filters)
    ]);

    res.json({
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch packets.", error: error.message });
  }
});

router.get("/packets/:id", async (req, res) => {
  try {
    const packet = await Packet.findById(req.params.id);

    if (!packet) {
      return res.status(404).json({ message: "Packet not found." });
    }

    return res.json(packet);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch packet.", error: error.message });
  }
});

router.delete("/packets", async (_req, res) => {
  try {
    const result = await Packet.deleteMany({});
    res.json({ message: "All packets cleared.", deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ message: "Failed to clear packets.", error: error.message });
  }
});

export default router;
