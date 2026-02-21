"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  ActionItems,
  ExportResult,
  RepoAnalysis,
  StructuredOutput
} from "@/lib/types";

type StepKey = "idle" | "step1" | "step2" | "step3" | "step4" | "done" | "error";
type ActiveStep = Exclude<StepKey, "idle" | "done" | "error">;

const WORKFLOW_STEPS: Array<{ key: ActiveStep; label: string }> = [
  { key: "step1", label: "Ingest and review" },
  { key: "step2", label: "Generate action plan" },
  { key: "step3", label: "Structure into tickets" },
  { key: "step4", label: "Export + notify" }
];

const STEP_HINTS: Record<ActiveStep, string[]> = {
  step1: [
    "Scanning repository content...",
    "Analyzing architecture and legacy patterns...",
    "Summarizing high-priority concerns..."
  ],
  step2: [
    "Drafting migration and refactor tasks...",
    "Validating quality and correctness...",
    "Refining priorities and effort estimates..."
  ],
  step3: [
    "Normalizing tasks into structured tickets...",
    "Mapping category, priority, and effort...",
    "Preparing acceptance criteria..."
  ],
  step4: [
    "Sending export payload to CodeWords...",
    "Preparing notification summary...",
    "Finishing delivery details..."
  ]
};

const STEP_STATE_COPY: Record<StepKey, string> = {
  idle: "Ready to run",
  step1: "Scanning inputs",
  step2: "Generating plan",
  step3: "Structuring tickets",
  step4: "Exporting and notifying",
  done: "Workflow complete",
  error: "Workflow failed"
};

const STEP_RESULT_TITLES: Record<ActiveStep, string> = {
  step1: "Ingest + Review",
  step2: "Action Plan",
  step3: "Ticket Structure",
  step4: "Delivery"
};

export default function HomePage() {
  const [reviewMode, setReviewMode] = useState<"repo" | "code">("repo");
  const [repoUrl, setRepoUrl] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [language, setLanguage] = useState("python");
  const [status, setStatus] = useState<StepKey>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastActiveStep, setLastActiveStep] = useState<ActiveStep | null>(null);
  const [loadingHintIndex, setLoadingHintIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [step1, setStep1] = useState<RepoAnalysis | null>(null);
  const [step2, setStep2] = useState<ActionItems | null>(null);
  const [step3, setStep3] = useState<StructuredOutput | null>(null);
  const [step4, setStep4] = useState<ExportResult | null>(null);

  const canRun = useMemo(() => {
    if (reviewMode === "repo") return !!repoUrl.trim();
    return !!codeInput.trim();
  }, [codeInput, repoUrl, reviewMode]);
  const isRunning = status === "step1" || status === "step2" || status === "step3" || status === "step4";
  const activeStep = isRunning ? (status as ActiveStep) : null;
  const progressPercent = useMemo(() => {
    if (status === "idle") return 0;
    if (status === "done") return 100;
    const focusStep = status === "error" ? lastActiveStep : activeStep;
    if (!focusStep) return 0;
    const activeIndex = WORKFLOW_STEPS.findIndex((step) => step.key === focusStep);
    return Math.max(10, (activeIndex + 1) * 25);
  }, [activeStep, lastActiveStep, status]);
  const loadingHint = activeStep ? STEP_HINTS[activeStep][loadingHintIndex] : null;
  const completedSteps = [step1, step2, step3, step4].filter(Boolean).length;
  const totalTickets = step3?.tickets.length ?? 0;
  const currentFocusStep = activeStep ?? lastActiveStep;
  const currentFocusStepIndex = currentFocusStep
    ? WORKFLOW_STEPS.findIndex((step) => step.key === currentFocusStep)
    : -1;

  useEffect(() => {
    if (activeStep) {
      setLastActiveStep(activeStep);
    }
  }, [activeStep]);

  useEffect(() => {
    if (!activeStep) {
      setLoadingHintIndex(0);
      setElapsedSeconds(0);
      return;
    }

    const startedAt = Date.now();
    setLoadingHintIndex(0);
    setElapsedSeconds(0);
    const intervalId = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
      setLoadingHintIndex((current) => (current + 1) % STEP_HINTS[activeStep].length);
    }, 1100);

    return () => window.clearInterval(intervalId);
  }, [activeStep]);

  function getApiUrl(path: string): string {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    if (!base) return path;
    return `${base.replace(/\/$/, "")}${path}`;
  }

  async function postJson<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(getApiUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const json = (await response.json()) as T & { error?: string };
    if (!response.ok) {
      throw new Error(json.error || `Request failed (${response.status})`);
    }
    return json;
  }

  function deriveRepoNameFromUrl(input: string): string | undefined {
    const trimmed = input.trim();
    if (!trimmed) return undefined;
    const repoSegment = trimmed.replace(/\/+$/, "").split("/").pop();
    if (!repoSegment) return undefined;
    return repoSegment.replace(/\.git$/i, "") || undefined;
  }

  function resetOutputs() {
    setError(null);
    setStep1(null);
    setStep2(null);
    setStep3(null);
    setStep4(null);
  }

  async function runSequentially() {
    if (!canRun) return;
    resetOutputs();
    try {
      setStatus("step1");
      const ingestPayload = {
        repoUrl: reviewMode === "repo" ? repoUrl : "",
        codeInput: reviewMode === "code" ? codeInput : "",
        language
      };
      const res1 = await postJson<RepoAnalysis>("/api/ingest", ingestPayload);
      setStep1(res1);

      setStatus("step2");
      const res2 = await postJson<ActionItems>("/api/generate-actions", { analysis: res1 });
      setStep2(res2);

      setStatus("step3");
      const res3 = await postJson<StructuredOutput>("/api/structure", res2);
      setStep3(res3);

      setStatus("step4");
      const res4 = await postJson<ExportResult>("/api/export", {
        structured: res3,
        repoContext:
          reviewMode === "repo"
            ? {
                repoName: deriveRepoNameFromUrl(repoUrl),
                repoUrl: repoUrl.trim() || undefined
              }
            : undefined
      });
      setStep4(res4);

      setStatus("done");
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "Unknown error");
    }
  }

  async function runPipelineRoute() {
    if (!canRun) return;
    resetOutputs();
    try {
      setStatus("step1");
      const result = await postJson<{
        step1: RepoAnalysis;
        step2: ActionItems;
        step3: StructuredOutput;
        step4: ExportResult;
      }>("/api/pipeline", {
        repoUrl: reviewMode === "repo" ? repoUrl : "",
        codeInput: reviewMode === "code" ? codeInput : "",
        language
      });
      setStep1(result.step1);
      setStep2(result.step2);
      setStep3(result.step3);
      setStep4(result.step4);
      setStatus("done");
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "Unknown error");
    }
  }

  return (
    <main className="app-shell">
      <section className="card hero-panel">
        <div className="hero-top-row">
          <span className="live-badge">Live • Gemini + Dust + CodeWords</span>
          <span className={`status-pill ${status}`}>{STEP_STATE_COPY[status]}</span>
        </div>
        <h1>Repo Surgeon</h1>
        <p className="hero-copy">
          Make legacy code obsolete in minutes. Analyze, prioritize, and ship GitHub-ready tickets
          with team notifications in one continuous AI pipeline.
        </p>

        <div className="metrics-grid">
          <article className="metric-card">
            <span className="metric-label">Pipeline Progress</span>
            <strong className="metric-value">{progressPercent}%</strong>
          </article>
          <article className="metric-card">
            <span className="metric-label">Steps Completed</span>
            <strong className="metric-value">{completedSteps}/4</strong>
          </article>
          <article className="metric-card">
            <span className="metric-label">Tickets Structured</span>
            <strong className="metric-value">{totalTickets}</strong>
          </article>
        </div>
      </section>

      <section className="card control-panel">
        <div className="section-heading">
          <h2>Launch Console</h2>
          <p>Choose input mode, configure context, and run the full workflow.</p>
        </div>

        <div className="mode-switch" role="tablist" aria-label="Review mode">
          <button
            className={reviewMode === "repo" ? "mode-button active" : "mode-button"}
            type="button"
            disabled={isRunning}
            onClick={() => {
              setReviewMode("repo");
            }}
          >
            Repo URL
          </button>
          <button
            className={reviewMode === "code" ? "mode-button active" : "mode-button"}
            type="button"
            disabled={isRunning}
            onClick={() => {
              setReviewMode("code");
            }}
          >
            Direct Code
          </button>
        </div>

        {reviewMode === "repo" ? (
          <div className="field-block">
            <label htmlFor="repo-url">GitHub repo URL</label>
            <input
              id="repo-url"
              value={repoUrl}
              disabled={isRunning}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
            />
          </div>
        ) : (
          <div className="field-block">
            <label htmlFor="code-input">Paste code directly</label>
            <textarea
              id="code-input"
              value={codeInput}
              disabled={isRunning}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Paste legacy files here."
            />
          </div>
        )}

        <div className="field-block">
          <label htmlFor="language">Language hint</label>
          <select
            id="language"
            value={language}
            disabled={isRunning}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="java">Java</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>

        <div className="row action-row">
          <button className="primary-cta" type="button" disabled={!canRun || isRunning} onClick={runSequentially}>
            {isRunning ? "Running workflow..." : "Run analysis"}
          </button>
        </div>
        {error ? <p className="error-copy">Error: {error}</p> : null}
      </section>

      <section className="card">
        <div className="section-heading">
          <h2>Workflow Timeline</h2>
          <p>Real-time status from ingest to final export and notifications.</p>
        </div>
        <div className="progress-track" aria-label="Workflow progress">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        {isRunning && loadingHint ? (
          <p className="progress-message">
            <span className="spinner-dot" aria-hidden="true" />
            {loadingHint} <span className="progress-elapsed">({elapsedSeconds}s)</span>
          </p>
        ) : null}
        <ol className="step-list">
          {WORKFLOW_STEPS.map((step) => {
            const index = WORKFLOW_STEPS.findIndex((item) => item.key === step.key);
            const state =
              status === "done"
                ? "complete"
                : index < currentFocusStepIndex
                  ? "complete"
                  : step.key === activeStep
                    ? "active"
                    : status === "error" && step.key === lastActiveStep
                      ? "error"
                      : "pending";
            return (
              <li key={step.key} className={`step-item ${state}`}>
                <span className="step-chip" aria-hidden="true">
                  {index + 1}
                </span>
                <div className="step-body">
                  <span className="step-title">{step.label}</span>
                  <span className="step-subtitle">{STEP_RESULT_TITLES[step.key]}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {step1 || step2 || step3 || step4 ? (
        <section className="results-grid">
          {step1 ? (
            <article className="card result-card">
              <h3>Step 1 — Ingest and Review</h3>
              <p className="result-summary">{step1.summary}</p>
              <ul className="result-points">
                <li>
                  <strong>Architecture:</strong> {step1.architecture}
                </li>
                <li>
                  <strong>Legacy patterns:</strong> {step1.legacyPatterns}
                </li>
                <li>
                  <strong>Top concerns:</strong> {step1.concerns}
                </li>
              </ul>
              <details>
                <summary>View raw JSON</summary>
                <pre>{JSON.stringify(step1, null, 2)}</pre>
              </details>
            </article>
          ) : null}

          {step2 ? (
            <article className="card result-card">
              <h3>Step 2 — Action Plan + Verification</h3>
              <p className="result-summary">Generated migration and reliability actions with verification notes.</p>
              <ul className="result-points">
                <li>
                  <strong>Action plan:</strong> {step2.actions.slice(0, 280)}
                  {step2.actions.length > 280 ? "..." : ""}
                </li>
                <li>
                  <strong>Verification notes:</strong> {step2.verificationNotes.slice(0, 280)}
                  {step2.verificationNotes.length > 280 ? "..." : ""}
                </li>
              </ul>
              <details>
                <summary>View raw JSON</summary>
                <pre>{JSON.stringify(step2, null, 2)}</pre>
              </details>
            </article>
          ) : null}

          {step3 ? (
            <article className="card result-card">
              <h3>Step 3 — Structured Tickets</h3>
              <p className="result-summary">{step3.summary}</p>
              <ul className="result-points">
                <li>
                  <strong>Ticket count:</strong> {step3.tickets.length}
                </li>
                <li>
                  <strong>Highest priority:</strong> {step3.tickets[0]?.priority ?? "N/A"}
                </li>
                <li>
                  <strong>First ticket:</strong> {step3.tickets[0]?.title ?? "N/A"}
                </li>
              </ul>
              <details>
                <summary>View raw JSON</summary>
                <pre>{JSON.stringify(step3, null, 2)}</pre>
              </details>
            </article>
          ) : null}

          {step4 ? (
            <article className="card result-card">
              <h3>Step 4 — Export + Notify</h3>
              <p className="result-summary">
                {step4.success ? (
                  <>
                    Issues status: <strong>created</strong> • Slack status: <strong>sent</strong>
                  </>
                ) : (
                  <>
                    Issues status: <strong>failed</strong> • Slack status: <strong>{step4.slackStatus}</strong>
                  </>
                )}
              </p>
              <details>
                <summary>View raw JSON</summary>
                <pre>{JSON.stringify(step4, null, 2)}</pre>
              </details>
            </article>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
