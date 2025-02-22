import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../servicos/api';
import style from './Resultados.module.css';
import Tabela from '../../componentes/Tabela/Tabela';
import Cabecalho from '../../componentes/Cabecalho/Cabecalho';  
import Rodape from '../../componentes/Rodape/Rodape';

const Resultados = () => {
  const { eventoId } = useParams();
  const [dados, setDados] = useState([]);
  const [erro, setErro] = useState(null);
  const apiResultados = '/resultados/resultadosEvento';

  useEffect(() => {
    const fetchResultados = async () => {
      try {
        const response = await api.get(`${apiResultados}/${eventoId}`);
        if (response.data) {
          setDados(response.data);
          setErro(null);
        }
      } catch (err) {
        console.error("Erro ao buscar resultados:", err.message);
        setErro("Erro ao buscar resultados");
      }
    };
    if (eventoId) fetchResultados();
  }, [eventoId]);

  return (
    <>
      <Cabecalho />
      <div className={style.resultadosContainer}>
        <h1>Resultados</h1>
        {erro && <div>{erro}</div>}
        {dados.length > 0 ? (
          <>
            {dados.map(item => (
              <div key={item.prova.eventos_provas_id}>
                <h2>{item.prova.nome}</h2>
                {item.baterias.map(bateria => {
                  const tableData = bateria.nadadores.map(nadador => {
                    let tempo = nadador.tempo;
                    if (nadador.status === 'NC') {
                      tempo = 'NÃO COMPETIU';
                    } else if (nadador.status === 'DESC') {
                      tempo = 'DESCLASSIFICADO';
                    }
                    return {
                      Raia: nadador.raia,
                      Nome: nadador.nome,
                      Equipe: nadador.equipe,
                      Categoria: nadador.categoria,
                      Tempo: tempo
                    };
                  });
                  return (
                    <div key={bateria.bateriaId}>
                      <h3>SÉRIE: {bateria.numeroBateria}</h3>
                      <div className={style.tabelaPersonalizada}>
                        <Tabela
                          dados={tableData}
                          textoExibicao={{
                            Raia: 'Raia',
                            Nome: 'Nadador',
                            Equipe: 'Equipe',
                            Categoria: 'Categoria',
                            Tempo: 'Tempo'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </>
        ) : (
          <p>Nenhum resultado encontrado.</p>
        )}
      </div>
      <Rodape />
    </>
  );
};

export default Resultados;
