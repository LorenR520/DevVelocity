// server/files/diff-engine.ts

import { diffLines } from "diff";

/**
 * DevVelocity Diff Engine
 * -----------------------
 * Compares:
 *  - previous file version
 *  - current file version
 *
 * Returns structured diff:
 *  {
 *    added: [...lines],
 *    removed: [...lines],
 *    unchanged: [...lines],
 *    full: [
 *       { type: "added" | "removed" | "unchanged", value: "line content" }
 *    ]
 *  }
 */

export interface DiffEntry {
  type: "added" | "removed" | "unchanged";
  value: string;
}

export interface DiffResult {
  added: string[];
  removed: string[];
  unchanged: string[];
  full: DiffEntry[];
}

export function computeDiff(oldText: string, newText: string): DiffResult {
  const changes = diffLines(oldText, newText);

  const result: DiffResult = {
    added: [],
    removed: [],
    unchanged: [],
    full: [],
  };

  for (const change of changes) {
    if (change.added) {
      result.added.push(change.value);
      result.full.push({ type: "added", value: change.value });
    } else if (change.removed) {
      result.removed.push(change.value);
      result.full.push({ type: "removed", value: change.value });
    } else {
      result.unchanged.push(change.value);
      result.full.push({ type: "unchanged", value: change.value });
    }
  }

  return result;
}
