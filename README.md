# PacketScope

PacketScope is a MERN network monitoring dashboard that captures packets with Scapy, stores them in MongoDB, streams live events over Socket.IO, and visualizes traffic through a dark React interface.

## Prerequisites

- Node.js 18+
- npm 9+
- Python 3.10+
- MongoDB running locally or accessible remotely
- Scapy installed in the same Python environment used by the backend sniffer
- Elevated terminal privileges for packet capture on most systems

## Installation

### Backend

```bash
cd backend
npm install
python3 -m pip install scapy
```

### Frontend

```bash
cd frontend
npm install
```

## Run Instructions

Start the backend in one terminal:

```bash
cd backend
npm run dev
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

## Sudo / Admin Note

Live packet sniffing usually requires elevated privileges.

- Linux and macOS: run the backend with `sudo` if the sniffer cannot bind to the interface.
- Windows: launch the terminal as Administrator when necessary.

If permissions are missing, the Express server can still boot while `sniffer.py` fails to capture traffic.

## Environment Variables

PacketScope reads the following values from `backend/.env`:

- `MONGO_URI`
  MongoDB connection string used by Mongoose.
- `PORT`
  Backend port for Express and Socket.IO. Default is `5000`.
- `PYTHON_PATH`
  Python executable used to spawn `sniffer.py`.
- `INTERFACE`
  Default network interface for packet capture.
- `FILTER`
  Optional default BPF filter expression, such as `tcp` or `port 53`.

## Architecture

```text
  +------------------------+        Socket.IO / REST        +------------------------+
  |   React + Vite Frontend| <----------------------------> |   Express + Socket.IO  |
  | Pages, charts, tables  |                                | Routes and live ingest  |
  +-----------+------------+                                +-----------+------------+
              |                                                             |
              |                                                             |
              v                                                             v
  +------------------------+                                 +------------------------+
  |   Framer Motion UI     |                                 |    MongoDB Storage     |
  | Tailwind dark dashboard|                                 | Packet documents/index |
  +------------------------+                                 +------------------------+
                                                                            |
                                                                            v
                                                                +------------------------+
                                                                |   Python Scapy Sniffer |
                                                                | interface + BPF filter |
                                                                +-----------+------------+
                                                                            |
                                                                            v
                                                                +------------------------+
                                                                |   Network Interface    |
                                                                |   live packet stream   |
                                                                +------------------------+
```

## Project Structure

```text
PacketScope/
|-- backend/
|   |-- models/
|   |-- routes/
|   |-- server.js
|   `-- sniffer.py
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- context/
|   |   |-- hooks/
|   |   |-- pages/
|   |   `-- utils/
|   `-- index.html
`-- README.md
```

## Usage

1. Start MongoDB.
2. Start the backend.
3. Start the frontend.
4. Open the dashboard.
5. Use the sidebar to navigate between Dashboard, Packets, Analytics, and Settings.
6. Start or stop the sniffer, apply filters, inspect packet details, and export CSV data from the UI.
