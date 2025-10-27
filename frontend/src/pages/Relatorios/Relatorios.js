import React, { useState, useEffect } from 'react';
import CabecalhoAdmin from '../../componentes/CabecalhoAdmin/CabecalhoAdmin';
import Rodape from '../../componentes/Rodape/Rodape';
import Botao from '../../componentes/Botao/Botao';
import Tabela from '../../componentes/Tabela/Tabela';
import CheckboxGroup from '../../componentes/CheckBoxGroup/CheckBoxGroup';
import api from '../../servicos/api';
import { jwtDecode } from 'jwt-decode';
import { gerarPDFResultadosEquipe, gerarPDFMelhoresTempos, gerarPDFRecordsPorProva } from '../../servicos/relatoriosPDF';
import style from './Relatorios.module.css';
import InputTexto from '../../componentes/InputTexto/InputTexto';

function Relatorios() {
  const [relatorioAtivo, setRelatorioAtivo] = useState(null);
  const [dadosRelatorio, setDadosRelatorio] = useState([]);
  const [estatisticas, setEstatisticas] = useState(null);
  const [melhoresTempos, setMelhoresTempos] = useState([]);
  const [recordsPorProva, setRecordsPorProva] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [eventoSelecionado, setEventoSelecionado] = useState(null);
  const [eventosDisponiveis, setEventosDisponiveis] = useState([]);
  const [provasSelecionadas, setProvasSelecionadas] = useState([]);
  const [provasDisponiveis, setProvasDisponiveis] = useState([]);
  const [sexoSelecionado, setSexoSelecionado] = useState('todos');
  const [nomeEquipe, setNomeEquipe] = useState('');
  const [nadadoresSelecionados, setNadadoresSelecionados] = useState([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [nadadoresSugeridos, setNadadoresSugeridos] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

  // Buscar equipeId do token JWT
  const getEquipeId = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const equipeId = decodedToken.equipeId?.[0]; // Pega o primeiro equipeId do array
        return equipeId;
      } catch (e) {
        console.error('Erro ao decodificar token:', e);
        return null;
      }
    }
    return null;
  };

  const equipeId = getEquipeId();

  // Buscar nome da equipe ao carregar
  useEffect(() => {
    const fetchNomeEquipe = async () => {
      if (!equipeId) return;
      try {
        const response = await api.get(`/equipes/${equipeId}`);
        setNomeEquipe(response.data.nome || 'Equipe');
      } catch (error) {
        console.error('Erro ao buscar nome da equipe:', error);
        setNomeEquipe('Equipe');
      }
    };
    fetchNomeEquipe();
  }, [equipeId]);

  const fetchResultadosEquipe = async () => {
    if (!equipeId) {
      setErro('Não foi possível identificar a equipe. Faça login novamente.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErro(null);
    try {
      const response = await api.get(`/relatorios/resultados-equipe/${equipeId}`);
      setDadosRelatorio(response.data);
      
      // Extrair eventos únicos dos resultados
      const eventos = response.data.map(evento => ({
        id: `${evento.evento}_${evento.data}`,
        nome: evento.evento,
        data: evento.data,
        cidade: evento.cidade,
        sede: evento.sede
      }));
      setEventosDisponiveis(eventos);
      
      // Selecionar o primeiro evento por padrão
      if (eventos.length > 0 && !eventoSelecionado) {
        setEventoSelecionado(eventos[0].id);
      }
    } catch (error) {
      console.error('Erro ao buscar resultados:', error);
      setErro('Erro ao buscar resultados da equipe');
    } finally {
      setLoading(false);
    }
  };

  const fetchEstatisticas = async () => {
    if (!equipeId) return;
    
    try {
      const response = await api.get(`/relatorios/estatisticas-equipe/${equipeId}`);
      setEstatisticas(response.data);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  const fetchMelhoresTempos = async () => {
    if (!equipeId) {
      setErro('Não foi possível identificar a equipe. Faça login novamente.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErro(null);
    try {
      const response = await api.get(`/relatorios/melhores-tempos/${equipeId}`);
      setMelhoresTempos(response.data);
    } catch (error) {
      console.error('Erro ao buscar melhores tempos:', error);
      setErro('Erro ao buscar melhores tempos');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecordsPorProva = async () => {
    if (!equipeId) {
      setErro('Não foi possível identificar a equipe. Faça login novamente.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErro(null);
    try {
      const response = await api.get(`/relatorios/records-por-prova/${equipeId}`);
      setRecordsPorProva(response.data);
      
      // Extrair provas únicas para os filtros
      const provasUnicas = [...new Set(response.data.map(r => r.prova_nome))];
      const provasOpcoes = provasUnicas.map(prova => ({
        id: prova,
        label: prova
      }));
      setProvasDisponiveis(provasOpcoes);
      
      // Selecionar todas as provas por padrão
      setProvasSelecionadas(provasUnicas);
    } catch (error) {
      console.error('Erro ao buscar records por prova:', error);
      setErro('Erro ao buscar records por prova');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (relatorioAtivo === 'resultados' && equipeId) {
      fetchResultadosEquipe();
      fetchEstatisticas();
    } else if (relatorioAtivo === 'melhores-tempos' && equipeId) {
      fetchMelhoresTempos();
    } else if (relatorioAtivo === 'records-prova' && equipeId) {
      fetchRecordsPorProva();
    }
  }, [relatorioAtivo, equipeId]);

  const renderMedalha = (classificacao) => {
    if (classificacao === 1) return <span className={style.medalha}>🥇</span>;
    if (classificacao === 2) return <span className={style.medalha}>🥈</span>;
    if (classificacao === 3) return <span className={style.medalha}>🥉</span>;
    return classificacao;
  };

  const renderDiferencaTempo = (tempo, diferencaCentesimos) => {
    if (!diferencaCentesimos || tempo === 'NC' || tempo === 'DQL') {
      return tempo;
    }

    const diferenca = Math.abs(diferencaCentesimos);
    const minutos = Math.floor(diferenca / 6000);
    const segundos = Math.floor((diferenca % 6000) / 100);
    const centesimos = diferenca % 100;

    const diferencaFormatada = `${diferencaCentesimos < 0 ? '-' : '+'}${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}:${String(centesimos).padStart(2, '0')}`;

    return (
      <>
        {tempo}{' '}
        <span
          className={diferencaCentesimos < 0 ? style.tempoMelhorado : style.tempoPiorado}
          title="Diferença em relação ao tempo de balizamento"
        >
          ({diferencaFormatada})
        </span>
      </>
    );
  };

  // Filtrar dados pelo evento selecionado
  const dadosFiltrados = eventoSelecionado
    ? dadosRelatorio.filter(evento => `${evento.evento}_${evento.data}` === eventoSelecionado)
    : dadosRelatorio;

  // Função para manipular a mudança de provas selecionadas
  const handleProvaChange = (provaId, checked) => {
    if (checked) {
      setProvasSelecionadas([...provasSelecionadas, provaId]);
    } else {
      setProvasSelecionadas(provasSelecionadas.filter(id => id !== provaId));
    }
  };

  // Função para selecionar todas as provas
  const selecionarTodasProvas = () => {
    const todasProvas = provasDisponiveis.map(p => p.id);
    setProvasSelecionadas(todasProvas);
  };

  // Função para limpar todas as provas
  const limparTodasProvas = () => {
    setProvasSelecionadas([]);
  };

  // Filtrar records por provas selecionadas e sexo
  let recordsFiltrados = provasSelecionadas.length > 0
    ? recordsPorProva.filter(record => provasSelecionadas.includes(record.prova_nome))
    : recordsPorProva;

  // Aplicar filtro de sexo
  if (sexoSelecionado !== 'todos') {
    recordsFiltrados = recordsFiltrados.filter(record => record.sexo_prova === sexoSelecionado);
  }

  // Buscar nadadores enquanto digita
  useEffect(() => {
    const buscarNadadores = async () => {
      if (termoBusca.trim().length < 2) {
        setNadadoresSugeridos([]);
        return;
      }

      try {
        const response = await api.get(`/relatorios/buscar-nadadores/${equipeId}`, {
          params: { termo: termoBusca }
        });
        setNadadoresSugeridos(response.data);
        setMostrarSugestoes(true);
      } catch (error) {
        console.error('Erro ao buscar nadadores:', error);
      }
    };

    const timer = setTimeout(buscarNadadores, 300); // Debounce de 300ms
    return () => clearTimeout(timer);
  }, [termoBusca, equipeId]);

  // Adicionar nadador selecionado
  const adicionarNadador = (nadador) => {
    if (!nadadoresSelecionados.find(n => n.id === nadador.id)) {
      setNadadoresSelecionados([...nadadoresSelecionados, nadador]);
    }
    setTermoBusca('');
    setNadadoresSugeridos([]);
    setMostrarSugestoes(false);
  };

  // Remover nadador selecionado
  const removerNadador = (nadadorId) => {
    setNadadoresSelecionados(nadadoresSelecionados.filter(n => n.id !== nadadorId));
  };

  // Filtrar melhores tempos pelos nadadores selecionados
  const melhoresTemposFiltrados = nadadoresSelecionados.length > 0
    ? melhoresTempos.filter(tempo => 
        nadadoresSelecionados.some(n => n.nome === tempo.nadador_nome)
      )
    : melhoresTempos;

  const renderRelatorioResultados = () => (
    <div className={style.relatorioConteudo}>
      <h2>Relatório de Resultados da Equipe</h2>
      
      {estatisticas && (
        <div className={style.estatisticasCard}>
          <h3>Resumo Geral</h3>
          <div className={style.estatisticasGrid}>
            <div className={style.estatItem}>
              <span className={style.estatLabel}>Total de Nadadores:</span>
              <span className={style.estatValor}>{estatisticas.total_nadadores}</span>
            </div>
            <div className={style.estatItem}>
              <span className={style.estatLabel}>Total de Provas:</span>
              <span className={style.estatValor}>{estatisticas.total_provas}</span>
            </div>
            <div className={style.estatItem}>
              <span className={style.estatLabel}>🥇 Ouro:</span>
              <span className={style.estatValor}>{estatisticas.total_ouro}</span>
            </div>
            <div className={style.estatItem}>
              <span className={style.estatLabel}>🥈 Prata:</span>
              <span className={style.estatValor}>{estatisticas.total_prata}</span>
            </div>
            <div className={style.estatItem}>
              <span className={style.estatLabel}>🥉 Bronze:</span>
              <span className={style.estatValor}>{estatisticas.total_bronze}</span>
            </div>
            <div className={style.estatItem}>
              <span className={style.estatLabel}>Pontos Individuais:</span>
              <span className={style.estatValor}>{estatisticas.total_pontos_individuais || 0}</span>
            </div>
            <div className={style.estatItem}>
              <span className={style.estatLabel}>Pontos Equipe:</span>
              <span className={style.estatValor}>{estatisticas.total_pontos_equipe || 0}</span>
            </div>
          </div>
        </div>
      )}

      {eventosDisponiveis.length > 0 && (
        <div className={style.seletorEventos}>
          <h3>Selecione o Evento:</h3>
          <div className={style.botoesEventos}>
            {eventosDisponiveis.map(evento => (
              <Botao
                key={evento.id}
                onClick={() => setEventoSelecionado(evento.id)}
                className={eventoSelecionado === evento.id ? style.ativo : ''}
              >
                {evento.nome} - {new Date(evento.data).toLocaleDateString('pt-BR')}
              </Botao>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <p>Carregando dados...</p>
      ) : erro ? (
        <p className={style.erro}>{erro}</p>
      ) : dadosFiltrados.length === 0 ? (
        <p>Nenhum resultado encontrado para esta equipe.</p>
      ) : (
        <>
          {dadosFiltrados.map((evento, index) => (
            <div key={index} className={style.eventoSection}>
              <h3 className={style.eventoTitulo}>
                {evento.evento} - {new Date(evento.data).toLocaleDateString('pt-BR')}
              </h3>
              <p className={style.eventoInfo}>
                {evento.cidade} - {evento.sede}
              </p>
              
              <Tabela
                dados={evento.provas.map(prova => ({
                  Prova: prova.prova,
                  Nadador: prova.nadador,
                  Categoria: prova.categoria || '-',
                  Tempo: renderDiferencaTempo(prova.tempo, prova.diferenca_centesimos),
                  Classificacao: renderMedalha(prova.classificacao)
                }))}
                textoExibicao={{
                  Prova: 'Prova',
                  Nadador: 'Nadador',
                  Categoria: 'Categoria',
                  Tempo: 'Tempo',
                  Classificacao: 'Classificação'
                }}
                colunasOcultas={[]}
              />
            </div>
          ))}
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Botao onClick={() => {
              const eventoSelecionadoObj = eventosDisponiveis.find(e => e.id === eventoSelecionado);
              const provasDoEvento = dadosFiltrados[0]?.provas || [];
              gerarPDFResultadosEquipe(eventoSelecionadoObj, provasDoEvento, estatisticas, nomeEquipe);
            }}>
              Baixar Relatório em PDF
            </Botao>
          </div>
        </>
      )}
    </div>
  );

  const renderRelatorioDesempenho = () => (
    <div className={style.relatorioConteudo}>
      <h2>Melhores Tempos por Nadador</h2>
      
      {/* Campo de busca de nadadores */}
      <div className={style.buscaNadadorContainer}>
        <h3>Filtrar por Nadador:</h3>
        <div className={style.inputBuscaWrapper}>
          <InputTexto
            id="busca-nadador"
            label=""
            placeholder="Digite o nome do nadador..."
            valor={termoBusca}
            aoAlterar={(valor) => setTermoBusca(valor)}
            obrigatorio={false}
          />
          
          {/* Lista de sugestões */}
          {mostrarSugestoes && nadadoresSugeridos.length > 0 && (
            <div className={style.sugestoesContainer}>
              {nadadoresSugeridos.map(nadador => (
                <div
                  key={nadador.id}
                  className={style.sugestaoItem}
                  onClick={() => adicionarNadador(nadador)}
                >
                  {nadador.nome}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nadadores selecionados */}
        {nadadoresSelecionados.length > 0 && (
          <div className={style.nadadoresSelecionadosContainer}>
            <h4>Nadadores selecionados:</h4>
            <div className={style.nadadoresSelecionados}>
              {nadadoresSelecionados.map(nadador => (
                <div key={nadador.id} className={style.nadadorChip}>
                  <span>{nadador.nome}</span>
                  <button
                    onClick={() => removerNadador(nadador.id)}
                    className={style.removerNadador}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {loading ? (
        <p>Carregando dados...</p>
      ) : erro ? (
        <p className={style.erro}>{erro}</p>
      ) : melhoresTemposFiltrados.length === 0 ? (
        <p>Nenhum tempo encontrado{nadadoresSelecionados.length > 0 ? ' para os nadadores selecionados' : ''}.</p>
      ) : (
        <>
          <Tabela
            dados={melhoresTemposFiltrados.map(tempo => ({
              Nadador: tempo.nadador_nome,
              Categoria: tempo.categoria_nome,
              Prova: tempo.prova_nome,
              Melhor_Tempo: tempo.melhor_tempo,
              Evento: tempo.evento_nome,
              Data: new Date(tempo.evento_data).toLocaleDateString('pt-BR')
            }))}
            textoExibicao={{
              Nadador: 'Nadador',
              Categoria: 'Categoria',
              Prova: 'Prova',
              Melhor_Tempo: 'Melhor Tempo',
              Evento: 'Evento',
              Data: 'Data'
            }}
            colunasOcultas={[]}
          />
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Botao onClick={() => gerarPDFMelhoresTempos(melhoresTemposFiltrados, nomeEquipe)}>
              Baixar Relatório em PDF
            </Botao>
          </div>
        </>
      )}
    </div>
  );

  const renderRecordsPorProva = () => (
    <div className={style.relatorioConteudo}>
      <h2>Melhores Tempos por Prova</h2>
      
      {provasDisponiveis.length > 0 && (
        <div className={style.filtrosContainer}>
          <div className={style.filtrosHeader}>
            <h3>Filtros:</h3>
            <div className={style.botoesAcao}>
              <button onClick={selecionarTodasProvas} className={style.btnSelecionar}>
                Aplicar Todos os Filtros
              </button>
              <button onClick={limparTodasProvas} className={style.btnLimpar}>
                Limpar Todos os Filtros
              </button>
            </div>
          </div>

          <div className={style.filtroSexo}>
            <label className={style.filtroSexoLabel}>Sexo:</label>
            <div className={style.filtroSexoOpcoes}>
              <label className={style.radioLabel}>
                <input
                  type="radio"
                  value="todos"
                  checked={sexoSelecionado === 'todos'}
                  onChange={(e) => setSexoSelecionado(e.target.value)}
                />
                Todos
              </label>
              <label className={style.radioLabel}>
                <input
                  type="radio"
                  value="M"
                  checked={sexoSelecionado === 'M'}
                  onChange={(e) => setSexoSelecionado(e.target.value)}
                />
                Masculino
              </label>
              <label className={style.radioLabel}>
                <input
                  type="radio"
                  value="F"
                  checked={sexoSelecionado === 'F'}
                  onChange={(e) => setSexoSelecionado(e.target.value)}
                />
                Feminino
              </label>
            </div>
          </div>

          <div className={style.filtroProvas}>
            <h3>Provas:</h3>
            <div className={style.filtroProvasBotoes}>
              <button onClick={selecionarTodasProvas} className={style.btnSelecionarProvas}>
                Selecionar Todas
              </button>
              <button onClick={limparTodasProvas} className={style.btnLimparProvas}>
                Limpar Todas
              </button>
            </div>
            <CheckboxGroup
              titulo=""
              opcoes={provasDisponiveis}
              selecionadas={provasSelecionadas}
              aoAlterar={handleProvaChange}
              useGrid={true}
            />
          </div>
        </div>
      )}
      
      {loading ? (
        <p>Carregando dados...</p>
      ) : erro ? (
        <p className={style.erro}>{erro}</p>
      ) : recordsFiltrados.length === 0 ? (
        <p>Nenhum record encontrado para os filtros selecionados.</p>
      ) : (
        <>
          <Tabela
            dados={recordsFiltrados.map(record => ({
              Prova: record.prova_nome,
              Sexo: record.sexo_prova === 'M' ? 'Masculino' : 'Feminino',
              Nadador: record.nadador_nome,
              Categoria: record.categoria_nome,
              Tempo: record.tempo_record,
              Evento: record.evento_nome,
              Data: new Date(record.evento_data).toLocaleDateString('pt-BR')
            }))}
            textoExibicao={{
              Prova: 'Prova',
              Sexo: 'Sexo',
              Nadador: 'Nadador',
              Categoria: 'Categoria',
              Tempo: 'Tempo',
              Evento: 'Evento',
              Data: 'Data'
            }}
            colunasOcultas={[]}
          />
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Botao onClick={() => gerarPDFRecordsPorProva(
              recordsFiltrados, 
              nomeEquipe,
              { sexo: sexoSelecionado, provas: provasSelecionadas }
            )}>
              Baixar Relatório em PDF
            </Botao>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className={style.relatoriosContainer}>
      <CabecalhoAdmin />
      
      <main className={style.relatoriosContent}>
        <h1>Relatórios Gerenciais</h1>
        
        {!equipeId && (
          <div className={style.erro}>
            <p>⚠️ Não foi possível identificar sua equipe. Por favor, faça login novamente.</p>
          </div>
        )}
        
        <div className={style.relatoriosBotoes}>
          <Botao
            onClick={() => setRelatorioAtivo('resultados')}
            className={relatorioAtivo === 'resultados' ? style.ativo : ''}
          >
            Resultados da Equipe
          </Botao>
          <Botao
            onClick={() => setRelatorioAtivo('melhores-tempos')}
            className={relatorioAtivo === 'melhores-tempos' ? style.ativo : ''}
          >
            Melhores Tempos por Nadador
          </Botao>
          <Botao
            onClick={() => setRelatorioAtivo('records-prova')}
            className={relatorioAtivo === 'records-prova' ? style.ativo : ''}
          >
            Melhores Tempos por Prova
          </Botao>
        </div>

        <div className={style.relatoriosArea}>
          {relatorioAtivo === null && (
            <p className={style.relatoriosPlaceholder}>
              Selecione um tipo de relatório acima
            </p>
          )}
          
          {relatorioAtivo === 'resultados' && renderRelatorioResultados()}
          {relatorioAtivo === 'melhores-tempos' && renderRelatorioDesempenho()}
          {relatorioAtivo === 'records-prova' && renderRecordsPorProva()}
        </div>
      </main>

      <Rodape />
    </div>
  );
}

export default Relatorios;
