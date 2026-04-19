import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export function useSocket(options = {}) {
  const { onPacket, onStatus, receivePackets = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [snifferStatus, setSnifferStatus] = useState("stopped");
  const packetHandlerRef = useRef(onPacket);
  const statusHandlerRef = useRef(onStatus);
  const socketRef = useRef(null);

  useEffect(() => {
    packetHandlerRef.current = onPacket;
  }, [onPacket]);

  useEffect(() => {
    statusHandlerRef.current = onStatus;
  }, [onStatus]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      transports: ["websocket", "polling"]
    });
    socketRef.current = socket;

    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handlePacket = (packet) => {
      packetHandlerRef.current?.(packet);
    };

    const handleStatus = (statusPayload) => {
      setSnifferStatus(statusPayload?.status || "stopped");
      statusHandlerRef.current?.(statusPayload);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("sniffer_status", handleStatus);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("sniffer_status", handleStatus);
      socket.off("new_packet", handlePacket);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) {
      return undefined;
    }

    const handlePacket = (packet) => {
      packetHandlerRef.current?.(packet);
    };

    socket.off("new_packet", handlePacket);

    if (receivePackets) {
      socket.on("new_packet", handlePacket);
    } else {
      socket.off("new_packet");
    }

    return () => {
      socket.off("new_packet", handlePacket);
    };
  }, [receivePackets]);

  return { isConnected, snifferStatus };
}
