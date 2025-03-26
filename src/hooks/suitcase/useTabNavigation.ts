
import { useState, useCallback } from "react";

export function useTabNavigation() {
  const [activeTab, setActiveTab] = useState("informacoes");
  
  // Adicionar função de reset
  const resetTabState = useCallback(() => {
    setActiveTab("informacoes");
  }, []);
  
  return {
    activeTab,
    setActiveTab,
    resetTabState
  };
}
