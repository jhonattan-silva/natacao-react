import ListaSuspensa from '../../componentes/ListaSuspensa/ListaSuspensa';
import { useEffect, useMemo, useState, useContext } from 'react';
import style from './ResultadosEntrada.module.css';
import api from '../../servicos/api';
import Botao from '../../componentes/Botao/Botao';
import CabecalhoAdmin from '../../componentes/CabecalhoAdmin/CabecalhoAdmin';
import { ResultadosContext } from '../../servicos/ResultadoContext'; // Contexto para salvar temporariamente o resultado de cada nadador
import CheckboxGroup from '../../componentes/CheckBoxGroup/CheckBoxGroup';

const ResultadosEntrada = () => {
    const [eventos, setEventos] = useState([]); // Recebe todos eventos pela API
    const [eventoId, setEventoId] = useState(''); // Recebe o evento escolhido
    const [provas, setProvas] = useState([]); // Recebe todas provas pela API
    const [provaId, setProvaId] = useState(''); // Estado da prova selecionada
    const [baterias, setBaterias] = useState([]); // Recebe as baterias de cada prova
    const [erro, setErro] = useState(null); // Estado para erros
    const { resultados, salvarTempo } = useContext(ResultadosContext); // Contexto com os resultados
    const [inputSalvo, setInputSalvo] = useState(null); // Estado para controlar a estilização do input
    const [checkboxes, setCheckboxes] = useState({}); // Estado para os checkboxes
    const [valoresBanco, setValoresBanco] = useState({}); // Novo estado para os tempos do banco

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

    // Listar Séries da prova escolhida
    useEffect(() => {
        if (!provaId) return;

        const fetchBaterias = async () => {
            try {
                const response = await api.get(`${apiBateriasProva}/${provaId}`);
                if (Array.isArray(response.data)) {
                    const bateriasComTempos = response.data.map((bateria) => ({
                        ...bateria,
                        id: bateria.bateriaId, // Mapeia bateriaId para id
                        nadadores: bateria.nadadores.map((nadador) => {
                            const tempoSalvo = resultados[provaId]?.[nadador.id];
                            return tempoSalvo ? { ...nadador, tempo: tempoSalvo } : nadador;
                        }),
                    }));
                    setBaterias(bateriasComTempos);

                    // Armazena os tempos carregados do banco
                    const dbMapping = {};
                    response.data.forEach((bateria) => {
                        bateria.nadadores.forEach((nadador) => {
                            if (nadador.tempo) {
                                dbMapping[nadador.id] = nadador.tempo;
                            }
                        });
                    });
                    setValoresBanco({ [provaId]: dbMapping });

                    setErro(null);
                } else {
                    console.error('ERRO: A resposta das Séries não é array');
                    setErro('Erro nos dados vindos do banco');
                }
            } catch (err) {
                console.error('Erro ao buscar Séries:', err.message);
                setErro('Erro ao buscar Séries');
            }
        };

        fetchBaterias();
    }, [provaId, resultados]); // Add 'resultados' to dependencies

    useEffect(() => {
        if (baterias.length > 0) {
            console.log("Baterias recebidas:", baterias);
            const newStates = {};
            baterias.forEach(bateria => {
                bateria.nadadores.forEach(nadador => {
                    console.log(`Nadador ${nadador.id} - Status do banco: ${nadador.status}`);
                    newStates[nadador.id] = {
                        nc: nadador.status === 'NC', // Define o estado do checkbox NC
                        desc: nadador.status === 'DESC', // Define o estado do checkbox DESC
                    };
                });
            });
            console.log("Novos estados dos checkboxes:", newStates);
            setCheckboxes(newStates);
        }
    }, [baterias]);

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

    // Carregar valores salvos do contexto ao atualizar Séries
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
    }, [resultados, provaId, baterias.length]); // Add 'Séries.length' to dependencies

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

    // Atualiza estados no handleCheckboxChange com logs para ver as mudanças
    const handleCheckboxChange = (nadadorId, tipo, value) => {
        setCheckboxes(prev => {
             const atual = prev[nadadorId] || { nc: false, desc: false };
             let novoEstado;
             if (tipo === 'nc' && value) {
                 novoEstado = { nc: true, desc: false };
             } else if (tipo === 'desc' && value) {
                 novoEstado = { nc: false, desc: true };
             } else {
                 novoEstado = { ...atual, [tipo]: value };
             }
             return { ...prev, [nadadorId]: novoEstado };
        });
    };

    const aoSalvar = async () => {
        // Validação: cada nadador deve ter um tempo ou exatamente um checkbox marcado
        for (const bateria of baterias) {
            for (const nadador of bateria.nadadores) {
                const cb = checkboxes[nadador.id] || { nc: false, desc: false };
                if (!nadador.tempo && !(cb.nc || cb.desc)) {
                    alert("SALVAR APÓS PREENCHER TODOS OS NADADORES");
                    return;
                }
                if (cb.nc && cb.desc) {
                    alert("SALVAR APÓS PREENCHER TODOS OS NADADORES");
                    return;
                }
            }
        }
        try {
            const dados = baterias.map((bateria) => ({
                bateriaId: bateria.id,
                nadadores: bateria.nadadores.map((nadador) => {
                    const cb = checkboxes[nadador.id] || { nc: false, desc: false };
                    const status = cb.nc ? "NC" : (cb.desc ? "DESC" : "OK");
                    // Fornece tempo padrão se inexistente (para status "NC" ou "DESC")
                    return { id: nadador.id, tempo: nadador.tempo || null, status };
                }),
            }));
            // Lookup the selected prova object to get the correct eventos_provas_id
            const selectedProva = provas.find(prova => String(prova.prova_id) === String(provaId));
            if (!selectedProva) {
                throw new Error('Prova selecionada não encontrada.');
            }
            const eventosProvasId = selectedProva.eventos_provas_id;
            console.log('Dados a serem salvos:', { provaId: eventosProvasId, dados });
            await api.post('/resultadosEntrada/salvarResultados', { provaId: eventosProvasId, dados });
            alert('Resultados salvos com sucesso!');
            window.location.reload();
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
                        {baterias.map((bateria) => {
                            // Calcula se todos os nadadores já possuem resultado salvo
                            const provaSalva = bateria.nadadores.every(nadador => 
                                valoresBanco[provaId] && 
                                valoresBanco[provaId][nadador.id] && 
                                nadador.tempo === valoresBanco[provaId][nadador.id]
                            );
                            return (
                                <div key={bateria.id} className={style.bateriaContainer}>
                                    <h2>{bateria.numeroBateria}</h2>
                                    {provaSalva && <span className={style.provaSalva}>PROVA SALVA</span>}
                                    {bateria.nadadores.map((nadador) => {
                                        // Define a classe do input de acordo com o valor: azul se igual ao do banco, senão verde se temporário
                                        const isSalvoBanco = valoresBanco[provaId] && valoresBanco[provaId][nadador.id] && nadador.tempo === valoresBanco[provaId][nadador.id];
                                        const isTemporario = inputSalvo?.bateriaId === bateria.id && inputSalvo?.nadadorId === nadador.id || resultados[provaId]?.[nadador.id];
                                        return (
                                            <div key={nadador.id} className={style.nadadorContainer}>
                                                <span className={style.nadadorNome}>{nadador.nome}</span>
                                                <input
                                                    type="text"
                                                    placeholder="Digite o tempo realizado"
                                                    value={nadador.tempo || ''}
                                                    onChange={(e) => handleTempoChange(bateria.id, nadador.id, e.target.value)}
                                                    onBlur={() => handleBlur(bateria.id, nadador.id, nadador.tempo)}
                                                    disabled={checkboxes[nadador.id]?.nc || checkboxes[nadador.id]?.desc}
                                                    className={`${style.nadadorInput} ${isSalvoBanco ? style.inputBanco : isTemporario ? style.inputSalvo : ''
                                                        }`}
                                                />
                                                {/* Substituído os checkboxes antigos pelo CheckboxGroup */}
                                                <CheckboxGroup
                                                    titulo=""
                                                    opcoes={[{ id: 'nc', label: 'NC' }, { id: 'desc', label: 'DESC' }]}
                                                    selecionadas={
                                                        (() => {
                                                            const selecionadas = [];
                                                            if (checkboxes[nadador.id]?.nc) selecionadas.push('nc');
                                                            if (checkboxes[nadador.id]?.desc) selecionadas.push('desc');
                                                            return selecionadas;
                                                        })()
                                                    }
                                                    aoAlterar={(value, checked) => handleCheckboxChange(nadador.id, value, checked)}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
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
