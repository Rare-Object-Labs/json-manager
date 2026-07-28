# {{DISPLAY_NAME}}

{{DESCRIPTION}}

Repository: `{{REPO_NAME}}`  
Default folder: `{{FOLDER_NAME}}`  
POC domain: `{{POC_DOMAIN}}`

## Prerequisites

- Node.js 22 or newer
- npm 10 or newer

## Getting started

```powershell
npm install
npm run dev
```

Vite prints the local development URL after startup.

## Available commands

- `npm run dev` starts the Vite development server.
- `npm run build` type-checks and creates a production build in `dist`.
- `npm run lint` checks the codebase with ESLint.
- `npm test` runs the Vitest test suite once.
- `npm run test:watch` runs Vitest in watch mode.

## Environment variables

Copy `.env.example` to `.env.local` if the application needs local configuration. `POC_DOMAIN` records deployment metadata and is not exposed to browser code. Browser-visible variables must use the `VITE_` prefix. Do not commit secrets.

## Standard deployment foundation

Proof-of-concept deployments follow this convention:

- Registrar: Porkbun
- DNS provider: Cloudflare
- POC hosting: Cloudflare Pages
- Source control: GitHub
- Umbrella domain: `rareobjectlabs.app`
- App POC domain: `{{POC_DOMAIN}}`
- Default POC domain: `{{REPO_NAME}}.rareobjectlabs.app`

Examples include `stackmap.rareobjectlabs.app` and `parenting-time.rareobjectlabs.app`.

This template documents the convention only. Cloudflare configuration, DNS records, and deployment setup are performed separately.

## Project structure

```text
src/                  React application and tests
docs/                 Product, architecture, and decision records
index.html             Vite HTML entry point
vite.config.ts         Vite and Vitest configuration
eslint.config.js       ESLint flat configuration
```

## Customizing the template

Replace `{{DISPLAY_NAME}}`, `{{REPO_NAME}}`, `{{FOLDER_NAME}}`, `{{DESCRIPTION}}`, and `{{POC_DOMAIN}}` when creating an application from this template. Unless explicitly overridden, set `{{POC_DOMAIN}}` to `{{REPO_NAME}}.rareobjectlabs.app`. Then replace the neutral shell with product-specific components and documentation.
