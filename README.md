# OAuth2 with PKCE Demonstration

This project is a practical implementation designed to help understand the **OAuth 2.0 Authorization Code Flow with Proof Key for Code Exchange (PKCE)**.

## Goal

The primary goal of this repository is to demystify the PKCE flow by implementing it from scratch using a modern web stack. It demonstrates how a public client (Single Page Application) can securely authenticate with a backend server without exposing client secrets.

## Architecture

The project is structured as a monorepo containing:

*   **Frontend (`apps/frontend`)**: A React application built with Vite. It acts as the **Public Client**.
    *   Generates the `code_verifier` and `code_challenge`.
    *   Initiates the authorization request.
    *   Exchanges the authorization code for an access token.
*   **Backend (`apps/backend`)**: A NestJS application. It acts as both the **Authorization Server** and **Resource Server**.
    *   Validates user credentials.
    *   Stores the `code_challenge` temporarily.
    *   Issues authorization codes.
    *   Verifies the `code_verifier` and issues JWT access tokens.

## Tech Stack

*   **Package Manager**: pnpm
*   **Backend**: NestJS, TypeORM, SQLite, Passport, JWT
*   **Frontend**: React, Vite, Axios, React Router

## The PKCE Flow Implemented

1.  **User clicks Login**: The frontend generates a random string called the `code_verifier`.
2.  **Challenge Creation**: The frontend hashes the `code_verifier` (using SHA-256) to create the `code_challenge`.
3.  **Authorization Request**: The user is redirected to the backend login endpoint, passing the `code_challenge` and `transformation_method` (S256).
4.  **User Authentication**: The user logs in with their credentials on the backend.
5.  **Code Issuance**: Upon successful login, the backend stores the `code_challenge` associated with a temporary Authorization Code and returns this code to the frontend.
6.  **Token Exchange**: The frontend sends the Authorization Code and the original `code_verifier` to the backend's token endpoint.
7.  **Verification**: The backend hashes the received `code_verifier` and compares it with the stored `code_challenge`.
8.  **Token Grant**: If they match, the backend issues an Access Token (JWT).

## Getting Started

### Prerequisites

*   Node.js
*   pnpm

### Installation

Install dependencies from the root directory:

```bash
pnpm install
```

### Running the Project

You will need to run both the backend and frontend terminals.

**1. Start the Backend:**

```bash
cd apps/backend
pnpm start:dev
```

The backend will run on `http://localhost:3000` (default NestJS port).

**2. Start the Frontend:**

```bash
cd apps/frontend
pnpm dev
```

The frontend will typically run on `http://localhost:5173`.

## Exploration

*   Check `apps/frontend/src/utils/pkce.ts` to see how the verifier and challenge are generated.
*   Check `apps/backend/src/auth/` to see how the backend handles the code exchange and validation.
