import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css'; 
import { Printer, Edit3, Save, X, Loader2, Globe, Menu } from 'lucide-react';
import { Article, ViewMode, Language } from '../types';
import { DEEPL_API_KEY, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../constants';

// --- MÓDULO DE REDIMENSIONAMENTO ---
import BlotFormatter from 'quill-blot-formatter';
Quill.register('modules/blotFormatter', BlotFormatter);

interface ArticleViewProps {
  article: Article | null;
  onUpdateArticle: (id: string, updates: Partial<Article>) => void;
  isAdmin: boolean;
  onToggleMobileMenu: () => void; // Nova Prop
}

export const ArticleView: React.FC<ArticleViewProps> = ({ article, onUpdateArticle, isAdmin, onToggleMobileMenu }) => {
  const [mode, setMode] = useState<ViewMode>('view');
  const [currentLang, setCurrentLang] = useState<Language>('PT');
  const [isLoadingTranslation, setIsLoadingTranslation] = useState(false);
  
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  
  const quillRef = useRef<ReactQuill>(null);

  useEffect(() => {
    if (article) {
      setEditTitle(article.title);
      setEditContent(article.content);
      setMode('view');
      setCurrentLang('PT'); 
    }
  }, [article?.id]);

  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files ? input.files[0] : null;
      if (!file) return;

      try {
        if (!CLOUDINARY_CLOUD_NAME || CLOUDINARY_CLOUD_NAME === "your_cloud_name") {
            alert("Configure Cloudinary");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const quill = quillRef.current?.getEditor();
        const range = quill?.getSelection(true);
        if (quill && range) {
            quill.insertText(range.index, "📷 Uploading...", 'bold', true);
        }

        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Falha no upload');
        const data = await response.json();

        if (quill && range) {
            quill.deleteText(range.index, 13);
            quill.insertEmbed(range.index, 'image', data.secure_url);
        }

      } catch (error) {
        alert("Erro no upload.");
      }
    };
  };

  const modules = useMemo(() => ({
    blotFormatter: {}, 
    toolbar: {
      container: [
        [{ 'header': [1, 2, false] }],
        ['bold', 'italic', 'underline'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: { image: imageHandler }
    }
  }), []);

  const handleLanguageChange = async (lang: Language) => {
    if (!article) return;
    setCurrentLang(lang);
    if (lang === 'PT') return;

    const cached = article.translations?.[lang];
    const isStale = cached && cached.timestamp < article.lastUpdated;

    if (!cached || isStale) {
      await performTranslation(lang);
    }
  };

  const performTranslation = async (targetLang: Language) => {
    if (!article) return;
    setIsLoadingTranslation(true);
    try {
      const titleTrans = await translateText(article.title, targetLang, false);
      const contentTrans = await translateText(article.content, targetLang, true);

      if (titleTrans && contentTrans) {
        onUpdateArticle(article.id, {
          translations: {
            ...article.translations,
            [targetLang]: { title: titleTrans, content: contentTrans, timestamp: Date.now() }
          }
        });
      }
    } catch (error) {
      alert("Erro na tradução.");
      setCurrentLang('PT');
    } finally {
      setIsLoadingTranslation(false);
    }
  };

  const translateText = async (text: string, targetLang: string, isHtml: boolean): Promise<string | null> => {
    if (!DEEPL_API_KEY || DEEPL_API_KEY.includes("YOUR_API_KEY")) return `[Mock] ${text}`;

    const url = '/api/deepl';
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: [text],
          target_lang: targetLang,
          tag_handling: isHtml ? 'html' : undefined,
        }),
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      return data.translations[0]?.text || null;
    } catch (e) { throw e; }
  };

  const handleSave = () => {
    if (!article) return;
    onUpdateArticle(article.id, {
      title: editTitle,
      content: editContent,
      lastUpdated: Date.now(),
    });
    setMode('view');
  };

  if (!article) {
    return (
      <div className="flex-1 flex flex-col h-full bg-gray-50">
        {/* Header Mobile para Estado Vazio */}
        <div className="md:hidden h-16 border-b bg-white flex items-center px-4">
            <button onClick={onToggleMobileMenu} className="p-2 -ml-2 text-slate-600">
                <Menu size={24} />
            </button>
            <span className="ml-2 font-bold text-slate-800">Gaucho Sensei</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-4 text-center">
          <Globe size={48} className="mb-4 opacity-50" />
          <p className="text-lg font-medium">Selecione um manual para começar</p>
          <p className="text-sm mt-2">Use o menu {isAdmin ? 'para criar ou selecionar' : 'para navegar'}.</p>
        </div>
      </div>
    );
  }

  // Lógica de Exibição
  let displayTitle = article.title;
  let displayContent = article.content;
  if (currentLang !== 'PT' && article.translations?.[currentLang]) {
      displayTitle = article.translations[currentLang].title;
      displayContent = article.translations[currentLang].content;
  }
  const isOriginal = currentLang === 'PT';

  return (
    <div className={`flex-1 flex flex-col h-full bg-white font-sans w-full`}>
      {/* Toolbar / Header */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4 md:px-6 bg-white print:hidden sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-3">
          {/* Botão Hambúrguer (Só Mobile) */}
          <button onClick={onToggleMobileMenu} className="md:hidden p-1 text-slate-600 hover:bg-gray-100 rounded">
            <Menu size={24} />
          </button>

          {/* Botões de Idioma */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            {['PT', 'JA', 'EN-US'].map((lang) => (
               <button
                 key={lang}
                 onClick={() => handleLanguageChange(lang as Language)}
                 className={`px-2 md:px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all ${currentLang === lang ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}
               >
                 {lang === 'PT' ? '🇧🇷' : lang === 'JA' ? '🇯🇵' : '🇺🇸'}
                 <span className="hidden md:inline ml-1">{lang === 'EN-US' ? 'EN' : lang}</span>
               </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
            {mode === 'view' ? (
                <>
                    {isAdmin && isOriginal && (
                        <button onClick={() => setMode('edit')} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded text-sm text-slate-700">
                            <Edit3 size={18} /> <span className="hidden md:inline">Editar</span>
                        </button>
                    )}
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded text-sm hover:bg-slate-800">
                        <Printer size={18} /> <span className="hidden md:inline">Imprimir</span>
                    </button>
                </>
            ) : (
                <>
                    <button onClick={() => setMode('view')} className="px-3 py-1.5 hover:bg-gray-100 rounded text-sm"><X size={18}/></button>
                    <button onClick={handleSave} className="flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"><Save size={18}/> Salvar</button>
                </>
            )}
        </div>
      </div>

      {/* Conteúdo com Scroll */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto w-full">
            {mode === 'edit' ? (
                <div className="flex flex-col gap-4 h-full">
                    <input 
                        value={editTitle} 
                        onChange={e => setEditTitle(e.target.value)} 
                        className="text-2xl md:text-3xl font-bold border-b pb-2 outline-none w-full" 
                        placeholder="Título do Procedimento"
                    />
                    <ReactQuill 
                        ref={quillRef}
                        theme="snow"
                        value={editContent}
                        onChange={setEditContent}
                        modules={modules}
                        className="h-[50vh] md:h-[60vh] mb-12"
                    />
                </div>
            ) : (
                <article className="prose prose-sm md:prose-lg max-w-none">
                    {isLoadingTranslation ? (
                        <div className="flex flex-col items-center py-20"><Loader2 className="animate-spin mb-2 text-amber-600"/>Traduzindo...</div>
                    ) : (
                        <>
                            <h1 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8 text-slate-900">{displayTitle}</h1>
                            <div className="break-words" dangerouslySetInnerHTML={{ __html: displayContent }} />
                        </>
                    )}
                </article>
            )}
        </div>
      </div>
    </div>
  );
};