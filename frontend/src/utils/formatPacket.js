export function formatTimestamp(iso) {
  if (!iso) {
    return "--:--:--.---";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "--:--:--.---";
  }

  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  const milliseconds = String(date.getMilliseconds()).padStart(3, "0");
  return `${timeFormatter.format(date)}.${milliseconds}`;
}

export function formatSize(bytes) {
  const numeric = Number(bytes);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return "0 B";
  }

  if (numeric < 1024) {
    return `${numeric} B`;
  }

  if (numeric < 1024 * 1024) {
    return `${(numeric / 1024).toFixed(1)} KB`;
  }

  return `${(numeric / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatFlags(flags = {}) {
  return [
    flags.syn ? "SYN" : null,
    flags.ack ? "ACK" : null,
    flags.fin ? "FIN" : null,
    flags.rst ? "RST" : null,
    flags.psh ? "PSH" : null
  ].filter(Boolean);
}

export function getProtocolColor(protocol) {
  const colorMap = {
    TCP: "#6C63FF",
    UDP: "#00D4AA",
    ICMP: "#3B82F6",
    ARP: "#F59E0B",
    OTHER: "#8B8BA8"
  };

  return colorMap[String(protocol || "OTHER").toUpperCase()] || colorMap.OTHER;
}
