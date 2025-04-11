import React, { useEffect, useState } from 'react';
import api from '../../servicos/api';
import Tabela from '../../componentes/Tabela/Tabela';
import Abas from '../../componentes/Abas/Abas';
import style from './Rankings.module.css';
import Cabecalho from '../../componentes/Cabecalho/Cabecalho';
import Rodape from '../../componentes/Rodape/Rodape';

const Rankings = () => {
    const torneiosId = 3; //torneio de 2025

    const [rankingsEquipes, setRankingsEquipes] = useState([]);
    const [errorEquipes, setErrorEquipes] = useState(null);
    const [rankingsNadadores, setRankingsNadadores] = useState({ masculino: [], feminino: [] });
    const [errorNadadores, setErrorNadadores] = useState(null);

    const fetchRankingsEquipes = async () => {
        try {
            const response = await api.get(`/rankings/ranking-equipes/${torneiosId}`);
            if (!Array.isArray(response.data)) {
                throw new Error(`Resposta inesperada: ${JSON.stringify(response.data)}`);
            }
            setRankingsEquipes(response.data);
            setErrorEquipes(null);
        } catch (err) {
            console.error('Erro ao buscar ranking das equipes:', err);
            setErrorEquipes(`Erro: ${err.message}`);
        }
    };

    // Fetch rankings para nadadores (individual) separados por gênero
    const fetchRankingsNadadores = async () => {
        try {
            const response = await api.get(`/rankings/ranking-nadadores/${torneiosId}`);
            setRankingsNadadores(response.data);
            setErrorNadadores(null);
        } catch (err) {
            console.error('Erro ao buscar ranking dos nadadores:', err);
            setErrorNadadores(`Erro: ${err.message}`);
        }
    };

    useEffect(() => {
        fetchRankingsEquipes();
        fetchRankingsNadadores();
    }, []);

    // Adiciona a posição como a primeira coluna nos rankings, considerando empates e ajustando corretamente as posições seguintes
    const addPositionToRanking = (ranking) => {
        let currentPosition = 1;
        return ranking.map((item, index, array) => {
            if (index > 0 && item.pontos === array[index - 1].pontos) {
                return { posicao: "", ...item }; // Deixa a posição em branco para empates
            }
            const position = currentPosition;
            currentPosition += array.slice(index).filter((el) => el.pontos === item.pontos).length; // Incrementa com base no número de itens empatados
            return { posicao: position, ...item };
        });
    };

    // Agrupa os nadadores por categoria para cada gênero
    const groupedMasculino = rankingsNadadores.masculino.reduce((acc, curr) => {
        const cat = curr.categoria || curr.Categoria; // Ajusta para usar o nome correto da propriedade
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push({ ...curr, equipe: curr.equipe }); // Inclui a equipe
        return acc;
    }, {});
    const groupedFeminino = rankingsNadadores.feminino.reduce((acc, curr) => {
        const cat = curr.categoria || curr.Categoria; // Ajusta para usar o nome correto da propriedade
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push({ ...curr, equipe: curr.equipe }); // Inclui a equipe
        return acc;
    }, {});

    // Adiciona posição aos rankings agrupados
    Object.keys(groupedMasculino).forEach(cat => {
        groupedMasculino[cat] = addPositionToRanking(groupedMasculino[cat]);
    });
    Object.keys(groupedFeminino).forEach(cat => {
        groupedFeminino[cat] = addPositionToRanking(groupedFeminino[cat]);
    });

    // Adiciona posição ao ranking de equipes
    const rankingsEquipesWithPosition = addPositionToRanking(rankingsEquipes);

    // Conteúdo da aba para equipes
    const equipeTabContent = errorEquipes ? (
        <div style={{ color: 'red', marginTop: '10px' }}>
            <strong>Erro:</strong> {errorEquipes}
        </div>
    ) : (
        rankingsEquipesWithPosition.length > 0 ? <Tabela dados={rankingsEquipesWithPosition} /> : <p>Nenhum dado disponível para o ranking das equipes.</p>
    );

    // Conteúdo da aba para atletas (nadadores), exibindo por gênero e categoria
    const atletaTabContent = errorNadadores ? (
        <div style={{ color: 'red', marginTop: '10px' }}>
            <strong>Erro:</strong> {errorNadadores}
        </div>
    ) : (
        <>
            <section>
                <h2>Ranking Masculino</h2>
                {Object.keys(groupedMasculino).length > 0 ? (
                    Object.keys(groupedMasculino).map(cat => (
                        <div key={cat}>
                            <h3>{cat}</h3>
                            <Tabela dados={groupedMasculino[cat]} />
                        </div>
                    ))
                ) : (
                    <p>Nenhum dado disponível para o ranking masculino.</p>
                )}
            </section>
            <section>
                <h2>Ranking Feminino</h2>
                {Object.keys(groupedFeminino).length > 0 ? (
                    Object.keys(groupedFeminino).map(cat => (
                        <div key={cat}>
                            <h3>{cat}</h3>
                            <Tabela dados={groupedFeminino[cat]} />
                        </div>
                    ))
                ) : (
                    <p>Nenhum dado disponível para o ranking feminino.</p>
                )}
            </section>
        </>
    );

    const tabs = [
        { label: 'Classificação por Equipe', content: equipeTabContent },
        { label: 'Classificação por Atleta', content: atletaTabContent },
    ];

    return (
        <>
            <Cabecalho />
            <div className={`${style.rankings}`}>
                <h1>Rankings</h1>
                <Abas tabs={tabs} />
            </div>
            <Rodape />
        </>
    );
};

export default Rankings;
