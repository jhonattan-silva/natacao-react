import { useEffect, useState } from 'react';
import Cabecalho from '../../componentes/Cabecalho/Cabecalho';
import Rodape from '../../componentes/Rodape/Rodape';
import Carrossel from '../../componentes/Carrossel/Carrossel';
import style from './Inicio.module.css';
import Card from '../../componentes/Card/Card';
import api from '../../servicos/api';

const formatDate = (dateString) => {
    const optionsDate = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: false };
    const date = new Date(dateString).toLocaleDateString('pt-BR', optionsDate);
    const time = new Date(dateString).toLocaleTimeString('pt-BR', optionsTime);
    return { date, time };
};

const Inicio = () => {
    const [etapas, setEtapas] = useState([]);

    useEffect(() => {
        const fetchEtapas = async () => {
            try {
                const response = await api.get('/etapas/listarEtapasAno'); // Chamar a API listaEtapas
                setEtapas(response.data); // Definir os Etapas no estado
            } catch (error) {
                console.error('Erro ao buscar Etapas:', error);
            }
        };

        fetchEtapas();
    }, []);

    return (
        <div>
            <Cabecalho />
            <Carrossel />
            <section className={style.container}>
                <h1>ETAPAS 2025</h1>
                <div className={style.cardsContainer}>
                    {etapas.map((etapa) => {
                        const { date, time } = formatDate(etapa.data);
                        return (
                            <Card 
                                key={etapa.id} 
                                nome={`${etapa.nome}`} 
                                data={`DATA: ${date}`} 
                                horario={`HORÁRIO: ${time}`} 
                                local={`ENDEREÇO: ${etapa.endereco}`} 
                                cidade={`LOCAL: ${etapa.cidade}`}
                                endereco={`ENDEREÇO: ${etapa.endereco}`} 
                            />
                        );
                    })}
                </div>
            </section>
            <Rodape />
        </div>
    )
}

export default Inicio;