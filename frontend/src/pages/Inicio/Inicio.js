import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
    const [anoTorneio, setAnoTorneio] = useState('');
    const [noticias, setNoticias] = useState([]); // Estado para notícias
    const [equipes, setEquipes] = useState([]); // Estado para equipes
    const backendOrigin = process.env.REACT_APP_API_URL.replace('/api', '');
    const getImageUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `${backendOrigin}${url}`;
    };

    useEffect(() => {
        const fetchTorneioAberto = async () => {
            try {
                const response = await api.get('/etapas/torneioAberto');
                setAnoTorneio(response.data.nome);
            } catch (error) {
                console.error('Erro ao buscar torneio aberto:', error);
            }
        };

        fetchTorneioAberto();
    }, []);

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

    // Buscar equipes ativas para exibir logos
    useEffect(() => {
        const fetchEquipes = async () => {
            try {
                const response = await api.get('/equipes/listarEquipes');
                const equipesAtivas = response.data.filter(eq => eq.Ativo === 1 && eq.logo);
                setEquipes(equipesAtivas);
            } catch (error) {
                console.error('Erro ao carregar equipes:', error);
            }
        };
        fetchEquipes();
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
                <h1>ETAPAS {anoTorneio}</h1>
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
            {/* Seção de logos das equipes */}
            {equipes && equipes.length > 0 && (
                <section className={style.equipesSection}>
                    <h2>EQUIPES PARTICIPANTES</h2>
                    <div className={style.equipesContainer}>
                        {equipes.map((equipe) => (
                            <div key={equipe.id} className={style.equipeItem}>
                                <img 
                                    src={getImageUrl(equipe.logo)} 
                                    alt={equipe.Equipe} 
                                    className={style.equipeLogo}
                                    title={equipe.Equipe}
                                />
                            </div>
                        ))}
                    </div>
                </section>
            )}
            {/* Seção de Banners */}
            <section className={style.bannersSection}>
                <div className={style.bannersContainer}>
                    <Link to="#regulamento" className={style.banner}>
                        <div className={style.bannerContent}>
                            <h3>Regulamento</h3>
                            <p>Conheça as regras e normas da Liga</p>
                        </div>
                    </Link>
                    <Link to="/faca-parte" className={style.banner}>
                        <div className={style.bannerContent}>
                            <h3>Traga sua Equipe</h3>
                            <p>Cadastre sua equipe e participe</p>
                        </div>
                    </Link>
                </div>
            </section>
            <Rodape />
        </div>
    )
}

export default Inicio;