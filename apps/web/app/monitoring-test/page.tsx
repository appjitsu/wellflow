"use client";

import { useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { captureException, addTag } from "../../lib/logrocket";

export default function MonitoringTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const testSentryError = () => {
    try {
      throw new Error("Test Sentry error from web app");
    } catch (error) {
      Sentry.captureException(error);
      addResult("Sentry error captured");
    }
  };

  const testSentryMessage = () => {
    Sentry.captureMessage("Test Sentry message from web app", "info");
    addResult("Sentry message sent");
  };

  const testLogRocketException = () => {
    try {
      throw new Error("Test LogRocket error");
    } catch (error) {
      captureException(error as Error, { context: "monitoring-test" });
      addResult("LogRocket exception captured");
    }
  };

  const testLogRocketTag = () => {
    addTag("test-feature", "monitoring-test");
    addResult("LogRocket tag added");
  };

  const testAPIError = async () => {
    try {
      const response = await fetch("/api/test-error", { method: "POST" });
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
    } catch (error) {
      addResult(`API error test completed: ${error}`);
    }
  };

  const testAPISentry = async () => {
    try {
      const response = await fetch("/api/test-sentry", { method: "POST" });
      const data = await response.json();
      addResult(`API Sentry test: ${data.message}`);
    } catch (error) {
      addResult(`API Sentry test failed: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h1>Monitoring Integration Test</h1>

      <div style={{ marginBottom: "20px" }}>
        <h2>Frontend Tests</h2>
        <button
          onClick={testSentryError}
          style={{ margin: "5px", padding: "10px" }}
        >
          Test Sentry Error
        </button>
        <button
          onClick={testSentryMessage}
          style={{ margin: "5px", padding: "10px" }}
        >
          Test Sentry Message
        </button>
        <button
          onClick={testLogRocketException}
          style={{ margin: "5px", padding: "10px" }}
        >
          Test LogRocket Exception
        </button>
        <button
          onClick={testLogRocketTag}
          style={{ margin: "5px", padding: "10px" }}
        >
          Test LogRocket Tag
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h2>API Tests</h2>
        <button
          onClick={testAPIError}
          style={{ margin: "5px", padding: "10px" }}
        >
          Test API Error (Sentry)
        </button>
        <button
          onClick={testAPISentry}
          style={{ margin: "5px", padding: "10px" }}
        >
          Test API Sentry Message
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={clearResults}
          style={{ margin: "5px", padding: "10px", backgroundColor: "#f0f0f0" }}
        >
          Clear Results
        </button>
      </div>

      <div>
        <h2>Test Results</h2>
        <div
          style={{
            backgroundColor: "#f5f5f5",
            padding: "10px",
            border: "1px solid #ddd",
            minHeight: "200px",
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          {testResults.length === 0 ? (
            <p style={{ color: "#666" }}>
              No test results yet. Click the buttons above to test monitoring
              integrations.
            </p>
          ) : (
            testResults.map((result, index) => (
              <div key={index} style={{ marginBottom: "5px" }}>
                {result}
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: "20px", fontSize: "12px", color: "#666" }}>
        <h3>Instructions:</h3>
        <ul>
          <li>Check your Sentry dashboard for captured errors and messages</li>
          <li>
            Check your LogRocket dashboard for session recordings and exceptions
          </li>
          <li>
            API tests will hit the backend endpoints to test server-side
            monitoring
          </li>
          <li>
            Make sure environment variables are configured for both services
          </li>
        </ul>
      </div>
    </div>
  );
}
