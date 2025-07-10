const net = require("net");

const INIT_PRINTER = Buffer.from([0x1B, 0x40]);
const SET_PRINT_WIDTH_80MM = Buffer.from([0x1B, 0x21, 0x00]);
const FEED_AND_CUT = Buffer.from([0x1D, 0x56, 0x00]);
const FEED_LINES = Buffer.from([0x1B, 0x64, 0x05]);

const SOCKET_TIMEOUT_MS = 1000;

async function sendToPrinter(ipPort, message, cut = true) {
  const [ip, port] = ipPort.split(":");
  if (!ip || !port) throw new Error(`Invalid printer IP:Port format → ${ipPort}`);

  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let resolved = false;

    const cleanup = () => {
      client.removeAllListeners("error");
      client.removeAllListeners("timeout");
      client.removeAllListeners("close");
    };

    client.setTimeout(SOCKET_TIMEOUT_MS);

    client.connect(parseInt(port), ip, () => {
      console.log(`[DEBUG] Connected to printer at ${ip}:${port}`);
      const buffers = [
        INIT_PRINTER,
        SET_PRINT_WIDTH_80MM,
        Buffer.isBuffer(message) ? message : Buffer.from(message, "utf8"),
        FEED_LINES,
      ];
      if (cut) {
        buffers.push(FEED_AND_CUT);
      }
      const dataToSend = Buffer.concat(buffers);
      console.log(`[DEBUG] Sending ${dataToSend.length} bytes to printer`);
      client.write(dataToSend, () => {
        client.end();
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve();
        }
      });
    });

    client.on("error", (err) => {
      if (!resolved) {
        resolved = true;
        cleanup();
        console.error(`[ERROR] Printer connection error: ${err.message}`);
        reject(new Error(`Failed to print to ${ipPort}: ${err.message}`));
      }
    });

    client.on("timeout", () => {
      if (!resolved) {
        resolved = true;
        cleanup();
        client.destroy();
        reject(new Error(`Printer connection timed out after ${SOCKET_TIMEOUT_MS}ms (${ipPort})`));
      }
    });

    client.on("close", () => {
      cleanup();
    });
  });
}

module.exports = { sendToPrinter };
