import { defaultTasks } from "../data/seedData.js";
import {
  currentUserId,
  defaultActivities,
  defaultComments,
  defaultInvitations,
  defaultWorkspaceMembers,
  defaultWorkspaces,
} from "../features/workspace/workspaceData.js";

const MOCK_STORE_KEY = "projectos.mockBackend";

const defaultProfile = {
  id: currentUserId,
  email: "jiwon@devgym.dev",
  display_name: "지원",
  avatar_url: "",
  created_at: "2026-05-03T09:00:00.000Z",
};

const initialStore = {
  profiles: [defaultProfile],
  workspaces: defaultWorkspaces,
  workspaceMembers: defaultWorkspaceMembers,
  projects: [],
  requirements: [],
  tasks: defaultTasks,
  comments: defaultComments,
  activityLogs: defaultActivities,
  invitations: defaultInvitations,
  engineeringDocuments: [],
  engineeringDocumentVersions: [],
};

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function readMockStore() {
  try {
    const stored = window.localStorage.getItem(MOCK_STORE_KEY);
    return stored ? { ...initialStore, ...JSON.parse(stored) } : initialStore;
  } catch {
    return initialStore;
  }
}

export function writeMockStore(store) {
  window.localStorage.setItem(MOCK_STORE_KEY, JSON.stringify(store));
  return store;
}

export function updateMockStore(updater) {
  const current = readMockStore();
  const next = updater(current);
  writeMockStore(next);
  return next;
}

export function makeMockId(prefix) {
  return createId(prefix);
}

export function getMockUser() {
  return defaultProfile;
}
