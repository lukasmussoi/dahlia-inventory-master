
/**
 * Aba de Histórico da Maleta
 * @file Exibe o histórico de acertos e movimentações da maleta
 * @relacionamento Utilizado pelo OpenSuitcaseDialog na aba "Histórico da Maleta"
 */
import { Suitcase } from "@/types/suitcase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatMoney } from "@/utils/formatUtils";
import { Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuitcaseHistoryTabProps {
  suitcase: Suitcase | null;
  acertosHistorico: any[];
}

export function SuitcaseHistoryTab({ suitcase, acertosHistorico }: SuitcaseHistoryTabProps) {
  // Abrir recibo do acerto em uma nova janela 
  const handleViewReceipt = (receiptUrl: string) => {
    if (receiptUrl) {
      window.open(receiptUrl, "_blank");
    }
  };

  // Verificar se a maleta existe antes de tentar acessar suas propriedades
  if (!suitcase) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Dados do histórico da maleta não disponíveis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações da Maleta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Código</h4>
              <p className="font-medium">{suitcase.code || "Sem código"}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Revendedora</h4>
              <p className="font-medium">{suitcase.seller?.name || "Não definido"}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Status</h4>
              <p className="font-medium">{
                suitcase.status === 'in_use' ? 'Em uso' :
                suitcase.status === 'returned' ? 'Devolvida' :
                suitcase.status === 'in_replenishment' ? 'Em reposição' :
                suitcase.status
              }</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Localização</h4>
              <p className="font-medium">
                {suitcase.neighborhood && suitcase.city 
                  ? `${suitcase.neighborhood}, ${suitcase.city}` 
                  : suitcase.neighborhood || suitcase.city || "Não definido"}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Data de Envio</h4>
              <p className="font-medium">
                {suitcase.sent_at 
                  ? format(new Date(suitcase.sent_at), "dd/MM/yyyy", { locale: ptBR })
                  : "Não enviada"}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Próximo Acerto</h4>
              <p className="font-medium">
                {suitcase.next_settlement_date
                  ? format(new Date(suitcase.next_settlement_date), "dd/MM/yyyy", { locale: ptBR })
                  : "Não agendado"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Acertos</CardTitle>
        </CardHeader>
        <CardContent>
          {acertosHistorico && acertosHistorico.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Total em Vendas</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recibo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {acertosHistorico.map((acerto) => (
                  <TableRow key={acerto.id}>
                    <TableCell>
                      {format(new Date(acerto.settlement_date), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{formatMoney(acerto.total_sales)}</TableCell>
                    <TableCell>{formatMoney(acerto.commission_amount)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        acerto.status === 'concluido' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {acerto.status === 'concluido' ? 'Concluído' : 'Pendente'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {acerto.receipt_url ? (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewReceipt(acerto.receipt_url)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      ) : (
                        <span className="text-gray-400 text-sm">Não disponível</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum acerto registrado para esta maleta.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
