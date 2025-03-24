
import { useState } from "react";

export function useTabNavigation() {
  const [activeTab, setActiveTab] = useState("informacoes");
  
  return {
    activeTab,
    setActiveTab
  };
}
