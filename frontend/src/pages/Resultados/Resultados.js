import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../servicos/api';
import style from './Resultados.module.css';

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
    <div className={style.resultadosContainer}>
      <h1>Resultados</h1>
      {erro && <div>{erro}</div>}
      {dados.length > 0 ? (
        dados.map(item => (
          <div key={item.prova.eventos_provas_id} className={style.provaContainer}>
            <h2>{item.prova.nome}</h2>
            {item.baterias.map(bateria => (
              <div key={bateria.bateriaId} className={style.bateriaContainer}>
                <h3>SÉRIE: {bateria.numeroBateria}</h3>
                {bateria.nadadores.map(nadador => {
                  let exibicaoTempo = nadador.tempo;
                  if (nadador.status === 'NC') {
                    exibicaoTempo = 'NÃO COMPETIU';
                  } else if (nadador.status === 'DESC') {
                    exibicaoTempo = 'DESCLASSIFICADO';
                  }
                  return (
                    <div key={nadador.id} className={style.nadador}>
                      <span>Raia: {nadador.raia} | </span>
                      <span>{nadador.nome} | </span>
                      <span>Tempo: {exibicaoTempo}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))
      ) : (
        <p>Nenhum resultado encontrado.</p>
      )}
    </div>
  );
};

export default Resultados;
