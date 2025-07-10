const {
  getPrinterSettings,
  updatePrinterSettings,
  printBill,
} = require("./lib/printerService");

const { sendToPrinter } = require("./lib/printerUtils");

module.exports = {
  getPrinterSettings,
  updatePrinterSettings,
  printBill,
  sendToPrinter,
};
