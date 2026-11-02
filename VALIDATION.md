# Validation — November 1, 2026

## Purely Hearing rebrand

- Removed the demo signup popup, its JavaScript, styles and unused configuration. The Experience the demo link navigates directly to the automatic demo; verified in the browser.
- Updated public branding, document titles, metadata, accessible labels, favicons and download names to Purely Hearing. Internal model identifiers are unchanged.
- Checked homepage widths 320, 390, 768, 1024 and 1440: no horizontal overflow or wordmark/navigation collision. The demo header also fits at 320px with separated brand, disclosure and back control.
- Verified automatic playback starts after direct navigation. No browser warnings or errors. All eleven existing tests and JavaScript syntax checks pass.
- Prepared static Vercel configuration using dist/ without build or installation dependencies.

## Automatic walkthrough update

- Verified a fresh load reaches review with all twelve points, without clicks or keyboard focus changes. The completed frame holds until replay or interaction.
- Verified pause holds both readiness and an eight-point test state; resume continues, and replay clears the session. Manual navigation cancels the tour, keeps its eight recorded points, and focuses the selected control.
- Six clock tests cover timing, remaining-time pause/resume, stale timer cancellation, replay, callback interruptions, completion and browser timer binding. Together with the five session-model tests, all eleven pass.
- Rechecked 320, 390, 768, 1024 and 1440 widths: no horizontal overflow. Controls remain within the opening viewport; stage space is reserved across transitions.
- Full-motion transitions inspected through the ignored local media-preference fixture. Signal packets converge, panels fade, and only new chart segments animate. The normal browser's reduced-motion setting still auto-advances without spatial effects.
- Hidden-tab pause/resume is implemented and source-reviewed using the tested clock; the available browser surface did not expose a real hidden-document state during tab switching.
- The signup experiment was subsequently removed at the user's request. No email addresses are collected or sent by this website.

## Landing page

- Browser checked at 320 × 740, 390 × 844, 768 × 1024, 1024 × 768 and 1440 × 900. No horizontal overflow. Reviewed desktop and mobile opening, sticky clinical instrument and scroll transitions; refined the 320px headline and mobile chart placement.
- Animation begins automatically. No footer motion switch or numbered scene labels remain. The browser requested reduced motion; verified gentle automatic lighting and the quiet waveform variant without spatial text movement.
- Full spatial motion checked through an ignored local QA server that overrides only the reduced-motion condition. Verified organic field transforms, scroll-linked text opacity/rotation/translation, canvas activity and clinical stage transitions. Production files retain the real user-preference check. This was not physical-device or OS-setting emulation.
- Native scrolling remains intact. Offscreen lighting and canvas work pause; hidden documents suspend animation. Motion mini is bundled locally, with no CDN request.
- Enquiry dialog opens, Escape closes it and focus returns to its trigger. Existing local brief download behavior is unchanged. No backend submission is claimed.

## Interactive demo

- Checked all five widths above after removing visible prose. Fixed a mobile overflow caused by ambient lighting. The 320px test controls and full review remain within the viewport.
- Visual controls retain accessible names, keyboard focus styles and focus/hover tooltips. Headings, status announcements, input labels and the results table remain available to assistive technology. The small Demo disclosure explains the simulation on demand.
- Verified preparation gating, the timed simulated connection, manual ear/frequency/level controls, virtual response recording, a complete twelve-point example, review and local summary download.
- Verified stopping an example preserves its recorded points. Reset during an active sequence cancels pending work, clears results and disconnects; no delayed points reappear. Readiness revocation invalidates the connected session.
- Opened the downloaded summary and verified its explicit demonstration/no-clinical-record wording. No actual sound, device, remote clinician, patient information, persistent storage or backend is involved.
- Five Node state-model tests pass: explicit readiness/connection, rejected invalid stimulus settings, unique point replacement, sorted detached twelve-point records, and invalidation/reset.

## Checks and limits

- JavaScript syntax checks and git whitespace checks pass. No browser console warnings or errors in the tested flows.
- Source reviewed for no-JavaScript fallback: landing-page content, SVG, navigation and enquiry fallback remain meaningful. Demo provides its no-script notice; its simulated workflow requires JavaScript.
- No full screen-reader audit, physical mobile-device test, clinical validation or equipment integration was performed.
- Ignored local screenshots are in qa/: fluid-opening.png, fluid-mobile.png, demo-mobile.png and demo-visual.png. They are QA artifacts, not deployed assets.
- Open-source adaptations and full licenses are recorded in dist/THIRD-PARTY-NOTICES.txt and dist/vendor/MOTION-LICENSE.md.
