import { useState, useCallback } from 'react';
import Alerta from '../componentes/Pop-Ups/Alerta';

/**
 * Hook customizado para exibir alertas e confirmações na aplicação.
 * 
 *   - mostrar: Função para exibir um alerta simples
 *   - componente: Componente React do alerta (renderize no JSX)
 *   - confirmar: Função para exibir um alerta de confirmação
 * 
 * // Uso básico - alerta simples
 * const { mostrar, componente } = useAlerta();
 * mostrar("Operação realizada com sucesso!");
 * 
 * // Alerta com callback após fechar
 * mostrar("Dados salvos!", () => {
 *   console.log("Usuário clicou em OK");
 *   // Executar ação após fechar o alerta
 * });
 * 
 * // Alerta de confirmação
 * const { confirmar, componente } = useAlerta();
 * confirmar("Deseja excluir este item?", () => {
 *   // Executar ação se confirmado
 * });
 */
export default function useAlerta() {
  const [mensagem, setMensagem] = useState('');
  const [visivel, setVisivel] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [onConfirm, setOnConfirm] = useState(null);
  const [onClose, setOnClose] = useState(null);

  /**
   * Exibe um alerta simples.
   * @param {string} msg - Mensagem a ser exibida no alerta
   * @param {function} [callback] - Função opcional a ser executada quando o usuário fechar o alerta
   */
  const mostrar = useCallback((msg, callback) => {
    setMensagem(msg);
    setVisivel(true);
    setConfirmar(false);
    setOnConfirm(null);
    // Só armazena o callback se ele for uma função
    if (typeof callback === 'function') {
      setOnClose(() => callback);
    } else {
      setOnClose(null);
    }
  }, []);

  /**
   * Fecha o alerta e executa o callback associado, se houver.
   */
  const esconder = useCallback(() => {
    const callbackToExecute = onClose;
    
    setVisivel(false);
    setMensagem('');
    setConfirmar(false);
    setOnConfirm(null);
    setOnClose(null);
    
    // Executa o callback ao fechar, se existir
    if (callbackToExecute) {
      callbackToExecute();
    }
  }, [onClose]);

  /**
   * Exibe um alerta de confirmação com botões OK e Cancelar.
   * @param {string} msg - Mensagem a ser exibida no alerta de confirmação
   * @param {function} callback - Função a ser executada quando o usuário clicar em OK
   */
  const confirmarAlerta = useCallback((msg, callback) => {
    setMensagem(msg);
    setVisivel(true);
    setConfirmar(true);
    setOnConfirm(() => callback);
  }, []);

  /**
   * Manipula a confirmação do usuário no alerta de confirmação.
   */
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
