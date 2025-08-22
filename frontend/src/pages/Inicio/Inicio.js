import { useEffect, useState } from 'react';
import Cabecalho from '../../componentes/Cabecalho/Cabecalho';
import Rodape from '../../componentes/Rodape/Rodape';
import Carrossel from '../../componentes/Carrossel/Carrossel';
import style from './Inicio.module.css';
import Card from '../../componentes/Card/Card';
import api from '../../servicos/api';
import { formataData } from '../../servicos/functions';

const formatarParaMaps = (endereco, cidade) => {
    return `https://www.google.com/maps/search/${encodeURIComponent(endereco + ', ' + cidade)}`;
};

const Inicio = () => {
    const [etapas, setEtapas] = useState([]);
    const [noticias, setNoticias] = useState([]); // Estado para notícias
    const backendOrigin = process.env.REACT_APP_API_URL;
    const getImageUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        if (backendOrigin) return `${backendOrigin}${url}`;
        return url;
    };

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

    // Buscar notícias para o carrossel
    useEffect(() => {
        const fetchNoticias = async () => {
            try {
                const response = await api.get('/news');
                setNoticias(response.data);
            } catch (error) {
                console.error('Erro ao carregar notícias:', error);
            }
        };
        fetchNoticias();
    }, []);

    // Seleciona os três primeiros itens (mais recentes)
    const newsSlides = noticias.slice(0, 3);
    // Mapeia as notícias para o formato esperado pelo Carrossel
    const slidesData = newsSlides.map(news => ({
        image: getImageUrl(news.imagem),
        title: news.titulo,
        subtitle: news.subtitulo, 
        link: `/noticias/${new Date(news.data).getFullYear()}/${news.slug}`
    }));

    return (
        <div>
            <Cabecalho />
            {/* Carrossel para Notícias */}
            {slidesData.length > 0 && (
                <section className={style.noticiasCarrossel}>
                    <Carrossel slides={slidesData} autoSlideTime={15000} />
                </section>
            )}
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
                                balizamento={etapa.teve_balizamento === 1 && (
                                    <a href={`/balizamentos/${etapa.id}`} target="_blank" rel="noopener noreferrer">
                                        Balizamento
                                    </a>
                                )}
                                resultados={etapa.teve_resultados === 1 && (
                                    <a href={`/resultados/${etapa.id}`}>
                                        Resultados
                                    </a>
                                )}
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