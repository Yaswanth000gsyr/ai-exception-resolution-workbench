function generateExplanation(exception) {
  switch (exception.type) {
    case "Amount Mismatch":
      return `The invoice was flagged because the expected amount was $${exception.expectedAmount}, but the actual invoice amount is $${exception.actualAmount}. The difference is $${exception.difference}.`;

    case "Duplicate Invoice":
      return `The invoice was flagged because a similar invoice from ${exception.vendor} already exists in the system.`;

    case "Missing Purchase Order":
      return `The invoice was flagged because no matching purchase order was found for this invoice.`;

    case "Tax Mismatch":
      return `The invoice was flagged because the expected amount was $${exception.expectedAmount}, while the invoice amount is $${exception.actualAmount}, creating a $${exception.difference} variance.`;

    case "Quantity Mismatch":
      return `The invoice was flagged because the billed quantity does not match the quantity specified in the purchase order.`;

    default:
      return "The transaction requires manual review because an exception was detected.";
  }
}


function generateResolution(exception) {
  switch (exception.type) {
    case "Amount Mismatch":
      return "Request vendor correction for the invoice amount.";

    case "Duplicate Invoice":
      return "Verify the original invoice and reject the duplicate if confirmed.";

    case "Missing Purchase Order":
      return "Ask the procurement team to provide or verify the purchase order.";

    case "Tax Mismatch":
      return "Verify the applicable tax rate and request vendor correction if necessary.";

    case "Quantity Mismatch":
      return "Compare the delivered quantity with the purchase order and request correction.";

    default:
      return "Send the transaction to a human reviewer.";
  }
}


function calculateConfidence(exception) {
  switch (exception.type) {
    case "Amount Mismatch":
      return 94;

    case "Duplicate Invoice":
      return 91;

    case "Missing Purchase Order":
      return 61;

    case "Tax Mismatch":
      return 87;

    case "Quantity Mismatch":
      return 82;

    default:
      return 50;
  }
}


module.exports = {
  generateExplanation,
  generateResolution,
  calculateConfidence
};