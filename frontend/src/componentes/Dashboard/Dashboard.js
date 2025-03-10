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

    useEffect(() => {
        if (loading) return;

        const equipeId = equipeIdProp || user?.equipeId; // Usa o prop se existir, senão pega do contexto
        if (!equipeId) return;

        const apiInscritosEquipe = `/estatisticas/inscricoesEquipe/${equipeId}`;
        const apiEquipes = '/estatisticas/equipes';

        const fetchInscricoes = async () => {
            try {
                const response = await api.get(apiInscritosEquipe);
                setDadosInscricoes(response.data);
            } catch (error) {
                console.error('Erro ao buscar dados de inscrições:', error);
            }
        };

        const fetchEquipes = async () => {
            try {
                const response = await api.get(apiEquipes);
                setDadosEquipes(response.data);
            } catch (error) {
                console.error('Erro ao buscar dados de equipes:', error);
            }
        };

        fetchInscricoes();
        fetchEquipes();
    }, [user, loading, equipeIdProp]);

    if (loading) return <div>Carregando...</div>;
    if (!user && !equipeIdProp) return <div>Usuário não autenticado</div>;

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