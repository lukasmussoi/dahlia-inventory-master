-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de categorias de inventário
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de fornecedores
CREATE TABLE public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_info TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de tipos de banho
CREATE TABLE public.plating_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela principal de inventário
CREATE TABLE public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    barcode TEXT,
    category_id UUID REFERENCES public.categories(id),
    quantity INTEGER DEFAULT 0,
    quantity_available INTEGER DEFAULT 0,
    quantity_reserved INTEGER DEFAULT 0,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit_cost DECIMAL(10,2) DEFAULT 0,
    raw_cost DECIMAL(10,2) DEFAULT 0,
    suggested_price DECIMAL(10,2) DEFAULT 0,
    weight DECIMAL(8,3),
    width DECIMAL(8,2),
    height DECIMAL(8,2),
    depth DECIMAL(8,2),
    min_stock INTEGER DEFAULT 0,
    supplier_id UUID REFERENCES public.suppliers(id),
    popularity INTEGER DEFAULT 0,
    plating_type_id UUID REFERENCES public.plating_types(id),
    material_weight DECIMAL(8,3),
    packaging_cost DECIMAL(10,2) DEFAULT 0,
    gram_value DECIMAL(10,2) DEFAULT 0,
    profit_margin DECIMAL(5,2) DEFAULT 0,
    reseller_commission DECIMAL(5,2) DEFAULT 0.3,
    markup_percentage DECIMAL(5,2) DEFAULT 30,
    archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de fotos do inventário
CREATE TABLE public.inventory_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de promotoras
CREATE TABLE public.promoters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    commission_rate DECIMAL(5,2) DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de revendedoras
CREATE TABLE public.resellers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    commission_rate DECIMAL(5,2) DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de maletas
CREATE TABLE public.suitcases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    promoter_id UUID REFERENCES public.promoters(id),
    status TEXT DEFAULT 'created',
    total_value DECIMAL(12,2) DEFAULT 0,
    total_items INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    returned_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de itens de maleta
CREATE TABLE public.suitcase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suitcase_id UUID NOT NULL REFERENCES public.suitcases(id) ON DELETE CASCADE,
    inventory_id UUID NOT NULL REFERENCES public.inventory(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'in_suitcase',
    added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(suitcase_id, inventory_id)
);

-- Tabela de vendas de itens de maleta
CREATE TABLE public.suitcase_item_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suitcase_item_id UUID NOT NULL REFERENCES public.suitcase_items(id) ON DELETE CASCADE,
    quantity_sold INTEGER NOT NULL DEFAULT 1,
    sale_price DECIMAL(10,2) NOT NULL,
    reseller_id UUID REFERENCES public.resellers(id),
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    commission_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de acertos de maleta
CREATE TABLE public.acerto_maleta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suitcase_id UUID NOT NULL REFERENCES public.suitcases(id),
    promoter_id UUID NOT NULL REFERENCES public.promoters(id),
    total_vendido DECIMAL(12,2) DEFAULT 0,
    total_comissao DECIMAL(12,2) DEFAULT 0,
    total_lucro DECIMAL(12,2) DEFAULT 0,
    data_acerto TIMESTAMP WITH TIME ZONE DEFAULT now(),
    observacoes TEXT,
    status TEXT DEFAULT 'pendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de itens vendidos no acerto
CREATE TABLE public.acerto_itens_vendidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acerto_id UUID NOT NULL REFERENCES public.acerto_maleta(id) ON DELETE CASCADE,
    inventory_id UUID NOT NULL REFERENCES public.inventory(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de movimentações de estoque
CREATE TABLE public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL, -- 'in', 'out', 'adjustment'
    quantity INTEGER NOT NULL,
    reference_type TEXT, -- 'suitcase', 'sale', 'adjustment'
    reference_id UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de itens danificados
CREATE TABLE public.inventory_damaged_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    damage_description TEXT,
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    resolved BOOLEAN DEFAULT false
);

-- Tabela de histórico de etiquetas
CREATE TABLE public.inventory_label_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
    label_type TEXT,
    printed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    printed_by TEXT
);

-- Índices para melhor performance
CREATE INDEX idx_inventory_category ON public.inventory(category_id);
CREATE INDEX idx_inventory_supplier ON public.inventory(supplier_id);
CREATE INDEX idx_inventory_sku ON public.inventory(sku);
CREATE INDEX idx_inventory_barcode ON public.inventory(barcode);
CREATE INDEX idx_suitcase_items_suitcase ON public.suitcase_items(suitcase_id);
CREATE INDEX idx_suitcase_items_inventory ON public.suitcase_items(inventory_id);
CREATE INDEX idx_inventory_photos_inventory ON public.inventory_photos(inventory_id);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_plating_types_updated_at BEFORE UPDATE ON public.plating_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_promoters_updated_at BEFORE UPDATE ON public.promoters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_resellers_updated_at BEFORE UPDATE ON public.resellers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_suitcases_updated_at BEFORE UPDATE ON public.suitcases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_suitcase_items_updated_at BEFORE UPDATE ON public.suitcase_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_acerto_maleta_updated_at BEFORE UPDATE ON public.acerto_maleta FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Criar buckets de storage
INSERT INTO storage.buckets (id, name, public) VALUES ('inventory_images', 'inventory_images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('inventory_photos', 'inventory_photos', true);

-- Políticas de storage
CREATE POLICY "Allow public access to inventory images" ON storage.objects FOR SELECT USING (bucket_id = 'inventory_images');
CREATE POLICY "Allow authenticated users to upload inventory images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'inventory_images' AND auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update inventory images" ON storage.objects FOR UPDATE USING (bucket_id = 'inventory_images' AND auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete inventory images" ON storage.objects FOR DELETE USING (bucket_id = 'inventory_images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow public access to inventory photos" ON storage.objects FOR SELECT USING (bucket_id = 'inventory_photos');
CREATE POLICY "Allow authenticated users to upload inventory photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'inventory_photos' AND auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update inventory photos" ON storage.objects FOR UPDATE USING (bucket_id = 'inventory_photos' AND auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete inventory photos" ON storage.objects FOR DELETE USING (bucket_id = 'inventory_photos' AND auth.role() = 'authenticated');

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plating_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promoters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suitcases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suitcase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suitcase_item_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acerto_maleta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acerto_itens_vendidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_damaged_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_label_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (permitir tudo para usuários autenticados por enquanto)
CREATE POLICY "Allow all for authenticated users" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.plating_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.inventory FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.inventory_photos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.promoters FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.resellers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.suitcases FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.suitcase_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.suitcase_item_sales FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.acerto_maleta FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.acerto_itens_vendidos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.inventory_movements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.inventory_damaged_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.inventory_label_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Inserir dados iniciais
INSERT INTO public.categories (name, description) VALUES 
('Anéis', 'Anéis diversos'),
('Colares', 'Colares e gargantilhas'),
('Brincos', 'Brincos diversos'),
('Pulseiras', 'Pulseiras e braceletes'),
('Conjuntos', 'Conjuntos de joias');

INSERT INTO public.plating_types (name, description) VALUES 
('Ouro 18k', 'Banho de ouro 18 quilates'),
('Prata', 'Banho de prata'),
('Ródio', 'Banho de ródio'),
('Ouro Rosé', 'Banho de ouro rosé');

INSERT INTO public.suppliers (name, contact_info, phone, email) VALUES 
('Fornecedor Exemplo', 'Contato exemplo', '(11) 99999-9999', 'contato@exemplo.com');