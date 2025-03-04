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
  const apiResultados = '/resultados/resultadosEvento';
  const apiClassificacao = '/resultados/resultadosPorCategoria';
  const apiAbsoluto = '/resultados/resultadosAbsoluto';
  const apiResultadosBanco = '/resultados/listarDoBanco';
  const apiEventosComResultados = '/resultados/listarEventosComResultados';

  const fetchResultadosEClassificacao = async () => {
    try {
      const [resultadosResponse, classificacaoResponse, absolutoResponse] = await Promise.all([
        api.get(`${apiResultados}/${eventoId}`),
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

  useEffect(() => {
    if (eventoId) {
      setLoading(true);
      fetchResultadosEClassificacao();
      fetchResultadosBanco();
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

  const renderTabelaBalizamento = (item) => {
    return item.baterias.map(bateria => {
      const tableData = bateria.nadadores.map(nadador => {
        let tempo = nadador.tempo;
        if (nadador.status === 'NC') {
          tempo = 'NC';
        } else if (nadador.status === 'DQL') { // Alterado de 'DESC' para 'DQL'
          tempo = 'DQL';
        }
        const rowData = item.prova.revezamento ? {
          Raia: nadador.raia,
          Equipe: nadador.equipe,
          Tempo: tempo
        } : {
          Raia: nadador.raia,
          Nome: nadador.nome,
          Tempo: tempo,
          Equipe: nadador.equipe,
          Categoria: nadador.categoria
        };
        return rowData;
      });
      const textoExibicao = item.prova.revezamento ? {
        Raia: 'Raia',
        Equipe: 'Equipe',
        Tempo: 'Tempo'
      } : {
        Raia: 'Raia',
        Nome: 'Nadador',
        Tempo: 'Tempo',
        Equipe: 'Equipe',
        Categoria: 'Categoria'
      };
      const colunasOcultas = item.prova.revezamento ? [] : [];
      return (
        <div key={bateria.bateriaId}>
          <h3 className={style.titulo}>{bateria.numeroBateria}</h3>
          <div className={`${style.tabelaPersonalizada} ${style.tabelaResultadosBalizamento}`}>
            <Tabela
              dados={tableData}
              textoExibicao={textoExibicao}
              colunasOcultas={colunasOcultas}
            />
          </div>
        </div>
      );
    });
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
                        label: 'Classificação Final',
                        content: (
                          <div className={style.resultadosContainer}>
                            {Object.keys(resultadosBanco).length > 0 ? (
                              Object.entries(resultadosBanco).map(([prova, resultados]) => {
                                const colunasOcultas = [];
                                const ehRevezamento = resultados.some(item => item.eh_revezamento);
                                if (ehRevezamento) {
                                  colunasOcultas.push('Categoria', 'Nome', 'Tipo');
                                }
                                return (
                                  <div key={prova} className={style.resultadoBancoItem}>
                                    <h2 className={style.titulo}>{prova.replace('(M)', '(Masculino)').replace('(F)', '(Feminino)')}</h2>
                                    <div className={style.tabelaPersonalizada}>
                                      <Tabela
                                        className={style.tabelaClassificacaoFinal}
                                        dados={resultados.map(item => ({
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
                        label: 'Resultados pelo Balizamento',
                        content: (
                          <div className={style.resultadosContainer}>
                            {dados.map(item => (
                              <div key={item.prova.eventos_provas_id}>
                                <h2 className={style.titulo}>{item.prova.nome.replace('(M)', '(Masculino)').replace('(F)', '(Feminino)')}</h2>
                                {renderTabelaBalizamento(item)}
                              </div>
                            ))}
                          </div>
                        ),
                      },
                      {
                        label: 'Classificação por Categoria',
                        content: (
                          <div className={style.resultadosContainer}>
                            {Object.keys(classificacao).length > 0 ? (
                              Object.entries(classificacao).map(([categoria, atletas]) => {
                                const colunasOcultas = [];
                                if (categoria.includes('Revezamento')) {
                                  colunasOcultas.push('Categoria', 'Nome');
                                }
                                const ehProvaCategoria = atletas.some(atleta => atleta.eh_prova_categoria);
                                return (
                                  <div key={categoria}>
                                    <h2 className={style.titulo}>{categoria.replace('(M)', '(Masculino)').replace('(F)', '(Feminino)')}</h2>
                                    <div className={style.classificacaoTabela}>
                                      <Tabela
                                        className={style.tabelaClassificacaoCategoria}
                                        dados={atletas.map(atleta => ({
                                          Classificação: renderMedalha(atleta.classificacao, ehProvaCategoria),
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
                                        colunasOcultas={colunasOcultas}
                                        ehProvaCategoria={ehProvaCategoria}
                                      />
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <p>Nenhuma classificação encontrada.</p>
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
