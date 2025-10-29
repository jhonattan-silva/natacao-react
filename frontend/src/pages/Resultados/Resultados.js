import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../servicos/api';
import style from './Resultados.module.css';
import Tabela from '../../componentes/Tabela/Tabela';
import Cabecalho from '../../componentes/Cabecalho/Cabecalho';
import Rodape from '../../componentes/Rodape/Rodape';
import Abas from '../../componentes/Abas/Abas';
import Card from '../../componentes/Card/Card';
import Botao from '../../componentes/Botao/Botao';
import { formataData } from '../../servicos/functions';

const Resultados = () => {
  const { eventoId } = useParams();
  const navigate = useNavigate();
  const [dados, setDados] = useState([]);
  const [classificacao, setClassificacao] = useState({});
  const [absoluto, setAbsoluto] = useState({});
  const [resultadosBanco, setResultadosBanco] = useState([]);
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eventosComResultados, setEventosComResultados] = useState([]);
  const [pontuacaoEtapa, setPontuacaoEtapa] = useState([]);
  const [eventoFinalizado, setEventoFinalizado] = useState(null);
  const [pontuacaoMirim, setPontuacaoMirim] = useState([]);

  const apiClassificacao = '/resultados/resultadosPorCategoria';
  const apiAbsoluto = '/resultados/resultadosAbsoluto';
  const apiResultadosBanco = '/resultados/listarDoBanco';
  const apiEventosComResultados = '/resultados/listarEventosComResultados';
  const apiRankingEquipesPorEvento = '/rankings/ranking-equipes-por-evento';
  const apiRankingEquipesMirim = '/rankings/ranking-mirim';
  const apiBuscaResultadosCompleto = '/resultados/buscaResultadosCompleto';
  const apiStatusEvento = '/resultados/statusEvento';

  const agruparPorProvaEBateria = (dados) => {
    // Agrupa por prova
    const provas = {};
    dados.forEach(row => {
      if (!provas[row.eventos_provas_id]) {
        provas[row.eventos_provas_id] = {
          nome: row.nome_prova,
          ordem: row.ordem,
          revezamento: !!row.eh_revezamento,
          baterias: {}
        };
      }
      // Agrupa por bateria
      if (!provas[row.eventos_provas_id].baterias[row.bateria_id]) {
        provas[row.eventos_provas_id].baterias[row.bateria_id] = {
          numeroBateria: row.numero_bateria,
          nadadores: []
        };
      }
      provas[row.eventos_provas_id].baterias[row.bateria_id].nadadores.push(row);
    });
    // Transforma em array para renderizar
    return Object.values(provas)
      .sort((a, b) => a.ordem - b.ordem) // <-- garante a ordem correta das provas!
      .map(prova => ({
        ...prova,
        baterias: Object.values(prova.baterias)
      }));
  };

  // Agrupa por nome da prova E sexo (para evitar sobrescrever masculino/feminino)
  const provasAgrupadas = {};

  Object.entries(classificacao).forEach(([chave, atletas]) => {
    // Extrai nome da prova e sexo
    let nomeProva = chave;
    let categoria = '';
    let sexo = '';
    const match = chave.match(/^(.*) - (.*) \((M|F)\)$/);
    if (match) {
      nomeProva = match[1].trim();
      categoria = match[2].trim();
      sexo = match[3] === 'M' ? 'Masculino' : 'Feminino';
    }
    // Chave composta para evitar sobrescrever masculino/feminino
    const chaveAgrupada = `${nomeProva} (${sexo})`;
    if (!provasAgrupadas[chaveAgrupada]) provasAgrupadas[chaveAgrupada] = { nomeProva, sexo, categorias: [] };
    provasAgrupadas[chaveAgrupada].categorias.push({ categoria, atletas });
  });

  const fetchResultadosEClassificacao = async () => {
    try {
      const [resultadosResponse, classificacaoResponse, absolutoResponse] = await Promise.all([
        //api.get(`${apiResultados}/${eventoId}`),
        api.get(`${apiBuscaResultadosCompleto}/${eventoId}`),
        api.get(`${apiClassificacao}/${eventoId}`),
        api.get(`${apiAbsoluto}/${eventoId}`)
      ]);

      setDados(resultadosResponse.data || []);
      setClassificacao(classificacaoResponse.data || {});
      setAbsoluto(absolutoResponse.data || {});
      setErro(null);
    } catch (err) {
      console.error("Erro ao buscar dados:", err.message);
      setErro("Erro ao buscar dados");
    } finally {
      setLoading(false);
    }
  };

  const fetchResultadosBanco = async () => {
    try {
      const response = await api.get(`${apiResultadosBanco}/${eventoId}`);
      setResultadosBanco(response.data || []);
    } catch (err) {
      console.error("Erro ao buscar resultados do banco:", err.message);
      setErro("Erro ao buscar resultados do banco");
    }
  };

  const fetchEventosComResultados = async () => {
    try {
      const response = await api.get(apiEventosComResultados);
      setEventosComResultados(response.data || []);
    } catch (err) {
      console.error("Erro ao buscar eventos com resultados:", err.message);
      setErro("Erro ao buscar eventos com resultados");
    } finally {
      setLoading(false);
    }
  };

  const fetchPontuacaoEtapa = async (eventoId) => {
    try {
      const response = await api.get(`${apiRankingEquipesPorEvento}/${eventoId}`);
      setPontuacaoEtapa(response.data || []);
    } catch (err) {
      console.error("Erro ao buscar pontuação da etapa:", err.message);
      setErro("Erro ao buscar pontuação da etapa");
    }
  };

  const fetchPontuacaoMirim = async (eventoId) => {
    try {
      const response = await api.get(`${apiRankingEquipesMirim}/${eventoId}`);
      setPontuacaoMirim(response.data || []);
      
      // Log adicional para verificar se há dados
      if (!response.data || response.data.length === 0) {
        console.warn('⚠️ Nenhum dado de ranking mirim retornado');
      }
    } catch (err) {
      console.error('❌ Erro ao buscar ranking mirim:', err);
      console.error('Detalhes do erro:', err.response?.data);
      setErro('Erro ao buscar ranking mirim');
    }
  };

  const fetchResultadosCompleto = async () => {
    try {
      const response = await api.get(`${apiBuscaResultadosCompleto}/${eventoId}`);
      setDados(response.data || []);
      setErro(null);
    } catch (err) {
      setErro("Erro ao buscar resultados completos");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusEvento = async () => {
    try {
      const response = await api.get(`${apiStatusEvento}/${eventoId}`);
      setEventoFinalizado(response.data.classificacao_finalizada === 1);
    } catch {
      setEventoFinalizado(null);
    }
  };

  useEffect(() => {
    if (eventoId) {
      setLoading(true);
      fetchResultadosEClassificacao();
      fetchResultadosCompleto(); // nova forma de buscar resultados
      fetchResultadosBanco();
      fetchPontuacaoEtapa(eventoId);
      fetchPontuacaoMirim(eventoId);
      fetchStatusEvento(); // verifica se o evento ainda aguarda resultados
    } else {
      setLoading(true);
      fetchEventosComResultados();
    }
  }, [eventoId]);

  const aoClicarNoCard = (id) => {
    navigate(`/resultados/${id}`);
  };

  const renderMedalha = (classificacao, ehProvaCategoria) => {
    if (!ehProvaCategoria) return classificacao;
    if (classificacao === 1) {
      return <span className={style.medalha}>🥇</span>;
    } else if (classificacao === 2) {
      return <span className={style.medalha}>🥈</span>;
    } else if (classificacao === 3) {
      return <span className={style.medalha}>🥉</span>;
    }
    return classificacao;
  };

  const renderDiferencaTempo = (tempoRealizado, diferencaCentesimos) => {
    if (!diferencaCentesimos || tempoRealizado === 'NC' || tempoRealizado === 'DQL') {
      return tempoRealizado;
    }

    const diferenca = Math.abs(diferencaCentesimos);
    const minutos = Math.floor(diferenca / 6000);
    const segundos = Math.floor((diferenca % 6000) / 100);
    const centesimos = diferenca % 100;

    const diferencaFormatada = `${diferencaCentesimos < 0 ? '-' : '+'}${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}:${String(centesimos).padStart(2, '0')}`;

    return (
      <>
        {tempoRealizado}{' '}
        <span
          className={diferencaCentesimos < 0 ? style.tempoMelhorado : style.tempoPiorado}
          title="Diferença em relação ao tempo de balizamento"
        >
          ({diferencaFormatada})
        </span>
      </>
    );
  };

  return (
    <>
      <Cabecalho />
      <div className={style.resultadosContainer}>
        <h1 className={style.titulo}>Resultados</h1>
        {loading ? (
          <p className={style.loadingMessage}>Aguarde um momento, carregando...</p>
        ) : (
          <>
            {erro && <div>{erro}</div>}
            {eventoId ? (
              <>
                {dados.length > 0 ? (
                  <Abas
                    tabs={[
                      {
                        label: 'Resultados pelo Balizamento',
                  content: (
                <div className={style.resultadosContainer}>
                  {eventoFinalizado === false && (
                    <h2 className={style.eventoAndamento}>
                      EVENTO EM ANDAMENTO - ATUALIZE A PÁGINA APÓS CADA PROVA
                    </h2>
                  )}
                  {agruparPorProvaEBateria(dados).map(prova => (
                    <div key={prova.nome}>
                      <h2 className={style.titulo}>
                        {prova.nome.replace('(M)', 'MASCULINO').replace('(F)', 'FEMININO')}
                      </h2>
                      {prova.baterias.map(bateria => (
                        <div key={bateria.numeroBateria}>
                          <h3 className={style.titulo}>{bateria.numeroBateria}</h3>
                          <div className={`${style.tabelaPersonalizada} ${style.tabelaResultadosBalizamento}`}>
                            <Tabela
                              dados={bateria.nadadores.map(nadador => {
                                const tempo = renderDiferencaTempo(nadador.tempo, nadador.diferenca_centesimos);
                                return prova.revezamento
                                  ? { Raia: nadador.raia, Equipe: nadador.nome_equipe, Tempo: tempo }
                                  : { 
                                      Raia: nadador.raia, 
                                      Nome: nadador.nome_nadador, 
                                      Tempo: tempo, 
                                      Equipe: nadador.nome_equipe, 
                                      Categoria: nadador.categoria_nadador 
                                    };
                              })}
                              textoExibicao={prova.revezamento
                                ? { Raia: 'Raia', Equipe: 'Equipe', Tempo: 'Tempo' }
                                : { Raia: 'Raia', Nome: 'Nadador', Tempo: 'Tempo', Equipe: 'Equipe', Categoria: 'Categoria' }
                              }
                              colunasOcultas={[]}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                ),
                      },
                {
                  label: 'Classificação por Categoria',
                content: (
                <div className={style.resultadosContainer}>
                  {eventoFinalizado === false && (
                    <h2 className={style.eventoAndamento}>
                      EVENTO EM ANDAMENTO - ATUALIZE A PÁGINA APÓS CADA PROVA
                    </h2>
                  )}
                  {Object.entries(provasAgrupadas)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([chaveAgrupada, { nomeProva, sexo, categorias }]) => (
                      <div key={chaveAgrupada}>
                        <h2 className={style.titulo}>
                          {nomeProva} <span>({sexo})</span>
                        </h2>
                        {categorias.map(({ categoria, atletas }) => {
                          // Recalcula classificação dentro da categoria
                          const atletasOrdenados = [...atletas].sort((a, b) => {
                            // Prioriza status OK, depois tempo
                            if (a.status !== b.status) {
                              if (a.status === 'OK') return -1;
                              if (b.status === 'OK') return 1;
                              return a.status.localeCompare(b.status);
                            }
                            if (a.status === 'OK' && b.status === 'OK') {
                              // Ordena por tempo
                              if (a.tempo && b.tempo) {
                                return a.tempo.localeCompare(b.tempo);
                              }
                            }
                            return 0;
                          });
                          let posicao = 1;
                          // Calcula classificação dentro da categoria (posição por tempo/status)
                          let posicaoCategoria = 1;
                          const atletasComClassificacao = atletasOrdenados.map(atleta => {
                            let classificacao_categoria = null;
                            if (atleta.status === 'OK' && atleta.tempo && atleta.tempo !== 'NC' && atleta.tempo !== 'DQL') {
                              classificacao_categoria = posicaoCategoria++;
                            } else if (atleta.status === 'NC' || atleta.status === 'DQL') {
                              classificacao_categoria = atleta.status;
                            }
                            return {
                              ...atleta,
                              classificacao_categoria
                            };
                          });
                          return (
                            <div key={categoria}>
                              <h3 className={style.tituloCategoria}>{categoria}</h3>
                              <div className={style.classificacaoTabela}>
                                <Tabela
                                  className={style.tabelaClassificacaoCategoria}
                                  dados={atletasComClassificacao.map(atleta => ({
                                    Classificação: renderMedalha(atleta.classificacao_categoria, atleta.eh_prova_categoria),
                                    'Classificação Absoluto': atleta.classificacao,
                                    Nome: atleta.nomeNadador,
                                    Tempo: atleta.tempo || '-',
                                    Equipe: atleta.nomeEquipe,
                                    Categoria: atleta.categoria,
                                    Pontuação: atleta.pontuacao_individual != null ? atleta.pontuacao_individual : 0,
                                    Pontuação_Equipe: atleta.pontuacao_equipe != null ? atleta.pontuacao_equipe : 0
                                  }))}
                                  textoExibicao={{
                                    Classificação: 'Classificação Categoria',
                                    'Classificação Absoluto': 'Classificação Absoluto',
                                    Nome: 'Nadador',
                                    Tempo: 'Tempo',
                                    Equipe: 'Equipe',
                                    Categoria: 'Categoria',
                                    Pontuação: 'Pontuação',
                                    Pontuação_Equipe: 'Pontuação Equipe'
                                  }}
                                  colunasOcultas={['Categoria']}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                </div>
                ),
                      },
                {
                  label: 'Classificação Absoluto',
                  content: (
                    <div className={style.resultadosContainer}>
                      {eventoFinalizado === false && (
                        <h2 className={style.eventoAndamento}>
                          EVENTO EM ANDAMENTO - ATUALIZE A PÁGINA APÓS CADA PROVA
                        </h2>
                      )}
                      {Object.keys(absoluto).length > 0 ? (
                        Object.entries(absoluto)
                          .map(([prova, resultados]) => {
                            const colunasOcultas = [];
                            const ehRevezamento = resultados.some(item => item.eh_revezamento);
                            if (ehRevezamento) {
                              colunasOcultas.push('Categoria', 'Nome', 'Tipo');
                            }

                            // Corrige para garantir que está mostrando o campo pontuacao_individual do backend
                            // e não recalculando nada para Mirins ou Petiz+
                            const dadosTabela = resultados.map(item => ({
                              Classificação: item.status === 'NC' || item.status === 'DQL' ? item.status : item.classificacao,
                              Nome: item.nome_nadador || '-',
                              Tempo: item.tempo,
                              Equipe: item.nome_equipe || '-',
                              Categoria: item.categoria_nadador || '-',
                              Tipo: item.tipo || '',
                              Pontuação_Individual: item.pontuacao_individual !== undefined && item.pontuacao_individual !== null
                                ? Number(item.pontuacao_individual)
                                : 0,
                              Pontuação_Equipe: item.pontuacao_equipe !== undefined && item.pontuacao_equipe !== null
                                ? Number(item.pontuacao_equipe)
                                : 0
                            }));

                            return (
                              <div key={prova} className={style.resultadoBancoItem}>
                                <h2 className={style.titulo}>{prova.replace('(M)', 'MASCULINO').replace('(F)', 'FEMININO')}</h2>
                                <div className={style.tabelaPersonalizada}>
                                  {dadosTabela.length > 0 ? (
                                    <Tabela
                                      className={style.tabelaClassificacaoFinal}
                                      dados={dadosTabela}
                                      textoExibicao={{
                                        Classificação: 'Classificação',
                                        Nome: 'Nome',
                                        Tempo: 'Tempo',
                                        Equipe: 'Equipe',
                                        Categoria: 'Categoria',
                                        Tipo: 'Tipo',
                                        Pontuação_Individual: 'Pontos Individuais',
                                        Pontuação_Equipe: 'Pontos Equipe'
                                      }}
                                      colunasOcultas={colunasOcultas}
                                    />
                                  ) : (
                                    <p>Nenhum dado disponível.</p>
                                  )}
                                </div>
                              </div>
                            );
                          })
                      ) : (
                        <p>Nenhum resultado absoluto encontrado.</p>
                      )}
                    </div>
                  ),
                },
                {
                  label: 'Pontuação da Etapa',
                content: (
                <div className={`${style.resultadosContainer} ${style.pontuacaoEtapaContainer}`}>
                  {eventoFinalizado === false && (
                    <h2 className={style.eventoAndamento}>
                      EVENTO EM ANDAMENTO - ATUALIZE A PÁGINA APÓS CADA PROVA
                    </h2>
                  )}
                  <h2 className={style.titulo}>Pontuação da Etapa</h2>
                  {pontuacaoEtapa.length > 0 ? (
                    <Tabela
                      className={style.tabelaPontuacaoEtapa}
                      dados={pontuacaoEtapa
                        .sort((a, b) => b.pontos - a.pontos)
                        .map((item, index, array) => {
                          const posicao = index === 0 || item.pontos !== array[index - 1].pontos
                            ? index + 1
                            : null;
                          return {
                            Posição: posicao || '',
                            Equipe: item.equipe,
                            Pontos: item.pontos
                          };
                        })}
                      textoExibicao={{
                        Posição: 'Posição',
                        Equipe: 'Equipe',
                        Pontos: 'Pontos na etapa'
                      }}
                      colunasOcultas={[]}
                    />
                  ) : (
                    <p>Nenhuma pontuação encontrada para a etapa.</p>
                  )}

                  <h2 className={style.titulo}>Ranking de Equipes Mirins</h2>
                  <Tabela
                    className={style.tabelaPontuacaoEtapa}
                    dados={
                      pontuacaoMirim.length > 0
                        ? pontuacaoMirim
                            .sort((a, b) => Number(b.pontos) - Number(a.pontos))
                            .map((item, index, array) => {
                              const posicao = index === 0 || Number(item.pontos) !== Number(array[index - 1].pontos)
                                ? index + 1
                                : null;
                              return {
                                Posição: posicao || '',
                                Equipe: item.equipe_nome,
                                Pontos: item.pontos
                              };
                            })
                        : []
                    }
                    textoExibicao={{
                      Posição: 'Posição',
                      Equipe: 'Equipe',
                      Pontos: 'Pontos Mirins'
                    }}
                    colunasOcultas={[]}
                  />
                  {pontuacaoMirim.length === 0 && (
                    <p>Nenhuma pontuação mirim encontrada para a etapa.</p>
                  )}
                </div>
                ),
                      },
                    ]}
                  />
                ) : (
                <p>Nenhum resultado encontrado.</p>
                )}
              </>
            ) : (
              <div className={style.eventosContainer}>
                {eventosComResultados.length > 0 ? (
                  eventosComResultados.map(evento => {
                    const { dataEvento, horario } = formataData(evento.data);
                    return (
                      <Card
                        key={evento.id}
                        className={`${style.eventoCard} ${style.cardContainer}`}
                        nome={`${evento.nome}`}
                        data={`Data: ${dataEvento}`}
                        horario={`Horário: ${horario}`}
                        local={`Sede: ${evento.sede}`}
                        cidade={`Cidade: ${evento.cidade}`}
                        onClick={() => aoClicarNoCard(evento.id)}
                      >
                      </Card>
                    );
                  })
                ) : (
                  <p>Nenhum evento com resultados encontrado.</p>
                )}
                
                <div className={style.botoesAnosAnteriores}>
                  <Botao 
                    onClick={() => navigate('/resultados/2024')}
                    className={style.botaoAno}
                  >
                    Resultados 2024
                  </Botao>
                  <Botao 
                    onClick={() => navigate('/resultados/2023')}
                    className={style.botaoAno}
                  >
                    Resultados 2023
                  </Botao>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Rodape />
    </>
  );
};

export default Resultados;