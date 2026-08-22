import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api";

function App() {
  const [exceptions, setExceptions] = useState([]);
  const [selectedException, setSelectedException] = useState(null);
  const [explanation, setExplanation] = useState("");
  const [resolution, setResolution] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/exceptions`)
      .then((response) => response.json())
      .then((data) => {
        setExceptions(data);

        if (data.length > 0) {
          setSelectedException(data[0]);
        }
      })
      .catch((error) => {
        console.error("Failed to load exceptions:", error);
      });
  }, []);

  const selectException = (exception) => {
    setSelectedException(exception);
    setExplanation("");
    setResolution(null);
  };

  const explainException = async () => {
    if (!selectedException) return;

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/exceptions/${selectedException.id}/ai-explain`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      setExplanation(data.explanation);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const suggestResolution = async () => {
    if (!selectedException) return;

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/exceptions/${selectedException.id}/suggest`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      setResolution(data);

      setExceptions((current) =>
        current.map((item) =>
          item.id === selectedException.id
            ? {
                ...item,
                confidence: data.confidence,
                resolution: data.resolution,
              }
            : item,
        ),
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resolveException = async () => {
    if (!selectedException) return;

    try {
      const response = await fetch(
        `${API_URL}/exceptions/${selectedException.id}/resolve`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          `${data.message}\nConfidence: ${data.confidence}%\nHuman review required.`,
        );
        return;
      }

      const updated = data.exception;

      setExceptions((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );

      setSelectedException(updated);
    } catch (error) {
      console.error(error);
    }
  };

  const total = exceptions.length;

  const pending = exceptions.filter((item) => item.status === "Pending").length;

  const resolved = exceptions.filter(
    (item) => item.status === "Resolved",
  ).length;

  const escalated = exceptions.filter(
    (item) => item.confidence !== null && item.confidence < 90,
  ).length;

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>Exception Resolution Workbench</h1>
          <p>AI-assisted transaction exception management</p>
        </div>

        <div className="status">
          <span className="status-dot"></span>
          System Online
        </div>
      </header>

      <main className="container">
        <section className="metrics">
          <div className="metric-card">
            <span>Total Exceptions</span>
            <strong>{total}</strong>
          </div>

          <div className="metric-card">
            <span>Pending Review</span>
            <strong>{pending}</strong>
          </div>

          <div className="metric-card">
            <span>Resolved</span>
            <strong>{resolved}</strong>
          </div>

          <div className="metric-card">
            <span>Human Review</span>
            <strong>{escalated}</strong>
          </div>
        </section>

        <section className="workspace">
          <div className="queue">
            <div className="section-header">
              <div>
                <h2>Exception Queue</h2>
                <p>Flagged transactions requiring attention</p>
              </div>
            </div>

            <div className="exception-list">
              {exceptions.map((exception) => (
                <button
                  key={exception.id}
                  className={`exception-item ${
                    selectedException?.id === exception.id ? "selected" : ""
                  }`}
                  onClick={() => selectException(exception)}
                >
                  <div className="exception-top">
                    <span className="exception-id">{exception.id}</span>

                    <span
                      className={`severity ${exception.severity.toLowerCase()}`}
                    >
                      {exception.severity}
                    </span>
                  </div>

                  <h3>{exception.type}</h3>

                  <p>{exception.vendor}</p>

                  <div className="exception-bottom">
                    <span>{exception.invoiceNumber}</span>

                    <span
                      className={
                        exception.status === "Resolved" ? "resolved" : "pending"
                      }
                    >
                      {exception.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="details">
            {selectedException ? (
              <>
                <div className="details-header">
                  <div>
                    <span className="label">{selectedException.id}</span>

                    <h2>{selectedException.type}</h2>

                    <p>{selectedException.vendor}</p>
                  </div>

                  <span
                    className={`severity ${selectedException.severity.toLowerCase()}`}
                  >
                    {selectedException.severity}
                  </span>
                </div>

                <div className="data-grid">
                  <div>
                    <span>Invoice</span>
                    <strong>{selectedException.invoiceNumber}</strong>
                  </div>

                  <div>
                    <span>Expected Amount</span>
                    <strong>${selectedException.expectedAmount}</strong>
                  </div>

                  <div>
                    <span>Actual Amount</span>
                    <strong>${selectedException.actualAmount}</strong>
                  </div>

                  <div>
                    <span>Difference</span>
                    <strong className="difference">
                      ${selectedException.difference}
                    </strong>
                  </div>
                </div>

                <div className="description">
                  <span>Why was this flagged?</span>
                  <p>{selectedException.description}</p>
                </div>

                <div className="actions">
                  <button
                    className="secondary-button"
                    onClick={explainException}
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Explain Exception"}
                  </button>

                  <button
                    className="primary-button"
                    onClick={suggestResolution}
                    disabled={loading}
                  >
                    Suggest Resolution
                  </button>
                </div>

                {explanation && (
                  <div className="ai-card">
                    <div className="ai-title">
                      <span>✦</span>
                      AI Explanation
                    </div>

                    <p>{explanation}</p>
                  </div>
                )}

                {resolution && (
                  <div className="resolution-card">
                    <div className="resolution-header">
                      <div>
                        <span>Suggested Resolution</span>
                        <h3>{resolution.resolution}</h3>
                      </div>

                      <div className="confidence">
                        <strong>{resolution.confidence}%</strong>
                        <span>Confidence</span>
                      </div>
                    </div>

                    <div
                      className={
                        resolution.autoResolve
                          ? "decision safe"
                          : "decision review"
                      }
                    >
                      {resolution.autoResolve
                        ? "✓ Eligible for automatic resolution"
                        : "⚠ Human review required"}
                    </div>

                    {resolution.autoResolve && (
                      <button
                        className="resolve-button"
                        onClick={resolveException}
                      >
                        Auto Resolve
                      </button>
                    )}
                  </div>
                )}

                {selectedException.status === "Resolved" && (
                  <div className="resolved-banner">
                    ✓ This exception has been resolved.
                  </div>
                )}
              </>
            ) : (
              <div className="empty">Select an exception to view details.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
