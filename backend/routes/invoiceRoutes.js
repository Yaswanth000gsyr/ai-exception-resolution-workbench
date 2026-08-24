const express = require("express");

const router = express.Router();

const exceptions = require("../data/exceptions");

const {
  validateInvoice,
  determineSeverity
} = require("../services/validationService");

router.post("/", (req, res) => {
  const invoice = req.body;

  const validation = validateInvoice(invoice, exceptions);

  // Invoice passed all validation rules
  if (validation.valid) {
    return res.status(200).json({
      status: "Processed",
      message: "Invoice passed all validation checks.",
      invoice
    });
  }

  const exceptionId = `EXC-${1000 + exceptions.length + 1}`;

  const expectedAmount = Number(invoice.expectedAmount || 0);
  const actualAmount = Number(invoice.actualAmount || 0);

  const difference = Math.abs(actualAmount - expectedAmount);

  const primaryExceptionType =
    validation.exceptionTypes[0] || "Transaction Validation Error";

  const exception = {
    id: exceptionId,

    invoiceNumber:
      invoice.invoiceNumber || "UNKNOWN",

    vendor:
      invoice.vendor || "UNKNOWN",

    type: primaryExceptionType,

    exceptionTypes: validation.exceptionTypes,

    severity: determineSeverity(
      validation.exceptionTypes,
      invoice
    ),

    status: "Pending",

    expectedAmount,

    actualAmount,

    difference,

    purchaseOrderNumber:
      invoice.purchaseOrderNumber || null,

    expectedPurchaseOrderNumber:
      invoice.expectedPurchaseOrderNumber || null,

    description:
      invoice.description ||
      validation.errors.join(" "),

    validationErrors: validation.errors,

    confidence: null,

    resolution: null,

    createdAt: new Date().toISOString()
  };

  exceptions.push(exception);

  return res.status(201).json({
    status: "Exception Created",

    message:
      "Invoice failed automated validation and an exception was created.",

    validationErrors: validation.errors,

    exception
  });
});

module.exports = router;