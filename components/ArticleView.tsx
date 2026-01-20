import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Estilo do editor
import { Printer, Edit3, Save, Languages, X, Loader2, Globe } from 'lucide-react';
import { Article, ViewMode, Language } from '../types';
import { DEEPL_API_KEY, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../constants';

interface ArticleViewProps {
  article: Article | null;
  onUpdateArticle: (id: string, updates: Partial<Article>) => void;
  isAdmin: boolean;
}

export const ArticleView: React.FC<ArticleViewProps> = ({ article, onUpdateArticle, isAdmin }) => {
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

  // --- HANDLER DE UPLOAD DE IMAGEM ---
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files ? input.files[0] : null;
      if (!file) return;

      try {
        let imageUrl = "";

        // Se o usuário ainda não configurou, usa mock
        if (!CLOUDINARY_CLOUD_NAME || CLOUDINARY_CLOUD_NAME === "your_cloud_name") {
            alert("Configure o Cloudinary no constants.ts para upload real.");
            return;
        }

        // Upload Real para o Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        // Feedback visual simples
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
        imageUrl = data.secure_url;

        // Substitui o texto "Uploading..." pela imagem
        if (quill && range) {
            quill.deleteText(range.index, 13); // Deleta "📷 Uploading..."
            quill.insertEmbed(range.index, 'image', imageUrl);
        }

      } catch (error) {
        console.error("Erro no upload:", error);
        alert("Erro ao fazer upload. Verifique se o Preset está como 'Unsigned' no Cloudinary.");
      }
    };
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, false] }],
        ['bold', 'italic', 'underline'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image'], // Botão de imagem
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    }
  }), []);

  // --- TRADUÇÃO (COM PROXY CORRIGIDO) ---
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
      // Traduz título (texto simples) e conteúdo (HTML)
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
      console.error(error);
      alert("Erro na tradução.");
      setCurrentLang('PT');
    } finally {
      setIsLoadingTranslation(false);
    }
  };

  const translateText = async (text: string, targetLang: string, isHtml: boolean): Promise<string | null> => {
    if (!DEEPL_API_KEY || DEEPL_API_KEY === "YOUR_API_KEY_HERE") {
       return `[${targetLang} Mock] ${text}`;
    }

    // USA O PROXY DO VITE AQUI
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
          tag_handling: isHtml ? 'html' : undefined, // Mantém formatação do Quill
        }),
      });

      if (!response.ok) throw new Error('DeepL Error');
      const data = await response.json();
      return data.translations[0]?.text || null;
    } catch (e) {
      throw e;
    }
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
      <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400">
        <Globe size={48} className="mb-4" />
        <p>Selecione um manual para começar</p>
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
    <div className={`flex-1 flex flex-col h-full bg-white font-sans`}>
      {/* Toolbar */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white print:hidden sticky top-0 z-10">
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          {['PT', 'JA', 'EN-US'].map((lang) => (
             <button
               key={lang}
               onClick={() => handleLanguageChange(lang as Language)}
               className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${currentLang === lang ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}
             >
               {lang === 'PT' ? '🇧🇷 PT' : lang === 'JA' ? '🇯🇵 JP' : '🇺🇸 EN'}
             </button>
          ))}
        </div>
        <div className="flex gap-2">
            {mode === 'view' ? (
                <>
                    {isAdmin && isOriginal && (
                        <button onClick={() => setMode('edit')} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded text-sm">
                            <Edit3 size={18} /> Editar
                        </button>
                    )}
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded text-sm">
                        <Printer size={18} /> Imprimir
                    </button>
                </>
            ) : (
                <>
                    <button onClick={() => setMode('view')} className="px-3 py-1.5 hover:bg-gray-100 rounded text-sm"><X size={18}/></button>
                    <button onClick={handleSave} className="flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white rounded text-sm"><Save size={18}/> Salvar</button>
                </>
            )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
            {mode === 'edit' ? (
                <div className="flex flex-col gap-4 h-full">
                    <input 
                        value={editTitle} 
                        onChange={e => setEditTitle(e.target.value)} 
                        className="text-3xl font-bold border-b pb-2 outline-none" 
                        placeholder="Título do Procedimento"
                    />
                    {/* Editor Visual Quill */}
                    <ReactQuill 
                        ref={quillRef}
                        theme="snow"
                        value={editContent}
                        onChange={setEditContent}
                        modules={modules}
                        className="h-[60vh] mb-12"
                    />
                </div>
            ) : (
                <article className="prose max-w-none">
                    {isLoadingTranslation ? (
                        <div className="flex flex-col items-center py-20"><Loader2 className="animate-spin mb-2"/>Traduzindo...</div>
                    ) : (
                        <>
                            <h1 className="text-4xl font-bold mb-8">{displayTitle}</h1>
                            {/* Renderiza HTML Seguro */}
                            <div dangerouslySetInnerHTML={{ __html: displayContent }} />
                        </>
                    )}
                </article>
            )}
        </div>
      </div>
    </div>
  );
};