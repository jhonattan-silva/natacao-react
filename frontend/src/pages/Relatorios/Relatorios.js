import React, { useState, useEffect } from 'react';
import CabecalhoAdmin from '../../componentes/CabecalhoAdmin/CabecalhoAdmin';
import Rodape from '../../componentes/Rodape/Rodape';
import Botao from '../../componentes/Botao/Botao';
import Tabela from '../../componentes/Tabela/Tabela';
import CheckboxGroup from '../../componentes/CheckBoxGroup/CheckBoxGroup';
import api from '../../servicos/api';
import { jwtDecode } from 'jwt-decode';
import { gerarPDFResultadosEquipe, gerarPDFMelhoresTempos, gerarPDFRecordsPorProva } from '../../servicos/relatoriosPDF';
import { gerarPDFPosProvaEquipe } from '../../servicos/relatoriosPosProvaPDF';
import style from './Relatorios.module.css';
import InputTexto from '../../componentes/InputTexto/InputTexto';
import ListaSuspensa from '../../componentes/ListaSuspensa/ListaSuspensa';

function Relatorios() {
  const [relatorioAtivo, setRelatorioAtivo] = useState(null);
  const [dadosRelatorio, setDadosRelatorio] = useState([]);
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
  const [anoTemporadaAtual, setAnoTemporadaAtual] = useState('');
  const [temporadasDisponiveis, setTemporadasDisponiveis] = useState([]);
  const [anoSelecionado, setAnoSelecionado] = useState('');
  const [nadadoresSelecionados, setNadadoresSelecionados] = useState([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [nadadoresSugeridos, setNadadoresSugeridos] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [eventosPosProva, setEventosPosProva] = useState([]);
  const [eventoPosProvaSelecionado, setEventoPosProvaSelecionado] = useState('');
  const [baixandoPosProva, setBaixandoPosProva] = useState(false);

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

  useEffect(() => {
    const fetchTemporadas = async () => {
      try {
        const [resAberto, resTorneios] = await Promise.all([
          api.get('/etapas/torneioAberto'),
          api.get('/etapas/listarTorneios')
        ]);

        const anoAtual = String(resAberto?.data?.nome || '');
        if (anoAtual) setAnoTemporadaAtual(anoAtual);

        const temporadas = (resTorneios?.data || [])
          .map((torneio) => ({ id: String(torneio.nome), nome: `Temporada ${torneio.nome}` }))
          .sort((a, b) => Number(b.id) - Number(a.id));

        setTemporadasDisponiveis(temporadas);

        if (anoAtual) {
          setAnoSelecionado(anoAtual);
        } else if (temporadas.length > 0) {
          setAnoSelecionado(temporadas[0].id);
        }
      } catch (error) {
        console.error('Erro ao buscar temporada atual:', error);
      }
    };

    fetchTemporadas();
  }, []);

  // Carregar eventos disponíveis para relatório Pós-Prova
  useEffect(() => {
    const fetchEventosPosProva = async () => {
      if (!equipeId || !anoSelecionado || relatorioAtivo !== 'pos-prova') return;

      try {
        setLoading(true);
        setErro(null);
        const response = await api.get(`/relatorios/pos-prova/eventos/${equipeId}`, {
          params: { ano: anoSelecionado }
        });

        const opcoes = (response.data?.eventos || []).map((evento) => ({
          id: evento.id,
          nome: evento.nome
        }));

        setEventosPosProva(opcoes);
        setEventoPosProvaSelecionado('');
      } catch (error) {
        console.error('Erro ao carregar eventos pós-prova:', error);
        setErro('Não foi possível carregar os eventos do relatório pós-prova.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventosPosProva();
  }, [equipeId, anoSelecionado, relatorioAtivo]);

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
  const eventosDisponiveisFiltrados = anoSelecionado
    ? eventosDisponiveis.filter(evento => {
        const anoEvento = new Date(evento.data).getFullYear();
        return String(anoEvento) === String(anoSelecionado);
      })
    : eventosDisponiveis;

  const dadosRelatorioFiltradosAno = anoSelecionado
    ? dadosRelatorio.filter(evento => {
        const anoEvento = new Date(evento.data).getFullYear();
        return String(anoEvento) === String(anoSelecionado);
      })
    : dadosRelatorio;

  const dadosFiltrados = eventoSelecionado
    ? dadosRelatorioFiltradosAno.filter(evento => `${evento.evento}_${evento.data}` === eventoSelecionado)
    : dadosRelatorioFiltradosAno;

  useEffect(() => {
    if (eventosDisponiveisFiltrados.length === 0) {
      setEventoSelecionado(null);
      return;
    }

    const eventoAtualExiste = eventosDisponiveisFiltrados.some(evento => evento.id === eventoSelecionado);
    if (!eventoAtualExiste) {
      setEventoSelecionado(eventosDisponiveisFiltrados[0].id);
    }
  }, [anoSelecionado, eventosDisponiveisFiltrados, eventoSelecionado]);

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
  const tempoParaCentesimos = (tempo) => {
    if (!tempo || typeof tempo !== 'string') return null;
    const [min, seg, cen] = tempo.split(':').map(Number);
    if ([min, seg, cen].some(Number.isNaN)) return null;
    return (min * 6000) + (seg * 100) + cen;
  };

  const formatarDiferencaTempo = (diferencaCentesimos) => {
    if (diferencaCentesimos === null || diferencaCentesimos === undefined) return '-';

    const sinal = diferencaCentesimos > 0 ? '+' : diferencaCentesimos < 0 ? '-' : '±';
    const valor = Math.abs(diferencaCentesimos);
    const minutos = Math.floor(valor / 6000);
    const segundos = Math.floor((valor % 6000) / 100);
    const centesimos = valor % 100;

    return `${sinal}${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}:${String(centesimos).padStart(2, '0')}`;
  };

  const renderDiferencaParaMelhor = (diferencaTexto, diferencaCentesimos) => {
    if (diferencaTexto === '-' || diferencaCentesimos === null || diferencaCentesimos === undefined) {
      return '-';
    }

    const classe = diferencaCentesimos <= 0 ? style.tempoMelhorado : style.tempoPiorado;
    return <span className={classe}>{diferencaTexto}</span>;
  };

  const melhoresTemposComDiferenca = melhoresTempos.map((tempo) => {
    const tempoAtual = Number.isFinite(Number(tempo.melhor_tempo_centesimos))
      ? Number(tempo.melhor_tempo_centesimos)
      : tempoParaCentesimos(tempo.melhor_tempo);
    
    const melhorGlobal = Number.isFinite(Number(tempo.melhor_tempo_global_centesimos))
      ? Number(tempo.melhor_tempo_global_centesimos)
      : null;
    
    const diferenca = (tempoAtual !== null && melhorGlobal !== null)
      ? tempoAtual - melhorGlobal
      : null;

    return {
      ...tempo,
      diferenca_centesimos_para_melhor: diferenca,
      diferenca_para_melhor: formatarDiferencaTempo(diferenca)
    };
  });

  const melhoresTemposFiltrados = nadadoresSelecionados.length > 0
    ? melhoresTemposComDiferenca.filter(tempo => 
        nadadoresSelecionados.some(n => n.nome === tempo.nadador_nome)
      )
    : melhoresTemposComDiferenca;

  const renderRelatorioResultados = () => (
    <div className={style.relatorioConteudo}>
      <h2>Relatório de Resultados da Equipe</h2>

      {eventosDisponiveisFiltrados.length > 0 && (
        <div className={style.seletorEventos}>
          <h3>Selecione o Evento:</h3>
          <div className={style.botoesEventos}>
            {eventosDisponiveisFiltrados.map(evento => (
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
              gerarPDFResultadosEquipe(eventoSelecionadoObj, provasDoEvento, null, nomeEquipe);
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
            dados={(() => {
              // Cria mapa de nadador -> índice único
              const nadoresUnicos = [];
              const mapaIndiceNadador = new Map();
              
              melhoresTemposFiltrados.forEach((tempo) => {
                if (!mapaIndiceNadador.has(tempo.nadador_nome)) {
                  mapaIndiceNadador.set(tempo.nadador_nome, nadoresUnicos.length);
                  nadoresUnicos.push(tempo.nadador_nome);
                }
              });
              
              return melhoresTemposFiltrados.map((tempo) => {
                const indiceNadador = mapaIndiceNadador.get(tempo.nadador_nome);
                
                return {
                  _rowClassName: indiceNadador % 2 === 0 ? style.linhaGrupoA : style.linhaGrupoB,
                  Nadador: tempo.nadador_nome,
                  Categoria: tempo.categoria_nome,
                  Prova: tempo.prova_nome,
                  Melhor_Tempo: tempo.melhor_tempo,
                  Dif_Para_Melhor: renderDiferencaParaMelhor(
                    tempo.diferenca_para_melhor,
                    tempo.diferenca_centesimos_para_melhor
                  ),
                  Evento: tempo.evento_nome,
                  Data: new Date(tempo.evento_data).toLocaleDateString('pt-BR')
                };
              });
            })()}
            textoExibicao={{
              Nadador: 'Nadador',
              Categoria: 'Categoria',
              Prova: 'Prova',
              Melhor_Tempo: 'Melhor Tempo',
              Dif_Para_Melhor: 'Dif. p/ Melhor da Prova',
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

  const renderRelatorioPosProva = () => {
    const handleBaixarPosProva = async () => {
      if (!equipeId || !eventoPosProvaSelecionado) return;

      try {
        setBaixandoPosProva(true);
        setErro(null);
        const response = await api.get(`/relatorios/pos-prova/arquivo/${equipeId}`, {
          params: { eventoId: eventoPosProvaSelecionado }
        });
        gerarPDFPosProvaEquipe(response.data);
      } catch (error) {
        console.error('Erro ao gerar relatório pós-prova:', error);
        setErro('Erro ao gerar/baixar relatório pós-prova.');
      } finally {
        setBaixandoPosProva(false);
      }
    };

    return (
      <div className={style.relatorioConteudo}>
        <h2>Relatório Pós-Prova (Técnicos)</h2>
        <p className={style.descricao}>
          Selecione o evento e baixe o PDF com tempos da equipe de todas as provas e comparativos técnicos.
        </p>

        {loading ? (
          <p>Carregando eventos...</p>
        ) : erro ? (
          <p className={style.erro}>{erro}</p>
        ) : (
          <div className={style.formArea}>
            <ListaSuspensa
              opcoes={eventosPosProva}
              onChange={setEventoPosProvaSelecionado}
              textoPlaceholder="Selecione um evento"
              valorSelecionado={eventoPosProvaSelecionado}
            />
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Botao 
                onClick={handleBaixarPosProva} 
                disabled={!eventoPosProvaSelecionado || baixandoPosProva}
              >
                {baixandoPosProva ? '⏳ Gerando PDF...' : '📥 Baixar Relatório'}
              </Botao>
            </div>
          </div>
        )}
      </div>
    );
  };

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
          <Botao
            onClick={() => setRelatorioAtivo('pos-prova')}
            className={relatorioAtivo === 'pos-prova' ? style.ativo : ''}
          >
            Relatório Pós-Prova (Técnicos)
          </Botao>
        </div>

        {relatorioAtivo && (
          <div className={style.seletorTemporadaGlobal}>
            <h3>Temporada:</h3>
            <ListaSuspensa
              opcoes={temporadasDisponiveis}
              onChange={setAnoSelecionado}
              textoPlaceholder="Selecione a temporada"
              valorSelecionado={anoSelecionado}
            />
          </div>
        )}

        <div className={style.relatoriosArea}>
          {relatorioAtivo === null && (
            <p className={style.relatoriosPlaceholder}>
              Selecione um tipo de relatório acima
            </p>
          )}
          
          {relatorioAtivo === 'resultados' && renderRelatorioResultados()}
          {relatorioAtivo === 'melhores-tempos' && renderRelatorioDesempenho()}
          {relatorioAtivo === 'records-prova' && renderRecordsPorProva()}
          {relatorioAtivo === 'pos-prova' && renderRelatorioPosProva()}
        </div>
      </main>

      <Rodape />
    </div>
  );
}

export default Relatorios;
