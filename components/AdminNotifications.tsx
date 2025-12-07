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

    useEffect(() => {
        // Carregar notificações iniciais
        fetchInitialData();

        // Inscrever para atualizações em tempo real
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
                    // Novo ticket criado
                    setUnreadCount((prev) => prev + 1);
                    const newTicket = payload.new;
                    setNotifications((prev) => [{
                        id: newTicket.id,
                        type: 'ticket',
                        message: `#${String(newTicket.numero).padStart(4, '0')} - ${newTicket.nome_cliente || 'Cliente'}\nNovo Ticket: ${newTicket.titulo}`,
                        created_at: newTicket.created_at || new Date().toISOString()
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

                    // Detectar nova resposta do cliente
                    // Se resposta_cliente mudou para algo (não null/vazio) e é diferente do anterior
                    if (newData.resposta_cliente && newData.resposta_cliente !== oldData.resposta_cliente) {
                        setUnreadCount((prev) => prev + 1);
                        setNotifications((prev) => [{
                            id: newData.id,
                            type: 'message',
                            message: `#${String(newData.numero).padStart(4, '0')} - ${newData.nome_cliente || 'Cliente'}\n${newData.resposta_cliente}`,
                            created_at: new Date().toISOString()
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
        // Buscar tickets pendentes OU com resposta do cliente não lida
        const { data: tickets, error } = await supabase
            .from('tickets')
            .select('*')
            .or('status.eq.Pending,resposta_cliente.neq.null')
            .order('criado_em', { ascending: false })
            .limit(15);

        if (!error && tickets) {
            setUnreadCount(tickets.length);

            // Converter tickets em notificações visuais
            const initialNotifications = tickets.map(t => {
                const isReply = !!t.resposta_cliente;
                return {
                    id: t.id,
                    type: isReply ? 'message' : 'ticket',
                    message: `#${String(t.numero).padStart(4, '0')} - ${t.nome_cliente || 'Cliente'}\n${isReply ? t.resposta_cliente : `Novo Ticket: ${t.titulo}`}`,
                    created_at: t.atualizado_em || t.criado_em
                };
            });

            setNotifications(initialNotifications);
        }
    };

    const handleOpen = () => {
        setShowDropdown(!showDropdown);
        if (!showDropdown && unreadCount > 0) {
            // Marcar como lido visualmente (resetar contador) ao abrir
            setUnreadCount(0);
        }
    };

    const handleNotificationBaseClick = (ticketId: string) => {
        if (onNotificationClick) {
            onNotificationClick(ticketId);
            setShowDropdown(false); // Close dropdown on click
        }
    };

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={handleOpen}
                className="relative p-2 text-gray-300 hover:text-white transition-colors rounded-lg border border-gray-700 bg-gray-800/50 hover:bg-gray-700/50 group"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>

                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 transform bg-red-600 rounded-full border-2 border-gray-900">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 z-50 overflow-hidden">
                    <div className="p-3 border-b border-gray-700 bg-gray-800/50">
                        <h3 className="font-semibold text-white">Notificações</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-400 text-sm">
                                Nenhuma nova notificação recentemente.
                            </div>
                        ) : (
                            notifications.map((notif, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleNotificationBaseClick(notif.id)}
                                    className="p-3 hover:bg-gray-700/50 border-b border-gray-700/50 transition-colors cursor-pointer"
                                >
                                    <p className="text-sm text-gray-200 whitespace-pre-wrap">{notif.message}</p>
                                    <span className="text-xs text-gray-500 mt-1 block">
                                        {new Date(notif.created_at).toLocaleTimeString()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
