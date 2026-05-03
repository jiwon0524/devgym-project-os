import { createContext, useContext, useMemo, useState } from "react";
import { analyzeRequirement, normalizeRequirementAnalysis } from "./analyzeRequirement.js";

const RequirementAssistantContext = createContext(null);

const defaultOpenSections = {
  functional: true,
  ui: true,
  api: true,
  database: true,
  tasks: true,
};

export function RequirementAssistantProvider({
  input,
  onInputChange,
  analysis,
  onAnalysisChange,
  onAddGeneratedTasks,
  children,
}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [openSections, setOpenSections] = useState(defaultOpenSections);
  const [activeFilter, setActiveFilter] = useState("all");
  const [lastAddedCount, setLastAddedCount] = useState(null);
  const normalizedAnalysis = useMemo(() => normalizeRequirementAnalysis(analysis), [analysis]);

  const analyze = async () => {
    if (!input.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    setLastAddedCount(null);
    await new Promise((resolve) => setTimeout(resolve, 520));
    try {
      const nextAnalysis = analyzeRequirement(input);
      await onAnalysisChange(nextAnalysis);
      setOpenSections(defaultOpenSections);
      setActiveFilter("all");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSection = (sectionId) => {
    setOpenSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }));
  };

  const addGeneratedTasks = () => {
    if (!normalizedAnalysis?.tasks?.length) return;
    if (!onAddGeneratedTasks) return;
    const addedCount = onAddGeneratedTasks(normalizedAnalysis.tasks);
    setLastAddedCount(addedCount);
  };

  const value = {
    input,
    onInputChange,
    analysis: normalizedAnalysis,
    isAnalyzing,
    openSections,
    activeFilter,
    lastAddedCount,
    setActiveFilter,
    analyze,
    toggleSection,
    addGeneratedTasks,
  };

  return (
    <RequirementAssistantContext.Provider value={value}>
      {children}
    </RequirementAssistantContext.Provider>
  );
}

export function useRequirementAssistant() {
  const context = useContext(RequirementAssistantContext);
  if (!context) {
    throw new Error("useRequirementAssistant must be used inside RequirementAssistantProvider");
  }
  return context;
}
