/**
 * Workspaces — a level below the organization.
 *
 * The organization is the company account (billing, team roster, API keys).
 * A workspace is a hiring context inside it, with its own candidate-facing
 * customisation, careers page and notification templates. One organization can
 * hold several workspaces; the switcher under the logo moves between them.
 */

function delay(ms = 400) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function err(code: string) {
  return { code, message: code };
}

export type Workspace = {
  id: string;
  name: string;
  /** Plan label shown as a pill beside the name in the switcher. */
  plan: string;
  /** Two-letter monogram used when no logo is set. */
  initials: string;
};

export const WORKSPACE_NAME_MAX = 40;

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '--';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

let workspaceStore: Workspace[] = [
  { id: 'ws_1', name: 'XInterview', plan: 'Pro', initials: 'XI' },
];

let activeId = 'ws_1';

export async function getWorkspaces(): Promise<Workspace[]> {
  await delay(300);
  return workspaceStore.map((w) => ({ ...w }));
}

export async function getActiveWorkspace(): Promise<Workspace> {
  await delay(200);
  const found = workspaceStore.find((w) => w.id === activeId);
  return { ...(found ?? workspaceStore[0]) };
}

export async function setActiveWorkspace(id: string): Promise<Workspace> {
  await delay(300);
  const found = workspaceStore.find((w) => w.id === id);
  if (!found) throw err('workspace_not_found');
  activeId = id;
  return { ...found };
}

export async function createWorkspace(name: string): Promise<Workspace> {
  await delay(600);
  const trimmed = name.trim();
  if (!trimmed) throw err('workspace_name_required');
  if (trimmed.length > WORKSPACE_NAME_MAX) throw err('workspace_name_too_long');
  if (workspaceStore.some((w) => w.name.toLowerCase() === trimmed.toLowerCase())) {
    throw err('workspace_name_taken');
  }

  const ws: Workspace = {
    id: `ws_${Math.random().toString(36).slice(2, 10)}`,
    name: trimmed,
    plan: 'Free',
    initials: initialsOf(trimmed),
  };
  workspaceStore = [...workspaceStore, ws];
  activeId = ws.id;
  return { ...ws };
}
