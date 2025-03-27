/**
 * Aba de Itens da Maleta
 * @file Exibe os itens dentro da maleta e permite devolver ao estoque ou marcar como danificado
 * @relacionamento Utilizado pelo OpenSuitcaseDialog na aba "Itens da Maleta"
 */
import { useState } from "react";
import { Suitcase, SuitcaseItem } from "@/types/suitcase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Undo2, AlertTriangle, Phone, MapPin, User } from "lucide-react";
import { formatMoney } from "@/utils/formatUtils";

interface SuitcaseItemsTabProps {
  suitcase: Suitcase;
  promoterInfo: any;
  suitcaseItems: SuitcaseItem[];
  onReturnToInventory: (itemId: string, quantity: number) => Promise<void>;
  onMarkAsDamaged: (itemId: string) => Promise<void>;
}

export function SuitcaseItemsTab({
  suitcase,
  promoterInfo,
  suitcaseItems,
  onReturnToInventory,
  onMarkAsDamaged
}: SuitcaseItemsTabProps) {
  // Estado para armazenar as quantidades de devolução
  const [returnQuantities, setReturnQuantities] = useState<{[key: string]: number}>({});
  // Estado para controlar itens em processamento
  const [processing, setProcessing] = useState<{[key: string]: boolean}>({});

  // Inicializar quantidades
  const initializeQuantities = (itemId: string, defaultQty: number = 1) => {
    if (!returnQuantities[itemId]) {
      setReturnQuantities(prev => ({
        ...prev,
        [itemId]: defaultQty
      }));
    }
    return returnQuantities[itemId] || defaultQty;
  };

  // Manipulador para alteração de quantidade
  const handleQuantityChange = (itemId: string, value: string) => {
    const qty = parseInt(value, 10);
    if (!isNaN(qty) && qty > 0) {
      setReturnQuantities(prev => ({
        ...prev,
        [itemId]: qty
      }));
    }
  };

  // Manipulador para devolução ao estoque
  const handleReturn = async (itemId: string) => {
    const quantity = returnQuantities[itemId] || 1;
    setProcessing(prev => ({ ...prev, [itemId]: true }));
    
    try {
      await onReturnToInventory(itemId, quantity);
    } finally {
      setProcessing(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Manipulador para marcar como danificado
  const handleMarkDamaged = async (itemId: string) => {
    setProcessing(prev => ({ ...prev, [itemId]: true }));
    
    try {
      await onMarkAsDamaged(itemId);
    } finally {
      setProcessing(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Filtra itens que estão em posse (não vendidos/devolvidos)
  const activeItems = suitcaseItems.filter(item => item.status === 'in_possession');
  
  return (
    <div className="space-y-6">
      {/* Informações da Revendedora e Promotora */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Dados da Revendedora</h3>
            <div className="flex items-center gap-2">
              <User size={16} className="text-gray-500" />
              <span className="font-medium">{suitcase.seller?.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-gray-500" />
              <span>{suitcase.seller?.phone || 'Sem telefone cadastrado'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-gray-500" />
              <span>
                {suitcase.neighborhood && suitcase.city 
                  ? `${suitcase.neighborhood}, ${suitcase.city}`
                  : suitcase.neighborhood || suitcase.city || 'Localização não especificada'}
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Dados da Promotora</h3>
            {promoterInfo ? (
              <>
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-500" />
                  <span className="font-medium">{promoterInfo.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-gray-500" />
                  <span>{promoterInfo.phone || 'Sem telefone cadastrado'}</span>
                </div>
              </>
            ) : (
              <p className="text-gray-500">Sem promotora vinculada</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Itens */}
      <div>
        <h3 className="text-lg font-medium mb-3">
          Itens na Maleta
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({activeItems.length} {activeItems.length === 1 ? 'item' : 'itens'})
          </span>
        </h3>
        
        {activeItems.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Foto</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead>Devolver</TableHead>
                <TableHead>Danificado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeItems.map((item) => {
                const qty = initializeQuantities(item.id, item.quantity || 1);
                const photoUrl = item.product?.photo_url 
                  ? Array.isArray(item.product.photo_url) 
                    ? item.product.photo_url[0]?.photo_url 
                    : item.product.photo_url
                  : null;

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={item.product?.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-gray-500 text-xs">Sem foto</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {item.product?.sku || 'Sem código'}
                    </TableCell>
                    <TableCell>{item.product?.name}</TableCell>
                    <TableCell>
                      {item.product?.price 
                        ? formatMoney(item.product.price) 
                        : 'R$ 0,00'}
                    </TableCell>
                    <TableCell>{item.quantity || 1}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <div className="w-16">
                          <Input
                            type="number"
                            min="1"
                            max={item.quantity || 1}
                            value={qty}
                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                            className="w-full"
                            disabled={processing[item.id]}
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReturn(item.id)}
                          disabled={processing[item.id]}
                        >
                          {processing[item.id] ? (
                            <div className="h-4 w-4 border-2 border-t-transparent border-primary rounded-full animate-spin mr-1"></div>
                          ) : (
                            <Undo2 className="h-4 w-4 mr-1" />
                          )}
                          Devolver
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-amber-600"
                        onClick={() => handleMarkDamaged(item.id)}
                        disabled={processing[item.id]}
                      >
                        {processing[item.id] ? (
                          <div className="h-4 w-4 border-2 border-t-transparent border-amber-600 rounded-full animate-spin mr-1"></div>
                        ) : (
                          <AlertTriangle className="h-4 w-4 mr-1" />
                        )}
                        Danificado
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-md">
            <p className="text-gray-500">Não há itens em posse nesta maleta.</p>
          </div>
        )}
      </div>
    </div>
  );
}
