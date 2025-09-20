"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./page.module.css";

interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  services: {
    database: string;
    redis: string;
  };
}

interface User {
  id: number;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export default function ApiTestPage() {
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ name: "", email: "" });

  // Temporary fix: Use Railway API URL directly until environment variable embedding is resolved
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "https://api-wellflow-pr-1.up.railway.app";

  // Debug info to verify environment variable embedding
  const debugInfo = {
    nodeEnv: process.env.NODE_ENV,
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    fallbackUrl: "http://localhost:3001",
    actualUrl: API_BASE_URL,
    buildTime: new Date().toISOString()
  };

  const testHealthEndpoint = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setHealthData(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch health data",
      );
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/users`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!newUser.name || !newUser.email) {
      setError("Please fill in both name and email");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUsers([...users, data]);
      setNewUser({ name: "", email: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testHealthEndpoint();
  }, [testHealthEndpoint]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>API Connection Test</h1>

      <div className={styles.section}>
        <h2>Health Check</h2>
        <button
          onClick={testHealthEndpoint}
          disabled={loading}
          className={styles.button}
        >
          {loading ? "Testing..." : "Test Health Endpoint"}
        </button>

        {healthData && (
          <div className={styles.healthData}>
            <h3>✅ API is healthy!</h3>
            <pre>{JSON.stringify(healthData, null, 2)}</pre>
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h2>Users API Test</h2>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className={styles.button}
        >
          {loading ? "Loading..." : "Fetch Users"}
        </button>

        <div className={styles.createUser}>
          <h3>Create New User</h3>
          <input
            type="text"
            placeholder="Name"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            className={styles.input}
          />
          <input
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            className={styles.input}
          />
          <button
            onClick={createUser}
            disabled={loading}
            className={styles.button}
          >
            {loading ? "Creating..." : "Create User"}
          </button>
        </div>

        {users.length > 0 && (
          <div className={styles.usersData}>
            <h3>Users ({users.length})</h3>
            <div className={styles.usersList}>
              {users.map((user) => (
                <div key={user.id} className={styles.userCard}>
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                  <small>ID: {user.id}</small>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className={styles.error}>
          <h3>❌ Error</h3>
          <p>{error}</p>
          <small>Make sure the API server is running on {API_BASE_URL}</small>
          <small>Environment: {process.env.NODE_ENV} | API URL: {API_BASE_URL}</small>
        <details style={{ marginTop: "10px", fontSize: "12px" }}>
          <summary>Debug Info</summary>
          <pre style={{ fontSize: "10px", background: "#f5f5f5", padding: "8px", borderRadius: "4px" }}>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </details>
        </div>
      )}

      <div className={styles.instructions}>
        <h3>Instructions</h3>
        <ol>
          <li>
            Make sure the API server is running:{" "}
            <code>cd apps/api && pnpm run start:dev</code>
          </li>
          <li>
            Make sure PostgreSQL and Redis are running:{" "}
            <code>cd apps/api && pnpm run dev:services</code>
          </li>
          <li>
            Click &ldquo;Test Health Endpoint&rdquo; to verify API connectivity
          </li>
          <li>Click &ldquo;Fetch Users&rdquo; to test the users endpoint</li>
          <li>Try creating a new user to test POST requests</li>
        </ol>
      </div>
    </div>
  );
}
