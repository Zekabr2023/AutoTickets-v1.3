import React, { useState, useEffect } from 'react';
import { configService } from '../lib/configService';

interface IframeConfigModalProps {
  onClose: () => void;
}

export const IframeConfigModal: React.FC<IframeConfigModalProps> = ({ onClose }) => {
  const [dominios, setDominios] = useState<string[]>([]);
  const [novoDominio, setNovoDominio] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    carregarDominios();
  }, []);

  const carregarDominios = async () => {
    try {
      setIsLoading(true);
      const dominiosPermitidos = await configService.buscarDominiosIframe();
      setDominios(dominiosPermitidos);
    } catch (error) {
      console.error('Erro ao carregar domínios:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const adicionarDominio = () => {
    if (!novoDominio.trim()) return;
    
    const dominio = novoDominio.trim().toLowerCase();
    
    // Validar formato do domínio
    const dominioRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,})$/;
    if (!dominioRegex.test(dominio)) {
      alert('Por favor, insira um domínio válido (ex: exemplo.com.br)');
      return;
    }

    if (dominios.includes(dominio)) {
      alert('Este domínio já está na lista!');
      return;
    }

    setDominios([...dominios, dominio]);
    setNovoDominio('');
  };

  const removerDominio = (index: number) => {
    setDominios(dominios.filter((_, i) => i !== index));
  };

  const salvarConfiguracoes = async () => {
    try {
      setIsSaving(true);
      const resultado = await configService.atualizarDominiosIframe(dominios);
      
      if (resultado.success) {
        alert('Configurações salvas com sucesso!');
        onClose();
      } else {
        alert('Erro ao salvar configurações: ' + resultado.error);
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      adicionarDominio();
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-600">
          <div className="text-white text-center">Carregando configurações...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-600">
        <h3 className="text-xl font-bold text-white mb-4">🌐 Configuração de Domínios Iframe</h3>
        
        <div className="space-y-4">
          <div className="bg-gray-700/50 rounded-lg p-3">
            <p className="text-gray-300 text-sm mb-3">
              Configure quais domínios podem exibir sua aplicação em iframes. 
              Isso permite incorporar o sistema em outros sites.
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Adicionar Domínio:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={novoDominio}
                onChange={(e) => setNovoDominio(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="exemplo.com.br"
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={adicionarDominio}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors duration-200"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Domínios Permitidos:</label>
            <div className="bg-gray-700/50 rounded-lg p-3 max-h-40 overflow-y-auto">
              {dominios.length === 0 ? (
                <p className="text-gray-400 text-sm">Nenhum domínio configurado</p>
              ) : (
                <div className="space-y-2">
                  {dominios.map((dominio, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-600/50 rounded p-2">
                      <span className="text-white text-sm">{dominio}</span>
                      <button
                        onClick={() => removerDominio(index)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3">
            <p className="text-yellow-300 text-sm">
              ⚠️ <strong>Atenção:</strong> Permitir domínios em iframe pode expor sua aplicação. 
              Use apenas com domínios confiáveis.
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={salvarConfiguracoes}
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};
