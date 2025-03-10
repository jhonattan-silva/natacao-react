import { useState } from 'react';
import style from './Dashboard.module.css';

const InscricoesCard = ({ dados }) => {
    const [exibirDetalhes, setExibirDetalhes] = useState(false);

    return (
        <div className={style.card}>
            <h3>Inscrições</h3>
            <p>Atletas Inscritos: <strong>{dados?.total_inscricoes || 'Carregando...'}</strong></p>
            <p>Revezamentos Inscritos: <strong>{dados?.total_revezamentos || 'Carregando...'}</strong></p>
            
            {/* Botão para exibir/ocultar detalhes */}
            <button onClick={() => setExibirDetalhes(!exibirDetalhes)}>
                {exibirDetalhes ? 'Ocultar' : 'Exibir'} inscritos
            </button>
            
            {/* Lista de atletas e provas, mostrada apenas quando exibirDetalhes for true */}
            {exibirDetalhes && (
                <div>
                    {dados?.atletas && (
                        <ul className={style.listaAtletas}>
                            {dados.atletas.map((atleta, index) => (
                                <li key={index}>
                                    <strong>{atleta.nome}</strong>
                                    <ul>
                                        {atleta.provas.map((prova, idx) => (
                                            <li key={idx}>{prova}</li>
                                        ))}
                                    </ul>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Lista de provas de revezamento */}
                    {dados?.provas_revezamento && (
                        <div className={style.listaRevezamentos}>
                            <h4>Provas de Revezamento</h4>
                            <ul>
                                {dados.provas_revezamento.map((prova, index) => (
                                    <li key={index}>{prova}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default InscricoesCard;
