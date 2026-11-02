'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const AuralTimeline = require('../dist/demo/timeline.js');
const fs = require('node:fs');
const vm = require('node:vm');

function fakeClock() {
  let time = 0;
  let id = 0;
  const timers = new Map();
  return {
    now: () => time,
    setTimer: (run, delay) => { timers.set(++id, {run, at: time + delay}); return id; },
    clearTimer: timer => timers.delete(timer),
    get pending() { return timers.size; },
    nextCallback() { return [...timers.values()][0]?.run; },
    advance(amount) {
      const target = time + amount;
      let safety = 1000;
      while (safety-- > 0) {
        const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
        if (!next || next[1].at > target) { time = target; return; }
        timers.delete(next[0]);
        time = next[1].at;
        next[1].run();
      }
      throw new Error('Unexpected timer loop.');
    }
  };
}

test('plays ordered steps at the specified times and completes once', () => {
  const clock = fakeClock();
  const calls = [];
  const states = [];
  const timeline = new AuralTimeline([
    {at: 200, run: () => calls.push('review')},
    {at: 0, run: () => calls.push('prepare')},
    {at: 100, run: () => calls.push('connect')},
    {at: 100, run: () => calls.push('test')}
  ], {...clock, onState: state => states.push(state)});

  assert.equal(timeline.state, 'idle');
  assert.equal(timeline.duration, 200);
  timeline.play().play();
  clock.advance(0);
  assert.deepEqual(calls, ['prepare']);
  clock.advance(99);
  assert.equal(timeline.position, 99);
  assert.deepEqual(calls, ['prepare']);
  clock.advance(1);
  assert.deepEqual(calls, ['prepare', 'connect', 'test']);
  clock.advance(100);
  assert.equal(timeline.state, 'complete');
  assert.equal(timeline.position, 200);
  assert.equal(clock.pending, 0);
  timeline.play();
  clock.advance(1000);
  assert.deepEqual(calls, ['prepare', 'connect', 'test', 'review']);
  assert.deepEqual(states, ['playing', 'complete']);
});

test('pause preserves remaining time and resume never replays completed steps', () => {
  const clock = fakeClock();
  const calls = [];
  const timeline = new AuralTimeline([
    {at: 100, run: () => calls.push(1)},
    {at: 300, run: () => calls.push(2)}
  ], clock);
  timeline.play();
  clock.advance(150);
  timeline.pause().pause();
  assert.equal(timeline.state, 'paused');
  assert.equal(clock.pending, 0);
  clock.advance(5000);
  assert.equal(timeline.position, 150);
  assert.deepEqual(calls, [1]);
  timeline.play();
  clock.advance(149);
  assert.deepEqual(calls, [1]);
  clock.advance(1);
  assert.deepEqual(calls, [1, 2]);
  assert.equal(timeline.state, 'complete');
});

test('cancel and replay invalidate even callbacks already queued by the host', () => {
  const clock = fakeClock();
  let count = 0;
  const timeline = new AuralTimeline([{at: 100, run: () => count++}], clock);
  timeline.play();
  const stale = clock.nextCallback();
  clock.advance(40);
  timeline.cancel();
  assert.equal(timeline.state, 'idle');
  assert.equal(timeline.position, 0);
  timeline.play();
  stale();
  assert.equal(count, 0);
  assert.equal(clock.pending, 1);
  clock.advance(100);
  assert.equal(count, 1);
  timeline.reset().play();
  clock.advance(100);
  assert.equal(count, 2);
});

test('step callbacks can pause and reset without leaking later steps', () => {
  const clock = fakeClock();
  const calls = [];
  const timeline = new AuralTimeline([
    {at: 100, run: timeline => { calls.push('pause'); timeline.pause(); }},
    {at: 100, run: () => calls.push('same-time')},
    {at: 200, run: timeline => { calls.push('reset'); timeline.reset(); }},
    {at: 300, run: () => calls.push('stale')}
  ], clock);
  timeline.play();
  clock.advance(1000);
  assert.deepEqual(calls, ['pause']);
  assert.equal(timeline.position, 100);
  timeline.play();
  clock.advance(0);
  assert.deepEqual(calls, ['pause', 'same-time']);
  clock.advance(1000);
  assert.deepEqual(calls, ['pause', 'same-time', 'reset']);
  assert.equal(timeline.state, 'idle');
  assert.equal(timeline.position, 0);
  assert.equal(clock.pending, 0);
});

test('state callbacks may interrupt playback, and empty timelines finish cleanly', () => {
  const clock = fakeClock();
  const calls = [];
  const timeline = new AuralTimeline([{at: 100, run: () => calls.push('step')}], {
    ...clock,
    onState: (state, timeline) => { if (state === 'playing') timeline.pause(); }
  });
  timeline.play();
  assert.equal(timeline.state, 'paused');
  assert.equal(clock.pending, 0);
  clock.advance(1000);
  assert.deepEqual(calls, []);
  const empty = new AuralTimeline([], clock);
  empty.play();
  assert.equal(empty.state, 'complete');
  assert.equal(empty.position, 0);
  assert.equal(clock.pending, 0);
});

test('default adapters preserve browser host function receivers', () => {
  const context = vm.createContext({});
  vm.runInContext(`
    'use strict';
    let time = 0;
    let timer = null;
    let calls = 0;
    const performance = {now() {
      if (this !== performance) throw new TypeError('Illegal invocation');
      return time;
    }};
    function setTimeout(run, delay) {
      if (this !== undefined && this !== globalThis) throw new TypeError('Illegal invocation');
      timer = {run, delay};
      return 1;
    }
    function clearTimeout() {
      if (this !== undefined && this !== globalThis) throw new TypeError('Illegal invocation');
      timer = null;
    }
  `, context);
  vm.runInContext(fs.readFileSync(require.resolve('../dist/demo/timeline.js'), 'utf8'), context);
  vm.runInContext('const timeline = new AuralTimeline([{at:100, run:()=>calls++}]); timeline.play();', context);
  assert.equal(vm.runInContext('timer.delay', context), 100);
  vm.runInContext('time=40; timeline.pause();', context);
  assert.equal(vm.runInContext('timer', context), null);
  vm.runInContext('time=1000; timeline.play();', context);
  assert.equal(vm.runInContext('timer.delay', context), 60);
  vm.runInContext('time=1060; timer.run();', context);
  assert.equal(vm.runInContext('calls', context), 1);
  assert.equal(vm.runInContext('timeline.state', context), 'complete');
});
