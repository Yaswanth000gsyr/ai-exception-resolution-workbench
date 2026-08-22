# AI Exception Resolution Workbench

An AI-assisted transaction exception resolution system designed to help finance operations teams investigate transaction exceptions, understand why they occurred, generate resolution recommendations, and determine whether an exception can be safely automated or requires human review.

## Overview

Finance and transaction-processing systems can generate exceptions when transaction data does not match expected business conditions.

Examples include:

- Invoice amount mismatches
- Missing purchase orders
- Duplicate invoices
- Vendor-related discrepancies
- Transaction validation failures

The AI Exception Resolution Workbench helps streamline this workflow by combining deterministic business rules with AI-assisted analysis.

The system can:

1. Display transaction exceptions
2. Explain why an exception was triggered
3. Generate a recommended resolution
4. Assign a confidence score
5. Automatically resolve high-confidence exceptions
6. Escalate low-confidence exceptions for human review

## Core Concept

The system follows a **human-in-the-loop AI** approach.

```text
Transaction Exception
        |
        v
  Exception Queue
        |
        v
    AI Analysis
        |
        +----------------+
        |                |
        v                v
  Explanation      Resolution
                        |
                        v
                Confidence Score
                        |
              +---------+---------+
              |                   |
           >= 90%              < 90%
              |                   |
              v                   v
       Auto Resolution       Human Review
```

A 90% confidence threshold is used as the automation boundary.

The AI does not blindly resolve every exception.

## Features

### Exception Management

- View transaction exceptions
- View individual exception details
- Display invoice and vendor information
- Compare expected and actual amounts
- Display transaction differences
- Track exception status

### AI Explanation

The system can send structured exception information to an AI model and generate an explanation of why the transaction was flagged.

The AI is instructed to use the supplied transaction information rather than inventing unsupported facts.

### Resolution Recommendation

The system generates a recommended action for an exception.

Example:

```text
Request vendor correction for the invoice amount.
```

### Confidence-Based Automation

Every recommendation receives a confidence score.

Example:

```text
94% -> Eligible for automatic resolution

61% -> Requires human review
```

### Human-in-the-Loop

Exceptions below the automation threshold are not automatically resolved.

Instead, they are identified as requiring human review.

## Example Workflows

### High-Confidence Exception

**Exception:** EXC-1001

```text
Expected Amount: $1000
Actual Amount:   $1200
Difference:      $200
Confidence:      94%
```

The system generates a recommended resolution and determines that the confidence is above the 90% automation threshold.

Result:

```text
Safe for automatic resolution
```

The exception can then be automatically resolved.

### Low-Confidence Exception

**Exception:** EXC-1003

```text
Confidence: 61%
```

Because the confidence is below the 90% threshold:

```text
Automatic resolution: No
Human review: Required
```

This prevents uncertain recommendations from being automatically applied.

## Technology Stack

### Frontend

- React
- Vite
- JavaScript
- CSS

### Backend

- Node.js
- Express.js
- REST APIs

### AI

- OpenAI SDK
- AI-powered exception explanation
- AI-powered resolution recommendations

### Development

- Git
- GitHub
- npm

## Project Structure

```text
ai-exception-resolution-workbench/
|
+-- backend/
|   +-- data/
|   |   +-- exceptions.js
|   |
|   +-- routes/
|   |   +-- exceptionRoutes.js
|   |
|   +-- services/
|   |   +-- aiService.js
|   |   +-- resolutionService.js
|   |
|   +-- server.js
|   +-- package.json
|   +-- package-lock.json
|
+-- frontend/
|   +-- public/
|   +-- src/
|       +-- App.jsx
|       +-- App.css
|       +-- index.css
|       +-- main.jsx
|   +-- package.json
|   +-- package-lock.json
|
+-- .gitignore
+-- README.md
```

## API Endpoints

### Get All Exceptions

```http
GET /api/exceptions
```

Returns all available transaction exceptions.

### Get a Specific Exception

```http
GET /api/exceptions/:id
```

Example:

```http
GET /api/exceptions/EXC-1001
```

### Generate AI Explanation

```http
POST /api/exceptions/:id/ai-explain
```

Example:

```http
POST /api/exceptions/EXC-1001/ai-explain
```

### Suggest Resolution

```http
POST /api/exceptions/:id/suggest
```

Example:

```http
POST /api/exceptions/EXC-1001/suggest
```

Example response:

```json
{
  "exceptionId": "EXC-1001",
  "resolution": "Request vendor correction for the invoice amount.",
  "confidence": 94,
  "autoResolve": true
}
```

### Resolve Exception

```http
POST /api/exceptions/:id/resolve
```

The backend checks the confidence score before allowing automatic resolution.

If the confidence is below the threshold:

```json
{
  "message": "Confidence below auto-resolution threshold.",
  "requiresHumanReview": true
}
```

## Getting Started

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Yaswanth000gsyr/ai-exception-resolution-workbench.git
```

```bash
cd ai-exception-resolution-workbench
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment Variables

Create a file:

```text
backend/.env
```

Add your API key:

```env
OPENAI_API_KEY=your_api_key_here
```

**Never commit your `.env` file or API key to GitHub.**

### 4. Start the Backend

From the `backend` directory:

```bash
node server.js
```

The backend runs on:

```text
http://localhost:5000
```

### 5. Install Frontend Dependencies

Open another terminal:

```bash
cd frontend
npm install
```

### 6. Start the Frontend

```bash
npm run dev
```

Open the Vite URL shown in the terminal, normally:

```text
http://localhost:5173
```

## Architecture

```text
                 Transaction System
                         |
                         v
                  Exception Intake
                         |
                         v
                  Exception Queue
                         |
                         v
                  Express Backend
                         |
              +----------+----------+
              |                     |
              v                     v
       Resolution Service       AI Service
              |                     |
              |                     v
              |                AI Model
              |                     |
              +----------+----------+
                         |
                         v
                 Resolution Decision
                         |
                +--------+--------+
                |                 |
                v                 v
          Auto Resolve       Human Review
```

## Design Decisions

### Why AI?

Traditional rule-based systems can identify known exception patterns, but AI can provide contextual explanations and recommendations based on the available transaction information.

### Why Keep Deterministic Rules?

Business-critical actions should not depend entirely on an AI response.

The resolution service maintains deterministic logic for known exception scenarios, while the confidence threshold provides an additional safety boundary.

### Why Human Review?

AI recommendations can be uncertain.

Instead of forcing automation, the system escalates low-confidence recommendations to a human reviewer.

This creates a safer human-in-the-loop workflow.

## Current Prototype Scope

This prototype currently uses a representative exception dataset to simulate the upstream transaction-processing system.

The exception-resolution engine is separated from the intake layer so that it can later be connected to external transaction or invoice-processing systems.

Potential production integrations could include:

- ERP systems
- Invoice processing platforms
- Procurement systems
- Transaction-processing pipelines
- Enterprise databases

## Future Improvements

Potential future improvements include:

- Real invoice and transaction ingestion
- MongoDB or PostgreSQL persistence
- Authentication and role-based access
- Exception creation APIs
- Audit history
- Analytics dashboard
- Bulk exception processing
- Human reviewer workflow
- Email and Slack notifications
- ERP integration
- AI evaluation and monitoring
- Resolution feedback loop
- Production deployment

## Security

- API keys are stored using environment variables.
- `.env` files are excluded from Git.
- Secrets should never be committed to source control.
- AI recommendations are subject to a confidence threshold before automatic resolution.

## Demo Scenarios

### Scenario 1 - Automatic Resolution

```text
EXC-1001
    |
    v
AI Explanation
    |
    v
Resolution Recommendation
    |
    v
94% Confidence
    |
    v
Automatic Resolution
```

### Scenario 2 - Human Review

```text
EXC-1003
    |
    v
AI Resolution Recommendation
    |
    v
61% Confidence
    |
    v
Below 90% Threshold
    |
    v
Human Review Required
```

## Key Value Proposition

The system is designed around a simple principle:

> **AI assists with investigation and recommendation, while confidence-based controls determine whether the recommendation can be automated or must be reviewed by a human.**

This approach helps reduce repetitive manual investigation while maintaining human oversight for uncertain cases.

## Author

**Yaswanth Reddy**

B.Tech - Computer Science & Engineering

## License

This project is developed as a prototype for demonstration and evaluation purposes.
