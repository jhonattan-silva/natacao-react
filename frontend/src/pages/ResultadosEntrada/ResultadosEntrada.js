import ListaSuspensa from '../../componentes/ListaSuspensa/ListaSuspensa';
import Formulario from '../../componentes/Formulario/Formulario';
import { useEffect, useMemo, useState } from 'react';
import style from './ResultadosEntrada.style.css';
import api from '../../servicos/api';
import Botao from '../../componentes/Botao/Botao';

const ResultadosEntrada = () => {
    const [eventos, setEventos] = useState([]);//recebe todos eventos pela api
    const [eventoId, setEventoId] = useState(''); //recebe o evento escolhido
    const [provas, setProvas] = useState([]); //recebe todas provas pela api
    const [provaId, setProvaId] = useState(''); //estado da prova selecionada
    const [baterias, setBaterias] = useState([]); //recebe as baterias de cada prova
    const [erro, setErro] = useState(null); //estado para erros

    const apiEventos = '/resultadosEntrada/listarEventos';
    const apiProvasEvento = '/resultadosEntrada/listarProvasEvento';
    const apiBateriasProva = '/resultadosEntrada/listarBateriasProva';

    // URL dinâmica para buscar provas
    //useMemo cria a URL de forma eficiente, recalculando-a apenas quando o eventoId mudar.
    //Isso evita problemas de renderização desnecessária.
    const urlProvasEvento = useMemo(() => {
        return eventoId ? `${apiProvasEvento}/${eventoId}` : null; // Somente define a URL quando há um evento selecionado
    }, [eventoId]);


    // Nome da prova selecionada para não fazer busca desnecessária no banco
    const nomeProvaSelecionada = useMemo(() => {
        console.log('Provas disponíveis:', provas); // Exibe todas as provas
        console.log('Prova selecionada (ID):', provaId); // Exibe o ID selecionado
        return provas.find((prova) => String(prova.prova_id) === String(provaId))?.nome || '';
    }, [provas, provaId]);
    

    //Listar os eventos
    useEffect(() => {
        const fetchEventos = async () => {
            try {
                const response = await api.get(apiEventos);
                if (Array.isArray(response.data)) { //verificação se a resposta está no formato desejado
                    setEventos(response.data[0]?.id || ''); //recebe o campo id da resposta da api
                    setErro(null);                    
                } else {
                    console.error('ERRO: A resposta dos eventos não é array');
                    setErro('Erro nos dados do banco');
                }
            } catch (err) {
                console.error('Erro ao buscar eventos');
                setErro('Erro ao buscar os eventos', err.message);
            }
        };
        fetchEventos();
    }, []);

    //Listar as Provas do evento escolhido acima
    useEffect(() => {
        if (!eventoId) return; // Não busca provas sem um evento selecionado

        const fetchProvas = async () => {
            try {
                const response = await api.get(urlProvasEvento);

                // Validação com base na estrutura da resposta
                if (Array.isArray(response.data)) {
                    setProvas(response.data); // Atualiza o estado com o array completo
                    setErro(null); // Nenhum erro
                    
                    console.log("RETORNO>>>>>", response.data);
                } else {
                    console.error('ERRO: A resposta das provas não é array', response.data);
                    setErro('Erro nos dados vindos do banco');
                }
            } catch (err) {
                console.error('Erro ao buscar provas:', err.message);
                setErro(`Erro ao buscar provas: ${err.message}`);
            }
        };

        fetchProvas();
    }, [eventoId]);     //para recarregar toda vez que mudar o ID DO EVENTO

    useEffect(() => {
        if (!provaId) return; //se não tiver escolhido a prova ainda
    
        const fetchBaterias = async () => {
            try {
                const urlBateriasEvento = `${apiBateriasProva}/${provaId}`;
                console.log("Buscando baterias da prova:", urlBateriasEvento);
    
                const response = await api.get(urlBateriasEvento);
                console.log("Resposta da API de baterias:", response.data);
    
                if (Array.isArray(response.data)) {
                    console.log("Baterias recebidas:", response.data);
                    setBaterias(response.data);
                    setErro(null);
                } else {
                    console.error("Resposta inesperada:", response.data);
                    setErro("Erro nos dados recebidos.");
                }
            } catch (err) {
                console.error("Erro ao buscar baterias:", err.message);
                setErro("Erro ao buscar baterias.");
            }
        };
        fetchBaterias();
    }, [provaId]);
    
     // Atualizar tempos no estado
     const atualizarTempo = (bateriaId, nadadorId, novoTempo) => {
        setBaterias((prev) =>
            prev.map((bateria) =>
                bateria.id === bateriaId
                    ? {
                        ...bateria,
                        nadadores: bateria.nadadores.map((nadador) =>
                            nadador.id === nadadorId
                                ? { ...nadador, tempo: novoTempo }
                                : nadador
                        ),
                    }
                    : bateria
            )
        );
    };

    // Salvar dados no backend
    const aoSalvar = async () => {
        try {
            const dados = baterias.map((bateria) => ({
                bateriaId: bateria.id,
                nadadores: bateria.nadadores.map((nadador) => ({
                    id: nadador.id,
                    tempo: nadador.tempo,
                })),
            }));
            console.log('Enviando dados para o backend:', dados);
            await api.post('/resultadosEntrada/salvarResultados', { provaId, dados });
            alert('Resultados salvos com sucesso!');
        } catch (err) {
            console.error('Erro ao salvar resultados:', err.message);
            alert('Erro ao salvar resultados. Tente novamente.');
        }
    };

    console.log("PROVA SELECIONADA______", nomeProvaSelecionada);
    return (
        <div className={style.resultadosEntrada}>
            <div className={style.opcoesContainer}>
                <ListaSuspensa
                    fonteDados={apiEventos}
                    textoPlaceholder="Escolha o evento"
                    onChange={setEventoId}
                    obrigatorio
                />
                {eventoId && (
                    <ListaSuspensa
                        fonteDados={urlProvasEvento}
                        textoPlaceholder="Escolha a prova disputada"
                        onChange={setProvaId}
                        selectId='prova_id'
                    />
                )}
            </div>
            <div className={style.listagemContainer}>
                {baterias.length > 0 && (
                    <section>
                        <h1>Prova: {nomeProvaSelecionada}</h1>
                        {baterias.map((bateria) => (
                            <div key={bateria.id}>
                                <h2>{bateria.numeroBateria}</h2>
                                <Formulario
                                    inputs={bateria.nadadores.map((nadador) => ({
                                        id: nadador.id,
                                        label: nadador.nome,
                                        tipo: 'text',
                                        placeholder: 'Digite o tempo realizado',
                                        valor: nadador.tempo || '',
                                        obrigatorio: true,
                                        aoAlterar: (novoTempo) => atualizarTempo(bateria.id, nadador.id, novoTempo),
                                    }))}
                                />
                            </div>
                        ))}
                    </section>
                )}
                <Botao onClick={aoSalvar} className={style.btnSalvar}>
                    Salvar Resultados
                </Botao>
            </div>
        </div>
    );
};

export default ResultadosEntrada;