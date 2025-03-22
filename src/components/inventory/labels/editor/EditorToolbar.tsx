
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Grid, CheckSquare, FileText, Layers, Plus, Settings, X } from "lucide-react";
import { useState } from "react";

interface EditorToolbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean) => void;
  modelName: string;
  setModelName: (name: string) => void;
  onClose: () => void;
  handlePreview: () => void;
  isGeneratingPdf: boolean;
}

export function EditorToolbar({
  activeTab,
  setActiveTab,
  zoom,
  setZoom,
  showGrid,
  setShowGrid,
  snapToGrid,
  setSnapToGrid,
  modelName,
  setModelName,
  onClose,
  handlePreview,
  isGeneratingPdf
}: EditorToolbarProps) {
  return (
    <>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between p-3 border-b">
        <h2 className="text-lg font-semibold">Criar Novo Modelo de Etiqueta</h2>
        <div className="flex items-center space-x-2">
          <Input 
            id="model-name-input"
            placeholder="Nome do modelo" 
            className="w-48 h-8 text-sm" 
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
          />
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Toolbar */}
      <div className="flex items-center border-b p-2 gap-2 bg-muted/30">
        <Button 
          variant={activeTab === "elementos" ? "default" : "outline"} 
          size="sm" 
          className="h-8 px-3" 
          onClick={() => setActiveTab("elementos")}
        >
          <Plus className="h-4 w-4 mr-1" />
          <span className="text-xs">Elementos</span>
        </Button>
        
        <Button 
          variant={activeTab === "etiquetas" ? "default" : "outline"} 
          size="sm" 
          className="h-8 px-3" 
          onClick={() => setActiveTab("etiquetas")}
        >
          <Layers className="h-4 w-4 mr-1" />
          <span className="text-xs">Etiquetas</span>
        </Button>
        
        <Button 
          variant={activeTab === "config" ? "default" : "outline"} 
          size="sm" 
          className="h-8 px-3" 
          onClick={() => setActiveTab("config")}
        >
          <Settings className="h-4 w-4 mr-1" />
          <span className="text-xs">Config</span>
        </Button>
        
        <div className="ml-auto flex items-center gap-2">
          <Select
            value={String(zoom)}
            onValueChange={(value) => setZoom(Number(value))}
          >
            <SelectTrigger className="h-8 w-20">
              <SelectValue placeholder={`${zoom}%`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">50%</SelectItem>
              <SelectItem value="75">75%</SelectItem>
              <SelectItem value="100">100%</SelectItem>
              <SelectItem value="150">150%</SelectItem>
              <SelectItem value="200">200%</SelectItem>
              <SelectItem value="300">300%</SelectItem>
              <SelectItem value="500">500%</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant={showGrid ? "default" : "outline"}
            size="sm"
            className="h-8 px-3"
            onClick={() => setShowGrid(!showGrid)}
          >
            <Grid className="h-4 w-4 mr-1" />
            <span className="text-xs">Grade</span>
          </Button>
          
          <Button
            variant={snapToGrid ? "default" : "outline"}
            size="sm"
            className="h-8 px-3"
            onClick={() => setSnapToGrid(!snapToGrid)}
          >
            <CheckSquare className="h-4 w-4 mr-1" />
            <span className="text-xs">Snap</span>
          </Button>
          
          <Button
            variant="default"
            size="sm"
            className="h-8 px-3"
            onClick={handlePreview}
            disabled={isGeneratingPdf}
          >
            <FileText className="h-4 w-4 mr-1" />
            <span className="text-xs">Pré-visualizar</span>
          </Button>
        </div>
      </div>
    </>
  );
}
