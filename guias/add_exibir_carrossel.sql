-- Adicionar coluna exibir_carrossel na tabela noticias
-- Esta flag controla se a notícia aparece no carrossel da página inicial

ALTER TABLE noticias 
ADD COLUMN exibir_carrossel TINYINT(1) DEFAULT 1 
COMMENT 'Define se a notícia aparece no carrossel da página inicial (1=sim, 0=não)';

-- Atualizar notícias existentes para exibir no carrossel por padrão
UPDATE noticias SET exibir_carrossel = 1 WHERE exibir_carrossel IS NULL;
