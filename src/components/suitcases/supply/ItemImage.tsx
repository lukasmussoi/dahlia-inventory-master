
/**
 * Componente de Miniatura de Imagem de Item
 * @file Este componente renderiza miniaturas de imagens de produtos com fallback
 * @relacionamento Utilizado por componentes que exibem itens em listas
 */
import { getProductPhotoUrl } from "@/utils/photoUtils";
import { useState } from "react";

interface ItemImageProps {
  photoUrl: string | { photo_url: string }[] | undefined;
  alt: string;
  className?: string;
}

export function ItemImage({ photoUrl, alt, className = "" }: ItemImageProps) {
  const [error, setError] = useState(false);
  const imageUrl = getProductPhotoUrl(photoUrl);
  
  // Se não houver imagem ou ocorrer erro, mostrar placeholder
  if (!imageUrl || error) {
    return (
      <div className={`bg-gray-200 rounded flex items-center justify-center ${className}`}>
        <span className="text-gray-400 text-xs">Sem imagem</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={`object-cover rounded ${className}`}
      onError={() => setError(true)}
    />
  );
}
