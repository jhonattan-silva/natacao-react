import React, { useEffect, useState } from 'react';
import api from '../../servicos/api';
import Tabela from '../../componentes/Tabela/Tabela';
import Abas from '../../componentes/Abas/Abas';
import style from './Rankings.module.css';
import Cabecalho from '../../componentes/Cabecalho/Cabecalho';
import Rodape from '../../componentes/Rodape/Rodape';

const Rankings = () => {
    const [torneiosId, setTorneiosId] = useState(null); // Será preenchido dinamicamente

    const [rankingsEquipes, setRankingsEquipes] = useState([]);
    const [errorEquipes, setErrorEquipes] = useState(null);
    const [rankingsNadadores, setRankingsNadadores] = useState({ masculino: [], feminino: [] });
    const [errorNadadores, setErrorNadadores] = useState(null);

    // novo estado para ranking mirim geral
    const [rankingMirimGeral, setRankingMirimGeral] = useState([]);
    const [errorMirimGeral, setErrorMirimGeral] = useState(null);

    // Buscar o torneio aberto ao montar o componente
    useEffect(() => {
        const fetchTorneioAberto = async () => {
            try {
                const response = await api.get('/etapas/torneioAberto');
                setTorneiosId(response.data.id);
            } catch (error) {
                console.error('Erro ao buscar torneio aberto:', error);
                // Fallback para um ID padrão se falhar
                setTorneiosId(3);
            }
        };
        fetchTorneioAberto();
    }, []);

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

    // fetch para ranking mirim geral
    const fetchRankingMirimGeral = async () => {
        try {
            const response = await api.get(`/rankings/ranking-mirim-geral/${torneiosId}`);
            if (!Array.isArray(response.data)) throw new Error('Resposta inesperada');
            setRankingMirimGeral(response.data);
            setErrorMirimGeral(null);
        } catch (err) {
            console.error('Erro ao buscar ranking mirim geral:', err);
            setErrorMirimGeral(err.message);
        }
    };

    useEffect(() => {
        fetchRankingsEquipes();
        fetchRankingsNadadores();
        fetchRankingMirimGeral(); // carrega também o ranking mirim
    }, [torneiosId]);

    /*
     * Adiciona posição considerando empates:
     * - Mesma pontuação → mesma posição
     * - Próxima posição = posição anterior + número de itens avaliados
     */
    const addPosicaoNoRanking = (ranking) => {
        let pontuacaoAnterior = null;
        let posicaoAtual = 0;
        let offset = 1;
        let posicaoAnterior = null; 
        return ranking.map((item, idx) => {
            const pontos = item.Pontos !== undefined ? item.Pontos : item.pontos;
            let posicao = '';
            if (pontos !== pontuacaoAnterior) {
                posicaoAtual = offset;
                posicao = posicaoAtual;
                posicaoAnterior = posicaoAtual;
                pontuacaoAnterior = pontos;
            } else {
                posicao = ''; // Suprime a posição nos empatados
            }
            offset++;
            return { posicao, ...item };
        });
    };

    // Agrupa nadadores por categoria, incluindo pontos normalizados
    const groupedMasculino = rankingsNadadores.masculino.reduce((acc, curr) => {
        const cat = curr.categoria || curr.Categoria;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push({
            ...curr,
            Pontos: Number(curr.Pontos || curr.pontos || 0) // normaliza o campo, mas mantém o nome original
        });
        return acc;
    }, {});
    const groupedFeminino = rankingsNadadores.feminino.reduce((acc, curr) => {
        const cat = curr.categoria || curr.Categoria;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push({
            ...curr,
            Pontos: Number(curr.Pontos || curr.pontos || 0)
        });
        return acc;
    }, {});

    // Adiciona posição usando o campo pontos normalizado
    Object.keys(groupedMasculino).forEach(cat => {
        groupedMasculino[cat] = addPosicaoNoRanking(groupedMasculino[cat]);
    });
    Object.keys(groupedFeminino).forEach(cat => {
        groupedFeminino[cat] = addPosicaoNoRanking(groupedFeminino[cat]);
    });

    // Normaliza ranking de equipes, padronizando a key 'pontos'
    const normalizedRankingsEquipes = rankingsEquipes.map(item => ({
        equipes_id: item.equipes_id,
        equipe: item.Equipe || item.equipe,
        pontos: Number(item.Pontos || item.pontos || 0)
    }));
    const rankingsEquipesWithPosition = addPosicaoNoRanking(normalizedRankingsEquipes);

    // Normaliza ranking mirim geral
    const normalizedRankingMirim = rankingMirimGeral.map(item => ({
        equipes_id: item.equipes_id,
        equipe: item.equipe_nome,
        pontos: Number(item.pontos_total || item.pontos || 0)
    }));
    const mirimWithPosition = addPosicaoNoRanking(normalizedRankingMirim);

    // Conteúdo da aba para equipes + mirim juntos
    const equipeTabContent = errorEquipes ? (
        <div style={{ color: 'red', marginTop: '10px' }}>
            <strong>Erro:</strong> {errorEquipes}
        </div>
    ) : (
        <>
            {/* Ranking normal de equipes */}
            {rankingsEquipesWithPosition.length > 0 ? (
                <Tabela
                    dados={rankingsEquipesWithPosition}
                    textoExibicao={{ posicao: 'Posição', equipe: 'Equipe', pontos: 'Pontos' }}
                    colunasOcultas={['equipes_id']} // esconde id interno
                />
            ) : (
                <p>Nenhum dado disponível para o ranking das equipes.</p>
            )}

            {/* Ranking Mirim Geral abaixo */}
            <h2 style={{ marginTop: '2rem' }}>Ranking Mirim Geral</h2>
            {errorMirimGeral ? (
                <div style={{ color: 'red' }}>{errorMirimGeral}</div>
            ) : mirimWithPosition.length > 0 ? (
                <Tabela
                    dados={mirimWithPosition}
                    textoExibicao={{ posicao: 'Posição', equipe: 'Equipe', pontos: 'Pontos Mirim' }}
                    colunasOcultas={['equipes_id']} // esconde id interno
                />
            ) : (
                <p>Nenhum dado mirim disponível.</p>
            )}
        </>
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
                            <Tabela
                                dados={groupedMasculino[cat]}
                                colunasOcultas={['categoria', 'Categoria']}
                            />
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
                            <Tabela
                                dados={groupedFeminino[cat]}
                                colunasOcultas={['categoria', 'Categoria']}
                            />
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
        { label: 'Classificação por Atleta', content: atletaTabContent }
    ];

    return (
        <>
            <Cabecalho />
            <div className={style.rankings}>
                <h1>Rankings</h1>
                <Abas tabs={tabs} />
            </div>
            <Rodape />
        </>
    );
};

export default Rankings;
