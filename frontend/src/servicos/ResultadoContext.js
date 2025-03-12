//ContextAPI para salvar temporariamente o resultado de cada nadador
import { createContext, useState, useEffect } from "react";

export const ResultadosContext = createContext();

export const ResultadosProvider = ({ children }) => {
  const [resultados, setResultados] = useState(() => {
    const eventoAtual = localStorage.getItem('evento_atual');
    const savedResultados = localStorage.getItem('resultados');
    if (eventoAtual !== localStorage.getItem('evento_selecionado')) {
        localStorage.removeItem('resultados'); // Limpa dados antigos ao trocar de evento
        localStorage.setItem('evento_atual', localStorage.getItem('evento_selecionado'));
        return {};
    }
    return savedResultados ? JSON.parse(savedResultados) : {};
});


  useEffect(() => {
    localStorage.setItem('resultados', JSON.stringify(resultados));
  }, [resultados]);

  const salvarTempo = (provaId, nadadorId, tempo) => {
    setResultados((prev) => ({
      ...prev,
      [provaId]: {
        ...(prev[provaId] || {}),
        [nadadorId]: tempo,
      },
    }));
  };

  return (
    <ResultadosContext.Provider value={{ resultados, salvarTempo }}>
      {children}
    </ResultadosContext.Provider>
  );
};
