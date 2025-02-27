import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../servicos/api';
import style from './Resultados.module.css';
import Tabela from '../../componentes/Tabela/Tabela';
import Cabecalho from '../../componentes/Cabecalho/Cabecalho';  
import Rodape from '../../componentes/Rodape/Rodape';
import Abas from '../../componentes/Abas/Abas';

const Resultados = () => {
  const { eventoId } = useParams();
  const [dados, setDados] = useState([]);
  const [classificacao, setClassificacao] = useState({});
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state
  const apiResultados = '/resultados/resultadosEvento';
  const apiClassificacao = '/resultados/resultadosPorCategoria';

  const formatarSexo = (sexo) => {
    return sexo === 'M' ? 'Masculino' : 'Feminino';
  };

  const fetchResultadosEClassificacao = async () => {
    try {
      const [resultadosResponse, classificacaoResponse] = await Promise.all([
        api.get(`${apiResultados}/${eventoId}`),
        api.get(`${apiClassificacao}/${eventoId}`)
      ]);

      setDados(resultadosResponse.data || []);
      setClassificacao(classificacaoResponse.data || {});
      setErro(null);
    } catch (err) {
      console.error("Erro ao buscar dados:", err.message);
      setErro("Erro ao buscar dados");
    } finally {
      setLoading(false); // Set loading to false after data is fetched
    }
  };

  useEffect(() => {
    if (eventoId) {
      setLoading(true);
      fetchResultadosEClassificacao();
    }
  }, [eventoId]);

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
            {dados.length > 0 ? (
              <Abas
                tabs={[
                  {
                    label: 'Resultados',
                    content: (
                      <div className={style.resultadosContainer}>
                        {dados.map(item => {
                          return (
                            <div key={item.prova.eventos_provas_id}>
                              <h2 className={style.titulo}>{item.prova.nome.replace('(M)', '(Masculino)').replace('(F)', '(Feminino)')}</h2>
                              {item.baterias.map(bateria => {
                                const tableData = bateria.nadadores.map(nadador => {
                                  let tempo = nadador.tempo;
                                  if (nadador.status === 'NC') {
                                    tempo = 'NÃO COMPETIU';
                                  } else if (nadador.status === 'DESC') {
                                    tempo = 'DESCLASSIFICADO';
                                  }
                                  const rowData = {
                                    Raia: nadador.raia,
                                    Equipe: nadador.equipe,
                                    Tempo: tempo,
                                    Nome: nadador.nome,
                                    Categoria: nadador.categoria
                                  };
                                  return rowData;
                                });
                                const textoExibicao = {
                                  Raia: 'Raia',
                                  Equipe: 'Equipe',
                                  Tempo: 'Tempo',
                                  Nome: 'Nadador',
                                  Categoria: 'Categoria'
                                };
                                const colunasOcultas = [];
                                if (item.prova.revezamento) { // Se for revezamento
                                  colunasOcultas.push('Categoria', 'Nome'); // Oculta as colunas categoria e nome
                                }
                                return (
                                  <div key={bateria.bateriaId}>
                                    <h3 className={style.titulo}>{bateria.numeroBateria}</h3>
                                    <div className={style.tabelaPersonalizada}>
                                      <Tabela
                                        dados={tableData}
                                        textoExibicao={textoExibicao}
                                        colunasOcultas={colunasOcultas}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    ),
                  },
                  {
                    label: 'Classificação no evento',
                    content: (
                      <div className={style.resultadosContainer}>
                        {Object.keys(classificacao).length > 0 ? (
                          Object.entries(classificacao).map(([categoria, atletas]) => {
                            const colunasOcultas = [];
                            if (categoria.includes('Revezamento')) { // Se for revezamento
                              colunasOcultas.push('Categoria', 'Nome'); // Oculta as colunas categoria e nome
                            }
                            return (
                              <div key={categoria}>
                                <h2 className={style.titulo}>{categoria.replace('(M)', '(Masculino)').replace('(F)', '(Feminino)')}</h2>
                                <div className={style.classificacaoTabela}>
                                  <Tabela
                                    dados={atletas.map(atleta => ({
                                      Classificação: atleta.classificacao || '-',
                                      Nome: atleta.nomeNadador,
                                      Equipe: atleta.nomeEquipe,
                                      Tempo: `${String(atleta.minutos).padStart(2, '0')}:${String(atleta.segundos).padStart(2, '0')}:${String(atleta.centesimos).padStart(2, '0')}`,
                                      Categoria: atleta.categoria
                                    }))}
                                    textoExibicao={{
                                      Classificação: 'Classificação',
                                      Nome: 'Nadador',
                                      Equipe: 'Equipe',
                                      Tempo: 'Tempo',
                                      Categoria: 'Categoria'
                                    }}
                                    colunasOcultas={colunasOcultas}
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
        )}
      </div>
      <Rodape />
    </>
  );
};

export default Resultados;
