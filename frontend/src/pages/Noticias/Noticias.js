import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../servicos/api';

const Noticias = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [noticias, setNoticias] = useState([]);
  const [noticia, setNoticia] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (id) {
      // Buscar notícia específica
      api.get(`/news/${id}`)
        .then(res => {
          setNoticia(res.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      // Buscar todas as notícias
      api.get('/news')
        .then(res => {
          setNoticias(res.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <p>Carregando...</p>;

  if (id && noticia) {
    // Página de detalhe
    return (
      <div>
        <button onClick={() => navigate('/noticias')}>Voltar</button>
        <h1>{noticia.titulo}</h1>
        <p><em>{noticia.data}</em></p>
        {noticia.imagem && <img src={noticia.imagem} alt={noticia.titulo} style={{maxWidth: 400}} />}
        <div>{noticia.conteudo}</div>
      </div>
    );
  }

  // Página de listagem
  return (
    <div>
      <h1>Notícias</h1>
      {noticias.length === 0 && <p>Nenhuma notícia encontrada.</p>}
      <ul>
        {noticias.map(n => (
          <li key={n.id} style={{marginBottom: 16, cursor: 'pointer'}} onClick={() => navigate(`/noticias/${n.id}`)}>
            <strong>{n.titulo}</strong>
            <br />
            <span><em>{n.data}</em></span>
            {n.imagem && <div><img src={n.imagem} alt={n.titulo} style={{maxWidth: 200}} /></div>}
            <div>{n.resumo || (n.conteudo && n.conteudo.slice(0, 100) + '...')}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Noticias;