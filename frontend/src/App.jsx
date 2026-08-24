import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api";

const emptyInvoice = {
  invoiceNumber: "",
  vendor: "",
  expectedAmount: "",
  actualAmount: "",
  purchaseOrderNumber: "",
  expectedPurchaseOrderNumber: "",
  description: "",
};

function App() {
  const [page, setPage] = useState("dashboard");
  const [invoices, setInvoices] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [selectedException, setSelectedException] = useState(null);

  const [invoice, setInvoice] = useState(emptyInvoice);
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);

  const [notice, setNotice] = useState(null);

  useEffect(() => {
    loadExceptions();
  }, []);

  async function loadExceptions() {
    try {
      const response = await fetch(`${API}/exceptions`);

      if (!response.ok) {
        throw new Error("Unable to load exceptions");
      }

      const data = await response.json();

      setExceptions(data);

      if (data.length && !selectedException) {
        setSelectedException(data[0]);
      }
    } catch (error) {
      console.error(error);
    }
  }

  function showNotice(message, type = "success") {
    setNotice({ message, type });

    setTimeout(() => {
      setNotice(null);
    }, 3500);
  }

  function updateInvoice(field, value) {
    setInvoice((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function processInvoice(event) {
    event.preventDefault();

    if (
      !invoice.invoiceNumber ||
      !invoice.vendor ||
      invoice.expectedAmount === "" ||
      invoice.actualAmount === ""
    ) {
      showNotice(
        "Please complete the required invoice fields.",
        "error"
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API}/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...invoice,
          expectedAmount: Number(invoice.expectedAmount),
          actualAmount: Number(invoice.actualAmount),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Invoice processing failed"
        );
      }

      if (data.status === "Exception Created") {
        await loadExceptions();

        const newException = data.exception;

        setSelectedException(newException);
        setPage("exceptions");

        showNotice(
          `Exception ${newException.id} created automatically.`,
          "warning"
        );
      } else {
        setPage("invoices");

        showNotice(
          "Invoice passed all validation checks.",
          "success"
        );
      }

      setInvoices((current) => [
        {
          ...invoice,
          ...data.invoice,
          status:
            data.status === "Exception Created"
              ? "Exception"
              : "Processed",
        },
        ...current,
      ]);

      setInvoice(emptyInvoice);
    } catch (error) {
      console.error(error);

      showNotice(
        error.message || "Unable to process invoice.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function analyzeException() {
  if (!selectedException) return;

  setAiLoading(true);

  try {
    // 1. Ask Gemini to explain the exception
    const explainResponse = await fetch(
      `${API}/exceptions/${selectedException.id}/ai-explain`,
      {
        method: "POST",
      }
    );

    const explainData = await explainResponse.json();

    if (!explainResponse.ok) {
      throw new Error(
        explainData.message || "AI explanation failed"
      );
    }

    // 2. Ask the resolution engine for recommendation
    const suggestResponse = await fetch(
      `${API}/exceptions/${selectedException.id}/suggest`,
      {
        method: "POST",
      }
    );

    const suggestData = await suggestResponse.json();

    if (!suggestResponse.ok) {
      throw new Error(
        suggestData.message ||
          "Resolution suggestion failed"
      );
    }

    // 3. Combine both responses
    const updatedException = {
      ...selectedException,

      aiExplanation:
        explainData.explanation,

      aiResolution:
        suggestData.resolution,

      resolution:
        suggestData.resolution,

      confidence:
        Number(suggestData.confidence),

      autoResolve:
        suggestData.autoResolve,

      status:
        suggestData.autoResolve
          ? "AI Approved"
          : "Pending Review",
    };

    setSelectedException(updatedException);

    setExceptions((current) =>
      current.map((item) =>
        item.id === updatedException.id
          ? updatedException
          : item
      )
    );

    showNotice(
      "AI investigation completed.",
      "success"
    );

  } catch (error) {
    console.error("AI investigation error:", error);

    showNotice(
      error.message ||
        "Unable to complete AI investigation.",
      "error"
    );
  } finally {
    setAiLoading(false);
  }
}

  async function reviewException(decision) {
  if (!selectedException) return;

  setReviewLoading(true);

  try {
    if (decision === "approve") {
      const response = await fetch(
        `${API}/exceptions/${selectedException.id}/resolve`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to resolve exception"
        );
      }

      setSelectedException(data.exception);

      setExceptions((current) =>
        current.map((item) =>
          item.id === data.exception.id
            ? data.exception
            : item
        )
      );

      showNotice(
        "Exception resolved successfully.",
        "success"
      );
    }

    if (decision === "reject") {
      const updated = {
        ...selectedException,
        status: "Rejected",
      };

      setSelectedException(updated);

      setExceptions((current) =>
        current.map((item) =>
          item.id === updated.id
            ? updated
            : item
        )
      );

      showNotice(
        "AI recommendation rejected.",
        "warning"
      );
    }

  } catch (error) {
    console.error(error);

    showNotice(
      error.message ||
        "Unable to complete review.",
      "error"
    );
  } finally {
    setReviewLoading(false);
  }
}
  const metrics = useMemo(() => {
    const resolved = exceptions.filter(
      (item) => item.status === "Resolved"
    ).length;

    const pending = exceptions.filter(
      (item) =>
        item.status === "Pending" ||
        item.status === "Pending Review"
    ).length;

    const high = exceptions.filter(
      (item) =>
        String(item.severity).toLowerCase() === "high"
    ).length;

    return {
      totalExceptions: exceptions.length,
      pending,
      resolved,
      high,
    };
  }, [exceptions]);

  return (
    <div className="app-shell">

      <Sidebar
        page={page}
        setPage={setPage}
      />

      <div className="main-area">

        <Header
          page={page}
          onRefresh={loadExceptions}
        />

        {page === "dashboard" && (
          <Dashboard
            metrics={metrics}
            exceptions={exceptions}
            setPage={setPage}
            setSelectedException={setSelectedException}
          />
        )}

        {page === "invoices" && (
          <Invoices
            invoices={invoices}
            setPage={setPage}
          />
        )}

        {page === "new-invoice" && (
          <NewInvoice
            invoice={invoice}
            updateInvoice={updateInvoice}
            processInvoice={processInvoice}
            submitting={submitting}
            setPage={setPage}
          />
        )}

        {page === "exceptions" && (
          <Exceptions
            exceptions={exceptions}
            selectedException={selectedException}
            setSelectedException={setSelectedException}
            analyzeException={analyzeException}
            aiLoading={aiLoading}
            reviewException={reviewException}
            reviewLoading={reviewLoading}
          />
        )}

      </div>

      {notice && (
        <div className={`notice ${notice.type}`}>
          <span>
            {notice.type === "success"
              ? "✓"
              : notice.type === "warning"
              ? "!"
              : "×"}
          </span>
          {notice.message}
        </div>
      )}
    </div>
  );
}

/* ================================
   SIDEBAR
================================ */

function Sidebar({ page, setPage }) {
  const items = [
    ["dashboard", "Overview", "⌂"],
    ["invoices", "Invoices", "▤"],
    ["exceptions", "Exceptions", "⚠"],
  ];

  return (
    <aside className="sidebar">

      <div className="brand">
        <div className="brand-icon">✦</div>

        <div>
          <strong>ResolveAI</strong>
          <span>Finance Operations</span>
        </div>
      </div>

      <div className="nav-label">
        WORKSPACE
      </div>

      <nav>
        {items.map(([id, label, icon]) => (
          <button
            key={id}
            className={
              page === id
                ? "nav-button active"
                : "nav-button"
            }
            onClick={() => setPage(id)}
          >
            <span>{icon}</span>
            {label}

            {id === "exceptions" && (
              <small>AI</small>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">

        <div className="ai-status">
          <div className="ai-orb">✦</div>

          <div>
            <strong>AI Employee</strong>
            <span>Gemini connected</span>
          </div>

          <i />
        </div>

        <div className="profile">
          <div className="avatar">
            YR
          </div>

          <div>
            <strong>Finance Reviewer</strong>
            <span>Operations</span>
          </div>
        </div>

      </div>
    </aside>
  );
}

/* ================================
   HEADER
================================ */

function Header({ page, onRefresh }) {
  const titles = {
    dashboard: [
      "OPERATIONS",
      "Exception Management",
      "Monitor your finance automation pipeline.",
    ],
    invoices: [
      "TRANSACTIONS",
      "Invoices",
      "Submit and monitor incoming invoices.",
    ],
    "new-invoice": [
      "TRANSACTIONS",
      "New Invoice",
      "Submit a transaction for automated validation.",
    ],
    exceptions: [
      "EXCEPTION MANAGEMENT",
      "Exception Queue",
      "Investigate and resolve detected anomalies.",
    ],
  };

  const [eyebrow, title, description] =
    titles[page];

  return (
    <header className="top-header">

      <div>
        <div className="eyebrow">
          {eyebrow}
        </div>

        <h1>{title}</h1>

        <p>{description}</p>
      </div>

      <div className="header-actions">

        <div className="connection">
          <i />
          System Online
        </div>

        <button
          className="icon-button"
          onClick={onRefresh}
          title="Refresh"
        >
          ↻
        </button>

      </div>

    </header>
  );
}

/* ================================
   DASHBOARD
================================ */

function Dashboard({
  metrics,
  exceptions,
  setPage,
  setSelectedException,
}) {
  return (
    <main className="page">

      <section className="metric-grid">

        <Metric
          label="Total Exceptions"
          value={metrics.totalExceptions}
          description="Detected by validation"
          type="purple"
          icon="◈"
        />

        <Metric
          label="Pending Review"
          value={metrics.pending}
          description="Awaiting decision"
          type="amber"
          icon="◷"
        />

        <Metric
          label="Resolved"
          value={metrics.resolved}
          description="Completed successfully"
          type="green"
          icon="✓"
        />

        <Metric
          label="High Severity"
          value={metrics.high}
          description="Requires attention"
          type="red"
          icon="!"
        />

      </section>

      <section className="hero-card">

        <div className="hero-copy">

          <div className="hero-badge">
            <span>✦</span>
            AI-POWERED WORKFLOW
          </div>

          <h2>
            From invoice to resolution,
            <br />
            <em>automatically.</em>
          </h2>

          <p>
            ResolveAI validates transactions,
            detects exceptions and uses Gemini
            to recommend the next action.
          </p>

          <button
            className="primary-button"
            onClick={() => setPage("new-invoice")}
          >
            Process an Invoice
            <span>→</span>
          </button>

        </div>

        <div className="workflow">

          <WorkflowStep
            number="01"
            title="Invoice"
            text="Transaction received"
          />

          <div className="workflow-line" />

          <WorkflowStep
            number="02"
            title="Validate"
            text="Rules checked"
          />

          <div className="workflow-line" />

          <WorkflowStep
            number="03"
            title="AI Review"
            text="Gemini investigates"
          />

          <div className="workflow-line" />

          <WorkflowStep
            number="04"
            title="Resolve"
            text="Auto or human"
          />

        </div>

      </section>

      <section className="dashboard-grid">

        <div className="panel">

          <div className="panel-header">

            <div>
              <h3>Recent Exceptions</h3>
              <p>
                Latest detected transaction issues
              </p>
            </div>

            <button
              className="text-button"
              onClick={() => setPage("exceptions")}
            >
              View all →
            </button>

          </div>

          {exceptions.length === 0 ? (
            <EmptyState
              title="No exceptions yet"
              text="Process an invoice to begin."
            />
          ) : (
            <div className="mini-list">

              {exceptions
                .slice(0, 5)
                .map((exception) => (
                  <button
                    key={exception.id}
                    className="mini-item"
                    onClick={() => {
                      setSelectedException(
                        exception
                      );
                      setPage("exceptions");
                    }}
                  >
                    <div>
                      <strong>
                        {exception.type}
                      </strong>

                      <span>
                        {exception.id} ·{" "}
                        {exception.vendor}
                      </span>
                    </div>

                    <Status
                      status={exception.status}
                    />
                  </button>
                ))}

            </div>
          )}

        </div>

        <div className="panel automation-panel">

          <div className="panel-header">
            <div>
              <h3>Automation Policy</h3>
              <p>
                Current AI decision controls
              </p>
            </div>
          </div>

          <div className="policy">

            <div className="policy-icon">
              ✦
            </div>

            <div>
              <strong>
                90% confidence threshold
              </strong>

              <p>
                Exceptions at or above 90%
                confidence may be automatically
                resolved.
              </p>
            </div>

            <span className="enabled">
              ACTIVE
            </span>

          </div>

          <div className="policy-row">
            <span>AI provider</span>
            <strong>Gemini</strong>
          </div>

          <div className="policy-row">
            <span>Human review</span>
            <strong>Enabled</strong>
          </div>

          <div className="policy-row">
            <span>Validation</span>
            <strong>Automatic</strong>
          </div>

        </div>

      </section>

    </main>
  );
}

/* ================================
   INVOICES
================================ */

function Invoices({ invoices, setPage }) {
  return (
    <main className="page">

      <div className="page-toolbar">

        <div>
          <h2>Invoice Register</h2>
          <p>
            Transactions submitted for processing.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => setPage("new-invoice")}
        >
          + New Invoice
        </button>

      </div>

      <div className="table-panel">

        <div className="table-header">
          <span>INVOICE</span>
          <span>VENDOR</span>
          <span>EXPECTED</span>
          <span>ACTUAL</span>
          <span>STATUS</span>
        </div>

        {invoices.length === 0 ? (
          <EmptyState
            title="No invoices submitted"
            text="Create your first invoice to start the workflow."
          />
        ) : (
          invoices.map((invoice, index) => (
            <div
              className="table-row"
              key={`${invoice.invoiceNumber}-${index}`}
            >
              <strong>
                {invoice.invoiceNumber}
              </strong>

              <span>{invoice.vendor}</span>

              <span>
                ${invoice.expectedAmount}
              </span>

              <span>
                ${invoice.actualAmount}
              </span>

              <Status
                status={
                  invoice.status || "Processed"
                }
              />
            </div>
          ))
        )}

      </div>

    </main>
  );
}

/* ================================
   NEW INVOICE
================================ */

function NewInvoice({
  invoice,
  updateInvoice,
  processInvoice,
  submitting,
  setPage,
}) {
  return (
    <main className="page">

      <div className="form-layout">

        <form
          className="invoice-form"
          onSubmit={processInvoice}
        >

          <div className="form-heading">
            <div className="form-number">
              01
            </div>

            <div>
              <h2>Invoice Details</h2>
              <p>
                Enter the transaction data that
                should be validated.
              </p>
            </div>
          </div>

          <div className="field-grid">

            <Field
              label="Invoice Number"
              required
              value={invoice.invoiceNumber}
              onChange={(value) =>
                updateInvoice(
                  "invoiceNumber",
                  value
                )
              }
              placeholder="INV-2026-001"
            />

            <Field
              label="Vendor"
              required
              value={invoice.vendor}
              onChange={(value) =>
                updateInvoice(
                  "vendor",
                  value
                )
              }
              placeholder="ABC Supplies"
            />

          </div>

          <div className="form-divider" />

          <div className="form-heading compact">
            <div className="form-number">
              02
            </div>

            <div>
              <h2>Amount Validation</h2>
              <p>
                Compare expected and actual values.
              </p>
            </div>
          </div>

          <div className="field-grid">

            <Field
              label="Expected Amount"
              required
              type="number"
              value={invoice.expectedAmount}
              onChange={(value) =>
                updateInvoice(
                  "expectedAmount",
                  value
                )
              }
              placeholder="1000"
            />

            <Field
              label="Actual Amount"
              required
              type="number"
              value={invoice.actualAmount}
              onChange={(value) =>
                updateInvoice(
                  "actualAmount",
                  value
                )
              }
              placeholder="1200"
            />

          </div>

          <div className="amount-preview">

            <span>
              Expected vs actual
            </span>

            {invoice.expectedAmount !== "" &&
            invoice.actualAmount !== "" ? (
              <strong
                className={
                  Number(invoice.expectedAmount) ===
                  Number(invoice.actualAmount)
                    ? "match"
                    : "mismatch"
                }
              >
                {Number(invoice.expectedAmount) ===
                Number(invoice.actualAmount)
                  ? "✓ Amounts match"
                  : `⚠ Difference: $${Math.abs(
                      Number(
                        invoice.actualAmount
                      ) -
                        Number(
                          invoice.expectedAmount
                        )
                    )}`}
              </strong>
            ) : (
              <strong>
                Enter both amounts
              </strong>
            )}

          </div>

          <div className="form-divider" />

          <div className="form-heading compact">
            <div className="form-number">
              03
            </div>

            <div>
              <h2>Purchase Order</h2>
              <p>
                Optional matching validation.
              </p>
            </div>
          </div>

          <div className="field-grid">

            <Field
              label="Purchase Order Number"
              value={
                invoice.purchaseOrderNumber
              }
              onChange={(value) =>
                updateInvoice(
                  "purchaseOrderNumber",
                  value
                )
              }
              placeholder="PO-1001"
            />

            <Field
              label="Expected Purchase Order"
              value={
                invoice.expectedPurchaseOrderNumber
              }
              onChange={(value) =>
                updateInvoice(
                  "expectedPurchaseOrderNumber",
                  value
                )
              }
              placeholder="PO-1001"
            />

          </div>

          <div className="form-divider" />

          <div className="field">

            <label>Description</label>

            <textarea
              value={invoice.description}
              onChange={(event) =>
                updateInvoice(
                  "description",
                  event.target.value
                )
              }
              placeholder="Describe the transaction..."
              rows="4"
            />

          </div>

          <div className="form-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={() => setPage("invoices")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={submitting}
            >
              {submitting
                ? "Processing..."
                : "Process Invoice →"}
            </button>

          </div>

        </form>

        <aside className="process-info">

          <div className="process-icon">
            ✦
          </div>

          <h3>
            What happens next?
          </h3>

          <Step
            number="01"
            title="Validate"
            text="The backend checks amount and purchase-order rules."
          />

          <Step
            number="02"
            title="Create exception"
            text="If validation fails, an exception is created automatically."
          />

          <Step
            number="03"
            title="AI investigation"
            text="Gemini explains the issue and recommends a resolution."
          />

          <Step
            number="04"
            title="Decision"
            text="High-confidence cases can be automated; uncertain cases go to a reviewer."
          />

        </aside>

      </div>

    </main>
  );
}

/* ================================
   EXCEPTIONS
================================ */

function Exceptions({
  exceptions,
  selectedException,
  setSelectedException,
  analyzeException,
  aiLoading,
  reviewException,
  reviewLoading,
}) {
  return (
    <main className="page">

      <div className="exception-workspace">

        <section className="exception-list">

          <div className="list-heading">

            <div>
              <h2>Exception Queue</h2>
              <p>
                Automatically generated by validation.
              </p>
            </div>

            <span>
              {exceptions.length}
            </span>

          </div>

          {exceptions.length === 0 ? (
            <EmptyState
              title="No exceptions"
              text="Every processed transaction is currently valid."
            />
          ) : (
            exceptions.map((exception) => (
              <button
                key={exception.id}
                className={
                  selectedException?.id ===
                  exception.id
                    ? "exception-card selected"
                    : "exception-card"
                }
                onClick={() =>
                  setSelectedException(
                    exception
                  )
                }
              >

                <div className="exception-card-top">

                  <span>
                    {exception.id}
                  </span>

                  <Severity
                    severity={
                      exception.severity
                    }
                  />

                </div>

                <h3>
                  {exception.type}
                </h3>

                <p>
                  {exception.vendor}
                </p>

                <div>
                  <span>
                    {exception.invoiceNumber}
                  </span>

                  <Status
                    status={exception.status}
                  />
                </div>

              </button>
            ))
          )}

        </section>

        <ExceptionDetails
          exception={selectedException}
          analyzeException={analyzeException}
          aiLoading={aiLoading}
          reviewException={reviewException}
          reviewLoading={reviewLoading}
        />

      </div>

    </main>
  );
}

/* ================================
   EXCEPTION DETAILS
================================ */

function ExceptionDetails({
  exception,
  analyzeException,
  aiLoading,
  reviewException,
  reviewLoading,
}) {
  if (!exception) {
    return (
      <section className="exception-detail empty-detail">
        <div>
          <div className="empty-icon">
            ✦
          </div>
          <h2>Select an exception</h2>
          <p>
            Select a transaction to inspect its
            validation and AI resolution.
          </p>
        </div>
      </section>
    );
  }

  const confidence =
    exception.confidence !== null &&
    exception.confidence !== undefined
      ? Number(exception.confidence)
      : null;

  return (
    <section className="exception-detail">

      <div className="detail-top">

        <div>
          <span className="detail-code">
            {exception.id}
          </span>

          <h2>{exception.type}</h2>

          <p>
            {exception.vendor} ·{" "}
            {exception.invoiceNumber}
          </p>
        </div>

        <div className="detail-badges">
          <Severity
            severity={exception.severity}
          />

          <Status status={exception.status} />
        </div>

      </div>

      <div className="detail-section">

        <label>VALIDATION RESULT</label>

        <div className="validation-error">
          <span>!</span>

          <div>
            <strong>
              Transaction failed validation
            </strong>

            {exception.validationErrors?.map(
              (error, index) => (
                <p key={index}>{error}</p>
              )
            )}

          </div>
        </div>

      </div>

      <div className="detail-section">

        <label>TRANSACTION DATA</label>

        <div className="detail-data-grid">

          <Data
            label="Expected"
            value={`$${exception.expectedAmount}`}
          />

          <Data
            label="Actual"
            value={`$${exception.actualAmount}`}
          />

          <Data
            label="Difference"
            value={`$${exception.difference}`}
          />

          <Data
            label="Purchase Order"
            value={
              exception.purchaseOrderNumber ||
              "Not provided"
            }
          />

        </div>

      </div>

      <div className="ai-panel">

        <div className="ai-panel-header">

          <div className="ai-title">

            <div>✦</div>

            <div>
              <strong>
                AI Employee Investigation
              </strong>

              <span>
                Powered by Gemini
              </span>
            </div>

          </div>

          <button
            className="ai-button"
            onClick={analyzeException}
            disabled={aiLoading}
          >
            {aiLoading
              ? "Analyzing..."
              : exception.aiExplanation
              ? "Re-analyze"
              : "Analyze with AI"}
          </button>

        </div>

        {!exception.aiExplanation ? (

          <div className="ai-empty">

            <div>✦</div>

            <p>
              Run AI investigation to understand
              why this transaction failed and what
              should happen next.
            </p>

          </div>

        ) : (

          <div className="ai-results">

            <div className="ai-explanation">

              <label>
                AI EXPLANATION
              </label>

              <p>
                {exception.aiExplanation}
              </p>

            </div>

            <div className="ai-resolution">

              <div>

                <label>
                  RECOMMENDED RESOLUTION
                </label>

                <p>
                  {exception.aiResolution ||
                    exception.resolution}
                </p>

              </div>

              {confidence !== null && (
                <div className="confidence-box">

                  <strong>
                    {confidence}%
                  </strong>

                  <span>
                    confidence
                  </span>

                </div>
              )}

            </div>

            {confidence !== null && (

              <div className="confidence-area">

                <div className="confidence-track">
                  <div
                    className={
                      confidence >= 90
                        ? "confidence-fill safe"
                        : "confidence-fill review"
                    }
                    style={{
                      width: `${confidence}%`,
                    }}
                  />
                </div>

                <div className="confidence-labels">
                  <span>0%</span>
                  <span>90% threshold</span>
                  <span>100%</span>
                </div>

              </div>

            )}

            {confidence >= 90 && (
              <div className="decision-box safe">
                <strong>
                  ✓ Eligible for automatic resolution
                </strong>

                <span>
                  AI confidence meets the 90%
                  automation threshold.
                </span>
              </div>
            )}

            {confidence !== null &&
              confidence < 90 && (
                <>
                  <div className="decision-box review">
                    <strong>
                      ! Human review required
                    </strong>

                    <span>
                      AI confidence is below the
                      automatic resolution threshold.
                    </span>
                  </div>

                  {exception.status !==
                    "Resolved" && (
                    <div className="review-actions">

                      <button
                        className="approve-button"
                        onClick={() =>
                          reviewException(
                            "approve"
                          )
                        }
                        disabled={reviewLoading}
                      >
                        ✓ Approve Resolution
                      </button>

                      <button
                        className="reject-button"
                        onClick={() =>
                          reviewException(
                            "reject"
                          )
                        }
                        disabled={reviewLoading}
                      >
                        Reject
                      </button>

                    </div>
                  )}
                </>
              )}

          </div>

        )}

      </div>

    </section>
  );
}

/* ================================
   SMALL COMPONENTS
================================ */

function Metric({
  label,
  value,
  description,
  type,
  icon,
}) {
  return (
    <div className="metric-card">

      <div className={`metric-icon ${type}`}>
        {icon}
      </div>

      <div>
        <span>{label}</span>

        <strong>{value}</strong>

        <small>{description}</small>
      </div>

    </div>
  );
}

function WorkflowStep({
  number,
  title,
  text,
}) {
  return (
    <div className="workflow-step">

      <div>{number}</div>

      <strong>{title}</strong>

      <span>{text}</span>

    </div>
  );
}

function Step({ number, title, text }) {
  return (
    <div className="info-step">

      <div>{number}</div>

      <section>
        <strong>{title}</strong>
        <p>{text}</p>
      </section>

    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}) {
  return (
    <div className="field">

      <label>
        {label}

        {required && (
          <span>*</span>
        )}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        required={required}
      />

    </div>
  );
}

function Data({ label, value }) {
  return (
    <div className="data-card">

      <span>{label}</span>

      <strong>{value}</strong>

    </div>
  );
}

function Severity({ severity }) {
  const value =
    severity || "Low";

  return (
    <span
      className={`severity ${String(
        value
      ).toLowerCase()}`}
    >
      {value}
    </span>
  );
}

function Status({ status }) {
  const resolved =
    status === "Resolved";

  return (
    <span
      className={
        resolved
          ? "status resolved"
          : "status pending"
      }
    >
      <i />
      {status || "Pending"}
    </span>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="empty-state">

      <div>◈</div>

      <strong>{title}</strong>

      <p>{text}</p>

    </div>
  );
}

export default App;