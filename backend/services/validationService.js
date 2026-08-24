function validateInvoice(invoice, existingInvoices = []) {
  const errors = [];
  const exceptionTypes = [];

  if (!invoice.invoiceNumber) {
    errors.push("Invoice number is missing.");
    exceptionTypes.push("Missing Invoice Number");
  }

  if (!invoice.vendor) {
    errors.push("Vendor is missing.");
    exceptionTypes.push("Missing Vendor");
  }

  if (invoice.expectedAmount == null) {
    errors.push("Expected amount is missing.");
    exceptionTypes.push("Missing Expected Amount");
  }

  if (invoice.actualAmount == null) {
    errors.push("Actual amount is missing.");
    exceptionTypes.push("Missing Actual Amount");
  }

  // Duplicate invoice
  if (
    invoice.invoiceNumber &&
    existingInvoices.some(
      (item) => item.invoiceNumber === invoice.invoiceNumber
    )
  ) {
    errors.push(
      `Invoice ${invoice.invoiceNumber} already exists.`
    );

    exceptionTypes.push("Duplicate Invoice");
  }

  // Purchase order mismatch
  if (
    invoice.purchaseOrderNumber &&
    invoice.expectedPurchaseOrderNumber &&
    invoice.purchaseOrderNumber !== invoice.expectedPurchaseOrderNumber
  ) {
    errors.push(
      `Purchase order mismatch. Expected ${invoice.expectedPurchaseOrderNumber}, received ${invoice.purchaseOrderNumber}.`
    );

    exceptionTypes.push("Purchase Order Mismatch");
  }

  // Amount mismatch
  if (
    invoice.expectedAmount != null &&
    invoice.actualAmount != null &&
    Number(invoice.expectedAmount) !== Number(invoice.actualAmount)
  ) {
    errors.push(
      `Invoice amount mismatch. Expected ${invoice.expectedAmount}, received ${invoice.actualAmount}.`
    );

    exceptionTypes.push("Invoice Amount Mismatch");
  }

  return {
    valid: errors.length === 0,
    errors,
    exceptionTypes
  };
}

function determineSeverity(exceptionTypes) {
  if (
    exceptionTypes.includes("Duplicate Invoice") ||
    exceptionTypes.includes("Invoice Amount Mismatch") ||
    exceptionTypes.includes("Missing Vendor") ||
    exceptionTypes.includes("Missing Invoice Number")
  ) {
    return "High";
  }

  if (exceptionTypes.length > 0) {
    return "Medium";
  }

  return "Low";
}

module.exports = {
  validateInvoice,
  determineSeverity
};