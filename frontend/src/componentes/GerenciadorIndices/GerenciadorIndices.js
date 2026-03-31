import React, { useState, useEffect } from 'react';
import api from '../../servicos/api';
import Botao from '../Botao/Botao';
import useAlerta from '../../hooks/useAlerta';
import { aplicarMascaraTempo } from '../../servicos/functions';
import style from './GerenciadorIndices.module.css';

const GerenciadorIndices = () => {
  const { mostrar: mostrarAlerta, componente: AlertaComponente } = useAlerta();
  const [provas, setProvas] = useState([]);
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProvaId, setSelectedProvaId] = useState('');
  const [tempoIndice, setTempoIndice] = useState('');
  const [descricao, setDescricao] = useState('');
  const [editandoId, setEditandoId] = useState(null);

  // Carregar provas e índices ao montar o componente
  useEffect(() => {
    fetchProvas();
    fetchIndices();
  }, []);

  /**
   * Buscar lista de provas de 400m
   */
  const fetchProvas = async () => {
    try {
      const response = await api.get('/indices-tempos/listar-provas');
      if (response.data.success) {
        setProvas(response.data.dados);
      }
    } catch (error) {
      console.error('Erro ao buscar provas:', error);
      mostrarAlerta('Erro ao buscar provas de 400m');
    }
  };

  /**
   * Buscar índices já configurados
   */
  const fetchIndices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/indices-tempos/listar');
      if (response.data.success) {
        setIndices(response.data.dados);
      }
    } catch (error) {
      console.error('Erro ao buscar índices:', error);
      mostrarAlerta('Erro ao buscar índices');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Validar e formatar tempo (MM:SS:CC)
   */
  const validarTempoIndice = (tempo) => aplicarMascaraTempo(tempo);

  /**
   * Salvar novo índice ou atualizar existente
   */
  const handleSalvarIndice = async (e) => {
    e.preventDefault();

    if (!selectedProvaId) {
      mostrarAlerta('Selecione uma prova');
      return;
    }

    if (!tempoIndice) {
      mostrarAlerta('Digite o tempo máximo (MM:SS:CC)');
      return;
    }

    try {
      setLoading(true);

      if (editandoId) {
        // Atualizar índice existente
        const response = await api.put(`/indices-tempos/${editandoId}`, {
          tempoIndice,
          descricao
        });

        if (response.data.success) {
          mostrarAlerta('Índice atualizado com sucesso!');
          setEditandoId(null);
          setSelectedProvaId('');
          setTempoIndice('');
          setDescricao('');
          fetchIndices();
        }
      } else {
        // Criar novo índice
        const response = await api.post('/indices-tempos/criar', {
          provaId: parseInt(selectedProvaId),
          tempoIndice,
          descricao
        });

        if (response.data.success) {
          mostrarAlerta('Índice criado com sucesso!');
          setSelectedProvaId('');
          setTempoIndice('');
          setDescricao('');
          fetchIndices();
        }
      }
    } catch (error) {
      console.error('Erro ao salvar índice:', error);
      const mensagem = error.response?.data?.message || 'Erro ao salvar índice';
      mostrarAlerta(mensagem);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Editar índice existente
   */
  const handleEditar = (indice) => {
    const provaDoIndice = provas.find(p => p.id === indice.provas_id);
    if (provaDoIndice) {
      setEditandoId(indice.id);
      setSelectedProvaId(indice.provas_id.toString());
      setTempoIndice(indice.tempo_indice);
      setDescricao(indice.descricao || '');
      // Scroll para o formulário
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /**
   * Remover índice
   */
  const handleRemover = async (id) => {
    if (window.confirm('Tem certeza que deseja remover este índice?')) {
      try {
        setLoading(true);
        const response = await api.delete(`/indices-tempos/${id}`);

        if (response.data.success) {
          mostrarAlerta('Índice removido com sucesso!');
          fetchIndices();
        }
      } catch (error) {
        console.error('Erro ao remover índice:', error);
        mostrarAlerta('Erro ao remover índice');
      } finally {
        setLoading(false);
      }
    }
  };

  /**
   * Cancelar edição
   */
  const handleCancelar = () => {
    setEditandoId(null);
    setSelectedProvaId('');
    setTempoIndice('');
    setDescricao('');
  };

  const provasSemIndice = provas.filter(p => !p.indice_id || (editandoId && p.id === parseInt(selectedProvaId)));

  return (
    <div className={style.container}>
      {AlertaComponente}

      <h3>Gerenciar Índices de Provas</h3>

      {/* Formulário para adicionar/editar índices */}
      <section className={style.formulario}>
        <h4>{editandoId ? 'Editar Índice' : 'Adicionar Novo Índice'}</h4>

        <form onSubmit={handleSalvarIndice}>
          <div className={style.grupo}>
            <label htmlFor="prova">Prova (400m)</label>
            <select
              id="prova"
              value={selectedProvaId}
              onChange={(e) => setSelectedProvaId(e.target.value)}
              disabled={loading}
              required
            >
              <option value="">-- Selecione uma prova --</option>
              {provasSemIndice.map((prova) => (
                <option key={prova.id} value={prova.id}>
                  {prova.nome_prova}
                </option>
              ))}
            </select>
          </div>

          <div className={style.grupo}>
            <label htmlFor="tempo">
              Tempo Máximo (MM:SS:CC)
              <span className={style.hint}> (ex: 04:30:00)</span>
            </label>
            <input
              id="tempo"
              type="text"
              value={tempoIndice}
              onChange={(e) => setTempoIndice(validarTempoIndice(e.target.value))}
              placeholder="MM:SS:CC"
              disabled={loading}
              required
              pattern="[0-9]{2}:[0-9]{2}:[0-9]{2}"
              maxLength="8"
            />
          </div>

          <div className={style.grupo}>
            <label htmlFor="descricao">Descrição (opcional)</label>
            <input
              id="descricao"
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Índice 2025 para 400m Livre"
              disabled={loading}
            />
          </div>

          <div className={style.botoes}>
            <Botao
              type="submit"
              disabled={loading}
            >
              {editandoId ? 'Atualizar' : 'Adicionar'}
            </Botao>
            {editandoId && (
              <button
                type="button"
                className={style.btnCancelar}
                onClick={handleCancelar}
                disabled={loading}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Lista de índices configurados */}
      <section className={style.lista}>
        <h4>Índices Configurados</h4>

        {loading && <p className={style.carregando}>Carregando...</p>}

        {!loading && indices.length === 0 && (
          <p className={style.vazio}>Nenhum índice configurado ainda</p>
        )}

        {!loading && indices.length > 0 && (
          <div className={style.tabela}>
            <table>
              <thead>
                <tr>
                  <th>Prova</th>
                  <th>Tempo Máximo</th>
                  <th>Descrição</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {indices.map((indice) => (
                  <tr key={indice.id}>
                    <td>{indice.nome_prova}</td>
                    <td className={style.tempo}>{indice.tempo_indice}</td>
                    <td>{indice.descricao || '-'}</td>
                    <td className={style.acoes}>
                      <button
                        className={style.btnEditar}
                        onClick={() => handleEditar(indice)}
                        disabled={loading}
                        title="Editar"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        className={style.btnRemover}
                        onClick={() => handleRemover(indice.id)}
                        disabled={loading}
                        title="Remover"
                      >
                        🗑️ Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Informação sobre o funcionamento */}
      <section className={style.info}>
        <h4>ℹ️ Como Funciona</h4>
        <ul>
          <li>
            <strong>Tempo Máximo:</strong> Nadadores que terminam acima deste tempo não pontuam na prova
          </li>
          <li>
            <strong>Status:</strong> O índice é aplicado automaticamente ao calcular a pontuação do evento
          </li>
          <li>
            <strong>Exemplo:</strong> Se o índice é 04:30:00, apenas nadadores com tempo ≤ 04:30:00 recebem pontos
          </li>
        </ul>
      </section>
    </div>
  );
};

export default GerenciadorIndices;
