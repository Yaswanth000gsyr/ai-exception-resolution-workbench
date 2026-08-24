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

// AI explanation
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

    const aiResult = await generateAIExplanation(exception);

    res.json({
      exceptionId: exception.id,
      explanation: aiResult.explanation,
      resolution: aiResult.resolution,
      confidence: aiResult.confidence
    });

  } catch (error) {
    console.error("AI Error:", error);

    res.status(500).json({
      message: "Failed to generate AI explanation"
    });
  }
});

// Process exception using AI
router.post("/:id/process", async (req, res) => {
  try {
    const exception = exceptions.find(
      item => item.id === req.params.id
    );

    if (!exception) {
      return res.status(404).json({
        message: "Exception not found"
      });
    }

    // Ask Gemini to analyze the exception
    const aiResult = await generateAIExplanation(exception);

    // Store AI results on the exception
    exception.aiExplanation = aiResult.explanation;
    exception.aiResolution = aiResult.resolution;
    exception.confidence = Number(aiResult.confidence) || 0;

    // Business decision
    if (exception.confidence >= 90) {
      exception.status = "Resolved";
      exception.decision = "Auto-Resolved";
      exception.requiresHumanReview = false;
    } else {
      exception.status = "Pending Review";
      exception.decision = "Human Review Required";
      exception.requiresHumanReview = true;
    }

    res.json({
      exceptionId: exception.id,
      status: exception.status,
      decision: exception.decision,
      requiresHumanReview: exception.requiresHumanReview,
      confidence: exception.confidence,
      explanation: exception.aiExplanation,
      resolution: exception.aiResolution
    });

  } catch (error) {
    console.error("AI Processing Error:", error);

    res.status(500).json({
      message: "Failed to process exception",
      error: error.message
    });
  }
});


// Human review decision
router.post("/:id/review", (req, res) => {
  const exception = exceptions.find(
    item => item.id === req.params.id
  );

  if (!exception) {
    return res.status(404).json({
      message: "Exception not found"
    });
  }

  const { decision, reviewer } = req.body;

  if (!["approve", "reject"].includes(decision)) {
    return res.status(400).json({
      message: "Decision must be 'approve' or 'reject'."
    });
  }

  exception.review = {
    reviewer: reviewer || "Finance Reviewer",
    decision,
    reviewedAt: new Date().toISOString()
  };

  if (decision === "approve") {
    exception.status = "Resolved";
    exception.decision = "Human Approved";
  } else {
    exception.status = "Rejected";
    exception.decision = "Human Rejected";
  }

  res.json({
    message: "Human review recorded successfully.",
    exception
  });
});
module.exports = router;