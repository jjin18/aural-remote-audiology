/* Small pausable clock for the browser-local demonstration. No background work. */
const AuralTimeline = (() => {
  'use strict';

  return class AuralTimeline {
    constructor(steps, {now = () => performance.now(), setTimer = (run, delay) => setTimeout(run, delay), clearTimer = timer => clearTimeout(timer), onState = () => {}} = {}) {
      if (!Array.isArray(steps) || steps.some(step => !Number.isFinite(step.at) || step.at < 0 || typeof step.run !== 'function')) {
        throw new TypeError('Timeline steps need a non-negative time and a callback.');
      }
      this._steps = steps.map(step => ({at: step.at, run: step.run})).sort((a, b) => a.at - b.at);
      this._now = now;
      this._setTimer = setTimer;
      this._clearTimer = clearTimer;
      this._onState = onState;
      this._state = 'idle';
      this._position = 0;
      this._startedAt = 0;
      this._next = 0;
      this._timer = null;
      this._epoch = 0;
    }

    get state() { return this._state; }
    get duration() { return this._steps.length ? this._steps[this._steps.length - 1].at : 0; }
    get position() {
      const elapsed = this._state === 'playing' ? Math.max(0, this._now() - this._startedAt) : 0;
      return Math.min(this.duration, this._position + elapsed);
    }

    play() {
      if (this._state === 'playing' || this._state === 'complete') return this;
      this._invalidate();
      const epoch = this._epoch;
      this._startedAt = this._now();
      this._setState('playing');
      if (this._state === 'playing' && this._epoch === epoch) this._arm(epoch);
      return this;
    }

    pause() {
      if (this._state !== 'playing') return this;
      this._position = this.position;
      this._invalidate();
      this._setState('paused');
      return this;
    }

    reset() {
      this._invalidate();
      this._position = 0;
      this._startedAt = 0;
      this._next = 0;
      this._setState('idle');
      return this;
    }

    cancel() { return this.reset(); }

    _setState(state) {
      if (this._state === state) return;
      this._state = state;
      this._onState(state, this);
    }

    _invalidate() {
      this._epoch += 1;
      if (this._timer !== null) this._clearTimer(this._timer);
      this._timer = null;
    }

    _arm(epoch) {
      if (this._next >= this._steps.length) {
        this._position = this.duration;
        this._invalidate();
        this._setState('complete');
        return;
      }
      const delay = Math.max(0, this._steps[this._next].at - this.position);
      this._timer = this._setTimer(() => {
        if (this._epoch !== epoch || this._state !== 'playing') return;
        this._timer = null;
        this._runDue(epoch);
      }, delay);
    }

    _runDue(epoch) {
      while (this._next < this._steps.length && this._steps[this._next].at <= this.position) {
        const step = this._steps[this._next++];
        try { step.run(this); }
        catch (error) { this.pause(); throw error; }
        // A callback may pause, reset, cancel, or start a fresh playback.
        if (this._epoch !== epoch || this._state !== 'playing') return;
      }
      this._arm(epoch);
    }
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = AuralTimeline;
