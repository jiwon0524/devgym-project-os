import { buildEngineeringArtifacts } from "../features/requirements/engineeringArtifacts.js";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";
import { makeMockId, readMockStore, updateMockStore } from "./mockStore.js";

export function buildEngineeringDocumentPayload({ workspaceId, projectId, requirementId, analysis }) {
  const artifacts = buildEngineeringArtifacts(analysis);
  if (!artifacts) return [];

  return [
    {
      type: "prd",
      title: "제품 요구사항 정의서(PRD)",
      content: artifacts.prd,
      markdown: artifacts.markdown,
    },
    {
      type: "uml",
      title: "UML 다이어그램",
      content: artifacts.uml,
      markdown: artifacts.markdown,
    },
    {
      type: "test_plan",
      title: "테스트 계획서",
      content: artifacts.testPlan,
      markdown: artifacts.markdown,
    },
    {
      type: "traceability",
      title: "요구사항 추적 매트릭스",
      content: { rows: artifacts.traceability },
      markdown: artifacts.markdown,
    },
  ].map((document) => ({
    ...document,
    workspaceId,
    projectId,
    requirementId: requirementId || null,
  }));
}

function saveMockDocumentVersion({ document, createdBy }) {
  const store = readMockStore();
  const existing = store.engineeringDocuments.find(
    (item) =>
      item.projectId === document.projectId &&
      item.requirementId === document.requirementId &&
      item.type === document.type,
  );
  const nextVersion = existing ? existing.currentVersion + 1 : 1;
  const now = new Date().toISOString();
  const documentId = existing?.id || makeMockId("artifact");
  const version = {
    id: makeMockId("artifact-version"),
    documentId,
    versionNumber: nextVersion,
    content: document.content,
    markdown: document.markdown,
    createdBy,
    createdAt: now,
  };
  const nextDocument = {
    id: documentId,
    workspaceId: document.workspaceId,
    projectId: document.projectId,
    requirementId: document.requirementId,
    type: document.type,
    title: document.title,
    currentVersion: nextVersion,
    createdBy: existing?.createdBy || createdBy,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  updateMockStore((current) => ({
    ...current,
    engineeringDocuments: [
      nextDocument,
      ...current.engineeringDocuments.filter((item) => item.id !== documentId),
    ],
    engineeringDocumentVersions: [version, ...current.engineeringDocumentVersions],
  }));

  return { ...nextDocument, latestVersion: version };
}

export async function saveEngineeringArtifacts({
  workspaceId,
  projectId,
  requirementId,
  analysis,
  createdBy,
}) {
  const documents = buildEngineeringDocumentPayload({
    workspaceId,
    projectId,
    requirementId,
    analysis,
  });

  if (!documents.length) return [];

  if (!isSupabaseConfigured) {
    return documents.map((document) => saveMockDocumentVersion({ document, createdBy }));
  }

  const saved = [];
  for (const document of documents) {
    const { data, error } = await supabase.rpc("save_engineering_document_version", {
      p_workspace_id: workspaceId,
      p_project_id: projectId,
      p_requirement_id: requirementId || null,
      p_type: document.type,
      p_title: document.title,
      p_content: document.content,
      p_markdown: document.markdown,
    });

    if (error) throw error;
    saved.push(data);
  }

  return saved;
}
