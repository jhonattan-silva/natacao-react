import React from 'react';
import style from './TileFoto.module.css';

const getImagemUrl = (imagem) => {
  if (!imagem) return '';
  if (imagem.startsWith('http')) return imagem;
  // Ajuste para produção se necessário
  const apiUrl = process.env.REACT_APP_API_URL || '';
  return `${apiUrl}${imagem}`;
};

const TileFoto = ({ titulo, imagem, resumo, onClick }) => (
  <div className={style.tileFoto} onClick={onClick}>
    <div className={style.imagemContainer}>
      {imagem ? (
        <img src={getImagemUrl(imagem)} alt={titulo} className={style.imagem} />
      ) : (
        <div style={{ width: '100%', height: '100%', background: '#eee' }} />
      )}
    </div>
    <div className={style.conteudo}>
      <h3 className={style.titulo}>{titulo}</h3>
      {resumo && <div className={style.resumo}>{resumo}</div>}
    </div>
  </div>
);

export default TileFoto;
