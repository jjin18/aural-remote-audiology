/* Purely Hearing interactive workflow. Everything is simulated locally; no audio, API,
   calibration, patient data, or clinical threshold estimation is performed. */
const AuralDemo = (() => {
  const FREQUENCIES = Object.freeze([250, 500, 1000, 2000, 4000, 8000]);
  const EXAMPLE_LEVELS = Object.freeze({
    L: Object.freeze([25, 30, 25, 35, 45, 40]),
    R: Object.freeze([20, 25, 20, 30, 40, 35])
  });
  const CHECKS = ['assistant', 'equipment', 'room'];

  class DemoSession {
    constructor() { this.reset(); }
    reset() {
      this.checks = new Set();
      this.connected = false;
      this.points = new Map();
    }
    get ready() { return CHECKS.every(check => this.checks.has(check)); }
    setReady(check, value) {
      if (!CHECKS.includes(check)) throw new Error('Unknown readiness check.');
      if (value) this.checks.add(check); else this.checks.delete(check);
      if (!this.ready) {
        this.connected = false;
        this.points.clear();
      }
    }
    connect() {
      if (!this.ready) return false;
      this.connected = true;
      return true;
    }
    clearResults() { this.points.clear(); }
    record(ear, frequency, level) {
      if (!this.ready || !this.connected) throw new Error('Prepare and connect the demo first.');
      if (!['L', 'R'].includes(ear) || !FREQUENCIES.includes(frequency) || !Number.isInteger(level) || level < 0 || level > 100 || level % 5 !== 0) {
        throw new Error('Invalid demonstration signal.');
      }
      const response = level >= EXAMPLE_LEVELS[ear][FREQUENCIES.indexOf(frequency)];
      const point = Object.freeze({ear, frequency, level, response});
      this.points.set(`${ear}-${frequency}`, point);
      return point;
    }
    getRecords() {
      return [...this.points.values()].sort((a, b) => a.ear.localeCompare(b.ear) || a.frequency - b.frequency).map(point => ({...point}));
    }
  }
  return {DemoSession, FREQUENCIES, EXAMPLE_LEVELS};
})();

// Export the pure state model for validation without requiring a browser.
if (typeof module !== 'undefined' && module.exports) module.exports = AuralDemo;

if (typeof document !== 'undefined') (() => {
  'use strict';
  const {DemoSession, FREQUENCIES, EXAMPLE_LEVELS} = AuralDemo;
  const model = new DemoSession();
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const stages = ['prepare', 'connect', 'test', 'review'];
  const svgNS = 'http://www.w3.org/2000/svg';
  let stage = 'prepare';
  let busy = '';
  let operation = 0;
  const timers = new Set();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const panelAnimations = new Map();
  let tourActive = false;
  let resumeWhenVisible = false;
  let chartSignature = '';

  function schedule(callback, delay, token = operation) {
    const timer = setTimeout(() => {
      timers.delete(timer);
      if (token === operation) callback();
    }, delay);
    timers.add(timer);
  }
  function stopOperations(message = '') {
    const previousOperation = busy;
    operation += 1;
    timers.forEach(timer => clearTimeout(timer));
    timers.clear();
    busy = '';
    document.body.classList.remove('is-presenting', 'is-connecting');
    if (previousOperation === 'signal' || previousOperation === 'running') {
      $('#signal-response').textContent = 'Presentation stopped. Recorded demo points have been kept.';
    }
    if (message) setMessage(message);
  }
  function setMessage(message) { $('#session-message').textContent = message; }
  function setButtonLabel(button, text) {
    button.setAttribute('aria-label', text);
    button.title = text;
    button.dataset.tooltip = text;
    button.dataset.state = text === 'Start session' ? 'start' : text === 'Connecting…' ? 'pending' : 'connect';
    if (button.id === 'connect-action') {
      button.querySelector('svg').innerHTML = text === 'Start session'
        ? '<path d="m9 5 11 7-11 7z"/>'
        : '<path d="m9 15 6-6M8 17l-1 1a4.25 4.25 0 0 1-6-6l4-4a4.25 4.25 0 0 1 6 0M16 7l1-1a4.25 4.25 0 0 1 6 6l-4 4a4.25 4.25 0 0 1-6 0" transform="translate(1 0) scale(.92)"/>';
    }
  }
  function allowed(next) {
    return next === 'prepare' || (next === 'connect' && model.ready) || (next === 'test' && model.connected) || (next === 'review' && model.connected && model.points.size > 0);
  }
  function setStage(next, {focus = true, message = ''} = {}) {
    if (!stages.includes(next) || !allowed(next)) return false;
    if (busy) stopOperations();
    const previous = stage;
    stage = next;
    document.body.dataset.stage = stage;
    $$('[data-panel]').forEach(panel => {
      panelAnimations.get(panel)?.cancel();
      const current = panel.dataset.panel === stage;
      panel.inert = !current;
      panel.setAttribute('aria-hidden', String(!current));
      if (previous === stage || reducedMotion.matches || !panel.animate) {
        panel.hidden = !current;
      } else if (current || panel.dataset.panel === previous) {
        panel.hidden = false;
        const animation = panel.animate(current
          ? [{opacity: 0, transform: 'translateY(8px)'}, {opacity: 1, transform: 'translateY(0)'}]
          : [{opacity: 1, transform: 'translateY(0)'}, {opacity: 0, transform: 'translateY(-5px)'}],
        {duration: current ? 850 : 320, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both'});
        panelAnimations.set(panel, animation);
        animation.onfinish = () => {
          if (!current && panel.dataset.panel !== stage) panel.hidden = true;
          animation.cancel();
          panelAnimations.delete(panel);
        };
      } else panel.hidden = true;
    });
    $('#results-section').hidden = stage !== 'review';
    if (message) setMessage(message);
    else setMessage('');
    updateUI();
    if (focus) $(`[data-stage="${stage}"]`).focus({preventScroll: true});
    return true;
  }
  function currentSignal() {
    return {
      ear: $('input[name="ear"]:checked').value,
      frequency: Number($('#frequency').value),
      level: Number($('#level').value)
    };
  }
  function applySignal(signal) {
    $(`input[name="ear"][value="${signal.ear}"]`).checked = true;
    $('#frequency').value = String(signal.frequency);
    $('#level').value = String(signal.level);
    $('#level-output').textContent = `${signal.level} dB HL`;
  }
  function formatHz(frequency) { return `${frequency.toLocaleString('en-US')} Hz`; }
  function describePoint(point) {
    return `${point.ear === 'L' ? 'Left' : 'Right'} · ${formatHz(point.frequency)} · ${point.level} dB HL. ${point.response ? 'Virtual response registered.' : 'No virtual response at this level.'}`;
  }
  function updateUI() {
    const count = model.points.size;
    const isBusy = busy !== '';
    document.body.classList.toggle('is-connected', model.connected);
    $$('[data-stage]').forEach(button => {
      const target = button.dataset.stage;
      button.disabled = !allowed(target);
      if (target === stage) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    $('#prepare-next').disabled = !model.ready || isBusy;
    $('#connect-action').disabled = !model.ready || isBusy;
    setButtonLabel($('#connect-action'), model.connected ? 'Start session' : busy === 'connecting' ? 'Connecting…' : 'Connect demo clinician');
    $('#connection-state').textContent = model.connected ? 'Connected. The demo session is ready.' : busy === 'connecting' ? 'Bringing both sides into the session…' : 'Clinic ready. Awaiting demo connection.';
    const connectionLabel = model.connected ? 'Demo connected' : busy === 'connecting' ? 'Connecting' : model.ready ? 'Clinic ready' : 'Not connected';
    $('#connection-badge').setAttribute('aria-label', connectionLabel);
    $('#connection-badge').title = connectionLabel;
    $$('.test-controls input,.test-controls select,.ear-control input').forEach(control => { control.disabled = !model.connected || isBusy; });
    $('#present-signal').disabled = !model.connected || isBusy;
    $('#run-example').disabled = !model.connected || isBusy;
    $('#run-example').hidden = busy === 'running';
    $('#cancel-sequence').hidden = busy !== 'running';
    $('#review-next').disabled = count === 0 || isBusy;
    $('#result-count').textContent = String(count);
    $('#point-count').textContent = `${count} / 12`;
    $('#point-count').setAttribute('aria-label', `${count} of 12 demo points recorded`);
    $('#session-progress').value = count;
    $('#session-progress').textContent = `${count} of 12 demonstration points`;
    $('#progress-label').textContent = !model.ready ? 'Awaiting clinic preparation' : !model.connected ? 'Ready for a connection' : count === 0 ? 'Ready for the first signal' : count === 12 ? 'Example set recorded' : 'Recording demonstration points';
    $('#review-completeness').textContent = count === 12 ? 'Both channels. All six example frequencies.' : `${count} of 12 ear–frequency combinations recorded. You can continue testing.`;
    $('#download-summary').disabled = count === 0;
    drawChart();
    if (stage === 'review') renderResults();
  }
  function svgElement(tag, attributes) {
    const element = document.createElementNS(svgNS, tag);
    for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, String(value));
    return element;
  }
  function drawChart() {
    const group = $('#chart-points');
    const records = model.getRecords();
    const signature = JSON.stringify(records);
    if (signature === chartSignature) return;
    chartSignature = signature;
    const keep = new Set();
    function retain(key, create) {
      keep.add(key);
      let node = [...group.children].find(child => child.dataset.key === key);
      if (!node) {
        node = create();
        node.dataset.key = key;
        group.append(node);
        if (!reducedMotion.matches) node.classList.add('chart-arrival');
      }
      return node;
    }
    for (const ear of ['L', 'R']) {
      const points = records.filter(point => point.ear === ear).map(point => ({...point, x: 52 + FREQUENCIES.indexOf(point.frequency) * 103.2, y: 36 + point.level * 2.95}));
      points.slice(1).forEach((point, index) => {
        const previous = points[index];
        const node = retain(`line-${ear}-${point.frequency}`, () => svgElement('path', {class: ear === 'L' ? 'trace-left' : 'trace-right', pathLength: 1}));
        node.setAttribute('d', `M${previous.x} ${previous.y}L${point.x} ${point.y}`);
      });
      for (const point of points) {
        const shape = retain(`point-${ear}-${point.frequency}-${point.level}-${point.response}`, () => ear === 'L'
          ? svgElement('path', {d: `M${point.x - 5} ${point.y - 5}l10 10m0-10l-10 10`, class: `point-left${point.response ? '' : ' no-response'}`})
          : svgElement('circle', {cx: point.x, cy: point.y, r: 5, class: `point-right${point.response ? '' : ' no-response'}`}));
        if (!shape.querySelector('title')) {
          const title = svgElement('title', {});
          title.textContent = describePoint(point);
          shape.append(title);
        }
      }
    }
    [...group.children].forEach(node => { if (!keep.has(node.dataset.key)) node.remove(); });
    $('#chart-description').textContent = records.length
      ? `${records.length} illustrative stimulus settings have been recorded. These are demonstration values and virtual responses, not measured hearing thresholds. The full values are available in the review table.`
      : 'The graph is empty. Recorded points are demonstration stimulus settings, not measured hearing thresholds.';
  }
  function renderResults() {
    const body = $('#results-body');
    body.replaceChildren();
    for (const point of model.getRecords()) {
      const row = document.createElement('tr');
      [point.ear === 'L' ? 'Left' : 'Right', formatHz(point.frequency), `${point.level} dB HL`, point.response ? 'Response' : 'No response'].forEach(value => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      });
      body.append(row);
    }
  }

  function playbackState(state) {
    const playing = state === 'playing';
    document.body.dataset.playback = state;
    document.body.classList.toggle('is-walkthrough', tourActive);
    document.body.classList.toggle('walkthrough-paused', tourActive && !playing);
    const button = $('#toggle-playback');
    const label = playing ? 'Pause walkthrough' : state === 'paused' ? 'Resume walkthrough' : 'Play walkthrough';
    setButtonLabel(button, label);
    button.querySelector('svg').innerHTML = playing ? '<path d="M9 6v12M15 6v12"/>' : '<path d="m8 5 11 7-11 7z"/>';
    panelAnimations.forEach(animation => tourActive && state === 'paused' ? animation.pause() : animation.play());
  }
  function prepareFrame(check) {
    model.setReady(check, true);
    $(`#ready-${check}`).checked = true;
    updateUI();
  }
  const tourSteps = [
    {at: 1000, run: () => prepareFrame('assistant')},
    {at: 2100, run: () => prepareFrame('equipment')},
    {at: 3200, run: () => prepareFrame('room')},
    {at: 4500, run: () => setStage('connect', {focus: false, message: 'The prepared clinic connects with a remote audiologist.'})},
    {at: 5100, run: () => {
      busy = 'connecting';
      document.body.classList.add('is-connecting');
      updateUI();
    }},
    {at: 7400, run: () => {
      model.connect();
      busy = '';
      document.body.classList.remove('is-connecting');
      updateUI();
    }},
    {at: 9100, run: () => setStage('test', {focus: false, message: 'The remote clinician presents simulated signals to each ear. The clinic remains connected.'})}
  ];
  const tourSignals = ['L', 'R'].flatMap(ear => FREQUENCIES.map((frequency, index) => ({ear, frequency, level: EXAMPLE_LEVELS[ear][index]})));
  tourSignals.forEach((signal, index) => {
    tourSteps.push({at: 10600 + index * 1100, run: () => {
      applySignal(signal);
      document.body.classList.add('is-presenting');
      document.body.dataset.channel = signal.ear;
      $('#signal-response').textContent = `${signal.ear === 'L' ? 'Left' : 'Right'} channel · ${formatHz(signal.frequency)} · presenting…`;
    }});
    tourSteps.push({at: 11250 + index * 1100, run: () => {
      const point = model.record(signal.ear, signal.frequency, signal.level);
      document.body.classList.remove('is-presenting');
      $('#signal-response').textContent = describePoint(point);
      updateUI();
    }});
  });
  tourSteps.push({at: 24700, run: () => setStage('review', {focus: false, message: 'The simulated session is complete. Both channels are ready for clinician review and documentation. You can replay or explore the controls.'})});
  tourSteps.push({at: 26200, run: () => {}});
  const timeline = new AuralTimeline(tourSteps, {onState: playbackState});
  function clearSession() {
    stopOperations();
    model.reset();
    $$('input[name="ready"]').forEach(input => { input.checked = false; });
    applySignal({ear: 'L', frequency: 1000, level: 35});
    document.body.dataset.channel = '';
    $('#signal-response').textContent = 'Ready to present a simulated signal.';
    $('#results-body').replaceChildren();
    setStage('prepare', {focus: false, message: 'Automatic walkthrough. An onsite assistant prepares the clinic and equipment.'});
  }
  function startWalkthrough() {
    timeline.reset();
    tourActive = true;
    clearSession();
    timeline.play();
    if (document.hidden) { resumeWhenVisible = true; timeline.pause(); }
  }
  function takeControl() {
    if (!tourActive) return;
    tourActive = false;
    resumeWhenVisible = false;
    timeline.cancel();
    stopOperations();
    updateUI();
    setMessage('Automatic playback stopped. Explore the controls, or replay the walkthrough.');
  }
  $('#toggle-playback').addEventListener('click', () => {
    resumeWhenVisible = false;
    if (timeline.state === 'playing') timeline.pause();
    else if (timeline.state === 'paused') timeline.play();
    else startWalkthrough();
  });
  $('#replay-walkthrough').addEventListener('click', startWalkthrough);
  // Changing controls must never race the guided sequence or lose keyboard focus.
  for (const container of [$('.stage-area'), $('.stage-navigation')]) {
    container.addEventListener('pointerdown', takeControl, {capture: true});
    container.addEventListener('focusin', takeControl);
    container.addEventListener('click', takeControl, {capture: true});
    container.addEventListener('change', takeControl, {capture: true});
  }

  $$('input[name="ready"]').forEach(input => input.addEventListener('change', () => {
    const hadSession = model.connected || busy !== '' || model.points.size > 0;
    if (busy) stopOperations();
    model.setReady(input.value, input.checked);
    if (!model.ready && hadSession) setMessage('Readiness changed. The demo connection and results were cleared.');
    else setMessage(model.ready ? 'Your clinic is ready. Connect the demo clinician.' : 'Select the three readiness checks to begin.');
    updateUI();
  }));
  $$('[data-stage]').forEach(button => button.addEventListener('click', () => setStage(button.dataset.stage)));
  $('#prepare-next').addEventListener('click', () => setStage('connect'));
  $('#connect-action').addEventListener('click', () => {
    if (model.connected) { setStage('test'); return; }
    if (!model.ready || busy) return;
    operation += 1;
    busy = 'connecting';
    document.body.classList.add('is-connecting');
    setMessage('Establishing a simulated clinic-to-clinician session.');
    updateUI();
    schedule(() => {
      model.connect();
      busy = '';
      document.body.classList.remove('is-connecting');
      setMessage('Demo clinician connected. Continue to explore the test controls.');
      updateUI();
    }, 1400);
  });
  $('#level').addEventListener('input', () => { $('#level-output').textContent = `${$('#level').value} dB HL`; });
  $('#present-signal').addEventListener('click', () => {
    if (!model.connected || busy) return;
    const signal = currentSignal();
    operation += 1;
    busy = 'signal';
    document.body.classList.add('is-presenting');
    $('#signal-response').textContent = `Presenting ${formatHz(signal.frequency)} to the ${signal.ear === 'L' ? 'left' : 'right'} demo channel…`;
    setMessage('Simulated signal in progress. No audio is played.');
    updateUI();
    schedule(() => {
      const point = model.record(signal.ear, signal.frequency, signal.level);
      busy = '';
      document.body.classList.remove('is-presenting');
      $('#signal-response').textContent = describePoint(point);
      setMessage('Demonstration point recorded. Present another signal or review the session.');
      updateUI();
    }, 900);
  });
  $('#run-example').addEventListener('click', () => {
    if (!model.connected || busy) return;
    operation += 1;
    model.clearResults();
    busy = 'running';
    const signals = ['L', 'R'].flatMap(ear => FREQUENCIES.map((frequency, index) => ({ear, frequency, level: EXAMPLE_LEVELS[ear][index]})));
    setMessage('Running twelve illustrative signals. You can stop at any time.');
    updateUI();
    function runPoint(index) {
      const signal = signals[index];
      applySignal(signal);
      document.body.classList.add('is-presenting');
      $('#signal-response').textContent = `${signal.ear === 'L' ? 'Left' : 'Right'} channel · ${formatHz(signal.frequency)} · presenting…`;
      schedule(() => {
        const point = model.record(signal.ear, signal.frequency, signal.level);
        document.body.classList.remove('is-presenting');
        $('#signal-response').textContent = describePoint(point);
        updateUI();
        if (index === signals.length - 1) {
          busy = '';
          setStage('review', {message: 'Example session complete. All twelve demonstration points are ready to review.'});
        } else schedule(() => runPoint(index + 1), 130);
      }, 330);
    }
    runPoint(0);
  });
  $('#cancel-sequence').addEventListener('click', () => {
    if (busy !== 'running') return;
    stopOperations('Sequence stopped. Recorded demo points have been kept.');
    $('#signal-response').textContent = 'Sequence stopped. You can present signals manually or restart the example.';
    updateUI();
    $('#present-signal').focus({preventScroll: true});
  });
  $('#review-next').addEventListener('click', () => setStage('review'));
  $('#return-test').addEventListener('click', () => setStage('test'));
  $('#download-summary').addEventListener('click', () => {
    if (!model.points.size || !model.connected) return;
    const records = model.getRecords();
    const lines = [
      'PURELY HEARING — DEMONSTRATION SESSION SUMMARY',
      'SIMULATED EQUIPMENT / NO PATIENT DATA / NOT A CLINICAL RECORD',
      '',
      `Exported: ${new Date().toISOString()}`,
      'Clinic checks: assistant, simulated equipment, and room marked ready.',
      'Connection: simulated in this browser only.',
      `Recorded ear–frequency combinations: ${records.length} of 12.`,
      '',
      'Channel | Frequency (Hz) | Stimulus level (dB HL) | Virtual response',
      ...records.map(point => `${point.ear === 'L' ? 'Left' : 'Right'} | ${point.frequency} | ${point.level} | ${point.response ? 'Response' : 'No response'}`),
      '',
      'These values are illustrative stimulus settings, not measured hearing thresholds.',
      'A fixed example response profile generated the virtual responses.',
      'No audio was played. No audiometer, transducer, calibrated system, or remote person was connected.',
      'No results were sent, and this demonstration does not save session data after reloading.'
    ];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], {type: 'text/plain;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'purely-hearing-demo-session.txt';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage('Demo summary downloaded. Nothing has been sent.');
  });
  $('#reset-demo').addEventListener('click', () => {
    takeControl();
    clearSession();
    setStage('prepare', {message: 'Demo reset. Select the three readiness checks to begin.'});
  });
  function syncVisibility() {
    document.body.classList.toggle('tab-hidden', document.hidden);
    if (document.hidden) {
      if (timeline.state === 'playing') { resumeWhenVisible = true; timeline.pause(); }
    } else if (resumeWhenVisible) { resumeWhenVisible = false; timeline.play(); }
  }
  document.addEventListener('visibilitychange', syncVisibility);
  window.addEventListener('pagehide', () => {
    if (timeline.state === 'playing') { resumeWhenVisible = true; timeline.pause(); }
    if (!tourActive) stopOperations();
  });
  window.addEventListener('pageshow', () => { syncVisibility(); updateUI(); });
  updateUI();
  startWalkthrough();
})();
