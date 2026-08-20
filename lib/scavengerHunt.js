/**
 * Scavenger hunt jobs for 3D NFT drops.
 * A hunt is a public multi-stop trail. Completing stops (via claim tickets)
 * unlocks a completion reward that can be minted on Ethereum.
 */

export const HUNT_STATUSES = ['draft', 'active', 'scheduled', 'ended'];
export const STOP_TYPES = ['drop', 'zone', 'checkpoint'];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function createHunt({
  id,
  name,
  description = '',
  status = 'active',
  mode = 'unordered', // 'ordered' | 'unordered'
  stops = [],
  reward = null,
  startAt = null,
  endAt = null,
  maxCompletions = null,
  completionCount = 0,
} = {}) {
  assert(typeof name === 'string' && name.trim().length >= 2, 'Hunt name is required');
  assert(['ordered', 'unordered'].includes(mode), 'mode must be ordered or unordered');
  assert(HUNT_STATUSES.includes(status), 'Invalid hunt status');
  assert(Array.isArray(stops) && stops.length >= 1, 'Hunt needs at least one stop');

  const normalizedStops = stops.map((stop, index) => normalizeStop(stop, index));

  return {
    id: id || `hunt-${Date.now().toString(36)}`,
    name: name.trim(),
    description: String(description || '').slice(0, 500),
    status,
    mode,
    stops: normalizedStops,
    reward: reward
      ? {
          name: reward.name || `${name.trim()} Completion Badge`,
          family: reward.family || 'artifacts',
          subtype: reward.subtype || 'badge',
          rarity: reward.rarity || 'rare',
          description: reward.description || 'Scavenger hunt completion reward',
        }
      : {
          name: `${name.trim()} Completion Badge`,
          family: 'artifacts',
          subtype: 'badge',
          rarity: 'rare',
          description: 'Scavenger hunt completion reward',
        },
    schedule: {
      startAt: startAt || new Date().toISOString(),
      endAt: endAt || new Date(Date.now() + 14 * 86400000).toISOString(),
    },
    maxCompletions: maxCompletions == null ? null : Math.max(1, Number(maxCompletions)),
    completionCount: Math.max(0, Number(completionCount) || 0),
    kind: 'scavenger_hunt',
  };
}

function normalizeStop(stop, index) {
  assert(stop && typeof stop === 'object', `Stop ${index} invalid`);
  const type = stop.type || 'drop';
  assert(STOP_TYPES.includes(type), `Stop ${index} type invalid`);

  return {
    id: stop.id || `stop-${index + 1}`,
    type,
    order: Number.isFinite(stop.order) ? stop.order : index + 1,
    title: stop.title || `Stop ${index + 1}`,
    clue: stop.clue || '',
    dropId: stop.dropId || null,
    lat: Number.isFinite(stop.lat) ? stop.lat : null,
    lng: Number.isFinite(stop.lng) ? stop.lng : null,
    radiusMeters: Math.min(2000, Math.max(20, Number(stop.radiusMeters) || 100)),
    required: stop.required !== false,
  };
}

export function isHuntActive(hunt, now = new Date()) {
  if (!hunt || hunt.status !== 'active') return false;
  const t = now.getTime();
  const start = new Date(hunt.schedule?.startAt || 0).getTime();
  const end = new Date(hunt.schedule?.endAt || 0).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  if (t < start || t > end) return false;
  if (hunt.maxCompletions != null && hunt.completionCount >= hunt.maxCompletions) return false;
  return true;
}

/**
 * Progress for a wallet: which stops are cleared (by claim tickets or check-ins).
 * completedStopIds: string[]
 */
export function evaluateHuntProgress(hunt, completedStopIds = []) {
  const done = new Set((completedStopIds || []).map(String));
  const stops = [...(hunt.stops || [])].sort((a, b) => a.order - b.order);
  const required = stops.filter((s) => s.required);

  let nextStop = null;
  if (hunt.mode === 'ordered') {
    for (const stop of stops) {
      if (!done.has(stop.id)) {
        nextStop = stop;
        break;
      }
    }
  }

  const completedRequired = required.filter((s) => done.has(s.id)).length;
  const totalRequired = required.length || stops.length;
  const percent = totalRequired ? Math.round((completedRequired / totalRequired) * 100) : 0;
  const complete = totalRequired > 0 && completedRequired >= totalRequired;

  return {
    completedStopIds: [...done],
    completedRequired,
    totalRequired,
    percent,
    complete,
    nextStop,
    lockedStops:
      hunt.mode === 'ordered'
        ? stops.filter((s) => nextStop && s.order > nextStop.order).map((s) => s.id)
        : [],
  };
}

export function canCompleteStop(hunt, stopId, progress) {
  const stop = (hunt.stops || []).find((s) => s.id === stopId);
  if (!stop) return { ok: false, reason: 'stop_not_found' };
  if ((progress.completedStopIds || []).includes(stopId)) {
    return { ok: false, reason: 'already_completed' };
  }
  if (hunt.mode === 'ordered' && progress.nextStop && progress.nextStop.id !== stopId) {
    return { ok: false, reason: 'out_of_order', nextStopId: progress.nextStop.id };
  }
  return { ok: true, stop };
}

export function createDefaultHunts() {
  return [
    createHunt({
      id: 'hunt-metro-tech-trail',
      name: 'Metro Tech Trail',
      description: 'Scavenge three tech artifacts across public zones. Unordered — hit any stop first.',
      mode: 'unordered',
      status: 'active',
      stops: [
        {
          id: 'stop-camera',
          type: 'drop',
          title: 'Field Optics',
          clue: 'Near the park edge — a lens that never sleeps.',
          dropId: 'drop-field-camera-001',
          lat: 40.7648,
          lng: -73.9808,
          radiusMeters: 120,
        },
        {
          id: 'stop-robot',
          type: 'drop',
          title: 'Survey Unit',
          clue: 'Where the square hums, a metal scout waits.',
          dropId: 'drop-survey-robot-001',
          lat: 40.7359,
          lng: -73.9911,
          radiusMeters: 90,
        },
        {
          id: 'stop-deck',
          type: 'drop',
          title: 'Street Geometry',
          clue: 'Boardwalk lines. Find the deck.',
          dropId: 'drop-street-deck-001',
          lat: 33.985,
          lng: -118.4695,
          radiusMeters: 150,
        },
      ],
      reward: {
        name: 'Metro Trail Badge',
        family: 'artifacts',
        subtype: 'badge',
        rarity: 'epic',
        description: 'Completed the Metro Tech Trail scavenger hunt',
      },
    }),
    createHunt({
      id: 'hunt-ordered-relay',
      name: 'Relay Run',
      description: 'Ordered scavenger job: Camera → Robot → Deck. Complete in sequence.',
      mode: 'ordered',
      status: 'active',
      stops: [
        {
          id: 'relay-1',
          order: 1,
          type: 'drop',
          title: 'Leg 1 · Camera',
          clue: 'Start at the lens.',
          dropId: 'drop-field-camera-001',
          lat: 40.7648,
          lng: -73.9808,
          radiusMeters: 120,
        },
        {
          id: 'relay-2',
          order: 2,
          type: 'drop',
          title: 'Leg 2 · Robot',
          clue: 'Next: the survey unit.',
          dropId: 'drop-survey-robot-001',
          lat: 40.7359,
          lng: -73.9911,
          radiusMeters: 90,
        },
        {
          id: 'relay-3',
          order: 3,
          type: 'drop',
          title: 'Leg 3 · Deck',
          clue: 'Finish on the board.',
          dropId: 'drop-street-deck-001',
          lat: 33.985,
          lng: -118.4695,
          radiusMeters: 150,
        },
      ],
      reward: {
        name: 'Relay Finisher',
        family: 'artifacts',
        subtype: 'badge',
        rarity: 'legendary',
        description: 'Finished the ordered Relay Run scavenger job',
      },
    }),
  ];
}
