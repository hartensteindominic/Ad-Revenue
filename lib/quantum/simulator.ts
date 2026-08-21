export type Gate = 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T';
export type Operation = { gate: Gate; qubit: number };

export function simulateCircuit(qubits: number, operations: Operation[]) {
  if (!Number.isInteger(qubits) || qubits < 1 || qubits > 8) throw new Error('Qubit count must be between 1 and 8.');
  const size = 2 ** qubits;
  const re = new Float64Array(size); const im = new Float64Array(size); re[0] = 1;
  for (const op of operations) {
    if (!Number.isInteger(op.qubit) || op.qubit < 0 || op.qubit >= qubits) throw new Error('Invalid qubit.');
    const bit = 1 << op.qubit;
    for (let base = 0; base < size; base += bit * 2) {
      for (let i = 0; i < bit; i++) {
        const a = base + i; const b = a + bit;
        const ar = re[a], ai = im[a], br = re[b], bi = im[b];
        if (op.gate === 'H') { const s = 1 / Math.sqrt(2); re[a] = (ar + br) * s; im[a] = (ai + bi) * s; re[b] = (ar - br) * s; im[b] = (ai - bi) * s; }
        else if (op.gate === 'X') { re[a] = br; im[a] = bi; re[b] = ar; im[b] = ai; }
        else if (op.gate === 'Y') { re[a] = bi; im[a] = -br; re[b] = -ai; im[b] = ar; }
        else if (op.gate === 'Z') { re[b] = -br; im[b] = -bi; }
        else { const angle = op.gate === 'S' ? Math.PI / 2 : Math.PI / 4; const cr = Math.cos(angle), ci = Math.sin(angle); re[b] = br * cr - bi * ci; im[b] = br * ci + bi * cr; }
      }
    }
  }
  return Array.from({ length: size }, (_, index) => ({ state: index.toString(2).padStart(qubits, '0'), probability: re[index] ** 2 + im[index] ** 2, real: re[index], imaginary: im[index] }));
}
