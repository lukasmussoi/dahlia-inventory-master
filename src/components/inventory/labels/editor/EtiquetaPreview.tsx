
import React from 'react';
import type { CampoEtiqueta } from "@/types/etiqueta";

interface EtiquetaPreviewProps {
  campos: CampoEtiqueta[];
  largura: number;
  altura: number;
  zoomLevel: number;
  margemInternaEtiquetaSuperior: number;
  margemInternaEtiquetaInferior: number;
  margemInternaEtiquetaEsquerda: number;
  margemInternaEtiquetaDireita: number;
}

export function EtiquetaPreview({
  campos,
  largura,
  altura,
  zoomLevel,
  margemInternaEtiquetaSuperior,
  margemInternaEtiquetaInferior,
  margemInternaEtiquetaEsquerda,
  margemInternaEtiquetaDireita
}: EtiquetaPreviewProps) {
  return (
    <div className="flex flex-col items-center">
      <div 
        className="bg-white border rounded shadow-sm overflow-hidden"
        style={{
          width: `${largura * zoomLevel}px`,
          height: `${altura * zoomLevel}px`,
          position: 'relative'
        }}
      >
        {/* Margens internas */}
        <div
          className="absolute border border-dashed border-gray-300"
          style={{
            left: `${margemInternaEtiquetaEsquerda * zoomLevel}px`,
            top: `${margemInternaEtiquetaSuperior * zoomLevel}px`,
            width: `${(largura - margemInternaEtiquetaEsquerda - margemInternaEtiquetaDireita) * zoomLevel}px`,
            height: `${(altura - margemInternaEtiquetaSuperior - margemInternaEtiquetaInferior) * zoomLevel}px`
          }}
        />
        
        {campos.map((campo, index) => (
          <div 
            key={`preview-${campo.tipo}-${index}`}
            className="absolute border border-gray-300 bg-white"
            style={{
              left: `${campo.x * zoomLevel}px`,
              top: `${campo.y * zoomLevel}px`,
              width: `${campo.largura * zoomLevel}px`,
              height: `${campo.altura * zoomLevel}px`,
              fontSize: `${campo.tamanhoFonte * zoomLevel}px`,
              fontFamily: 'Arial, sans-serif',
              display: 'flex',
              alignItems: 'center',
              justifyContent: campo.align === 'center' ? 'center' : 
                            campo.align === 'right' ? 'flex-end' : 'flex-start',
              padding: '0 4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {campo.tipo === 'nome' ? 'Nome do Produto' :
             campo.tipo === 'codigo' ? '0123456789012' : 'R$ 99,99'}
          </div>
        ))}
      </div>
      
      <div className="text-sm text-gray-500 mt-2">
        Dimensões: {largura}mm × {altura}mm
      </div>
    </div>
  );
}
