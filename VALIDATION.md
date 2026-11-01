# Validation — November 1, 2026

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
