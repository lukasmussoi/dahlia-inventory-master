
import { useEffect } from "react"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EditorToolbar } from "./EditorToolbar"
import { ElementPanel } from "./ElementPanel"
import { LabelPanel } from "./LabelPanel"
import { ConfigPanel } from "./ConfigPanel"
import { PreviewDialog } from "./PreviewDialog"
import { VisualEditor } from "./VisualEditor"
import { EtiquetaCreatorProps } from "./types"
import { useEtiquetaCreator } from "./hooks/useEtiquetaCreator"

export default function EtiquetaCreator({ 
  onClose, 
  onSave, 
  initialData,
  autoAdjustDimensions = false,
  onToggleAutoAdjust
}: EtiquetaCreatorProps) {
  // Usar o hook para gerenciar o estado e a lógica
  const etiquetaCreator = useEtiquetaCreator(initialData, autoAdjustDimensions);
  
  // Quando a página carrega, definir o foco no input de nome
  useEffect(() => {
    const timer = setTimeout(() => {
      document.getElementById("model-name-input")?.focus();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="bg-background rounded-lg shadow-lg w-full max-w-5xl mx-auto overflow-hidden">
      {/* Toolbar e cabeçalho */}
      <EditorToolbar
        activeTab={etiquetaCreator.activeTab}
        setActiveTab={etiquetaCreator.setActiveTab}
        zoom={etiquetaCreator.zoom}
        setZoom={etiquetaCreator.setZoom}
        showGrid={etiquetaCreator.showGrid}
        setShowGrid={etiquetaCreator.setShowGrid}
        snapToGrid={etiquetaCreator.snapToGrid}
        setSnapToGrid={etiquetaCreator.setSnapToGrid}
        modelName={etiquetaCreator.modelName}
        setModelName={etiquetaCreator.setModelName}
        onClose={onClose}
        handlePreview={etiquetaCreator.handlePreview}
        isGeneratingPdf={etiquetaCreator.isGeneratingPdf}
      />
      
      {/* Conteúdo principal */}
      <div className="flex h-[calc(100vh-18rem)]">
        {/* Painel lateral */}
        <div className="w-72 border-r bg-muted/20 p-2 overflow-y-auto">
          {etiquetaCreator.activeTab === "elementos" && (
            <ElementPanel
              elements={etiquetaCreator.elements}
              selectedElement={etiquetaCreator.selectedElement}
              selectedLabelId={etiquetaCreator.selectedLabelId}
              labels={etiquetaCreator.labels}
              handleAddElement={etiquetaCreator.handleAddElement}
              handleDeleteElement={etiquetaCreator.handleDeleteElement}
              handleUpdateElement={etiquetaCreator.handleUpdateElement}
              handleSetAlignment={etiquetaCreator.handleSetAlignment}
            />
          )}
          
          {etiquetaCreator.activeTab === "etiquetas" && (
            <LabelPanel
              labels={etiquetaCreator.labels}
              selectedLabelId={etiquetaCreator.selectedLabelId}
              setSelectedLabelId={etiquetaCreator.setSelectedLabelId}
              setSelectedElement={etiquetaCreator.setSelectedElement}
              handleAddLabel={etiquetaCreator.handleAddLabel}
              handleDuplicateLabel={etiquetaCreator.handleDuplicateLabel}
              handleDeleteLabel={etiquetaCreator.handleDeleteLabel}
              handleUpdateLabelName={etiquetaCreator.handleUpdateLabelName}
              handleUpdateLabelSize={etiquetaCreator.handleUpdateLabelSize}
              handleOptimizeLayout={etiquetaCreator.handleOptimizeLayout}
            />
          )}
          
          {etiquetaCreator.activeTab === "config" && (
            <ConfigPanel
              pageFormat={etiquetaCreator.pageFormat}
              handleUpdatePageFormat={etiquetaCreator.handleUpdatePageFormat}
              pageOrientation={etiquetaCreator.pageOrientation}
              handleUpdatePageOrientation={etiquetaCreator.handleUpdatePageOrientation}
              pageMargins={etiquetaCreator.pageMargins}
              handleUpdatePageMargin={etiquetaCreator.handleUpdatePageMargin}
              labelSpacing={etiquetaCreator.labelSpacing}
              handleUpdateLabelSpacing={etiquetaCreator.handleUpdateLabelSpacing}
              pageSize={etiquetaCreator.pageSize}
              setPageSize={etiquetaCreator.setPageSize}
              gridSize={etiquetaCreator.gridSize}
              setGridSize={etiquetaCreator.setGridSize}
              autoAdjustDimensions={autoAdjustDimensions}
              onToggleAutoAdjust={onToggleAutoAdjust}
            />
          )}
        </div>
        
        {/* Editor Visual */}
        <VisualEditor
          editorRef={etiquetaCreator.editorRef}
          pageSize={etiquetaCreator.pageSize}
          zoom={etiquetaCreator.zoom}
          showGrid={etiquetaCreator.showGrid}
          gridSize={etiquetaCreator.gridSize}
          pageMargins={etiquetaCreator.pageMargins}
          labels={etiquetaCreator.labels}
          selectedLabelId={etiquetaCreator.selectedLabelId}
          selectedElement={etiquetaCreator.selectedElement}
          handleDrag={etiquetaCreator.handleDrag}
          handleEndDrag={etiquetaCreator.handleEndDrag}
          handleStartDrag={etiquetaCreator.handleStartDrag}
          setSelectedLabelId={etiquetaCreator.setSelectedLabelId}
          setSelectedElement={etiquetaCreator.setSelectedElement}
        />
      </div>
      
      {/* Rodapé */}
      <div className="flex justify-between p-3 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button 
          onClick={() => etiquetaCreator.handleSave(onSave)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Save className="h-4 w-4 mr-2" />
          Salvar
        </Button>
      </div>
      
      {/* Diálogo de Pré-visualização */}
      <PreviewDialog
        isOpen={etiquetaCreator.isPreviewDialogOpen}
        onOpenChange={etiquetaCreator.setIsPreviewDialogOpen}
        previewPdfUrl={etiquetaCreator.previewPdfUrl}
        modelName={etiquetaCreator.modelName}
        handleDownloadPdf={etiquetaCreator.handleDownloadPdf}
      />
    </div>
  );
}
