# Contributing to NEURO-OS

We love your input! We want to make contributing to this project as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process
We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## How to add a new Connector (AI Provider)
1. Navigate to `src/server/connectors/`.
2. Implement the `BaseConnector` interface.
3. Ensure you handle the `type` correctly (`'local'` vs `'cloud'`).
4. Implement Circuit Breaker logic (tracking error counts and handling timeouts).
5. Register it in `registry.ts`.

## Security First
If you are adding new API integrations, ensure API keys are retrieved from the secure Vault (`process.env` in simple deployments, or our AES-encrypted store). **Never commit keys.**

## Pull Requests
1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. Ensure the test suite passes.
4. Make sure your code lints.
5. Submit the PR.
