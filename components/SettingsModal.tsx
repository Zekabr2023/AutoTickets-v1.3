import React, { useState, useEffect } from 'react';
import { useToast } from './ToastProvider';

// Icons
const DiscordIcon = () => <span className="text-xl">👾</span>;
const WhatsAppIcon = () => <span className="text-xl">📱</span>;
const EmailIcon = () => <span className="text-xl">📧</span>;
const TemplateIcon = () => <span className="text-xl">📝</span>;

const API_URL = '/api';

// Helper para fetch
const api = {
    get: async (url: string) => {
        const res = await fetch(url);
        return { data: await res.json() };
    },
    post: async (url: string, data: any) => {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return { data: await res.json() };
    }
};

interface SettingsModalProps {
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<'discord' | 'whatsapp' | 'email' | 'templates'>('discord');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testingWhatsapp, setTestingWhatsapp] = useState(false);

    const [config, setConfig] = useState({
        discord: { webhookUrl: '' },
        whatsapp: { wabaId: '', phoneNumberId: '', accessToken: '' },
        email: { host: '', port: 587, secure: false, auth: { user: '', pass: '' }, from: '' },
        templates: [] as any[]
    });

    const [whatsappTemplates, setWhatsappTemplates] = useState<any[]>([]);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const res = await api.get(`${API_URL}/config`);
            setConfig(res.data);

            // If whatsapp configured, fetch templates
            if (res.data.whatsapp?.accessToken) {
                fetchWhatsappTemplates();
            }
        } catch (error) {
            console.error("Error fetching config:", error);
            toast.error('Erro ao carregar configurações. Verifique se o servidor está rodando.');
        } finally {
            setLoading(false);
        }
    };

    const fetchWhatsappTemplates = async () => {
        try {
            const res = await api.get(`${API_URL}/whatsapp/templates`);
            if (res.data.success && res.data.data) {
                setWhatsappTemplates(res.data.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching templates:", error);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await api.post(`${API_URL}/config`, config);

            // Reload templates after save if whatsapp config changed
            if (config.whatsapp.accessToken && config.whatsapp.wabaId) {
                await fetchWhatsappTemplates();
            }

            toast.success('Configurações salvas com sucesso!');
            // Don't close immediately so user can test
        } catch (error) {
            console.error("Error saving config:", error);
            toast.error('Erro ao salvar configurações.');
        } finally {
            setSaving(false);
        }
    };

    const handleTestWhatsapp = async () => {
        try {
            setTestingWhatsapp(true);
            // Salvar primeiro para garantir que o backend use as credenciais atuais
            await api.post(`${API_URL}/config`, config);

            // Get test phone from input
            const testPhoneInput = document.getElementById('testPhoneInput') as HTMLInputElement;
            const testPhoneRaw = testPhoneInput?.value?.replace(/\D/g, '') || '';
            const testPhone = testPhoneRaw ? `55${testPhoneRaw}` : '';

            const res = await api.post(`${API_URL}/whatsapp/test`, { testPhone });

            if (res.data.success) {
                if (testPhone) {
                    toast.success(res.data.message);
                } else {
                    toast.warning(res.data.message);
                }
                // Load templates from response
                if (res.data.templates?.data) {
                    setWhatsappTemplates(res.data.templates.data);
                }
            } else {
                toast.error(res.data.error);
            }
        } catch (error: any) {
            console.error("Error testing whatsapp:", error);
            toast.error('Erro ao testar conexão: ' + error.message);
        } finally {
            setTestingWhatsapp(false);
        }
    };

    const updateNestedConfig = (section: string, field: string, value: any) => {
        setConfig(prev => ({
            ...prev,
            [section]: {
                ...prev[section as keyof typeof prev],
                [field]: value
            }
        }));
    };

    const addMapping = () => {
        setConfig(prev => ({
            ...prev,
            templates: [...prev.templates, { status: 'Pending', type: 'whatsapp', templateName: '' }]
        }));
    };

    const updateMapping = (index: number, field: string, value: any) => {
        const newTemplates = [...config.templates];
        newTemplates[index] = { ...newTemplates[index], [field]: value };
        setConfig(prev => ({ ...prev, templates: newTemplates }));
    };

    const removeMapping = (index: number) => {
        setConfig(prev => ({
            ...prev,
            templates: prev.templates.filter((_, i) => i !== index)
        }));
    };

    if (loading) return <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 text-white">Carregando...</div>;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">

                {/* Header */}
                <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        ⚙️ Configurações do Sistema
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        ✕
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-700 bg-gray-900/30">
                    {[
                        { id: 'discord', label: 'Discord', icon: <DiscordIcon /> },
                        { id: 'whatsapp', label: 'WhatsApp API', icon: <WhatsAppIcon /> },
                        { id: 'email', label: 'Email SMTP', icon: <EmailIcon /> },
                        { id: 'templates', label: 'Regras de Notificação', icon: <TemplateIcon /> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-all ${activeTab === tab.id
                                ? 'border-b-2 border-indigo-500 text-indigo-400 bg-gray-800'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/30'
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-800">

                    {/* Discord Tab */}
                    {activeTab === 'discord' && (() => {
                        // Default template values
                        const defaultTitle = '🎫 Novo Ticket #{{numero}}';
                        const defaultDescription = '**{{titulo}}**\n\n{{descricao}}\n\n📎 [Clique aqui para abrir o ticket]({{link}})';

                        // Insert variable at cursor position
                        const insertVariable = (variable: string, inputId: string) => {
                            const input = document.getElementById(inputId) as HTMLInputElement | HTMLTextAreaElement;
                            if (!input) return;

                            const start = input.selectionStart || 0;
                            const end = input.selectionEnd || 0;
                            const currentValue = inputId === 'discord-title'
                                ? (config.discord.embedTitle || defaultTitle)
                                : (config.discord.embedDescription || defaultDescription);

                            const newValue = currentValue.substring(0, start) + `{{${variable}}}` + currentValue.substring(end);

                            if (inputId === 'discord-title') {
                                updateNestedConfig('discord', 'embedTitle', newValue);
                            } else {
                                updateNestedConfig('discord', 'embedDescription', newValue);
                            }

                            // Restore focus and cursor position
                            setTimeout(() => {
                                input.focus();
                                input.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
                            }, 10);
                        };

                        const variables = [
                            { key: 'numero', label: 'Nº Ticket', icon: '🎫', example: '0127' },
                            { key: 'titulo', label: 'Título', icon: '📝', example: 'Exemplo de Título' },
                            { key: 'descricao', label: 'Descrição', icon: '📄', example: 'Descrição do problema...' },
                            { key: 'empresa', label: 'Empresa', icon: '🏢', example: 'Empresa XYZ' },
                            { key: 'urgencia', label: 'Urgência', icon: '⚡', example: 'Média' },
                            { key: 'ia', label: 'IA', icon: '🤖', example: 'Agente IA' },
                            { key: 'link', label: 'Link', icon: '🔗', example: 'https://...' },
                        ];

                        const currentTitle = config.discord.embedTitle || defaultTitle;
                        const currentDescription = config.discord.embedDescription || defaultDescription;

                        // Preview with replacements
                        const previewTitle = currentTitle
                            .replace(/\{\{numero\}\}/g, '0127')
                            .replace(/\{\{titulo\}\}/g, 'Exemplo de Título')
                            .replace(/\{\{empresa\}\}/g, 'Empresa XYZ');

                        const previewDescription = currentDescription
                            .replace(/\{\{numero\}\}/g, '0127')
                            .replace(/\{\{titulo\}\}/g, 'Problema ao acessar relatórios')
                            .replace(/\{\{descricao\}\}/g, 'O cliente não consegue visualizar os relatórios mensais no painel.')
                            .replace(/\{\{empresa\}\}/g, 'Empresa XYZ')
                            .replace(/\{\{urgencia\}\}/g, 'Média')
                            .replace(/\{\{ia\}\}/g, 'Agente Suporte')
                            .replace(/\{\{link\}\}/g, `${window.location.origin}/?ticketId=abc123`);

                        return (
                            <div className="space-y-4 animate-fade-in">
                                <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-lg text-indigo-200 mb-4">
                                    <p>Configure o Webhook do Discord para receber notificações de novos tickets.</p>
                                    <p className="text-xs mt-2 text-indigo-300/70">
                                        🔒 O link abre diretamente no painel admin (requer login). Cada empresa só vê seus próprios tickets.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Webhook URL</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500"
                                        placeholder="https://discord.com/api/webhooks/..."
                                        value={config.discord.webhookUrl}
                                        onChange={e => updateNestedConfig('discord', 'webhookUrl', e.target.value)}
                                    />
                                </div>

                                <div className="border-t border-gray-700 pt-4">
                                    <label className="block text-sm font-medium text-gray-400 mb-3">
                                        📝 Personalizar Mensagem
                                    </label>

                                    {/* Clickable Variables */}
                                    <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 mb-4">
                                        <p className="text-xs text-gray-400 mb-2">
                                            🖱️ Clique em uma variável para inseri-la no campo ativo:
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {variables.map(v => (
                                                <button
                                                    key={v.key}
                                                    type="button"
                                                    draggable
                                                    onDragStart={(e) => e.dataTransfer.setData('text', `{{${v.key}}}`)}
                                                    onClick={() => {
                                                        // Try to insert in the last focused field
                                                        const active = document.activeElement;
                                                        if (active?.id === 'discord-title' || active?.id === 'discord-description') {
                                                            insertVariable(v.key, active.id);
                                                        } else {
                                                            // Default to description if no field is focused
                                                            insertVariable(v.key, 'discord-description');
                                                        }
                                                    }}
                                                    className="px-2 py-1.5 bg-indigo-900/50 hover:bg-indigo-700 border border-indigo-500/50 rounded text-xs text-indigo-200 transition-all hover:scale-105 cursor-grab active:cursor-grabbing flex items-center gap-1"
                                                    title={`Clique para inserir {{${v.key}}} - Exemplo: ${v.example}`}
                                                >
                                                    <span>{v.icon}</span>
                                                    <span>{v.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">Título do Embed</label>
                                            <input
                                                id="discord-title"
                                                type="text"
                                                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                value={currentTitle}
                                                onChange={e => updateNestedConfig('discord', 'embedTitle', e.target.value)}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    const text = e.dataTransfer.getData('text');
                                                    const input = e.target as HTMLInputElement;
                                                    const pos = input.selectionStart || input.value.length;
                                                    const newValue = input.value.substring(0, pos) + text + input.value.substring(pos);
                                                    updateNestedConfig('discord', 'embedTitle', newValue);
                                                }}
                                                onDragOver={(e) => e.preventDefault()}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">Descrição do Embed</label>
                                            <textarea
                                                id="discord-description"
                                                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                rows={4}
                                                value={currentDescription}
                                                onChange={e => updateNestedConfig('discord', 'embedDescription', e.target.value)}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    const text = e.dataTransfer.getData('text');
                                                    const textarea = e.target as HTMLTextAreaElement;
                                                    const pos = textarea.selectionStart || textarea.value.length;
                                                    const newValue = textarea.value.substring(0, pos) + text + textarea.value.substring(pos);
                                                    updateNestedConfig('discord', 'embedDescription', newValue);
                                                }}
                                                onDragOver={(e) => e.preventDefault()}
                                            />
                                            <p className="text-[10px] text-gray-500 mt-1">
                                                💡 Dica: Use **texto** para negrito e [texto](url) para links
                                            </p>
                                        </div>
                                    </div>

                                    {/* Preview */}
                                    <div className="mt-4 bg-[#36393f] rounded-lg overflow-hidden">
                                        <div className="bg-gray-700/50 px-3 py-1.5 text-xs text-gray-400">
                                            📱 Preview da mensagem no Discord
                                        </div>
                                        <div className="p-4 border-l-4 border-indigo-500">
                                            <div className="text-white font-semibold text-base">
                                                {previewTitle}
                                            </div>
                                            <div className="text-gray-300 text-sm mt-2 whitespace-pre-wrap leading-relaxed">
                                                {previewDescription.split('\n').map((line, i) => {
                                                    // Simple markdown parsing for preview
                                                    let content = line;
                                                    // Bold
                                                    content = content.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
                                                    // Links
                                                    content = content.replace(/\[(.*?)\]\((.*?)\)/g, '<a class="text-indigo-400 underline">$1</a>');
                                                    return <div key={i} dangerouslySetInnerHTML={{ __html: content || '&nbsp;' }} />;
                                                })}
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-400">
                                                <span>👤 Empresa XYZ</span>
                                                <span>🤖 Agente Suporte</span>
                                                <span>🟡 Média</span>
                                            </div>
                                            <div className="mt-3">
                                                <span className="inline-block bg-indigo-600 text-white text-xs px-3 py-1.5 rounded">
                                                    📋 Abrir Ticket
                                                </span>
                                            </div>
                                        </div>
                                        <div className="bg-gray-700/30 px-3 py-1.5 text-[10px] text-gray-500">
                                            AutoTickets • Agora
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* WhatsApp Tab */}
                    {activeTab === 'whatsapp' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg text-green-200 mb-6">
                                Conexão com a WhatsApp Cloud API (Meta).
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">WABA ID (Business Account ID)</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white"
                                        value={config.whatsapp.wabaId}
                                        onChange={e => updateNestedConfig('whatsapp', 'wabaId', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Phone Number ID</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white"
                                        value={config.whatsapp.phoneNumberId}
                                        onChange={e => updateNestedConfig('whatsapp', 'phoneNumberId', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Permanent Access Token</label>
                                    <input
                                        type="password"
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white"
                                        value={config.whatsapp.accessToken}
                                        onChange={e => updateNestedConfig('whatsapp', 'accessToken', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-700">
                                <label className="block text-sm font-medium text-gray-400 mb-1">Número para Teste (Receberá mensagem real)</label>
                                <div className="flex gap-2">
                                    <div className="flex flex-1">
                                        <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-600 bg-gray-700 text-gray-400 sm:text-sm shadow-sm">
                                            +55
                                        </span>
                                        <input
                                            type="tel"
                                            id="testPhoneInput"
                                            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-lg border border-gray-600 bg-gray-900 text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            placeholder="11999999999"
                                        />
                                    </div>
                                    <button
                                        onClick={handleTestWhatsapp}
                                        disabled={testingWhatsapp}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap ${testingWhatsapp
                                            ? 'bg-gray-600 cursor-not-allowed'
                                            : 'bg-green-600 hover:bg-green-500 text-white'
                                            }`}
                                    >
                                        {testingWhatsapp ? 'Testando...' : '🚀 Testar Envio Real'}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                    Informe um número de WhatsApp para receber o template <code className="bg-gray-700 px-1 rounded">hello_world</code> e validar a configuração completa.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Email Tab */}
                    {activeTab === 'email' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg text-blue-200 mb-6">
                                Configuração SMTP para envio de emails transacionais.
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">SMTP Host</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white"
                                        placeholder="smtp.gmail.com"
                                        value={config.email.host}
                                        onChange={e => updateNestedConfig('email', 'host', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Port</label>
                                    <input
                                        type="number"
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white"
                                        placeholder="587"
                                        value={config.email.port}
                                        onChange={e => updateNestedConfig('email', 'port', parseInt(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">User / Email</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white"
                                        value={config.email.auth.user}
                                        onChange={e => {
                                            const newAuth = { ...config.email.auth, user: e.target.value };
                                            updateNestedConfig('email', 'auth', newAuth);
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                                    <input
                                        type="password"
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white"
                                        value={config.email.auth.pass}
                                        onChange={e => {
                                            const newAuth = { ...config.email.auth, pass: e.target.value };
                                            updateNestedConfig('email', 'auth', newAuth);
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Templates/Rules Tab */}
                    {activeTab === 'templates' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <p className="text-gray-400 text-sm">Defina regras para disparar notificações quando o status mudar.</p>
                                    <p className="text-gray-500 text-xs mt-1">
                                        Variáveis disponíveis: <code className="bg-gray-700 px-1 rounded">{'{{1}}'}</code> = Nº Ticket,
                                        <code className="bg-gray-700 px-1 rounded ml-1">{'{{2}}'}</code> = Título,
                                        <code className="bg-gray-700 px-1 rounded ml-1">{'{{3}}'}</code> = Status
                                    </p>
                                </div>
                                <button onClick={addMapping} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-sm transition-colors">
                                    + Nova Regra
                                </button>
                            </div>

                            <div className="space-y-3">
                                {config.templates.map((rule: any, index: number) => (
                                    <div key={index} className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 space-y-3">
                                        <div className="flex gap-4 items-center flex-wrap">
                                            <div className="flex-1 min-w-[150px]">
                                                <label className="text-xs text-gray-500 block mb-1">Quando Status for:</label>
                                                <select
                                                    value={rule.status}
                                                    onChange={e => updateMapping(index, 'status', e.target.value)}
                                                    className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                                                >
                                                    <option value="Pending">Pendente</option>
                                                    <option value="InAnalysis">Em Análise</option>
                                                    <option value="AwaitingInfo">Aguardando Info</option>
                                                    <option value="Resolved">Resolvido</option>
                                                </select>
                                            </div>

                                            <div className="flex-1 min-w-[150px]">
                                                <label className="text-xs text-gray-500 block mb-1">Enviar por:</label>
                                                <select
                                                    value={rule.type}
                                                    onChange={e => updateMapping(index, 'type', e.target.value)}
                                                    className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                                                >
                                                    <option value="whatsapp">WhatsApp</option>
                                                    <option value="email">Email</option>
                                                </select>
                                            </div>

                                            <div className="flex-[2] min-w-[200px]">
                                                <label className="text-xs text-gray-500 block mb-1">Template / Assunto:</label>
                                                {rule.type === 'whatsapp' ? (
                                                    <div className="flex flex-col">
                                                        <select
                                                            value={rule.templateName}
                                                            onChange={e => updateMapping(index, 'templateName', e.target.value)}
                                                            className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                                                        >
                                                            <option value="">Selecione o Template...</option>
                                                            {whatsappTemplates.map(t => (
                                                                <option key={t.name} value={t.name}>{t.name} ({t.status})</option>
                                                            ))}
                                                        </select>
                                                        {whatsappTemplates.length === 0 && (
                                                            <span className="text-[10px] text-yellow-500 mt-1">
                                                                ⚠️ Cadastre/Teste o WhatsApp para ver os templates.
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={rule.templateName} // Using same field for subject/template
                                                        onChange={e => updateMapping(index, 'templateName', e.target.value)}
                                                        placeholder="Ex: Assunto do Email"
                                                        className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                                                    />
                                                )}
                                            </div>

                                            <button onClick={() => removeMapping(index)} className="text-red-400 hover:text-red-300 text-sm px-2">
                                                🗑️
                                            </button>
                                        </div>

                                        {/* Template Preview & Variables Selection for WhatsApp */}
                                        {rule.type === 'whatsapp' && rule.templateName && (() => {
                                            // Find the selected template
                                            const selectedTemplate = whatsappTemplates.find(t => t.name === rule.templateName);
                                            const bodyComponent = selectedTemplate?.components?.find((c: any) => c.type === 'BODY');
                                            const bodyText = bodyComponent?.text || '';

                                            // Check for URL buttons
                                            const buttonsComponent = selectedTemplate?.components?.find((c: any) => c.type === 'BUTTONS');
                                            const urlButtons = buttonsComponent?.buttons?.filter((b: any) => b.type === 'URL' && b.url?.includes('{{')) || [];

                                            // Check if template has variables ({{1}}, {{2}}, {{nome}}, {{nome_ticket}}, etc.)
                                            const hasVariables = /\{\{[^}]+\}\}/.test(bodyText);

                                            // Count how many variables
                                            const varMatches = bodyText.match(/\{\{[^}]+\}\}/g) || [];
                                            const varCount = varMatches.length;

                                            return (
                                                <div className="bg-gray-800/50 p-3 rounded border border-gray-600 space-y-3">
                                                    {/* Template Preview */}
                                                    <div>
                                                        <label className="text-xs text-gray-400 block mb-1">
                                                            📄 Conteúdo do Template:
                                                        </label>
                                                        <div className="bg-gray-900 p-2 rounded text-sm text-gray-300 border border-gray-700">
                                                            {bodyText || <span className="text-gray-500 italic">Sem conteúdo de texto</span>}
                                                        </div>
                                                    </div>

                                                    {/* Variables Selection - Only if template has variables */}
                                                    {hasVariables ? (
                                                        <div>
                                                            <label className="text-xs text-gray-400 block mb-1">
                                                                🔍 Variáveis encontradas no template:
                                                            </label>
                                                            <div className="text-xs text-yellow-400 mb-2 bg-yellow-500/10 px-2 py-1 rounded">
                                                                {varMatches.join(', ')}
                                                            </div>
                                                            <label className="text-xs text-gray-400 block mb-2">
                                                                🔧 Dados a enviar ({varCount} esperada{varCount > 1 ? 's' : ''}):
                                                            </label>
                                                            <div className="flex flex-wrap gap-2">
                                                                {[
                                                                    { key: 'ticketNumero', label: 'Nº do Ticket', icon: '🎫' },
                                                                    { key: 'ticketTitulo', label: 'Título', icon: '📝' },
                                                                    { key: 'ticketStatus', label: 'Novo Status', icon: '📊' },
                                                                ].map(variable => {
                                                                    const vars = rule.variables || [];
                                                                    const isSelected = vars.includes(variable.key);
                                                                    const order = vars.indexOf(variable.key) + 1;

                                                                    return (
                                                                        <button
                                                                            key={variable.key}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const currentVars = rule.variables || [];
                                                                                let newVars;
                                                                                if (isSelected) {
                                                                                    newVars = currentVars.filter((v: string) => v !== variable.key);
                                                                                } else {
                                                                                    newVars = [...currentVars, variable.key];
                                                                                }
                                                                                updateMapping(index, 'variables', newVars);
                                                                            }}
                                                                            className={`px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1 ${isSelected
                                                                                ? 'bg-green-600 text-white border-2 border-green-400'
                                                                                : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
                                                                                }`}
                                                                        >
                                                                            {isSelected && <span className="bg-white/20 px-1.5 rounded-full text-[10px]">{order}</span>}
                                                                            {variable.icon} {variable.label}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                            <p className="text-[10px] text-gray-500 mt-2">
                                                                Selecione os dados na ordem em que aparecem no template.
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-green-400">
                                                            ✅ Este template não usa variáveis no texto
                                                        </div>
                                                    )}

                                                    {/* URL Button Configuration */}
                                                    {urlButtons.length > 0 && (
                                                        <div className="border-t border-gray-600 pt-3 mt-3">
                                                            <label className="text-xs text-gray-400 block mb-2">
                                                                🔗 Botão de URL Dinâmica detectado:
                                                            </label>
                                                            {urlButtons.map((btn: any, btnIdx: number) => (
                                                                <div key={btnIdx} className="bg-blue-500/10 border border-blue-500/30 p-2 rounded mb-2">
                                                                    <div className="flex items-center gap-2 text-xs text-blue-300">
                                                                        <span>🔘</span>
                                                                        <span className="font-medium">{btn.text}</span>
                                                                        <span className="text-gray-500">→</span>
                                                                        <span className="text-gray-400 truncate">{btn.url}</span>
                                                                    </div>
                                                                    <p className="text-[10px] text-blue-400/70 mt-1">
                                                                        ⚡ O ID do ticket será enviado automaticamente para o botão
                                                                    </p>
                                                                </div>
                                                            ))}
                                                            <div className="mt-2">
                                                                <label className="text-xs text-gray-400 block mb-1">
                                                                    🌐 URL Base do Sistema:
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={rule.buttonBaseUrl || 'https://tickets.automabo.com.br/ticket/'}
                                                                    onChange={(e) => updateMapping(index, 'buttonBaseUrl', e.target.value)}
                                                                    placeholder="https://tickets.automabo.com.br/ticket/"
                                                                    className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                                                                />
                                                                <p className="text-[10px] text-gray-500 mt-1">
                                                                    Configure a URL base para links de tickets (o ID será adicionado ao final)
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                ))}
                                {config.templates.length === 0 && (
                                    <p className="text-gray-500 text-center py-4">Nenhuma regra definida.</p>
                                )}
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-700 bg-gray-900/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-300 hover:text-white transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving ? 'Salvando...' : 'Salvar Configurações'}
                    </button>
                </div>
            </div>
        </div>
    );
};
