"use client";

import { useMemo, useState } from "react";
import type {
  ActionItems,
  ExportResult,
  RepoAnalysis,
  StructuredOutput
} from "@/lib/types";

type StepKey = "idle" | "step1" | "step2" | "step3" | "step4" | "done" | "error";

const SAMPLE_REPO = "https://github.com/python/cpython";
const SAMPLE_CODE = `# Python 2 style legacy example
import urllib2

def load_data(url):
    print "fetching", url
    req = urllib2.Request(url)
    return urllib2.urlopen(req).read()
`;

export default function HomePage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [language, setLanguage] = useState("python");
  const [status, setStatus] = useState<StepKey>("idle");
  const [error, setError] = useState<string | null>(null);

  const [step1, setStep1] = useState<RepoAnalysis | null>(null);
  const [step2, setStep2] = useState<ActionItems | null>(null);
  const [step3, setStep3] = useState<StructuredOutput | null>(null);
  const [step4, setStep4] = useState<ExportResult | null>(null);

  const canRun = useMemo(() => !!repoUrl.trim() || !!codeInput.trim(), [repoUrl, codeInput]);

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
      const ingestPayload = { repoUrl, codeInput, language };
      const res1 = await postJson<RepoAnalysis>("/api/ingest", ingestPayload);
      setStep1(res1);

      setStatus("step2");
      const res2 = await postJson<ActionItems>("/api/generate-actions", { analysis: res1 });
      setStep2(res2);

      setStatus("step3");
      const res3 = await postJson<StructuredOutput>("/api/structure", res2);
      setStep3(res3);

      setStatus("step4");
      const res4 = await postJson<ExportResult>("/api/export", res3);
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
      }>("/api/pipeline", { repoUrl, codeInput, language });
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
    <main>
      <h1>Repo Surgeon</h1>
      <p>
        Independent 4-step services for hackathon collaboration. UI calls each service in order so
        each teammate can own one step.
      </p>

      <section className="card">
        <h2>Inputs</h2>
        <div className="row">
          <button
            className="secondary"
            type="button"
            onClick={() => {
              setRepoUrl(SAMPLE_REPO);
              setCodeInput("");
              setLanguage("python");
            }}
          >
            Use sample repo
          </button>
          <button
            className="secondary"
            type="button"
            onClick={() => {
              setCodeInput(SAMPLE_CODE);
              setRepoUrl("");
              setLanguage("python");
            }}
          >
            Use sample code
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          <label htmlFor="repo-url">GitHub repo URL</label>
          <input
            id="repo-url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <label htmlFor="language">Language hint</label>
          <select id="language" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="java">Java</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>

        <div style={{ marginTop: 12 }}>
          <label htmlFor="code-input">Or paste code directly</label>
          <textarea
            id="code-input"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder="Paste legacy files here if you do not want to fetch from GitHub."
          />
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <button type="button" disabled={!canRun} onClick={runSequentially}>
            Run steps 1→4 via UI orchestration
          </button>
          <button className="secondary" type="button" disabled={!canRun} onClick={runPipelineRoute}>
            Run via pipeline endpoint
          </button>
        </div>
        <p>Status: {status}</p>
        {error ? <p style={{ color: "#fca5a5" }}>Error: {error}</p> : null}
      </section>

      {step1 ? (
        <section className="card">
          <h2>Step 1 - Ingest and Review (Gemini)</h2>
          <pre>{JSON.stringify(step1, null, 2)}</pre>
        </section>
      ) : null}

      {step2 ? (
        <section className="card">
          <h2>Step 2 - Generate Actions + Verify (Gemini)</h2>
          <pre>{JSON.stringify(step2, null, 2)}</pre>
        </section>
      ) : null}

      {step3 ? (
        <section className="card">
          <h2>Step 3 - Structure (Dust)</h2>
          <pre>{JSON.stringify(step3, null, 2)}</pre>
        </section>
      ) : null}

      {step4 ? (
        <section className="card">
          <h2>Step 4 - Export (CodeWords)</h2>
          <pre>{JSON.stringify(step4, null, 2)}</pre>
        </section>
      ) : null}
    </main>
  );
}
