const express = require("express");

const router = express.Router();

const exceptions = require("../data/exceptions");

const {
  generateExplanation,
  generateResolution,
  calculateConfidence
} = require("../services/resolutionService");


const {
  generateAIExplanation
} = require("../services/aiService");

// Get all exceptions
router.get("/", (req, res) => {
  res.json(exceptions);
});


// Get one exception
router.get("/:id", (req, res) => {
  const exception = exceptions.find(
    item => item.id === req.params.id
  );

  if (!exception) {
    return res.status(404).json({
      message: "Exception not found"
    });
  }

  res.json(exception);
});


// Explain exception
router.post("/:id/explain", (req, res) => {
  const exception = exceptions.find(
    item => item.id === req.params.id
  );

  if (!exception) {
    return res.status(404).json({
      message: "Exception not found"
    });
  }

  const explanation = generateExplanation(exception);

  res.json({
    exceptionId: exception.id,
    explanation,
    sourceFields: {
      type: exception.type,
      expectedAmount: exception.expectedAmount,
      actualAmount: exception.actualAmount,
      difference: exception.difference
    }
  });
});


// Suggest resolution
router.post("/:id/suggest", (req, res) => {
  const exception = exceptions.find(
    item => item.id === req.params.id
  );

  if (!exception) {
    return res.status(404).json({
      message: "Exception not found"
    });
  }

  const resolution = generateResolution(exception);
  const confidence = calculateConfidence(exception);

  exception.confidence = confidence;
  exception.resolution = resolution;

  res.json({
    exceptionId: exception.id,
    resolution,
    confidence,
    autoResolve: confidence >= 90
  });
});


// Resolve exception
router.post("/:id/resolve", (req, res) => {
  const exception = exceptions.find(
    item => item.id === req.params.id
  );

  if (!exception) {
    return res.status(404).json({
      message: "Exception not found"
    });
  }

  const confidence = exception.confidence || 0;

  if (confidence < 90) {
    return res.status(400).json({
      message: "Confidence below auto-resolution threshold.",
      confidence,
      requiresHumanReview: true
    });
  }

  exception.status = "Resolved";

  res.json({
    message: "Exception automatically resolved.",
    exception
  });
});

//ai explanation
router.post("/:id/ai-explain", async (req, res) => {
  try {
    const exception = exceptions.find(
      item => item.id === req.params.id
    );

    if (!exception) {
      return res.status(404).json({
        message: "Exception not found"
      });
    }

    const explanation = await generateAIExplanation(exception);

    res.json({
      exceptionId: exception.id,
      explanation
    });

  } catch (error) {
    console.error("AI Error:", error);

    res.status(500).json({
      message: "Failed to generate AI explanation"
    });
  }
});

module.exports = router;