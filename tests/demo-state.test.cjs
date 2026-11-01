'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {DemoSession} = require('../dist/demo/demo.js');

const checks = ['assistant', 'equipment', 'room'];
const frequencies = [250, 500, 1000, 2000, 4000, 8000];

function preparedSession() {
  const session = new DemoSession();
  checks.forEach(check => session.setReady(check, true));
  return session;
}

function connectedSession() {
  const session = preparedSession();
  assert.equal(session.connect(), true);
  return session;
}

test('requires all readiness checks and an explicit connection before recording', () => {
  const session = new DemoSession();
  for (const check of checks) {
    assert.equal(session.ready, false);
    assert.equal(session.connect(), false);
    assert.equal(session.connected, false);
    assert.throws(() => session.record('L', 1000, 35), /Prepare and connect/);
    session.setReady(check, true);
  }

  assert.equal(session.ready, true);
  assert.equal(session.connected, false);
  assert.throws(() => session.record('L', 1000, 35), /Prepare and connect/);
  assert.deepEqual(session.getRecords(), []);
  assert.equal(session.connect(), true);
  assert.equal(session.record('L', 1000, 35).response, true);
});

test('rejects invalid stimulus settings without altering recorded results', () => {
  const session = connectedSession();
  session.record('R', 500, 30);
  const original = session.getRecords();
  const invalidSignals = [
    ['left', 1000, 35], ['X', 1000, 35],
    ['L', 750, 35], ['L', '1000', 35], ['L', NaN, 35],
    ['L', 1000, -5], ['L', 1000, 105], ['L', 1000, 32],
    ['L', 1000, 32.5], ['L', 1000, NaN], ['L', 1000, Infinity],
    ['L', 1000, '35'], ['L', 1000, undefined]
  ];
  for (const signal of invalidSignals) {
    assert.throws(() => session.record(...signal), /Invalid demonstration signal/);
    assert.deepEqual(session.getRecords(), original);
  }
  assert.equal(session.record('L', 250, 0).response, false);
  assert.equal(session.record('L', 8000, 100).response, true);
});

test('a repeated ear and frequency replaces the previous stimulus and response', () => {
  const session = connectedSession();
  const first = session.record('L', 1000, 20);
  assert.equal(first.response, false);
  session.record('R', 1000, 30);
  const replacement = session.record('L', 1000, 25);

  assert.equal(replacement.response, true);
  assert.equal(session.points.size, 2);
  assert.deepEqual(session.getRecords(), [
    {ear: 'L', frequency: 1000, level: 25, response: true},
    {ear: 'R', frequency: 1000, level: 30, response: true}
  ]);
  assert.equal(first.level, 20);
  assert.equal(first.response, false);
});

test('returns all twelve combinations sorted by ear then frequency as detached copies', () => {
  const session = connectedSession();
  for (const ear of ['R', 'L']) {
    for (const frequency of [...frequencies].reverse()) session.record(ear, frequency, 50);
  }
  const records = session.getRecords();
  const expected = ['L', 'R'].flatMap(ear => frequencies.map(frequency => ({
    ear, frequency, level: 50, response: true
  })));

  assert.equal(session.points.size, 12);
  assert.deepEqual(records, expected);
  records[0].level = 0;
  records[0].response = false;
  records.reverse();
  records.pop();
  assert.deepEqual(session.getRecords(), expected);
  assert.notStrictEqual(session.getRecords()[0], session.getRecords()[0]);
});

test('revoking any readiness check or resetting invalidates the connection and results', () => {
  for (const check of checks) {
    const session = connectedSession();
    session.record('L', 1000, 35);
    session.setReady(check, false);
    assert.equal(session.ready, false);
    assert.equal(session.connected, false);
    assert.equal(session.points.size, 0);
    assert.deepEqual(session.getRecords(), []);
    assert.throws(() => session.record('R', 1000, 35), /Prepare and connect/);

    session.setReady(check, true);
    assert.equal(session.ready, true);
    assert.equal(session.connected, false);
    assert.throws(() => session.record('R', 1000, 35), /Prepare and connect/);
    assert.equal(session.connect(), true);
    session.record('R', 1000, 35);
    session.reset();
    assert.equal(session.ready, false);
    assert.equal(session.connected, false);
    assert.equal(session.checks.size, 0);
    assert.equal(session.points.size, 0);
    assert.deepEqual(session.getRecords(), []);
    assert.equal(session.connect(), false);
  }
});
