import React, { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { NewTicketForm } from './components/NewTicketForm';
import { Empresa } from './lib/authService';
import { ToastProvider } from './components/ToastProvider';

enum AppView {
  Login,
  Dashboard,
  NewTicket,
}

function App() {
  // Recuperar sessão do localStorage ao iniciar
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const saved = localStorage.getItem('isAuthenticated');
    return saved === 'true';
  });

  const [empresaLogada, setEmpresaLogada] = useState<Empresa | null>(() => {
    const saved = localStorage.getItem('empresaLogada');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentView, setCurrentView] = useState<AppView>(() => {
    const saved = localStorage.getItem('currentView');
    return saved ? parseInt(saved) : AppView.Login;
  });

  // Salvar no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('isAuthenticated', String(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    if (empresaLogada) {
      localStorage.setItem('empresaLogada', JSON.stringify(empresaLogada));
    } else {
      localStorage.removeItem('empresaLogada');
    }
  }, [empresaLogada]);

  useEffect(() => {
    localStorage.setItem('currentView', String(currentView));
  }, [currentView]);

  // Desabilitar menu de contexto padrão do navegador globalmente
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // State for Deep Linking
  const [pendingTicketId, setPendingTicketId] = useState<string | null>(null);

  // Check for Deep Link on startup
  useEffect(() => {
    // Check query string format: ?ticketId=xxx
    const params = new URLSearchParams(window.location.search);
    let ticketId = params.get('ticketId');

    // Check path format: /ticket/xxx OR /xxx (UUID format)
    if (!ticketId) {
      // Tenta casar /ticket/UUID ou apenas /UUID
      const pathMatch = window.location.pathname.match(/(?:\/ticket\/|\/)([a-f0-9-]{36})/i);
      if (pathMatch) {
        ticketId = pathMatch[1];
      }
    }

    if (ticketId) {
      console.log("🔗 Deep Link detected for Ticket ID:", ticketId);
      setPendingTicketId(ticketId);
      // Store in localStorage for persistence after login
      localStorage.setItem('pendingTicketId', ticketId);
    } else {
      // Check if there's a pending ticket from before login
      const storedTicketId = localStorage.getItem('pendingTicketId');
      if (storedTicketId) {
        console.log("🔗 Restoring pending ticket from localStorage:", storedTicketId);
        setPendingTicketId(storedTicketId);
      }
    }
  }, []);

  const handleLoginSuccess = (empresa: Empresa) => {
    setIsAuthenticated(true);
    setEmpresaLogada(empresa);
    setCurrentView(AppView.Dashboard);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setEmpresaLogada(null);
    setCurrentView(AppView.Login);
    localStorage.clear();
    setPendingTicketId(null); // Clear pending ticket on logout
  };

  const handleEmpresaUpdate = (empresaAtualizada: Empresa) => {
    setEmpresaLogada(empresaAtualizada);
  };

  const handleOpenNewTicket = () => {
    setCurrentView(AppView.NewTicket);
  };

  const handleCancelNewTicket = () => {
    setCurrentView(AppView.Dashboard);
  };

  const handleSubmitNewTicket = () => {
    // Após criar o ticket, volta para o dashboard
    setCurrentView(AppView.Dashboard);
  }

  const renderView = () => {
    if (!isAuthenticated || !empresaLogada) {
      return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    }

    // Se for admin, mostrar painel administrativo
    if (empresaLogada.is_admin) {
      return <AdminDashboard empresa={empresaLogada} onLogout={handleLogout} initialTicketId={pendingTicketId} />;
    }

    // Cliente normal
    switch (currentView) {
      case AppView.Dashboard:
        return <Dashboard empresa={empresaLogada} onOpenNewTicket={handleOpenNewTicket} onLogout={handleLogout} onEmpresaUpdate={handleEmpresaUpdate} initialTicketId={pendingTicketId} />;
      case AppView.NewTicket:
        return <NewTicketForm empresa={empresaLogada} onCancel={handleCancelNewTicket} onSubmit={handleSubmitNewTicket} />;
      default:
        return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    }
  };

  return (
    <ToastProvider>
      <div
        className="relative min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col"
        style={{
          backgroundImage: `url('https://i.imgur.com/gVloist.jpeg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative z-10 flex-1">
          {renderView()}
        </div>

        {/* Footer - Powered by Automabo */}
        <footer className="relative z-10 py-4 text-center">
          <a
            href="https://automabo.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 text-sm hover:text-gray-300 transition-colors duration-300 inline-flex items-center gap-2"
          >
            <span>powered by</span>
            <span className="font-semibold text-indigo-400 hover:text-indigo-300">Automabo</span>
          </a>
        </footer>

        <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        @keyframes slide-up {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
            animation: slide-up 0.4s ease-out forwards;
        }
      `}</style>
      </div>
    </ToastProvider>
  );
}

export default App;
