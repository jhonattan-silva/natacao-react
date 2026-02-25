import { useCallback, useState } from 'react';
import AvisoBarra from '../componentes/AvisoBarra/AvisoBarra';

export default function useAvisoBarra() {
    const [mensagem, setMensagem] = useState('');
    const [visivel, setVisivel] = useState(false);

    const mostrar = useCallback((msg) => {
        setMensagem(msg);
        setVisivel(true);
    }, []);

    const esconder = useCallback(() => {
        setMensagem('');
        setVisivel(false);
    }, []);

    const componente = visivel ? <AvisoBarra mensagem={mensagem} /> : null;

    return { mostrar, esconder, componente };
}
