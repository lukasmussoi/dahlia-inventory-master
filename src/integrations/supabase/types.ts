export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      acerto_itens_vendidos: {
        Row: {
          acerto_id: string
          commission_rate: number | null
          commission_value: number | null
          created_at: string
          customer_name: string | null
          id: string
          inventory_id: string
          net_profit: number | null
          payment_method: string | null
          price: number
          sale_date: string
          suitcase_item_id: string
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          acerto_id: string
          commission_rate?: number | null
          commission_value?: number | null
          created_at?: string
          customer_name?: string | null
          id?: string
          inventory_id: string
          net_profit?: number | null
          payment_method?: string | null
          price: number
          sale_date?: string
          suitcase_item_id: string
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          acerto_id?: string
          commission_rate?: number | null
          commission_value?: number | null
          created_at?: string
          customer_name?: string | null
          id?: string
          inventory_id?: string
          net_profit?: number | null
          payment_method?: string | null
          price?: number
          sale_date?: string
          suitcase_item_id?: string
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "acerto_itens_vendidos_acerto_id_fkey"
            columns: ["acerto_id"]
            isOneToOne: false
            referencedRelation: "acertos_maleta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acerto_itens_vendidos_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acerto_itens_vendidos_suitcase_item_id_fkey"
            columns: ["suitcase_item_id"]
            isOneToOne: false
            referencedRelation: "suitcase_items"
            referencedColumns: ["id"]
          },
        ]
      }
      acertos_maleta: {
        Row: {
          commission_amount: number
          created_at: string
          id: string
          net_profit: number | null
          next_settlement_date: string | null
          receipt_url: string | null
          restock_suggestions: Json | null
          seller_id: string
          settlement_date: string
          status: Database["public"]["Enums"]["acerto_status"]
          suitcase_id: string
          total_cost: number | null
          total_sales: number
          updated_at: string
        }
        Insert: {
          commission_amount?: number
          created_at?: string
          id?: string
          net_profit?: number | null
          next_settlement_date?: string | null
          receipt_url?: string | null
          restock_suggestions?: Json | null
          seller_id: string
          settlement_date?: string
          status?: Database["public"]["Enums"]["acerto_status"]
          suitcase_id: string
          total_cost?: number | null
          total_sales?: number
          updated_at?: string
        }
        Update: {
          commission_amount?: number
          created_at?: string
          id?: string
          net_profit?: number | null
          next_settlement_date?: string | null
          receipt_url?: string | null
          restock_suggestions?: Json | null
          seller_id?: string
          settlement_date?: string
          status?: Database["public"]["Enums"]["acerto_status"]
          suitcase_id?: string
          total_cost?: number | null
          total_sales?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "acertos_maleta_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acertos_maleta_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_commission_rates"
            referencedColumns: ["seller_id"]
          },
          {
            foreignKeyName: "acertos_maleta_suitcase_id_fkey"
            columns: ["suitcase_id"]
            isOneToOne: false
            referencedRelation: "suitcases"
            referencedColumns: ["id"]
          },
        ]
      }
      etiquetas_custom: {
        Row: {
          altura: number
          altura_pagina: number | null
          atualizado_em: string
          campos: Json
          criado_em: string
          criado_por: string
          descricao: string
          espacamento_horizontal: number
          espacamento_vertical: number
          formato_pagina: string
          id: string
          largura: number
          largura_pagina: number | null
          margem_direita: number
          margem_esquerda: number
          margem_inferior: number
          margem_superior: number
          orientacao: string
          tipo: string
        }
        Insert: {
          altura: number
          altura_pagina?: number | null
          atualizado_em?: string
          campos?: Json
          criado_em?: string
          criado_por: string
          descricao: string
          espacamento_horizontal?: number
          espacamento_vertical?: number
          formato_pagina: string
          id?: string
          largura: number
          largura_pagina?: number | null
          margem_direita?: number
          margem_esquerda?: number
          margem_inferior?: number
          margem_superior?: number
          orientacao: string
          tipo: string
        }
        Update: {
          altura?: number
          altura_pagina?: number | null
          atualizado_em?: string
          campos?: Json
          criado_em?: string
          criado_por?: string
          descricao?: string
          espacamento_horizontal?: number
          espacamento_vertical?: number
          formato_pagina?: string
          id?: string
          largura?: number
          largura_pagina?: number | null
          margem_direita?: number
          margem_esquerda?: number
          margem_inferior?: number
          margem_superior?: number
          orientacao?: string
          tipo?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          archived: boolean | null
          barcode: string | null
          category_id: string
          created_at: string
          depth: number | null
          gram_value: number | null
          height: number | null
          id: string
          markup_percentage: number | null
          material_weight: number | null
          min_stock: number
          name: string
          packaging_cost: number | null
          plating_type_id: string | null
          popularity: number
          price: number
          profit_margin: number | null
          quantity: number
          quantity_reserved: number
          raw_cost: number | null
          reseller_commission: number | null
          sku: string | null
          suggested_price: number
          supplier_id: string | null
          unit_cost: number
          updated_at: string
          weight: number | null
          width: number | null
        }
        Insert: {
          archived?: boolean | null
          barcode?: string | null
          category_id: string
          created_at?: string
          depth?: number | null
          gram_value?: number | null
          height?: number | null
          id?: string
          markup_percentage?: number | null
          material_weight?: number | null
          min_stock?: number
          name: string
          packaging_cost?: number | null
          plating_type_id?: string | null
          popularity?: number
          price: number
          profit_margin?: number | null
          quantity?: number
          quantity_reserved?: number
          raw_cost?: number | null
          reseller_commission?: number | null
          sku?: string | null
          suggested_price?: number
          supplier_id?: string | null
          unit_cost?: number
          updated_at?: string
          weight?: number | null
          width?: number | null
        }
        Update: {
          archived?: boolean | null
          barcode?: string | null
          category_id?: string
          created_at?: string
          depth?: number | null
          gram_value?: number | null
          height?: number | null
          id?: string
          markup_percentage?: number | null
          material_weight?: number | null
          min_stock?: number
          name?: string
          packaging_cost?: number | null
          plating_type_id?: string | null
          popularity?: number
          price?: number
          profit_margin?: number | null
          quantity?: number
          quantity_reserved?: number
          raw_cost?: number | null
          reseller_commission?: number | null
          sku?: string | null
          suggested_price?: number
          supplier_id?: string | null
          unit_cost?: number
          updated_at?: string
          weight?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_plating_type_id_fkey"
            columns: ["plating_type_id"]
            isOneToOne: false
            referencedRelation: "plating_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_damaged_items: {
        Row: {
          created_at: string
          damage_type: Database["public"]["Enums"]["damage_type"] | null
          id: string
          inventory_id: string
          notes: string | null
          quantity: number
          reason: string
          suitcase_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          damage_type?: Database["public"]["Enums"]["damage_type"] | null
          id?: string
          inventory_id: string
          notes?: string | null
          quantity?: number
          reason: string
          suitcase_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          damage_type?: Database["public"]["Enums"]["damage_type"] | null
          id?: string
          inventory_id?: string
          notes?: string | null
          quantity?: number
          reason?: string
          suitcase_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_damaged_items_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_damaged_items_suitcase_id_fkey"
            columns: ["suitcase_id"]
            isOneToOne: false
            referencedRelation: "suitcases"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_label_history: {
        Row: {
          created_at: string | null
          id: string
          inventory_id: string
          printed_at: string | null
          quantity: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_id: string
          printed_at?: string | null
          quantity?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_id?: string
          printed_at?: string | null
          quantity?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_label_history_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string
          id: string
          inventory_id: string
          movement_type: string
          notes: string | null
          quantity: number
          reason: string
          unit_cost: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_id: string
          movement_type: string
          notes?: string | null
          quantity: number
          reason: string
          unit_cost: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inventory_id?: string
          movement_type?: string
          notes?: string | null
          quantity?: number
          reason?: string
          unit_cost?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_photos: {
        Row: {
          created_at: string
          id: string
          inventory_id: string
          is_primary: boolean | null
          photo_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_id: string
          is_primary?: boolean | null
          photo_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          inventory_id?: string
          is_primary?: boolean | null
          photo_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_photos_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      plating_types: {
        Row: {
          created_at: string
          description: string | null
          gram_value: number
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          gram_value?: number
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          gram_value?: number
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          status: Database["public"]["Enums"]["user_status"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string
        }
        Relationships: []
      }
      promoters: {
        Row: {
          address: Json | null
          cpf_cnpj: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["reseller_status"] | null
          updated_at: string
        }
        Insert: {
          address?: Json | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["reseller_status"] | null
          updated_at?: string
        }
        Update: {
          address?: Json | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["reseller_status"] | null
          updated_at?: string
        }
        Relationships: []
      }
      resellers: {
        Row: {
          address: Json | null
          commission_rate: number | null
          cpf_cnpj: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string
          promoter_id: string
          status: Database["public"]["Enums"]["reseller_status"] | null
          updated_at: string
        }
        Insert: {
          address?: Json | null
          commission_rate?: number | null
          cpf_cnpj: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone: string
          promoter_id: string
          status?: Database["public"]["Enums"]["reseller_status"] | null
          updated_at?: string
        }
        Update: {
          address?: Json | null
          commission_rate?: number | null
          cpf_cnpj?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string
          promoter_id?: string
          status?: Database["public"]["Enums"]["reseller_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resellers_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
        ]
      }
      suitcase_item_sales: {
        Row: {
          created_at: string
          customer_name: string | null
          id: string
          payment_method: string | null
          sold_at: string | null
          suitcase_item_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          id?: string
          payment_method?: string | null
          sold_at?: string | null
          suitcase_item_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          id?: string
          payment_method?: string | null
          sold_at?: string | null
          suitcase_item_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suitcase_item_sales_suitcase_item_id_fkey"
            columns: ["suitcase_item_id"]
            isOneToOne: false
            referencedRelation: "suitcase_items"
            referencedColumns: ["id"]
          },
        ]
      }
      suitcase_items: {
        Row: {
          created_at: string
          id: string
          inventory_id: string
          quantity: number
          status: Database["public"]["Enums"]["suitcase_item_status"] | null
          suitcase_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_id: string
          quantity?: number
          status?: Database["public"]["Enums"]["suitcase_item_status"] | null
          suitcase_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          inventory_id?: string
          quantity?: number
          status?: Database["public"]["Enums"]["suitcase_item_status"] | null
          suitcase_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suitcase_items_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suitcase_items_suitcase_id_fkey"
            columns: ["suitcase_id"]
            isOneToOne: false
            referencedRelation: "suitcases"
            referencedColumns: ["id"]
          },
        ]
      }
      suitcases: {
        Row: {
          city: string | null
          code: string | null
          created_at: string
          id: string
          is_empty: boolean | null
          neighborhood: string | null
          next_settlement_date: string | null
          seller_id: string
          sent_at: string
          status: Database["public"]["Enums"]["suitcase_status"] | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          code?: string | null
          created_at?: string
          id?: string
          is_empty?: boolean | null
          neighborhood?: string | null
          next_settlement_date?: string | null
          seller_id: string
          sent_at?: string
          status?: Database["public"]["Enums"]["suitcase_status"] | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          code?: string | null
          created_at?: string
          id?: string
          is_empty?: boolean | null
          neighborhood?: string | null
          next_settlement_date?: string | null
          seller_id?: string
          sent_at?: string
          status?: Database["public"]["Enums"]["suitcase_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suitcases_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suitcases_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_commission_rates"
            referencedColumns: ["seller_id"]
          },
        ]
      }
      suppliers: {
        Row: {
          contact_info: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          contact_info?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          contact_info?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          user_id: string
          user_role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          user_role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          user_role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
    }
    Views: {
      seller_commission_rates: {
        Row: {
          commission_rate: number | null
          seller_id: string | null
          seller_name: string | null
        }
        Insert: {
          commission_rate?: never
          seller_id?: string | null
          seller_name?: string | null
        }
        Update: {
          commission_rate?: never
          seller_id?: string | null
          seller_name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_update_user_password: {
        Args: {
          user_id: string
          new_password: string
        }
        Returns: undefined
      }
      begin_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_is_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      commit_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      count_item_sales: {
        Args: {
          inventory_id_param: string
          seller_id_param: string
          date_threshold: string
        }
        Returns: number
      }
      debug_check_table_columns: {
        Args: {
          table_name: string
        }
        Returns: Json
      }
      has_role:
        | {
            Args: {
              role: Database["public"]["Enums"]["user_role"]
            }
            Returns: boolean
          }
        | {
            Args: {
              role_name: string
            }
            Returns: boolean
          }
      is_admin:
        | {
            Args: Record<PropertyKey, never>
            Returns: boolean
          }
        | {
            Args: {
              user_id: string
            }
            Returns: boolean
          }
      rollback_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      validate_cpf_cnpj: {
        Args: {
          cpf_cnpj: string
        }
        Returns: boolean
      }
    }
    Enums: {
      acerto_status: "pendente" | "concluido"
      damage_type:
        | "manufacturing_defect"
        | "transportation_damage"
        | "customer_damage"
        | "unknown"
        | "other"
      plating_type: "ouro" | "prata" | "rose" | "rhodium" | "sem_banho"
      reseller_status: "Ativa" | "Inativa"
      suitcase_item_status:
        | "in_possession"
        | "sold"
        | "returned"
        | "lost"
        | "damaged"
      suitcase_status:
        | "in_use"
        | "returned"
        | "in_audit"
        | "lost"
        | "in_replenishment"
      user_role: "admin" | "promoter" | "seller"
      user_status: "active" | "inactive" | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
