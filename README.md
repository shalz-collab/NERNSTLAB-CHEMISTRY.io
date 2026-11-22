# NernstLab

An interactive Nernst equation simulator for exploring electrochemical cell
potentials, experiments, and scientific visualizations.

## Run Locally

**Prerequisites:** Node.js 22+

1. Install dependencies with `npm ci`.
2. Start the development server with `npm run dev`.
3. Create a production build with `npm run build`.

## Deploy to GitHub Pages

The `main` branch is built and deployed automatically by
`.github/workflows/deploy.yml`. The site is published at
https://shalz-collab.github.io/NERNSTLAB-CHEMISTRY.io/.

To enable deployment, open the repository's **Settings → Pages** and set the
build and deployment source to **GitHub Actions**. Subsequent pushes to `main`
will publish the site.
