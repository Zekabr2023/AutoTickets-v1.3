import React, { useState, useEffect } from 'react';
import { TicketStatus } from '../types';
import { createClient } from '@supabase/supabase-js';
import { useToast } from './ToastProvider';

const API_URL = '/api';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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

interface ColumnRuleModalProps {
    status: TicketStatus;
    onClose: () => void;
    onSaveSuccess?: () => void;
}

interface AutomationRule {
    id?: string;
    name: string;
    source_status: string;
    target_status: string;
    delay_days: number;
    delay_hours: number;
    is_enabled: boolean;
}

const ALL_STATUSES = [
    { id: TicketStatus.Pending, label: 'Pendente' },
    { id: TicketStatus.InAnalysis, label: 'Em Análise' },
    { id: TicketStatus.AwaitingInfo, label: 'Aguardando Info' },
    { id: TicketStatus.Resolved, label: 'Resolvido' },
    { id: TicketStatus.Archived, label: 'Arquivado' },
];

const resolveStatusName = (status: TicketStatus | string) => {
    switch (status) {
        case TicketStatus.Pending: return 'Pendente';
        case TicketStatus.InAnalysis: return 'Em Análise';
        case TicketStatus.AwaitingInfo: return 'Aguardando Info';
        case TicketStatus.Resolved: return 'Resolvido';
        case TicketStatus.Archived: return 'Arquivado';
        default: return status;
    }
};

export const ColumnRuleModal: React.FC<ColumnRuleModalProps> = ({ status, onClose, onSaveSuccess }) => {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<'notifications' | 'automation'>('notifications');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<any>({ templates: [] });
    const [whatsappTemplates, setWhatsappTemplates] = useState<any[]>([]);
    const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
    const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(null);

    useEffect(() => {
        fetchData();
    }, [status]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [configRes, templatesRes] = await Promise.all([
                api.get(`${API_URL}/config`),
                api.get(`${API_URL}/whatsapp/templates`)
            ]);

            setConfig(configRes.data);
            if (templatesRes.data.success && templatesRes.data.data) {
                setWhatsappTemplates(templatesRes.data.data.data || []);
            }

            // Fetch automation rules for this status
            const { data: rules, error } = await supabase
                .from('column_automation_rules')
                .select('*')
                .eq('source_status', status)
                .order('created_at', { ascending: true });

            if (!error && rules) {
                setAutomationRules(rules);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Notification Rules ---
    const handleSaveNotifications = async () => {
        try {
            setSaving(true);
            await api.post(`${API_URL}/config`, config);
            toast.success('Regras de notificação salvas com sucesso!');
            if (onSaveSuccess) onSaveSuccess();
        } catch (error) {
            console.error("Error saving config:", error);
            toast.error('Erro ao salvar regras de notificação.');
        } finally {
            setSaving(false);
        }
    };

    const addNotificationRule = () => {
        setConfig((prev: any) => ({
            ...prev,
            templates: [...prev.templates, { status: status, type: 'whatsapp', templateName: '' }]
        }));
    };

    const updateNotificationRule = (index: number, field: string, value: any) => {
        const newTemplates = [...config.templates];
        let matchCount = -1;
        const globalIndex = newTemplates.findIndex(t => {
            if (t.status === status) {
                matchCount++;
                return matchCount === index;
            }
            return false;
        });

        if (globalIndex !== -1) {
            newTemplates[globalIndex] = { ...newTemplates[globalIndex], [field]: value };
            setConfig((prev: any) => ({ ...prev, templates: newTemplates }));
        }
    };

    const removeNotificationRule = (index: number) => {
        let matchCount = -1;
        const globalIndex = config.templates.findIndex((t: any) => {
            if (t.status === status) {
                matchCount++;
                return matchCount === index;
            }
            return false;
        });

        if (globalIndex !== -1) {
            const newTemplates = config.templates.filter((_: any, i: number) => i !== globalIndex);
            setConfig((prev: any) => ({ ...prev, templates: newTemplates }));
        }
    };

    const filteredNotificationRules = config.templates.filter((t: any) => t.status === status);

    // --- Automation Rules ---
    const addAutomationRule = () => {
        const newRule: AutomationRule = {
            name: `Regra ${automationRules.length + 1}`,
            source_status: status,
            target_status: TicketStatus.Archived,
            delay_days: 7,
            delay_hours: 0,
            is_enabled: true
        };
        setAutomationRules(prev => [...prev, newRule]);
    };

    const updateAutomationRule = (index: number, field: keyof AutomationRule, value: any) => {
        setAutomationRules(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const toggleAutomationRule = async (index: number) => {
        const rule = automationRules[index];
        const newEnabled = !rule.is_enabled;

        if (rule.id) {
            await supabase
                .from('column_automation_rules')
                .update({ is_enabled: newEnabled, updated_at: new Date().toISOString() })
                .eq('id', rule.id);
        }

        updateAutomationRule(index, 'is_enabled', newEnabled);
        toast.info(newEnabled ? 'Regra habilitada.' : 'Regra desabilitada.');
    };

    const deleteAutomationRule = async (index: number) => {
        const rule = automationRules[index];

        if (rule.id) {
            // Show confirmation with pending state
            setPendingDeleteIndex(index);
            return;
        }

        setAutomationRules(prev => prev.filter((_, i) => i !== index));
        toast.info('Regra removida.');
    };

    const confirmDeleteRule = async () => {
        if (pendingDeleteIndex === null) return;

        const rule = automationRules[pendingDeleteIndex];
        if (rule.id) {
            await supabase
                .from('column_automation_rules')
                .delete()
                .eq('id', rule.id);
        }

        setAutomationRules(prev => prev.filter((_, i) => i !== pendingDeleteIndex));
        setPendingDeleteIndex(null);
        toast.success('Regra excluída permanentemente!');
    };

    const cancelDeleteRule = () => {
        setPendingDeleteIndex(null);
    };

    const saveAutomationRules = async () => {
        try {
            setSaving(true);

            for (const rule of automationRules) {
                if (rule.id) {
                    // Update existing rule
                    await supabase
                        .from('column_automation_rules')
                        .update({
                            name: rule.name,
                            target_status: rule.target_status,
                            delay_days: rule.delay_days,
                            delay_hours: rule.delay_hours,
                            is_enabled: rule.is_enabled,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', rule.id);
                } else {
                    // Insert new rule
                    const { data } = await supabase
                        .from('column_automation_rules')
                        .insert({
                            name: rule.name,
                            source_status: rule.source_status,
                            target_status: rule.target_status,
                            delay_days: rule.delay_days,
                            delay_hours: rule.delay_hours,
                            is_enabled: rule.is_enabled
                        })
                        .select()
                        .single();

                    if (data) {
                        rule.id = data.id;
                    }
                }
            }

            toast.success('Regras de automação salvas com sucesso!');
            if (onSaveSuccess) onSaveSuccess();
        } catch (error) {
            console.error("Error saving automation rules:", error);
            toast.error('Erro ao salvar regras de automação.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 text-white">Carregando...</div>;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        ⚙️ Regras: <span className="text-indigo-400">{resolveStatusName(status)}</span>
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-700">
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${activeTab === 'notifications'
                            ? 'bg-gray-700/50 text-white border-b-2 border-indigo-500'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        🔔 Notificações
                    </button>
                    <button
                        onClick={() => setActiveTab('automation')}
                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${activeTab === 'automation'
                            ? 'bg-gray-700/50 text-white border-b-2 border-indigo-500'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        ⏱️ Automação de Tempo
                    </button>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {activeTab === 'notifications' ? (
                        /* NOTIFICATIONS TAB */
                        <>
                            {filteredNotificationRules.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>Nenhuma regra de notificação para este status.</p>
                                    <button onClick={addNotificationRule} className="mt-4 px-4 py-2 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 rounded-lg transition-colors border border-indigo-500/30">
                                        + Criar Regra de Notificação
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredNotificationRules.map((rule: any, idx: number) => (
                                        <div key={idx} className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 flex flex-col gap-3">
                                            <div className="flex gap-4">
                                                <div className="flex-1">
                                                    <label className="text-xs text-gray-400 mb-1 block">Canal</label>
                                                    <select
                                                        value={rule.type}
                                                        onChange={e => updateNotificationRule(idx, 'type', e.target.value)}
                                                        className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                                                    >
                                                        <option value="whatsapp">WhatsApp</option>
                                                        <option value="email">Email</option>
                                                    </select>
                                                </div>
                                                <div className="flex-[2]">
                                                    <label className="text-xs text-gray-400 mb-1 block">Template / Assunto</label>
                                                    {rule.type === 'whatsapp' ? (
                                                        <select
                                                            value={rule.templateName}
                                                            onChange={e => updateNotificationRule(idx, 'templateName', e.target.value)}
                                                            className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                                                        >
                                                            <option value="">Selecione o Template...</option>
                                                            {whatsappTemplates.map(t => (
                                                                <option key={t.name} value={t.name}>{t.name} ({t.status})</option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            value={rule.templateName}
                                                            onChange={e => updateNotificationRule(idx, 'templateName', e.target.value)}
                                                            className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                                                            placeholder="Assunto do Email"
                                                        />
                                                    )}
                                                </div>
                                                <div className="flex items-end">
                                                    <button onClick={() => removeNotificationRule(idx)} className="text-red-400 hover:text-red-300 p-2 rounded hover:bg-red-900/20">
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={addNotificationRule} className="w-full py-2 border border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-gray-500 rounded-lg transition-colors text-sm">
                                        + Adicionar Outra Regra
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        /* AUTOMATION TAB */
                        <>
                            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                <p className="text-xs text-blue-300">
                                    ⏱️ Regras de automação movem tickets automaticamente após um período de tempo.
                                    <br />O cron job executa a cada hora para verificar tickets elegíveis.
                                </p>
                            </div>

                            {/* Confirmation Dialog for Delete */}
                            {pendingDeleteIndex !== null && (
                                <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                                    <p className="text-red-300 text-sm mb-3">
                                        ⚠️ Tem certeza que deseja <strong>EXCLUIR permanentemente</strong> a regra "{automationRules[pendingDeleteIndex]?.name}"?
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={confirmDeleteRule}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium"
                                        >
                                            ✓ Confirmar Exclusão
                                        </button>
                                        <button
                                            onClick={cancelDeleteRule}
                                            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {automationRules.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>Nenhuma regra de automação para este status.</p>
                                    <button onClick={addAutomationRule} className="mt-4 px-4 py-2 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 rounded-lg transition-colors border border-indigo-500/30">
                                        + Criar Regra de Automação
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {automationRules.map((rule, idx) => (
                                        <div key={rule.id || idx} className={`bg-gray-700/50 p-4 rounded-lg border transition-all ${rule.is_enabled ? 'border-green-500/50' : 'border-gray-600 opacity-60'} ${pendingDeleteIndex === idx ? 'ring-2 ring-red-500' : ''}`}>
                                            <div className="flex items-center justify-between mb-3">
                                                <input
                                                    type="text"
                                                    value={rule.name}
                                                    onChange={e => updateAutomationRule(idx, 'name', e.target.value)}
                                                    className="bg-transparent border-none text-white font-medium text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
                                                    placeholder="Nome da regra"
                                                />
                                                <div className="flex items-center gap-2">
                                                    {/* Toggle */}
                                                    <button
                                                        onClick={() => toggleAutomationRule(idx)}
                                                        className={`relative w-10 h-5 rounded-full transition-colors ${rule.is_enabled ? 'bg-green-500' : 'bg-gray-600'}`}
                                                        title={rule.is_enabled ? 'Clique para desabilitar' : 'Clique para habilitar'}
                                                    >
                                                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${rule.is_enabled ? 'left-5' : 'left-0.5'}`} />
                                                    </button>
                                                    {/* Delete */}
                                                    <button
                                                        onClick={() => deleteAutomationRule(idx)}
                                                        className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-900/20"
                                                        title="Excluir permanentemente"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-3 items-center text-sm">
                                                <span className="text-gray-400">Após</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={rule.delay_days}
                                                    onChange={e => updateAutomationRule(idx, 'delay_days', parseInt(e.target.value) || 0)}
                                                    className="w-16 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-center"
                                                />
                                                <span className="text-gray-400">dias</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="23"
                                                    value={rule.delay_hours}
                                                    onChange={e => updateAutomationRule(idx, 'delay_hours', parseInt(e.target.value) || 0)}
                                                    className="w-16 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-center"
                                                />
                                                <span className="text-gray-400">horas, mover para</span>
                                                <select
                                                    value={rule.target_status}
                                                    onChange={e => updateAutomationRule(idx, 'target_status', e.target.value)}
                                                    className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white"
                                                >
                                                    {ALL_STATUSES.filter(s => s.id !== status).map(s => (
                                                        <option key={s.id} value={s.id}>{s.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={addAutomationRule} className="w-full py-2 border border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-gray-500 rounded-lg transition-colors text-sm">
                                        + Adicionar Outra Regra
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="p-4 border-t border-gray-700 bg-gray-900/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-300 hover:text-white">Cancelar</button>
                    <button
                        onClick={activeTab === 'notifications' ? handleSaveNotifications : saveAutomationRules}
                        disabled={saving}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium disabled:opacity-50"
                    >
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </div>
        </div>
    );
};
