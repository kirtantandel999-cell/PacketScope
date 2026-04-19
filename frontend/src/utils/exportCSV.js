const escapeCsvValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return `"${String(value).replace(/"/g, "\"\"")}"`;
};

export function exportPacketsToCSV(packets, filename = "packetscope-packets.csv") {
  const rows = Array.isArray(packets) ? packets : [];
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
  ];

  const csvRows = rows.map((packet) =>
    [
      packet.timestamp,
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
    ]
      .map(escapeCsvValue)
      .join(",")
  );

  const csvContent = [header.join(","), ...csvRows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export default exportPacketsToCSV;
