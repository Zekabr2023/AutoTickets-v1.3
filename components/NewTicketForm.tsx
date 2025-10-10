import React, { useState, useEffect } from 'react';
import { UrgencyLevel } from '../types';
import { ImageDropzone } from './ImageDropzone';
import { Empresa } from '../lib/authService';
import { ticketService } from '../lib/ticketService';
import { iaService, IA } from '../lib/iaService';

interface NewTicketFormProps {
  empresa: Empresa;
  onCancel: () => void;
  onSubmit: () => void;
}

export const NewTicketForm: React.FC<NewTicketFormProps> = ({ empresa, onCancel, onSubmit }) => {
  const [ias, setIas] = useState<IA[]>([]);
  const [selectedAI, setSelectedAI] = useState<string>('');
  const [titulo, setTitulo] = useState('');
  const [whatIsHappening, setWhatIsHappening] = useState('');
  const [whatShouldHappen, setWhatShouldHappen] = useState('');
  const [urgency, setUrgency] = useState<UrgencyLevel>(UrgencyLevel.Medium);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingIAs, setIsLoadingIAs] = useState(true);
  const [error, setError] = useState('');
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false);

  // Carregar IAs da empresa
  useEffect(() => {
    const carregarIAs = async () => {
      setIsLoadingIAs(true);
      const iasCarregadas = await iaService.buscarIAs(empresa.id);
      setIas(iasCarregadas);
      if (iasCarregadas.length > 0) {
        setSelectedAI(iasCarregadas[0].id);
      }
      setIsLoadingIAs(false);
    };

    carregarIAs();
  }, [empresa.id]);

  // Drag & Drop Global
  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDraggingGlobal(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        setIsDraggingGlobal(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsDraggingGlobal(false);

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const imageFiles = Array.from(e.dataTransfer.files).filter(file => 
          file.type.startsWith('image/')
        );
        if (imageFiles.length > 0) {
          setAttachments(prev => [...prev, ...imageFiles]);
        }
      }
    };

    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, []);

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const imageFiles = Array.from(e.clipboardData.files).filter(file => file.type.startsWith('image/'));
        if (imageFiles.length > 0) {
          e.preventDefault(); // Prevent pasting file path as text
          setAttachments(prevAttachments => [...prevAttachments, ...imageFiles]);
        }
      }
    };
    
    document.addEventListener('paste', handleGlobalPaste);
    return () => {
      document.removeEventListener('paste', handleGlobalPaste);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (!selectedAI) {
        setError('Selecione uma IA');
        setIsSubmitting(false);
        return;
      }

      const selectedAIObj = ias.find(ia => ia.id === selectedAI);
      
      const result = await ticketService.criarTicket({
        empresa_id: empresa.id,
        empresa_nome: empresa.nome_empresa,
        titulo: titulo.trim(),
        descricao: whatIsHappening,
        o_que_deveria_acontecer: whatShouldHappen,
        ai_id: selectedAI,
        ai_name: selectedAIObj?.nome || 'IA',
        urgencia: urgency,
        imagens: attachments.length > 0 ? attachments : undefined,
      });

      if (result.success) {
        onSubmit();
      } else {
        setError(result.error || 'Erro ao criar ticket');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Erro ao criar ticket:', err);
      setError('Erro ao criar ticket. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 relative">
        {/* Overlay de Drag & Drop Global */}
        {isDraggingGlobal && (
          <div className="fixed inset-0 bg-indigo-600/20 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
            <div className="bg-gray-800/90 border-4 border-dashed border-indigo-500 rounded-2xl p-12 max-w-lg mx-4 text-center">
              <div className="text-6xl mb-4">📎</div>
              <h3 className="text-3xl font-bold text-white mb-2">Solte suas imagens aqui!</h3>
              <p className="text-gray-300 text-lg">As imagens serão adicionadas ao chamado</p>
            </div>
          </div>
        )}

        <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-2xl p-6 sm:p-8 border border-gray-700">
            <h1 className="text-3xl font-bold text-white mb-6 border-b border-gray-700 pb-4">Abrir Novo Chamado</h1>
            
            {error && (
              <div className="mb-6 bg-red-500/20 text-red-300 p-3 rounded-md">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                    {/* Título do Chamado */}
                    <div>
                        <label htmlFor="titulo" className="block text-sm font-medium text-gray-300 mb-2">
                            Título do Chamado <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            id="titulo"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 text-white rounded-md p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            placeholder="Especifique o problema em poucas palavras (ex: IA não responde sobre clima)"
                            required
                            maxLength={100}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Máximo 100 caracteres ({titulo.length}/100)
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="ai-select" className="block text-sm font-medium text-gray-300 mb-2">
                            Nome da IA
                            </label>
                            {isLoadingIAs ? (
                              <div className="w-full bg-gray-900 border border-gray-600 text-gray-400 rounded-md p-3">
                                Carregando IAs...
                              </div>
                            ) : ias.length === 0 ? (
                              <div className="w-full bg-gray-900 border border-red-600 text-red-300 rounded-md p-3">
                                Nenhuma IA cadastrada para esta empresa
                              </div>
                            ) : (
                              <select
                                id="ai-select"
                                value={selectedAI}
                                onChange={(e) => setSelectedAI(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 text-white rounded-md p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                required
                              >
                                {ias.map((ia) => (
                                  <option key={ia.id} value={ia.id}>
                                    {ia.nome}
                                  </option>
                                ))}
                              </select>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Nível de Urgência</label>
                            <select
                                value={urgency}
                                onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                                className="w-full bg-gray-900 border border-gray-600 text-white rounded-md p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                required
                            >
                                {Object.values(UrgencyLevel).map(level => (
                                <option key={level} value={level}>{level}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="what-is-happening" className="block text-sm font-medium text-gray-300 mb-2">
                        O que está acontecendo?
                        </label>
                        <textarea
                        id="what-is-happening"
                        rows={5}
                        value={whatIsHappening}
                        onChange={(e) => setWhatIsHappening(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 text-white rounded-md p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        placeholder="Descreva o problema detalhadamente..."
                        required
                        />
                    </div>

                    <div>
                        <label htmlFor="what-should-happen" className="block text-sm font-medium text-gray-300 mb-2">
                        O que deveria acontecer?
                        </label>
                        <textarea
                        id="what-should-happen"
                        rows={3}
                        value={whatShouldHappen}
                        onChange={(e) => setWhatShouldHappen(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 text-white rounded-md p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        placeholder="Descreva o comportamento esperado..."
                        required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                        Evidências (Imagens)
                        </label>
                        <ImageDropzone files={attachments} onFilesChange={setAttachments} />
                    </div>
                </div>

                <div className="mt-8 flex justify-end space-x-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 transition"
                    disabled={isSubmitting}
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:bg-indigo-800 disabled:cursor-not-allowed flex items-center"
                    disabled={isSubmitting || !titulo.trim() || !whatIsHappening || !whatShouldHappen || ias.length === 0}
                >
                    {isSubmitting && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                    {isSubmitting ? 'Enviando...' : 'Abrir Chamado'}
                </button>
                </div>
            </form>
        </div>
    </div>
  );
};