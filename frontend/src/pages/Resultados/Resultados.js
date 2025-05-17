import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../servicos/api';
import style from './Resultados.module.css';
import Tabela from '../../componentes/Tabela/Tabela';
import Cabecalho from '../../componentes/Cabecalho/Cabecalho';
import Rodape from '../../componentes/Rodape/Rodape';
import Abas from '../../componentes/Abas/Abas';
import Card from '../../componentes/Card/Card';
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


  //const apiResultados = '/resultados/resultadosEvento';
  const apiClassificacao = '/resultados/resultadosPorCategoria';
  const apiAbsoluto = '/resultados/resultadosAbsoluto';
  const apiResultadosBanco = '/resultados/listarDoBanco';
  const apiEventosComResultados = '/resultados/listarEventosComResultados';
  const apiRankingEquipesPorEvento = '/rankings/ranking-equipes-por-evento';
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

  // Agrupa por nome da prova (sem categoria)
  const provasAgrupadas = {};

  Object.entries(classificacao).forEach(([chave, atletas]) => {
    // Extrai nome da prova e categoria
    // Exemplo de chave: "1ª PROVA - 200 METROS BORBOLETA FEMININO - Infantil I (Feminino)"
    const idx = chave.lastIndexOf(' - ');
    let nomeProva = chave;
    let categoria = '';
    if (idx !== -1) {
      nomeProva = chave.substring(0, idx).trim();
      categoria = chave.substring(idx + 3).trim();
    }
    if (!provasAgrupadas[nomeProva]) provasAgrupadas[nomeProva] = [];
    provasAgrupadas[nomeProva].push({ categoria, atletas });
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
                                          let tempo;
                                          if (eventoFinalizado === false && (!nadador.tempo || nadador.tempo === "NC" || nadador.tempo === "A DISPUTAR")) {
                                            tempo = "A DISPUTAR";
                                          } else if (nadador.status === 'NC') {
                                            tempo = 'NC';
                                          } else if (nadador.status === 'DQL') {
                                            tempo = 'DQL';
                                          } else {
                                            tempo = nadador.tempo;
                                          }
                                          return prova.revezamento
                                            ? { Raia: nadador.raia, Equipe: nadador.nome_equipe, Tempo: tempo }
                                            : { Raia: nadador.raia, Nome: nadador.nome_nadador, Tempo: tempo, Equipe: nadador.nome_equipe, Categoria: nadador.categoria_nadador };
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
                              .sort((a, b) => {
                                const getOrdem = str => {
                                  const match = str.match(/^(\d+)ª PROVA/);
                                  return match ? parseInt(match[1], 10) : 9999;
                                };
                                const ordemA = getOrdem(a[0]);
                                const ordemB = getOrdem(b[0]);
                                if (ordemA !== ordemB) return ordemA - ordemB;
                                return a[0].localeCompare(b[0]);
                              })
                              .filter(([_, categorias]) =>
                                categorias.some(({ atletas }) =>
                                  atletas.some(atleta =>
                                    atleta.eh_prova_categoria &&
                                    atleta.tempo && atleta.tempo !== "A DISPUTAR" && atleta.tempo !== "NC"
                                  )
                                )
                              )
                              .map(([nomeProva, categorias]) => (
                                <div key={nomeProva}>
                                  <h2 className={style.titulo}>{nomeProva.replace('(M)', 'MASCULINO').replace('(F)', 'FEMININO')}</h2>
                                  {categorias
                                    .filter(({ atletas }) =>
                                      atletas.some(atleta =>
                                        atleta.eh_prova_categoria &&
                                        atleta.tempo && atleta.tempo !== "A DISPUTAR" && atleta.tempo !== "NC"
                                      )
                                    )
                                    .map(({ categoria, atletas }) => (
                                      <div key={categoria}>
                                        <h3 className={style.tituloCategoria}>
                                          {categoria.replace(/\s*\([MF]\)$/, '')}
                                        </h3>
                                        <div className={style.classificacaoTabela}>
                                          <Tabela
                                            className={style.tabelaClassificacaoCategoria}
                                            dados={atletas.map(atleta => ({
                                              Classificação: renderMedalha(atleta.classificacao, true),
                                              Nome: atleta.nomeNadador,
                                              Tempo: `${String(atleta.minutos).padStart(2, '0')}:${String(atleta.segundos).padStart(2, '0')}:${String(atleta.centesimos).padStart(2, '0')}`,
                                              Equipe: atleta.nomeEquipe,
                                              Categoria: atleta.categoria
                                            }))}
                                            textoExibicao={{
                                              Classificação: 'Classificação',
                                              Nome: 'Nadador',
                                              Tempo: 'Tempo',
                                              Equipe: 'Equipe',
                                              Categoria: 'Categoria'
                                            }}
                                            colunasOcultas={['Categoria']}
                                            ehProvaCategoria={true}
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
                        label: 'Classificação Absoluto',
                        content: (
                          <div className={style.resultadosContainer}>
                            {eventoFinalizado === false && (
                              <h2 className={style.eventoAndamento}>
                                EVENTO EM ANDAMENTO - ATUALIZE A PÁGINA APÓS CADA PROVA
                              </h2>
                            )}
                            {Object.keys(resultadosBanco).length > 0 ? (
                              Object.entries(resultadosBanco)
                                .filter(([_, resultados]) => resultados.some(item => item.tipo === 'ABSOLUTO'))
                                .map(([prova, resultados]) => {
                                  const colunasOcultas = [];
                                  const ehRevezamento = resultados.some(item => item.eh_revezamento);
                                  if (ehRevezamento) {
                                    colunasOcultas.push('Categoria', 'Nome', 'Tipo');
                                  }
                                  return (
                                    <div key={prova} className={style.resultadoBancoItem}>
                                      <h2 className={style.titulo}>{prova.replace('(M)', 'MASCULINO').replace('(F)', 'FEMININO')}</h2>
                                      <div className={style.tabelaPersonalizada}>
                                        <Tabela
                                          className={style.tabelaClassificacaoFinal}
                                          dados={resultados
                                            .filter(item => item.tipo === 'ABSOLUTO')
                                            .map(item => ({
                                              Classificação: item.status === 'NC' || item.status === 'DQL' ? item.status : item.classificacao,
                                              Nome: item.nome_nadador || '-',
                                              Tempo: item.tempo,
                                              Equipe: item.nome_equipe || '-',
                                              Categoria: item.categoria_nadador || '-',
                                              Tipo: item.tipo,
                                              Pontuação_Individual: item.pontuacao_individual,
                                              Pontuação_Equipe: item.pontuacao_equipe
                                            }))}
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
                                      </div>
                                    </div>
                                  );
                                })
                            ) : (
                              <p>Nenhum resultado encontrado no banco.</p>
                            )}
                          </div>
                        ),
                      },
                      {
                        label: 'Pontuação da Etapa',
                        content: (
                          <div className={style.resultadosContainer}>
                            {eventoFinalizado === false && (
                              <h2 className={style.eventoAndamento}>
                                EVENTO EM ANDAMENTO - ATUALIZE A PÁGINA APÓS CADA PROVA
                              </h2>
                            )}
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
