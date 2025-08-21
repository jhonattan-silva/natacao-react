import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../servicos/api';
import TileFoto from '../../componentes/TileFoto/TileFoto';
import styles from './Noticias.module.css';
import ModalImagem from '../../componentes/ModalImagem/ModalImagem';
import Cabecalho from '../../componentes/Cabecalho/Cabecalho';
import Rodape from '../../componentes/Rodape/Rodape';

const Noticias = () => {
  const { year, slug } = useParams();
  const navigate = useNavigate();
  const [noticias, setNoticias] = useState([]);
  const [noticia, setNoticia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalImg, setModalImg] = useState('');
  
  const backendOrigin = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const getImageUrl = url => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/uploads')) return `${backendOrigin}${url}`;
    return url;
  };

  const handleImageError = (e) => {
    console.warn('Erro ao carregar imagem:', e.target.src);
    e.target.style.display = 'none';
  };

  useEffect(() => {
    setLoading(true);
    if (year && slug) {
      api.get(`/news/${year}/${slug}`)
        .then(res => {
          setNoticia(res.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      api.get('/news')
        .then(res => {
          setNoticias(res.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [year, slug]);

  // Função para extrair o ano e gerar link amigável
  const pegarAno = (dataString) => {
    const d = new Date(dataString);
    return d.getFullYear();
  };

  //gerar link da notícia
  const getNewsLink = (noticia) => {
    return `/noticias/${pegarAno(noticia.data)}/${noticia.slug}`;
  };

  if (loading) return <p>Carregando...</p>;

  if (year && slug && noticia) {
    return (
      <div className={styles.pageWrapper}>
        <Cabecalho />
        <div className={styles.content}>
          <div className={styles.container}>
            <h1 className={styles.titulo}>{noticia.titulo}</h1>
            {noticia.subtitulo && (
              <h2 className={styles.subtitulo}>{noticia.subtitulo}</h2>
            )}
            {noticia.imagem && (
              <div className={styles.mainImageWrapper}>
                <img 
                  src={getImageUrl(noticia.imagem)} 
                  alt={noticia.titulo}
                  className={styles.mainImage}
                  onError={handleImageError}
                />
              </div>
            )}
            <div className={styles.texto} dangerouslySetInnerHTML={{ __html: noticia.texto }} />
            {noticia.galeria && noticia.galeria.length > 0 && (
              <div className={styles.galeria}>
                <h3 className={styles.galeriaTitulo}>Galeria</h3>
                <div className={styles.galeriaDestaqueWrapper}>
                  <img 
                    src={getImageUrl(noticia.galeria[0])} 
                    alt="Imagem destacada da galeria" 
                    className={styles.galeriaDestaque}
                    onError={handleImageError}
                    onClick={() => setModalImg(getImageUrl(noticia.galeria[0]))}
                  />
                </div>
                {noticia.galeria.length > 1 && (
                  <div className={styles.galeriaMiniaturas}>
                    {noticia.galeria.slice(1).map((img, idx) => (
                      <img 
                        key={idx}
                        src={getImageUrl(img)} 
                        alt={`Galeria ${idx + 2}`}
                        className={styles.galeriaItem}
                        onError={handleImageError}
                        onClick={() => setModalImg(getImageUrl(img))}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            {modalImg && <ModalImagem imagem={modalImg} onClose={() => setModalImg('')} />}
            <button onClick={() => navigate('/noticias')} className={styles.backButton}>Voltar</button>
          </div>
        </div>
        <Rodape />
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <Cabecalho />
      <div className={styles.content}>
        <h1>Notícias</h1>
        {noticias.length === 0 && <p>Nenhuma notícia encontrada.</p>}
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 16}}>
          {noticias.map(n => (
            <TileFoto
              key={n.id}
              titulo={n.titulo}
              imagem={getImageUrl(n.imagem)}
              resumo={n.resumo}
              onClick={() => navigate(getNewsLink(n))}
            />
          ))}
        </div>
      </div>
      <Rodape />
    </div>
  );
};

export default Noticias;