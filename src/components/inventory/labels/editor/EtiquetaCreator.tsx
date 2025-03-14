
"use client"
import type React from "react"
import { useState, useRef, useEffect } from "react"
import { AlignCenter, AlignLeft, AlignRight, ChevronLeft, ChevronRight, Copy, Grid, Layers, Plus, PlusCircle, Save, Settings, Trash, X, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export default function LabelCreator() {
  const [activeTab, setActiveTab] = useState("editor"), [selectedElement, setSelectedElement] = useState<string | null>(null), [selectedLabelIndex, setSelectedLabelIndex] = useState<number | null>(0), [zoom, setZoom] = useState(100), [showGrid, setShowGrid] = useState(!0), [snapToGrid, setSnapToGrid] = useState(!0), [gridSize, setGridSize] = useState(5), [pageSize, setPageSize] = useState({ width: 210, height: 297 }), [labelSize, setLabelSize] = useState({ width: 80, height: 40 }), [sidebarCollapsed, setSidebarCollapsed] = useState(!1), [activeSidebarPanel, setActiveSidebarPanel] = useState<"elements" | "settings" | "labels">("elements"), [labels, setLabels] = useState([{ id: 0, x: 20, y: 20, elements: [] }])
  const editorRef = useRef<HTMLDivElement>(null), dragRef = useRef({ isDragging: !1, type: null, id: null, startX: 0, startY: 0, offsetX: 0, offsetY: 0 })
  
  const elements = [{ id: "product-name", name: "Nome do Produto", defaultWidth: 60, defaultHeight: 15, defaultFontSize: 10, defaultAlign: "left" }, { id: "barcode", name: "Código de Barras", defaultWidth: 60, defaultHeight: 20, defaultFontSize: 8 }, { id: "price", name: "Preço", defaultWidth: 40, defaultHeight: 15, defaultFontSize: 12, defaultAlign: "center" }]
  
  const getSelectedElementDetails = () => labels.find((l) => l.id === selectedLabelIndex)?.elements.find((e) => e.id === selectedElement) || null

  const handleStartDrag = (e: React.MouseEvent, type: "label" | "element", id: number | string, x: number, y: number) => {
    if (!editorRef.current) return
    e.stopPropagation()
    const rect = editorRef.current.getBoundingClientRect()
    dragRef.current = { isDragging: !0, type, id, startX: x, startY: y, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top }
  }

  const snapToGridValue = (value: number) => snapToGrid ? Math.round(value / gridSize) * gridSize : value

  const handleDrag = (e: React.MouseEvent) => {
    if (!dragRef.current.isDragging || !editorRef.current) return
    e.preventDefault()
    const rect = editorRef.current.getBoundingClientRect(), x = snapToGridValue((e.clientX - rect.left - dragRef.current.offsetX) / (zoom / 100)), y = snapToGridValue((e.clientY - rect.top - dragRef.current.offsetY) / (zoom / 100))
    dragRef.current.type === "label" ? setLabels((prev) => prev.map((label) => label.id === dragRef.current.id ? { ...label, x: Math.max(0, Math.min(x, pageSize.width - labelSize.width)), y: Math.max(0, Math.min(y, pageSize.height - labelSize.height)) } : label)) : setLabels((prev) => prev.map((label) => label.id === selectedLabelIndex ? { ...label, elements: label.elements.map((el) => el.id === dragRef.current.id ? { ...el, x: Math.max(0, Math.min(x, labelSize.width - el.width)), y: Math.max(0, Math.min(y, labelSize.height - el.height)) } : el) } : label))
  }

  const handleEndDrag = () => (dragRef.current.isDragging = !1)

  return (
    <div className="bg-background rounded-lg shadow-lg w-full max-w-4xl mx-auto overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b">
        <h2 className="text-lg font-semibold">Criar Novo Modelo de Etiqueta</h2>
        <div className="flex items-center space-x-2">
          <Input placeholder="Nome do modelo" className="w-48 h-8 text-sm" />
          <Button variant="ghost" size="icon"><X className="h-4 w-4" /><span className="sr-only">Fechar</span></Button>
        </div>
      </div>
      <div className="flex h-[calc(100vh-8rem)] max-h-[700px]">
        <div className={cn("border-r flex flex-col transition-all duration-200 ease-in-out", sidebarCollapsed ? "w-10" : "w-64")}>
          <div className="flex border-b p-1 items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex space-x-1">
                <Button variant={activeSidebarPanel === "elements" ? "default" : "ghost"} size="sm" className="h-8 px-2" onClick={() => setActiveSidebarPanel("elements")}><Plus className="h-4 w-4 mr-1" /><span className="text-xs">Elementos</span></Button>
                <Button variant={activeSidebarPanel === "labels" ? "default" : "ghost"} size="sm" className="h-8 px-2" onClick={() => setActiveSidebarPanel("labels")}><Layers className="h-4 w-4 mr-1" /><span className="text-xs">Etiquetas</span></Button>
                <Button variant={activeSidebarPanel === "settings" ? "default" : "ghost"} size="sm" className="h-8 px-2" onClick={() => setActiveSidebarPanel("settings")}><Settings className="h-4 w-4 mr-1" /><span className="text-xs">Config</span></Button>
              </div>
            )}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>{sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}</Button>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between p-3 border-t bg-muted/50">
        <Button variant="outline" size="sm">Cancelar</Button>
        <Button size="sm"><Save className="h-4 w-4 mr-2" />Criar</Button>
      </div>
    </div>
  )
}
