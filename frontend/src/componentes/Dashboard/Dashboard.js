import { useEffect, useState } from 'react';
import { useUser } from '../../servicos/UserContext';
import api from '../../servicos/api';
import style from './Dashboard.module.css';
import InscricoesCard from './InscricoesCard';
import EquipesCard from './EquipesCard';

const Dashboard = ({ equipeId: equipeIdProp }) => {
    const { user, loading } = useUser();
    const [dadosInscricoes, setDadosInscricoes] = useState(null);
    const [dadosEquipes, setDadosEquipes] = useState(null);
    const [erro, setErro] = useState(null);
    const [carregando, setCarregando] = useState(false);

    useEffect(() => {
        if (loading) return;

        // Validar equipeId antes de fazer requisições
        const equipeId = equipeIdProp || (Array.isArray(user?.equipeId) ? user.equipeId[0] : user?.equipeId);
        
        if (!equipeId || equipeId === 'undefined') {
            setErro('Nenhuma equipe vinculada ao usuário');
            return;
        }

        const fetchDados = async () => {
            setCarregando(true);
            setErro(null);

            try {
                // Buscar inscrições apenas se a equipe estiver ativa
                if (user?.equipeAtiva !== 0) {
                    try {
                        const responseInscricoes = await api.get(`/estatisticas/inscricoesEquipe/${equipeId}`);
                        setDadosInscricoes(responseInscricoes.data);
                    } catch (error) {
                        console.warn('Erro ao buscar inscrições:', error);
                        setDadosInscricoes(null); // Não falha todo o dashboard
                    }
                }

                // Buscar dados gerais de equipes
                try {
                    const responseEquipes = await api.get('/estatisticas/equipes');
                    setDadosEquipes(responseEquipes.data);
                } catch (error) {
                    console.warn('Erro ao buscar equipes:', error);
                    setDadosEquipes(null);
                }
            } catch (error) {
                console.error('Erro geral no dashboard:', error);
                setErro('Erro ao carregar dados do dashboard');
            } finally {
                setCarregando(false);
            }
        };

        fetchDados();
    }, [user, loading, equipeIdProp]);

    if (loading || carregando) return <div className={style.loading}>⏳ Carregando...</div>;
    
    if (erro) {
        return (
            <section className={style.dashboardContainer}>
                <div className={style.erro}>⚠️ {erro}</div>
            </section>
        );
    }

    if (!user && !equipeIdProp) return <div className={style.erro}>Usuário não autenticado</div>;

    // Se equipe inativa, mostrar mensagem específica
    if (user?.equipeAtiva === 0) {
        return (
            <section className={style.dashboardContainer}>
                <h2>📊 Dashboard</h2>
                <div className={style.avisoInativa}>
                    <p>🔴 Sua equipe está <strong>INATIVA</strong></p>
                    <p>Entre em contato com a administração para regularizar</p>
                </div>
                <div className={style.cardsContainer}>
                    <EquipesCard dados={dadosEquipes} />
                </div>
            </section>
        );
    }

    return (
        <section className={style.dashboardContainer}>
            <h2>📊 Dashboard</h2>
            <div className={style.cardsContainer}>
                <InscricoesCard dados={dadosInscricoes} />
                <EquipesCard dados={dadosEquipes} />
            </div>
        </section>
    );
};

export default Dashboard;