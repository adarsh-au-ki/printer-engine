const { pool } = require("../config/db");
const { sendToPrinter } = require("./printerUtils");

// validate id and object
function validateId(id, name = "ID") {
  if (!id) throw new Error(`${name} is required`);
}

function validateObject(obj, name = "Object") {
  if (!obj || typeof obj !== "object") throw new Error(`${name} must be a valid object`);
}

// get printer settings from db
async function getPrinterSettings(restaurantId) {
  validateId(restaurantId, "restaurantId");
  try {
    const query = `
      SELECT print_settings, isPrintRequired
      FROM restaurants
      WHERE id = $1
    `;
    const { rows, rowCount } = await pool.query(query, [restaurantId]);
    if (rowCount === 0) {
      throw new Error(`Restaurant not found: ${restaurantId}`);
    }
    return rows[0];
  } catch (err) {
    throw new Error("Failed to retrieve printer settings");
  }
}

async function updatePrinterSettings(restaurantId, printSettings, isPrintRequired = true) {
  validateId(restaurantId, "restaurantId");
  validateObject(printSettings, "printSettings");
  try {
    const query = `
      UPDATE restaurants
      SET print_settings = $1,
          isPrintRequired = $2
      WHERE id = $3
      RETURNING print_settings, isPrintRequired
    `;
    const { rows, rowCount } = await pool.query(query, [
      printSettings,
      isPrintRequired,
      restaurantId,
    ]);
    if (rowCount === 0) {
      throw new Error(`Restaurant not found: ${restaurantId}`);
    }
    return rows[0];
  } catch (err) {
    throw new Error("Failed to update printer settings");
  }
}

async function printBill(restaurantId, type = "bill_printer", message = "", cut = true) {
  validateId(restaurantId, "restaurantId");
  validateId(type, "type");
  if (!message) throw new Error("message is required to print");
  const { print_settings } = await getPrinterSettings(restaurantId);
  const ipPort = print_settings?.[type];
  if (!ipPort) {
    throw new Error(`No printer configured for type "${type}" on restaurant ${restaurantId}`);
  }
  try {
    await sendToPrinter(ipPort, message, cut);
  } catch (err) {
    throw new Error(`Print job failed for ${type}: ${err.message}`);
  }
}

module.exports = {
  getPrinterSettings,
  updatePrinterSettings,
  printBill,
};
