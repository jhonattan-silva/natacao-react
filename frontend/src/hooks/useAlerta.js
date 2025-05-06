import { useState, useCallback } from 'react';
import Alerta from '../componentes/Pop-Ups/Alerta';

export default function useAlerta() {
  const [mensagem, setMensagem] = useState('');
  const [visivel, setVisivel] = useState(false);

  const mostrar = useCallback((msg) => {
    setMensagem(msg);
    setVisivel(true);
  }, []);

  const esconder = useCallback(() => {
    setVisivel(false);
    setMensagem('');
  }, []);

  const componente = visivel ? (
    <Alerta mensagem={mensagem} onClose={esconder} />
  ) : null;

  return { mostrar, componente };
}
