# Purely Hearing — remote diagnostic audiology

Static, buildless frontend. Serve `dist/` with a local HTTP server. Relative URLs support GitHub Pages project hosting.

## Experience

The landing page uses automatic organic light fields, a lightweight animated 2D sound field, and scroll-linked typography. The locally bundled Motion 14.9.0 mini engine is 8.1 KB minified. CSS Mesh and Codrops effect6 are adapted under MIT licenses; source URLs and complete notices are in `dist/THIRD-PARTY-NOTICES.txt` and `dist/vendor/MOTION-LICENSE.md`.

There is no motion opt-in. Reduced-motion devices receive automatic opacity changes, quiet lighting and subtle wave breathing without text displacement. Visible canvas work and offscreen lighting pause when not needed. Native scrolling is preserved.

## Interactive demo

The Experience the demo link opens `demo/` directly, without a signup popup. The browser-local demo follows preparation, simulated clinician connection, test controls, and review/export. It uses fixed illustrative values and a virtual response profile. No audio is played and no equipment, remote person, patient record, API or backend is connected. The controls and local downloads work; this is not pilot equipment integration or diagnostic software.

The demo uses visual controls with accessible labels and focus/hover tooltips. Supporting prose is screen-reader-only; the small Demo disclosure explains the simulation on demand.

The 26-second walkthrough starts automatically: preparation, connection, twelve simulated signals, then review. Pause preserves the current position; replay starts a fresh session. Using a workflow control cancels automatic playback and preserves recorded points. Hidden tabs pause the walkthrough; reduced motion removes spatial transitions while retaining the automatic sequence. No automatic download or email is triggered by watching.

No patient information is requested or stored. The main site's partnership form downloads a local brief; it does not submit an enquiry. The product is branded Purely Hearing.

## Deployment

The production custom domain is `trypurelyhearing.com`, registered with Network Solutions and served by GitHub Pages. Keep `dist/CNAME` in every Pages publication. The `www` record targets `jjin18.github.io`; the apex uses GitHub Pages' documented IP addresses.

Vercel configuration is in `vercel.json`: the Purely Hearing project serves `dist/` as a static site, without an install or build command. Directory URLs preserve the demo's relative assets. The original Sites identity remains in `.openai/hosting.json`. GitHub Pages can also serve the contents of `dist/`, including `demo/` and `vendor/`, from the `gh-pages` branch. There is no runtime CDN dependency.

See `VALIDATION.md` for checked behavior and limitations.
