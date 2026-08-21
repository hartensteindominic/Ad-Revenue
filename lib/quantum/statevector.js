const complex = (re = 0, im = 0) => ({ re, im });
const add = (a, b) => complex(a.re + b.re, a.im + b.im);
const mul = (a, b) => complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const scale = (a, s) => complex(a.re * s, a.im * s);

export function simulateBellState() {
  const invSqrt2 = 1 / Math.sqrt(2);
  const state = Array.from({ length: 4 }, () => complex());
  state[0] = complex(invSqrt2);
  state[3] = complex(invSqrt2);
  return probabilities(state);
}

export function applySingleQubitGate(state, qubit, gate) {
  const n = Math.log2(state.length);
  if (!Number.isInteger(n) || qubit < 0 || qubit >= n) throw new Error('Invalid quantum state or qubit');
  const out = state.map(() => complex());
  const bit = 1 << qubit;
  for (let i = 0; i < state.length; i++) {
    if ((i & bit) !== 0) continue;
    const j = i | bit;
    out[i] = add(out[i], add(mul(gate[0][0], state[i]), mul(gate[0][1], state[j])));
    out[j] = add(out[j], add(mul(gate[1][0], state[i]), mul(gate[1][1], state[j])));
  }
  return out;
}

export function probabilities(state) {
  return state.map((a, index) => ({ basis: index.toString(2).padStart(Math.log2(state.length), '0'), probability: Number((a.re * a.re + a.im * a.im).toFixed(8)) }));
}

export const gates = {
  H: [[complex(1 / Math.sqrt(2)), complex(1 / Math.sqrt(2))], [complex(1 / Math.sqrt(2)), complex(-1 / Math.sqrt(2))]],
  X: [[complex(0), complex(1)], [complex(1), complex(0)]],
};
