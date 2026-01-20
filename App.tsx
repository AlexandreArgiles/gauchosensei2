import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ArticleView } from './components/ArticleView';
import { Category, Article } from './types';
import { supabase } from './constants';

const App: React.FC = () => {
  // --- Estado ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- Carregar Dados do Supabase (Ao abrir o site) ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    // 1. Buscar Categorias
    const { data: catData, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true });

    if (catError) console.error('Erro ao buscar categorias:', catError);
    else setCategories(catData || []);

    // 2. Buscar Artigos
    const { data: artData, error: artError } = await supabase
      .from('articles')
      .select('*');

    if (artError) console.error('Erro ao buscar artigos:', artError);
    else {
      // Mapear do banco (snake_case) para o app (camelCase)
      const formattedArticles: Article[] = (artData || []).map((item: any) => ({
        id: item.id,
        categoryId: item.category_id,
        title: item.title,
        content: item.content,
        lastUpdated: item.last_updated,
        translations: item.translations || {}
      }));
      setArticles(formattedArticles);
    }
    
    setIsLoading(false);
  };

  // --- Handlers (Ações) ---

  const handleAdminToggle = () => {
    if (isAdmin) setIsAdmin(false);
    else {
      const pin = prompt("Senha de Gerente:");
      if (pin === '1234') setIsAdmin(true);
    }
  };

  const handleAddCategory = async () => {
    if (!isAdmin) return;
    const name = prompt("Nome da nova categoria:");
    if (!name) return;
    
    const newId = crypto.randomUUID();
    
    // Salvar no Banco
    const { error } = await supabase
      .from('categories')
      .insert([{ id: newId, name: name }]);

    if (error) alert("Erro ao criar categoria");
    else fetchData(); // Atualiza a tela
  };

  const handleDeleteCategory = async (id: string) => {
    if (!isAdmin) return;
    if (confirm("Tem certeza? Isso apagará todos os manuais desta categoria.")) {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) alert("Erro ao apagar");
      else {
        if (articles.some(a => a.categoryId === id && a.id === selectedArticleId)) {
          setSelectedArticleId(null);
        }
        fetchData();
      }
    }
  };

  const handleAddArticle = async (categoryId: string) => {
    if (!isAdmin) return;
    
    const newId = crypto.randomUUID();
    const newArticle = {
      id: newId,
      category_id: categoryId,
      title: 'Novo Procedimento',
      content: '<h1>Novo Procedimento</h1><p>Comece a escrever aqui...</p>',
      last_updated: Date.now(),
      translations: {}
    };

    const { error } = await supabase.from('articles').insert([newArticle]);

    if (error) alert("Erro ao criar artigo");
    else {
      await fetchData();
      setSelectedArticleId(newId);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!isAdmin) return;
    if (confirm("Apagar este manual?")) {
      const { error } = await supabase.from('articles').delete().eq('id', id);
      if (error) alert("Erro ao apagar");
      else {
        if (selectedArticleId === id) setSelectedArticleId(null);
        fetchData();
      }
    }
  };

  const handleUpdateArticle = async (id: string, updates: Partial<Article>) => {
    // Converter para o formato do banco
    const dbUpdates: any = {};
    if (updates.title) dbUpdates.title = updates.title;
    if (updates.content) dbUpdates.content = updates.content;
    if (updates.lastUpdated) dbUpdates.last_updated = updates.lastUpdated;
    if (updates.translations) dbUpdates.translations = updates.translations;

    const { error } = await supabase
      .from('articles')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error(error);
      alert("Erro ao salvar alterações");
    } else {
      // Atualiza o estado localmente para parecer instantâneo
      setArticles(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    }
  };

  const selectedArticle = articles.find(a => a.id === selectedArticleId) || null;

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen text-slate-500">Carregando dados...</div>;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 text-slate-900">
      <Sidebar
        categories={categories}
        articles={articles}
        selectedArticleId={selectedArticleId}
        onSelectArticle={setSelectedArticleId}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
        onAddArticle={handleAddArticle}
        onDeleteArticle={handleDeleteArticle}
        isAdmin={isAdmin}
        onToggleAdmin={handleAdminToggle}
      />
      <main className="flex-1 h-full relative">
        <ArticleView
          article={selectedArticle}
          onUpdateArticle={handleUpdateArticle}
          isAdmin={isAdmin}
        />
      </main>
    </div>
  );
};

export default App;