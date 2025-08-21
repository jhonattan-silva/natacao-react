import { useState, useCallback } from 'react';
import Alerta from '../componentes/Pop-Ups/Alerta';

export default function useAlerta() {
  const [mensagem, setMensagem] = useState('');
  const [visivel, setVisivel] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [onConfirm, setOnConfirm] = useState(null);

  const mostrar = useCallback((msg) => {
    setMensagem(msg);
    setVisivel(true);
    setConfirmar(false);
    setOnConfirm(null);
  }, []);

  const esconder = useCallback(() => {
    setVisivel(false);
    setMensagem('');
    setConfirmar(false);
    setOnConfirm(null);
  }, []);

  const confirmarAlerta = useCallback((msg, callback) => {
    setMensagem(msg);
    setVisivel(true);
    setConfirmar(true);
    setOnConfirm(() => callback);
  }, []);

  const handleConfirm = useCallback(() => {
    if (onConfirm) onConfirm();
    esconder();
  }, [onConfirm, esconder]);

  const componente = visivel ? (
    <Alerta
      mensagem={mensagem}
      onClose={esconder}
      confirmar={confirmar}
      onConfirm={handleConfirm}
    />
  ) : null;

  return { mostrar, componente, confirmar: confirmarAlerta };
}
