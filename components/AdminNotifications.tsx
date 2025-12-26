import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface NotificationBellProps {
    className?: string;
    onNotificationClick?: (ticketId: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ className = '', onNotificationClick }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [lastReadTime, setLastReadTime] = useState<number>(() => {
        const saved = localStorage.getItem('admin_last_notif_read');
        return saved ? parseInt(saved) : Date.now();
    });

    useEffect(() => {
        fetchInitialData();

        const channel = supabase
            .channel('admin-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'tickets',
                },
                (payload) => {
                    const newTicket = payload.new;
                    setUnreadCount((prev) => prev + 1);
                    setNotifications((prev) => [{
                        id: newTicket.id,
                        type: 'ticket',
                        message: `#${String(newTicket.numero).padStart(4, '0')} - ${newTicket.nome_cliente || 'Cliente'}\nNovo Ticket: ${newTicket.titulo}`,
                        created_at: newTicket.created_at || new Date().toISOString(),
                        is_new: true
                    }, ...prev]);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'tickets',
                },
                (payload) => {
                    const newData = payload.new;
                    const oldData = payload.old;

                    if (newData.resposta_cliente && newData.resposta_cliente !== oldData.resposta_cliente) {
                        setUnreadCount((prev) => prev + 1);
                        setNotifications((prev) => [{
                            id: newData.id,
                            type: 'message',
                            message: `#${String(newData.numero).padStart(4, '0')} - ${newData.nome_cliente || 'Cliente'}\n${newData.resposta_cliente}`,
                            created_at: new Date().toISOString(),
                            is_new: true
                        }, ...prev]);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchInitialData = async () => {
        const { data: tickets, error } = await supabase
            .from('tickets')
            .select('*')
            .or('status.eq.Pending,resposta_cliente.neq.null')
            .order('criado_em', { ascending: false })
            .limit(20);

        if (!error && tickets) {
            const initialNotifications = tickets.map(t => {
                const isReply = !!t.resposta_cliente;
                const timestamp = new Date(t.atualizado_em || t.criado_em).getTime();
                return {
                    id: t.id,
                    type: isReply ? 'message' : 'ticket',
                    message: `#${String(t.numero).padStart(4, '0')} - ${t.nome_cliente || 'Cliente'}\n${isReply ? t.resposta_cliente : `Novo Ticket: ${t.titulo}`}`,
                    created_at: t.atualizado_em || t.criado_em,
                    timestamp
                };
            });

            // Count only those newer than lastReadTime
            const newCount = initialNotifications.filter(n => n.timestamp > lastReadTime).length;
            setUnreadCount(newCount);
            setNotifications(initialNotifications);
        }
    };

    const handleOpen = () => {
        setShowDropdown(!showDropdown);
        if (!showDropdown) {
            // Mark all as read
            setUnreadCount(0);
            const now = Date.now();
            setLastReadTime(now);
            localStorage.setItem('admin_last_notif_read', now.toString());
        }
    };

    const handleNotificationBaseClick = (ticketId: string) => {
        if (onNotificationClick) {
            onNotificationClick(ticketId);
            setShowDropdown(false);
        }
    };

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={handleOpen}
                className={`relative p-2 transition-all rounded-lg border group ${showDropdown ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50' : 'text-gray-300 border-gray-700 bg-gray-800/50 hover:bg-gray-700/50 hover:text-white'
                    }`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform ${unreadCount > 0 ? 'animate-pulse-slow' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>

                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold leading-none text-white transform bg-red-600 rounded-full border-2 border-gray-900 shadow-sm animate-bounce-short">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 z-50 overflow-hidden animate-fade-in origin-top-right">
                        <div className="p-3 border-b border-gray-700 bg-gray-800/95 backdrop-blur-sm flex justify-between items-center sticky top-0">
                            <h3 className="font-semibold text-white">Notificações</h3>
                            <button
                                onClick={() => {
                                    setUnreadCount(0);
                                    setLastReadTime(Date.now());
                                    localStorage.setItem('admin_last_notif_read', Date.now().toString());
                                }}
                                className="text-xs text-indigo-400 hover:text-indigo-300"
                            >
                                Marcar todas como lidas
                            </button>
                        </div>
                        <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center">
                                    <span className="text-2xl mb-2">🔕</span>
                                    Nenhuma notificação recente.
                                </div>
                            ) : (
                                notifications.map((notif, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => handleNotificationBaseClick(notif.id)}
                                        className={`p-4 border-b border-gray-700/50 transition-all cursor-pointer group hover:bg-gray-700/50 ${(notif.timestamp > lastReadTime) ? 'bg-indigo-500/10 border-l-4 border-l-indigo-500' : ''
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${notif.type === 'message' ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'}`}>
                                                {notif.type === 'message' ? 'Nova Mensagem' : 'Novo Ticket'}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed group-hover:text-white transition-colors">{notif.message}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
