import { useEffect, useState } from 'react';
import Cabecalho from '../../componentes/Cabecalho/Cabecalho';
import Rodape from '../../componentes/Rodape/Rodape';
import Carrossel from '../../componentes/Carrossel/Carrossel';
import style from './Inicio.module.css';
import Card from '../../componentes/Card/Card';
import api from '../../servicos/api';

const formataData = (dateString) => {
    const adjustedDate = new Date(dateString);
    adjustedDate.setHours(adjustedDate.getHours() + 3); // Adiciona 3 horas

    const optionsDate = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo' };

    const dataEvento = adjustedDate.toLocaleDateString('pt-BR', optionsDate);
    const horario = adjustedDate.toLocaleTimeString('pt-BR', optionsTime);

    return { dataEvento, horario };
};

const formatarParaMaps = (endereco, cidade) => {
    return `https://www.google.com/maps/search/${encodeURIComponent(endereco + ', ' + cidade)}`;
};

const Inicio = () => {
    const [etapas, setEtapas] = useState([]);

    useEffect(() => {
        const fetchEtapas = async () => {
            try {
                const response = await api.get('/etapas/listarEtapasAnoAtual'); // Chamar a API listaEtapas
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
                        const { dataEvento, horario } = formataData(etapa.data);
                        const mapsLink = formatarParaMaps(etapa.endereco, etapa.cidade);
                        return (
                            <Card 
                                key={etapa.id} 
                                nome={`${etapa.nome}`} 
                                data={`Data: ${dataEvento}`} 
                                horario={`Horário: ${horario}`} 
                                local={`Sede: ${etapa.sede}`} 
                                cidade={`Cidade: ${etapa.cidade}`}
                                endereco={<a href={mapsLink} target="_blank" rel="noopener noreferrer">Endereço: {etapa.endereco}</a>} 
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