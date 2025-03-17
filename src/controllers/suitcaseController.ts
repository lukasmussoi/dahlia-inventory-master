import { Request, Response } from "express";
import { suitcaseModel } from "@/models/suitcaseModel";
import { SuitcaseItemStatus } from "@/types/suitcase";

export const suitcaseController = {
  async getAllSuitcases(req: Request, res: Response) {
    try {
      const filters = req.query;
      const suitcases = await suitcaseModel.getAllSuitcases(filters);
      res.json(suitcases);
    } catch (error) {
      console.error("Erro ao buscar maletas:", error);
      res.status(500).json({ message: "Erro ao buscar maletas" });
    }
  },

  async getSuitcaseById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const suitcase = await suitcaseModel.getSuitcaseById(id);
      if (suitcase) {
        res.json(suitcase);
      } else {
        res.status(404).json({ message: "Maleta não encontrada" });
      }
    } catch (error) {
      console.error("Erro ao buscar maleta:", error);
      res.status(500).json({ message: "Erro ao buscar maleta" });
    }
  },

  async createSuitcase(req: Request, res: Response) {
    try {
      const suitcaseData = req.body;
      const newSuitcase = await suitcaseModel.createSuitcase(suitcaseData);
      res.status(201).json(newSuitcase);
    } catch (error) {
      console.error("Erro ao criar maleta:", error);
      res.status(500).json({ message: "Erro ao criar maleta" });
    }
  },

  async updateSuitcase(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const suitcaseData = req.body;
      const updatedSuitcase = await suitcaseModel.updateSuitcase(id, suitcaseData);
      if (updatedSuitcase) {
        res.json(updatedSuitcase);
      } else {
        res.status(404).json({ message: "Maleta não encontrada" });
      }
    } catch (error) {
      console.error("Erro ao atualizar maleta:", error);
      res.status(500).json({ message: "Erro ao atualizar maleta" });
    }
  },

  async deleteSuitcase(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deletedSuitcase = await suitcaseModel.deleteSuitcase(id);
      if (deletedSuitcase) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Maleta não encontrada" });
      }
    } catch (error) {
      console.error("Erro ao excluir maleta:", error);
      res.status(500).json({ message: "Erro ao excluir maleta" });
    }
  },

  async getSuitcaseItems(req: Request, res: Response) {
    try {
      const { suitcaseId } = req.params;
      const items = await suitcaseModel.getSuitcaseItems(suitcaseId);
      res.json(items);
    } catch (error) {
      console.error("Erro ao buscar itens da maleta:", error);
      res.status(500).json({ message: "Erro ao buscar itens da maleta" });
    }
  },

  async addSuitcaseItem(req: Request, res: Response) {
    try {
      const { suitcaseId } = req.params;
      const { inventoryId } = req.body;
      const newItem = await suitcaseModel.addSuitcaseItem(suitcaseId, inventoryId);
      res.status(201).json(newItem);
    } catch (error) {
      console.error("Erro ao adicionar item à maleta:", error);
      res.status(500).json({ message: "Erro ao adicionar item à maleta" });
    }
  },

  async removeSuitcaseItem(req: Request, res: Response) {
    try {
      const { itemId } = req.params;
      const removedItem = await suitcaseModel.removeSuitcaseItem(itemId);
      if (removedItem) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Item não encontrado na maleta" });
      }
    } catch (error) {
      console.error("Erro ao remover item da maleta:", error);
      res.status(500).json({ message: "Erro ao remover item da maleta" });
    }
  },

  async updateSuitcaseItemStatus(req: Request, res: Response) {
    try {
      const { itemId } = req.params;
      const { status } = req.body;

      // Corrigir o tipo de SuitcaseItemStatus removendo 'available'
      // e usando apenas os tipos válidos: 'in_possession', 'sold', 'returned', 'lost'
      try {
        const result = await suitcaseModel.updateSuitcaseItemStatus(
          itemId,
          status as "in_possession" | "sold" | "returned" | "lost"
        );
        return res.json(result);
      } catch (error) {
        console.error("Erro ao atualizar status do item:", error);
        throw error;
      }
    } catch (error) {
      console.error("Erro ao atualizar status do item na maleta:", error);
      res.status(500).json({ message: "Erro ao atualizar status do item na maleta" });
    }
  },

  async getSuitcaseItemSales(req: Request, res: Response) {
    try {
      const { itemId } = req.params;
      const sales = await suitcaseModel.getSuitcaseItemSales(itemId);
      res.json(sales);
    } catch (error) {
      console.error("Erro ao buscar vendas do item da maleta:", error);
      res.status(500).json({ message: "Erro ao buscar vendas do item da maleta" });
    }
  },

  async addSuitcaseItemSale(req: Request, res: Response) {
    try {
      const { itemId } = req.params;
      const saleData = req.body;
      const newSale = await suitcaseModel.addSuitcaseItemSale(itemId, saleData);
      res.status(201).json(newSale);
    } catch (error) {
      console.error("Erro ao adicionar venda ao item da maleta:", error);
      res.status(500).json({ message: "Erro ao adicionar venda ao item da maleta" });
    }
  },

  async updateSuitcaseItemSale(req: Request, res: Response) {
    try {
      const { saleId } = req.params;
      const saleData = req.body;
      const updatedSale = await suitcaseModel.updateSuitcaseItemSale(saleId, saleData);
      if (updatedSale) {
        res.json(updatedSale);
      } else {
        res.status(404).json({ message: "Venda não encontrada" });
      }
    } catch (error) {
      console.error("Erro ao atualizar venda do item da maleta:", error);
      res.status(500).json({ message: "Erro ao atualizar venda do item da maleta" });
    }
  },

  async deleteSuitcaseItemSale(req: Request, res: Response) {
    try {
      const { saleId } = req.params;
      const deletedSale = await suitcaseModel.deleteSuitcaseItemSale(saleId);
      if (deletedSale) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Venda não encontrada" });
      }
    } catch (error) {
      console.error("Erro ao excluir venda do item da maleta:", error);
      res.status(500).json({ message: "Erro ao excluir venda do item da maleta" });
    }
  },
};
