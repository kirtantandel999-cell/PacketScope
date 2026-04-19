import sys
import json
import argparse
import platform
from datetime import datetime, timezone

import requests

from scapy.all import sniff, conf, IP, TCP, UDP, ICMP, ARP, Raw

if platform.system() == "Windows":
    conf.use_pcap = True


def list_available_interfaces():
    if platform.system() == "Windows":
        from scapy.arch.windows import get_windows_if_list

        interfaces = []
        for iface in get_windows_if_list():
            ips = iface.get("ips") or [""]
            interfaces.append(
                {
                    "name": iface.get("name", ""),
                    "description": iface.get("description", ""),
                    "ip": ips[0] if ips else "",
                }
            )
        return interfaces

    interfaces = []
    for iface_name in conf.ifaces.keys():
        iface = conf.ifaces[iface_name]
        interfaces.append(
            {
                "name": getattr(iface, "name", iface_name),
                "description": getattr(iface, "description", ""),
                "ip": getattr(iface, "ip", ""),
            }
        )
    return interfaces


def log_detected_interfaces():
    interfaces = list_available_interfaces()
    print(
        json.dumps(
            {
                "status": "interfaces_detected",
                "interfaces": interfaces,
            }
        ),
        flush=True,
    )


def get_default_interface():
    if platform.system() == "Windows":
        ifaces = list_available_interfaces()
        for iface in ifaces:
            if iface.get("ip") and not iface["ip"].startswith("127"):
                return iface["name"]
        return ifaces[0]["name"] if ifaces else "Ethernet"

    return conf.iface


def resolve_interface(selected_interface):
    if not selected_interface:
        return get_default_interface()

    requested = selected_interface.strip().lower()
    available = list_available_interfaces()

    for iface in available:
        if iface.get("name", "").strip().lower() == requested:
            return iface["name"]

    for iface in available:
        description = iface.get("description", "").strip().lower()
        if description and requested in description:
            return iface["name"]

    raise RuntimeError(
        f"Interface '{selected_interface}' not found. Available interfaces: "
        + ", ".join(iface["name"] for iface in available if iface.get("name"))
    )


parser = argparse.ArgumentParser(description="PacketScope packet sniffer")
parser.add_argument("--interface", default=None)
parser.add_argument("--filter", default="")

BACKEND_URL = "http://localhost:5000/api/packets"


def packet_handler(pkt):
    try:
        timestamp = datetime.fromtimestamp(float(pkt.time), tz=timezone.utc).isoformat()
        src_ip = pkt[IP].src if IP in pkt else ""
        dst_ip = pkt[IP].dst if IP in pkt else ""
        src_port = pkt[TCP].sport if TCP in pkt else pkt[UDP].sport if UDP in pkt else None
        dst_port = pkt[TCP].dport if TCP in pkt else pkt[UDP].dport if UDP in pkt else None
        length = len(pkt)
        ttl = pkt[IP].ttl if IP in pkt else None
        protocol = (
            "TCP"
            if TCP in pkt
            else "UDP"
            if UDP in pkt
            else "ICMP"
            if ICMP in pkt
            else "ARP"
            if ARP in pkt
            else "OTHER"
        )

        flags = {
            "SYN": False,
            "ACK": False,
            "FIN": False,
            "RST": False,
            "PSH": False,
        }

        if TCP in pkt:
            tcp_flags = pkt[TCP].flags
            flags = {
                "SYN": bool(tcp_flags & 0x02),
                "ACK": bool(tcp_flags & 0x10),
                "FIN": bool(tcp_flags & 0x01),
                "RST": bool(tcp_flags & 0x04),
                "PSH": bool(tcp_flags & 0x08),
            }

        raw_summary = pkt.summary()
        payload_preview = ""
        if Raw in pkt:
            raw_bytes = bytes(pkt[Raw].load)[:60]
            payload_preview = raw_bytes.hex()

        packet_data = {
            "timestamp": timestamp,
            "src_ip": src_ip,
            "dst_ip": dst_ip,
            "src_port": src_port,
            "dst_port": dst_port,
            "protocol": protocol,
            "length": length,
            "ttl": ttl,
            "flags": flags,
            "raw_summary": raw_summary,
            "payload_preview": payload_preview,
        }

        response = requests.post(BACKEND_URL, json=packet_data, timeout=5)
        response.raise_for_status()
    except Exception:
        pass


if __name__ == "__main__":
    args = parser.parse_args()
    iface = resolve_interface(args.interface)
    bpf = args.filter or ""

    try:
        if not iface:
            raise RuntimeError("No network interface found. Check your network configuration.")

        log_detected_interfaces()
        print(json.dumps({"status": "running", "interface": iface, "filter": bpf or ""}), flush=True)

        sniff(
            iface=iface,
            filter=bpf if bpf else None,
            prn=packet_handler,
            store=False,
        )
    except KeyboardInterrupt:
        sys.exit(0)
    except Exception as e:
        print(json.dumps({"error": str(e)}), flush=True)
        sys.exit(1)
