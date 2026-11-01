# Validation — November 1, 2026

- Responsive browser checks: 320 x 740, 390 x 844, 768 x 1024, 1024 x 768, 1440 x 900. Document width stayed within the viewport at all five widths; headline, buttons and instrument had no horizontal overflow.
- Captured and visually reviewed desktop opening, clinic and expertise scenes, closing; mobile opening and all three clinical scenes; tablet clinic; 320px enquiry dialog.
- Refined 320px hero to keep the headline on two lines, removed a clipped descender, corrected the mobile sticky panel/header overlap and increased small-screen axis labels.
- Browser requested reduced motion: verified animation-name:none in the default state. The explicit Motion control enables the full sequence; verified word-in at 1.2s and chart progress changing from .08 to .7171 to 1 while scrolling. Final connection progress reaches 1.
- Native anchor navigation, visible keyboard focus, labelled enquiry fields, download completion, Escape close and focus return verified. Test content was a fictional clinic brief, with no patient information. Download received at the browser's download destination.
- Browser console: no warnings or errors during the checked flow. JavaScript syntax check passed.
- Contrast spot checks: metallic headline lightest stop 3.16:1 against page; secondary body 5.08:1; chart axis 4.57:1 against darker panel end.
- No-JavaScript content and fallback source-reviewed: headings, narrative, SVG and anchors remain present; enquiry fallback states that no contact channel is available. No full screen-reader or physical-device test performed.
- Static, dependency-free frontend; no external fonts, assets, trackers, APIs or patient data. No CSS scroll hijacking, looping requestAnimationFrame work or continuous page-wide parallax.
- Screenshots are local, ignored QA artifacts in qa/. Normal scrolling drives convergence, normalized audiogram strokes and connection progress; viewport observers handle one-time word reveals.
