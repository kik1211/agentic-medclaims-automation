# Contributing to ClaimPilot India

Thank you for your interest in contributing to **ClaimPilot India**! We welcome contributions from developers, healthcare IT specialists, and open-source enthusiasts.

## How to Contribute

1. **Fork the Repository**: Create a personal fork on GitHub.
2. **Clone your Fork**:
   ```bash
   git clone https://github.com/your-username/Claim_bot_2.git
   cd Claim_bot_2
   ```
3. **Create a Feature Branch**:
   ```bash
   git checkout -b feat/short-description
   ```
4. **Make Your Changes**: Ensure your changes adhere to code style guidelines and pass all static checks.
5. **Run Typecheck & Linting**:
   ```bash
   # Frontend
   npm run lint
   npm run lint:full

   # Backend
   cd backend
   npm run typecheck
   ```
6. **Submit a Pull Request**: Push your branch to GitHub and open a Pull Request against `main`.

## Coding Guidelines
- Maintain strict TypeScript type annotations (`noImplicitAny`).
- Follow the established multi-layer backend architecture (Controller -> Service -> Repository -> Database).
- Preserve existing API contracts and database schema compatibility.
