import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../servicos/api';
import style from './Balizamentos.module.css';
import Tabela from '../../componentes/Tabela/Tabela';
import Cabecalho from '../../componentes/Cabecalho/Cabecalho';
import Rodape from '../../componentes/Rodape/Rodape';
import Abas from '../../componentes/Abas/Abas';
import Card from '../../componentes/Card/Card';
import { formataData } from '../../servicos/functions';

/*
*
* Componente Balizamentos
* Responsável por exibir os balizamentos de um evento específico ou uma lista de eventos com balizamentos (PÁGINA PUBLICA).
* Utiliza hooks para gerenciar estado e efeitos colaterais, além de componentes reutilizáveis para exibir dados.
*
* Dependências: React, React Router, Axios (api), CSS Modules (estilização).
*
* Estrutura de dados esperada:
* - dados: Array de objetos contendo informações sobre balizamentos, provas e nadadores.
* - balizamentosBanco: Array de objetos contendo informações sobre balizamentos do banco.
* - eventosComBalizamentos: Array de objetos contendo informações sobre eventos com balizamentos.
*
* - erro: String para armazenar mensagens de erro durante as requisições.
* - loading: Boolean para indicar se os dados estão sendo carregados.
*
* - eventoId: ID do evento obtido a partir da URL.
* - navigate: Função para navegar entre rotas.
*
* - fetchBalizamentos: Função assíncrona para buscar balizamentos de um evento específico.
*/

const Balizamentos = () => {
  const { eventoId } = useParams();
  const navigate = useNavigate();
  const [dados, setDados] = useState([]);
  const [balizamentosBanco, setBalizamentosBanco] = useState([]);
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eventosComBalizamentos, setEventosComBalizamentos] = useState([]);

  const apiBalizamentos = '/balizamentoExibicao/balizamentosEvento';
  const apiBalizamentosBanco = '/balizamentoExibicao/listarDoBanco';
  const apiEventosComBalizamentos = '/balizamentoExibicao/listarEventosComBalizamentos';

  const fetchBalizamentos = async () => {
    try {
      const response = await api.get(`${apiBalizamentos}/${eventoId}`);
      setDados(response.data || []);
      setErro(null);
    } catch (err) {
      console.error("Erro ao buscar balizamentos:", err.message);
      setErro("Erro ao buscar balizamentos");
    } finally {
      setLoading(false);
    }
  };

  const fetchBalizamentosBanco = async () => {
    try {
      const response = await api.get(`${apiBalizamentosBanco}/${eventoId}`);
      setBalizamentosBanco(response.data || []);
    } catch (err) {
      console.error("Erro ao buscar balizamentos do banco:", err.message);
      setErro("Erro ao buscar balizamentos do banco");
    }
  };

  const fetchEventosComBalizamentos = async () => {
    try {
      const response = await api.get(apiEventosComBalizamentos);
      setEventosComBalizamentos(response.data || []);
    } catch (err) {
      console.error("Erro ao buscar eventos com balizamentos:", err.message);
      setErro("Erro ao buscar eventos com balizamentos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventoId) {
      setLoading(true);
      fetchBalizamentos();
      fetchBalizamentosBanco();
    } else {
      setLoading(true);
      fetchEventosComBalizamentos();
    }
  }, [eventoId]);

  const aoClicarNoCard = (id) => {
    navigate(`/balizamentos/${id}`);
  };

  const renderTabelaBalizamento = (item) => {
    return item.baterias.map(bateria => {
      const tableData = bateria.nadadores.map(nadador => {
        let tempo = nadador.tempo || '-'; // Ensure tempo is displayed
        if (nadador.status === 'NC') {
          tempo = 'NC';
        } else if (nadador.status === 'DQL') {
          tempo = 'DQL';
        }
        const rowData = item.prova.revezamento ? {
          Raia: nadador.raia,
          Equipe: nadador.equipe,
          Tempo: tempo // Include tempo
        } : {
          Raia: nadador.raia,
          Nome: nadador.nome,
          Tempo: tempo, // Include tempo
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
          <div className={`${style.tabelaPersonalizada} ${style.tabelaBalizamento}`}>
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
      <div className={style.balizamentosContainer}>
        <h1 className={style.titulo}>Balizamentos</h1>
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
                        label: 'Balizamentos do Evento',
                        content: (
                          <div className={style.balizamentosContainer}>
                            {dados.map((item) => (
                              <div key={item.prova.eventos_provas_id}>
                                <h2 className={style.titulo}>
                                  {item.prova.nome}
                                </h2>
                                {renderTabelaBalizamento(item)}
                              </div>
                            ))}
                          </div>
                        ),
                      },
                      {
                        label: 'Inscritos por prova',
                        content: (
                          <div className={style.balizamentosContainer}>
                            {Object.keys(balizamentosBanco).length > 0 ? (
                              Object.entries(balizamentosBanco).map(([prova, balizamentos]) => {
                                return (
                                  <div key={prova} className={style.balizametoBancoItem}>
                                    <h2 className={style.titulo}>{prova}</h2>
                                    <div className={style.tabelaPersonalizada}>
                                      <Tabela
                                        className={style.tabelaBalizamentoBanco}
                                        dados={balizamentos.map(item => ({
                                          Nome: item.nome_nadador || '-',
                                          Tempo: item.tempo,
                                          Equipe: item.nome_equipe || '-',
                                          Categoria: item.categoria_nadador || '-',
                                        }))}
                                        textoExibicao={{
                                          Nome: 'Nadador',
                                          Tempo: 'Tempo',
                                          Equipe: 'Equipe',
                                          Categoria: 'Categoria'
                                        }}
                                        colunasOcultas={[]}
                                      />
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <p>Nenhum balizamento encontrado no banco.</p>
                            )}
                          </div>
                        ),
                      },
                    ]}
                  />
                ) : (
                  <p>Nenhum balizamento encontrado.</p>
                )}
              </>
            ) : (
              <div className={style.eventosContainer}>
                {eventosComBalizamentos.length > 0 ? (
                  eventosComBalizamentos.map(evento => {
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
                      />
                    );
                  })
                ) : (
                  <p>Nenhum evento com balizamentos encontrado.</p>
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

export default Balizamentos;
