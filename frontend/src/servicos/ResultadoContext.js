//ContextAPI para salvar temporariamente o resultado de cada nadador
import { createContext, useState, useEffect } from "react";

export const ResultadosContext = createContext();

export const ResultadosProvider = ({ children }) => {
  const [resultados, setResultados] = useState(() => {
    const savedResultados = localStorage.getItem('resultados');
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
