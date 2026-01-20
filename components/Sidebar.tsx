import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Folder, FileText, ChevronRight, ChevronDown, Menu, Search, Lock, Unlock, Flame } from 'lucide-react';
import { Category, Article } from '../types';

interface SidebarProps {
  categories: Category[];
  articles: Article[];
  selectedArticleId: string | null;
  onSelectArticle: (id: string) => void;
  onAddCategory: () => void;
  onDeleteCategory: (id: string) => void;
  onAddArticle: (categoryId: string) => void;
  onDeleteArticle: (id: string) => void;
  isAdmin: boolean;
  onToggleAdmin: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  categories,
  articles,
  selectedArticleId,
  onSelectArticle,
  onAddCategory,
  onDeleteCategory,
  onAddArticle,
  onDeleteArticle,
  isAdmin,
  onToggleAdmin
}) => {
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(categories.map(c => c.id)));
  const [searchTerm, setSearchTerm] = useState('');

  // Auto-expand categories when searching
  useEffect(() => {
    if (searchTerm.trim() !== '') {
      setExpandedCats(new Set(categories.map(c => c.id)));
    }
  }, [searchTerm, categories]);

  const toggleCategory = (catId: string) => {
    const newSet = new Set(expandedCats);
    if (newSet.has(catId)) {
      newSet.delete(catId);
    } else {
      newSet.add(catId);
    }
    setExpandedCats(newSet);
  };

  // Filter logic
  const filteredData = useMemo(() => {
    const lowerTerm = searchTerm.toLowerCase();
    return categories.map(cat => {
      const catMatches = cat.name.toLowerCase().includes(lowerTerm);
      const matchingArticles = articles.filter(a => 
        a.categoryId === cat.id && a.title.toLowerCase().includes(lowerTerm)
      );
      return {
        ...cat,
        matchingArticles,
        isVisible: catMatches || matchingArticles.length > 0
      };
    }).filter(item => item.isVisible);
  }, [categories, articles, searchTerm]);

  return (
    <div className="w-72 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 print:hidden transition-all duration-300">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center gap-3 text-amber-500 mb-4">
          <div className="p-2 bg-amber-900/30 rounded-lg text-amber-500">
            <Flame size={24} fill="currentColor" fillOpacity={0.4} />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-white leading-tight">Gaucho Sensei</h1>
            <p className="text-xs text-slate-500 font-medium">Training System</p>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
          <input 
            type="text"
            placeholder="Search manuals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 text-sm text-slate-200 pl-9 pr-3 py-2 rounded-lg border border-slate-700 focus:border-amber-600 focus:outline-none placeholder-slate-500 transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredData.map((category) => {
          const isExpanded = expandedCats.has(category.id);

          return (
            <div key={category.id} className="mb-2">
              {/* Category Header */}
              <div className="group flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-800 cursor-pointer transition-colors">
                <div 
                  className="flex items-center gap-2 flex-1 truncate"
                  onClick={() => toggleCategory(category.id)}
                >
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <Folder size={16} className="text-amber-600" />
                  <span className="font-medium text-sm text-slate-200">{category.name}</span>
                </div>
                
                {isAdmin && (
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onAddArticle(category.id); }}
                      title="Add Article"
                      className="p-1 hover:text-green-400"
                    >
                      <Plus size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteCategory(category.id); }}
                      title="Delete Category"
                      className="p-1 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Articles List */}
              {isExpanded && (
                <div className="ml-4 pl-2 border-l border-slate-700 mt-1 space-y-0.5">
                  {category.matchingArticles.map((article) => (
                    <div
                      key={article.id}
                      onClick={() => onSelectArticle(article.id)}
                      className={`
                        group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer text-sm
                        ${selectedArticleId === article.id ? 'bg-amber-900/30 text-amber-400 font-medium' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}
                      `}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText size={14} />
                        <span className="truncate">{article.title}</span>
                      </div>
                      {isAdmin && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDeleteArticle(article.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                  {category.matchingArticles.length === 0 && (
                    <div className="px-2 py-1 text-xs text-slate-600 italic">No matching articles</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filteredData.length === 0 && (
          <div className="p-4 text-center text-slate-500 text-sm">
            No results found.
          </div>
        )}
      </div>

      {/* Footer / Admin Controls */}
      <div className="p-3 border-t border-slate-800 space-y-2 bg-slate-950">
        {isAdmin && (
          <button
            onClick={onAddCategory}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-700 hover:bg-amber-600 text-xs uppercase tracking-wider font-semibold rounded text-white transition-colors shadow-sm"
          >
            <Plus size={16} />
            New Category
          </button>
        )}
        
        <button
          onClick={onToggleAdmin}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-xs uppercase tracking-wider font-semibold rounded transition-colors ${
             isAdmin 
             ? 'bg-slate-800 text-green-400 hover:bg-slate-700 border border-slate-700' 
             : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300 border border-slate-700'
          }`}
        >
          {isAdmin ? <Unlock size={14} /> : <Lock size={14} />}
          {isAdmin ? 'Manager Mode' : 'Employee Mode'}
        </button>
      </div>
    </div>
  );
};