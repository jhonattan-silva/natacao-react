import ListaSuspensa from '../../componentes/ListaSuspensa/ListaSuspensa';
import { useEffect, useMemo, useState, useContext } from 'react';
import style from './ResultadosEntrada.module.css';
import api from '../../servicos/api';
import Botao from '../../componentes/Botao/Botao';
import CabecalhoAdmin from '../../componentes/CabecalhoAdmin/CabecalhoAdmin';
import { ResultadosContext } from '../../servicos/ResultadoContext'; // Contexto para salvar temporariamente o resultado de cada nadador

const ResultadosEntrada = () => {
    const [eventos, setEventos] = useState([]); // Recebe todos eventos pela API
    const [eventoId, setEventoId] = useState(''); // Recebe o evento escolhido
    const [provas, setProvas] = useState([]); // Recebe todas provas pela API
    const [provaId, setProvaId] = useState(''); // Estado da prova selecionada
    const [baterias, setBaterias] = useState([]); // Recebe as baterias de cada prova
    const [erro, setErro] = useState(null); // Estado para erros
    const { resultados, salvarTempo } = useContext(ResultadosContext); // Contexto com os resultados
    const [inputSalvo, setInputSalvo] = useState(null); // Estado para controlar a estilização do input

    const apiEventos = '/resultadosEntrada/listarEventos';
    const apiProvasEvento = '/resultadosEntrada/listarProvasEvento';
    const apiBateriasProva = '/resultadosEntrada/listarBateriasProva';

    // URL dinâmica para buscar provas
    const urlProvasEvento = useMemo(() => {
        return eventoId ? `${apiProvasEvento}/${eventoId}` : null;
    }, [eventoId]);

    // Nome da prova selecionada
    const nomeProvaSelecionada = useMemo(() => {
        return provas.find((prova) => String(prova.prova_id) === String(provaId))?.nome || '';
    }, [provas, provaId]);

    // Listar os eventos
    useEffect(() => {
        const fetchEventos = async () => {
            try {
                const response = await api.get(apiEventos);
                if (Array.isArray(response.data)) {
                    setEventos(response.data);
                    setErro(null);
                } else {
                    console.error('ERRO: A resposta dos eventos não é array');
                    setErro('Erro nos dados do banco');
                }
            } catch (err) {
                console.error('Erro ao buscar eventos:', err.message);
                setErro('Erro ao buscar eventos');
            }
        };
        fetchEventos();
    }, []);

    // Listar as provas do evento escolhido
    useEffect(() => {
        if (!eventoId) return;

        const fetchProvas = async () => {
            try {
                const response = await api.get(urlProvasEvento);
                if (Array.isArray(response.data)) {
                    setProvas(response.data);
                    setErro(null);
                } else {
                    console.error('ERRO: A resposta das provas não é array');
                    setErro('Erro nos dados vindos do banco');
                }
            } catch (err) {
                console.error('Erro ao buscar provas:', err.message);
                setErro('Erro ao buscar provas');
            }
        };

        fetchProvas();
    }, [eventoId]);

    // Listar baterias da prova escolhida
    useEffect(() => {
        if (!provaId) return;

        const fetchBaterias = async () => {
            try {
                const response = await api.get(`${apiBateriasProva}/${provaId}`);
                if (Array.isArray(response.data)) {
                    const bateriasComTempos = response.data.map((bateria) => ({
                        ...bateria,
                        nadadores: bateria.nadadores.map((nadador) => {
                            const tempoSalvo = resultados[provaId]?.[nadador.id];
                            return tempoSalvo ? { ...nadador, tempo: tempoSalvo } : nadador;
                        }),
                    }));
                    setBaterias(bateriasComTempos);
                    setErro(null);
                } else {
                    console.error('ERRO: A resposta das baterias não é array');
                    setErro('Erro nos dados vindos do banco');
                }
            } catch (err) {
                console.error('Erro ao buscar baterias:', err.message);
                setErro('Erro ao buscar baterias');
            }
        };

        fetchBaterias();
    }, [provaId, resultados]); // Add 'resultados' to dependencies

    // Atualizar tempos no estado local
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

    // Carregar valores salvos do contexto ao atualizar baterias
    useEffect(() => {
        if (!resultados || !provaId || baterias.length === 0) return;

        const novasBaterias = baterias.map((bateria) => ({
            ...bateria,
            nadadores: bateria.nadadores.map((nadador) => {
                const tempoSalvo = resultados[provaId]?.[nadador.id];
                return tempoSalvo ? { ...nadador, tempo: tempoSalvo } : nadador;
            }),
        }));

        setBaterias(novasBaterias);
    }, [resultados, provaId, baterias.length]); // Add 'baterias.length' to dependencies

    const handleBlur = (bateriaId, nadadorId, tempo) => {
        salvarTempo(provaId, nadadorId, tempo);
        setInputSalvo({ bateriaId, nadadorId });
    };

    const formatarTempo = (tempo) => {
        const apenasNumeros = tempo.replace(/\D/g, '');
        const limitado = apenasNumeros.slice(-6);
        const preenchido = limitado.padStart(6, '0');
        const minutos = preenchido.slice(0, 2);
        const segundos = preenchido.slice(2, 4);
        const centesimos = preenchido.slice(4, 6);
        return `${minutos}:${segundos}:${centesimos}`;
    };

    const handleTempoChange = (bateriaId, nadadorId, valor) => {
        const tempoFormatado = formatarTempo(valor);
        atualizarTempo(bateriaId, nadadorId, tempoFormatado);
        salvarTempo(provaId, nadadorId, tempoFormatado); // Save the formatted time to context
    };

    const aoSalvar = async () => {
        try {
            const dados = baterias.map((bateria) => ({
                bateriaId: bateria.id,
                nadadores: bateria.nadadores.map((nadador) => ({
                    id: nadador.id,
                    tempo: nadador.tempo,
                })),
            }));
            await api.post('/resultadosEntrada/salvarResultados', { provaId, dados });
            alert('Resultados salvos com sucesso!');
        } catch (err) {
            console.error('Erro ao salvar resultados:', err.message);
            alert('Erro ao salvar resultados. Tente novamente.');
        }
    };

    return (
        <div className={style.resultadosEntrada}>
            <CabecalhoAdmin />
            <div className={style.opcoesContainer}>
                <h1>RESULTADOS DO EVENTO</h1>
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
                        selectId="prova_id"
                    />
                )}
            </div>
            <div className={style.listagemContainer}>
                {baterias.length > 0 && (
                    <section>
                        <h1>Prova: {nomeProvaSelecionada}</h1>
                        {baterias.map((bateria) => (
                            <div key={bateria.id} className={style.bateriaContainer}>
                                <h2>{bateria.numeroBateria}</h2>
                                {bateria.nadadores.map((nadador) => (
                                    <div key={nadador.id} className={style.nadadorContainer}>
                                        <span className={style.nadadorNome}>{nadador.nome}</span>
                                        <input
                                            type="text"
                                            placeholder="Digite o tempo realizado"
                                            value={nadador.tempo || ''}
                                            onChange={(e) => handleTempoChange(bateria.id, nadador.id, e.target.value)}
                                            onBlur={() => handleBlur(bateria.id, nadador.id, nadador.tempo)}
                                            className={`${style.nadadorInput} ${
                                                inputSalvo?.bateriaId === bateria.id && inputSalvo?.nadadorId === nadador.id
                                                    ? style.inputSalvo
                                                    : ''
                                            } ${
                                                resultados[provaId]?.[nadador.id] ? style.inputSalvo : ''
                                            }`}
                                        />
                                        <label>
                                            <input
                                                type="checkbox"
                                                name={`nc-${nadador.id}`}
                                                value="NC"
                                            />
                                            NC
                                        </label>
                                        <label>
                                            <input
                                                type="checkbox"
                                                name={`desc-${nadador.id}`}
                                                value="DESC"
                                            />
                                            DESC
                                        </label>
                                    </div>
                                ))}
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
