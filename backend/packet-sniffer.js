import { EventEmitter } from "events";

/**
 * Mock Packet Sniffer for Node.js
 * Simulates network packet capture for environments where raw socket access is restricted
 * (e.g., Render containers, Docker, etc.)
 */

class PacketSniffer extends EventEmitter {
  constructor() {
    super();
    this.isRunning = false;
    this.sniffInterval = null;
    this.packetCount = 0;
  }

  /**
   * Start sniffing packets
   */
  start(interfaceName = "eth0", filter = "") {
    if (this.isRunning) {
      throw new Error("Sniffer already running");
    }

    this.isRunning = true;
    this.packetCount = 0;

    console.log(`[PacketSniffer] Starting on interface: ${interfaceName}`);
    this.emit("start", { interface: interfaceName, filter });

    // Simulate packet generation every 500ms
    this.sniffInterval = setInterval(() => {
      this.generateMockPacket();
    }, 500);

    return { status: "started", interface: interfaceName };
  }

  /**
   * Stop sniffing packets
   */
  stop() {
    if (!this.isRunning) {
      throw new Error("Sniffer not running");
    }

    this.isRunning = false;
    if (this.sniffInterval) {
      clearInterval(this.sniffInterval);
      this.sniffInterval = null;
    }

    console.log(`[PacketSniffer] Stopped. Total packets captured: ${this.packetCount}`);
    this.emit("stop", { totalPackets: this.packetCount });

    return { status: "stopped", totalPackets: this.packetCount };
  }

  /**
   * Generate mock packet data
   */
  generateMockPacket() {
    this.packetCount++;

    const protocols = ["TCP", "UDP", "ICMP", "ARP", "HTTP"];
    const srcIps = [
      "192.168.1.100",
      "192.168.1.101",
      "10.0.0.50",
      "172.16.0.25",
      "203.0.113.42"
    ];
    const dstIps = [
      "8.8.8.8",
      "1.1.1.1",
      "192.168.1.1",
      "142.250.185.46",
      "93.184.216.34"
    ];

    const packet = {
      id: this.packetCount,
      timestamp: new Date().toISOString(),
      src_ip: srcIps[Math.floor(Math.random() * srcIps.length)],
      dst_ip: dstIps[Math.floor(Math.random() * dstIps.length)],
      protocol: protocols[Math.floor(Math.random() * protocols.length)],
      src_port: Math.floor(Math.random() * 65535),
      dst_port: Math.floor(Math.random() * 65535),
      length: Math.floor(Math.random() * 1500) + 20,
      raw_summary: `Mock packet #${this.packetCount} - ${protocols[Math.floor(Math.random() * protocols.length)]} traffic`,
      payload_preview: `Sample payload data for packet ${this.packetCount}`,
      ttl: Math.floor(Math.random() * 128) + 1,
      flags: {
        syn: Math.random() > 0.5,
        ack: Math.random() > 0.5,
        fin: Math.random() > 0.7,
        rst: Math.random() > 0.9,
        psh: Math.random() > 0.6
      }
    };

    this.emit("packet", packet);
    return packet;
  }

  /**
   * Get available network interfaces (mock)
   */
  static getInterfaces() {
    return [
      { name: "eth0", description: "Primary Ethernet", ip: "192.168.1.100", active: true },
      { name: "lo", description: "Loopback", ip: "127.0.0.1", active: false },
      { name: "docker0", description: "Docker Bridge", ip: "172.17.0.1", active: true }
    ];
  }

  /**
   * Check if sniffing is running
   */
  isActive() {
    return this.isRunning;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      packetsGenerated: this.packetCount,
      status: this.isRunning ? "running" : "stopped"
    };
  }
}

export default PacketSniffer;