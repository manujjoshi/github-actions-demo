# Calculator App

A basic and scientific calculator served by a small Node.js server, tested and deployed to [Render](https://render.com) with GitHub Actions.

Forked from [shazforiot/github-actions-demo](https://github.com/shazforiot/github-actions-demo).

## Project Structure

```
github-actions-demo/
├── src/
│   ├── index.js             # HTTP server and API
│   ├── index.test.js        # Server tests
│   ├── scientific.js        # Scientific expression evaluator
│   ├── scientific.test.js   # Evaluator tests
│   └── public/
│       ├── index.html       # Basic calculator UI
│       └── scientific.html  # Scientific calculator UI
├── .github/
│   └── workflows/
│       ├── ci.yml           # Tests on every push and pull request
│       └── deploy.yml       # Test, build and deploy to Render
├── render.yaml              # Render service definition
├── package.json
└── README.md
```

## Quick Start

Requires Node.js 18 or newer. There are no dependencies to install.

```bash
# Run tests
npm test

# Start the server
npm start
```

Then open:
- http://localhost:3000 - basic calculator
- http://localhost:3000/scientific - scientific calculator

## API

| Endpoint | Example | Result |
|---|---|---|
| `/add`, `/subtract`, `/multiply`, `/divide` | `/add?a=5&b=3` | `{"result":8}` |
| `/evaluate` | `/evaluate?expr=2sin(30)%2B5!&angle=deg` | `{"result":121}` |
| `/health` | `/health` | `{"status":"healthy"}` |
| `/api` | `/api` | Name, version and endpoint list |

`/evaluate` supports `+ - * / ^ !`, parentheses, `sin cos tan asin acos atan sinh cosh tanh sqrt cbrt ln log exp abs floor ceil round`, the constants `pi` and `e`, and implicit multiplication such as `2pi`. The `angle` parameter is `deg` or `rad` (default `rad`). Invalid expressions return status 400 with an `error` message.

## Deployment

Every push to `main` runs [deploy.yml](.github/workflows/deploy.yml):

```
Test --> Build --> Staging --> Production (Render)
```

The staging job is a placeholder that only lists the build output. The production job calls a Render deploy hook, and Render builds and runs the app from the pushed commit. `autoDeploy` is off in [render.yaml](render.yaml), so only commits that pass tests are deployed.

One-time setup:
1. On Render, create a service with **New > Blueprint** and select this repository.
2. Copy the service's **Settings > Deploy Hook** URL.
3. In GitHub, add it under **Settings > Secrets and variables > Actions** as `RENDER_DEPLOY_HOOK_URL`.
