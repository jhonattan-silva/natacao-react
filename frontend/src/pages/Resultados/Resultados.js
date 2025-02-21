import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../servicos/api';
import style from './Resultados.module.css';

const Resultados = () => {
  const { provaId } = useParams();
  const [prova, setProva] = useState(null);
  const [resultados, setResultados] = useState([]);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const fetchResultados = async () => {
      try {
        const response = await api.get(`/resultadosRoutes/obterResultados/${provaId}`);
        if (response.data) {
          setProva(response.data.prova);
          setResultados(response.data.resultados || []);
          setErro(null);
        }
      } catch (err) {
        console.error("Erro ao buscar resultados:", err.message);
        setErro("Erro ao buscar resultados");
      }
    };

    if (provaId) fetchResultados();
  }, [provaId]);

  return (
    <div className={style.resultadosContainer}>
      <h1>Resultados - {prova ? prova.nome : ''}</h1>
      {erro && <div>{erro}</div>}
      {resultados.length > 0 ? (
        resultados.map(resultado => (
          <div key={resultado.id}>
            <div><span>Nadador ID:</span> {resultado.nadadores_id}</div>
            <div><span>Tempo:</span> {resultado.tempo}</div>
            <div><span>Pontos:</span> {resultado.pontos}</div>
          </div>
        ))
      ) : (
        <p>Nenhum resultado encontrado.</p>
      )}
    </div>
  );
};

export default Resultados;
