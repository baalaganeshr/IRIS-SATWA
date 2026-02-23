import type { SSEUpdate } from "../types/schemas";

const SSE_URL = "/api/stream";
const RECONNECT_DELAY = 3000;

export type ConnectionStatus = "connected" | "disconnected" | "connecting";

export function createSSEConnection(
  onMessage: (data: SSEUpdate) => void,
  onStatusChange: (status: ConnectionStatus) => void
): () => void {
  let es: EventSource | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;

  function connect() {
    if (disposed) return;

    onStatusChange("connecting");
    es = new EventSource(SSE_URL);

    es.addEventListener("update", (event) => {
      try {
        const data = JSON.parse(event.data) as SSEUpdate;
        onMessage(data);
      } catch (err) {
        console.warn("SSE parse error:", err);
      }
    });

    es.addEventListener("heartbeat", () => {
      // keep-alive, no action needed
    });

    es.onopen = () => {
      onStatusChange("connected");
    };

    es.onerror = () => {
      onStatusChange("disconnected");
      es?.close();
      es = null;

      if (!disposed) {
        reconnectTimer = setTimeout(connect, RECONNECT_DELAY);
      }
    };
  }

  connect();

  // Return cleanup function
  return () => {
    disposed = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    es?.close();
    es = null;
  };
}
