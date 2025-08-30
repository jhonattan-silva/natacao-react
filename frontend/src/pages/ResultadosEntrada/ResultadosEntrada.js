import ListaSuspensa from '../../componentes/ListaSuspensa/ListaSuspensa';
import { useEffect, useMemo, useState, useContext } from 'react';
import style from './ResultadosEntrada.module.css';
import api from '../../servicos/api';
import Botao from '../../componentes/Botao/Botao';
import CabecalhoAdmin from '../../componentes/CabecalhoAdmin/CabecalhoAdmin';
import { ResultadosContext } from '../../servicos/ResultadoContext'; // Contexto para salvar temporariamente o resultado de cada nadador
import CheckboxGroup from '../../componentes/CheckBoxGroup/CheckBoxGroup';
import useAlerta from '../../hooks/useAlerta'; // <-- Adicione este import

// Configurar timeout para 60 segundos (60000 ms)
api.defaults.timeout = 60000; 

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
    const { mostrar: mostrarAlerta, componente: componenteAlerta } = useAlerta(); // <-- useAlerta hook

    const apiEventos = '/resultadosEntrada/listarEventos';
    const apiProvasEvento = '/resultadosEntrada/listarProvasEvento';
    const apiBateriasProva = '/resultadosEntrada/listarBateriasProva';

    // URL dinâmica para buscar provas
    const urlProvasEvento = useMemo(() => {
        return eventoId ? `${apiProvasEvento}/${eventoId}` : null;
    }, [eventoId]);

    // Nome da prova selecionada
    const nomeProvaSelecionada = useMemo(() => {
        return provas.find((prova) => String(prova.prova_id) === String(provaId))?.nome_prova || '';
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
        
        setProvas([]);
        setProvaId('');
        setBaterias([]);
        setCheckboxes({});
        setValoresBanco({});
        localStorage.removeItem('resultados'); // Limpa dados antigos

        const fetchProvas = async () => {
            try {
                const response = await api.get(urlProvasEvento);
                if (Array.isArray(response.data)) {
                    setProvas(response.data);
                    setErro(null);
                } else {
                    setErro('Erro nos dados vindos do banco');
                }
            } catch (err) {
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
                // Inclui eventoId na URL para filtrar o evento atual
                const response = await api.get(`${apiBateriasProva}/${provaId}?eventoId=${eventoId}`);
                if (Array.isArray(response.data)) {
                    const bateriasComTempos = response.data.map((bateria) => ({
                        ...bateria,
                        id: bateria.bateriaId,
                        nadadores: bateria.nadadores.map((nadador) => ({
                            ...nadador,
                            tempo: resultados[provaId]?.[nadador.id] || nadador.tempo || '',
                        })),
                        equipes: bateria.equipes.map((equipe) => ({
                            ...equipe,
                            tempo: resultados[provaId]?.[equipe.id] || equipe.tempo || '',
                        })),
                    }));
                    setBaterias(bateriasComTempos);
    
                    const dbMapping = {};
                    response.data.forEach((bateria) => {
                        bateria.nadadores.forEach((nadador) => {
                            if (nadador.tempo) dbMapping[nadador.id] = nadador.tempo;
                        });
                        bateria.equipes.forEach((equipe) => {
                            if (equipe.tempo) dbMapping[equipe.id] = equipe.tempo;
                        });
                    });
                    setValoresBanco({ [provaId]: dbMapping });
                    setErro(null);
                } else {
                    setErro('Erro nos dados vindos do banco');
                }
            } catch (err) {
                console.error("Erro na busca das baterias para provaId", provaId, err);
                setErro('Erro ao buscar Séries');
            }
        };
    
        fetchBaterias();
    }, [provaId, eventoId]);
    

    useEffect(() => {
        if (baterias.length > 0) {
            setCheckboxes(prev => {
                const newStates = { ...prev };
                baterias.forEach(bateria => {
                    bateria.nadadores.forEach(nadador => {
                        // Só adiciona se ainda não existir (preserva modificações do usuário)
                        if (!(nadador.id in newStates)) {
                            newStates[nadador.id] = {
                                nc: nadador.status === 'NC',
                                desc: nadador.status === 'DQL',
                            };
                        }
                    });
                    bateria.equipes.forEach(equipe => {
                        if (!(equipe.id in newStates)) {
                            newStates[equipe.id] = {
                                nc: equipe.status === 'NC',
                                desc: equipe.status === 'DQL',
                            };
                        }
                    });
                });
                return newStates;
            });
        }
    }, [baterias]);

    // Atualizar tempos no estado local
    const atualizarTempo = (bateriaId, id, novoTempo, isEquipe = false) => {
        setBaterias((prev) =>
            prev.map((bateria) =>
                bateria.id === bateriaId
                    ? {
                        ...bateria,
                        nadadores: isEquipe
                            ? bateria.nadadores
                            : bateria.nadadores.map((nadador) =>
                                nadador.id === id
                                    ? { ...nadador, tempo: novoTempo }
                                    : nadador
                            ),
                        equipes: isEquipe
                            ? bateria.equipes.map((equipe) =>
                                equipe.id === id
                                    ? { ...equipe, tempo: novoTempo }
                                    : equipe
                            )
                            : bateria.equipes,
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
                return tempoSalvo !== undefined ? { ...nadador, tempo: tempoSalvo } : nadador;
            }),
            equipes: bateria.equipes.map((equipe) => {
                const tempoSalvo = resultados[provaId]?.[equipe.id];
                return tempoSalvo !== undefined ? { ...equipe, tempo: tempoSalvo } : equipe;
            }),
        }));

        setBaterias(novasBaterias);
    }, [resultados, provaId]);


    const handleBlur = (bateriaId, id, tempo, isEquipe = false) => {
        salvarTempo(provaId, id, tempo);
        setInputSalvo({ bateriaId, id, isEquipe });
    };

    // Função robusta para normalizar tempo: sempre 6 dígitos numéricos (mm:ss:cc)
    const formatarTempo = (tempo) => {
        if (!tempo) return '00:00:00';
        // Remove tudo que não for número
        let apenasNumeros = String(tempo).replace(/\D/g, '');
        // Limita a 6 dígitos (se vier mais, pega os últimos)
        apenasNumeros = apenasNumeros.slice(-6);
        // Preenche à esquerda com zeros
        const preenchido = apenasNumeros.padStart(6, '0');
        // Se não for número, retorna zeros
        if (!/^[0-9]{6}$/.test(preenchido)) return '00:00:00';
        const minutos = preenchido.slice(0, 2);
        const segundos = preenchido.slice(2, 4);
        const centesimos = preenchido.slice(4, 6);
        return `${minutos}:${segundos}:${centesimos}`;
    };

    const handleTempoChange = (bateriaId, id, valor, isEquipe = false) => {
        const tempoFormatado = formatarTempo(valor);
        atualizarTempo(bateriaId, id, tempoFormatado, isEquipe);
        salvarTempo(provaId, id, tempoFormatado); // salva temporariamente o tempo
        setInputSalvo({ bateriaId, id, isEquipe }); // mantem o estado do input salvo
    };

    // Atualiza estados no handleCheckboxChange
    const handleCheckboxChange = (id, tipo, value) => {
        setCheckboxes(prev => {
            const atual = prev[id] || { nc: false, desc: false };
            let novoEstado;
            if (tipo === 'nc' && value) {
                novoEstado = { nc: true, desc: false };
            } else if (tipo === 'desc' && value) {
                novoEstado = { nc: false, desc: true };
            } else {
                novoEstado = { ...atual, [tipo]: value };
            }
            return { ...prev, [id]: novoEstado };
        });
        setInputSalvo(null); // garante que o estado do input salvo seja resetado ao alterar o checkbox
    };

    const aoSalvar = async () => {
        // Validação: cada nadador ou equipe deve ter um tempo ou exatamente um checkbox marcado
        for (const bateria of baterias) {
            for (const nadador of bateria.nadadores) {
                const cb = checkboxes[nadador.id] || { nc: false, desc: false };
                if (!nadador.tempo && !(cb.nc || cb.desc)) {
                    mostrarAlerta("SALVAR APÓS PREENCHER OS RESULTADOS DE TODOS OS NADADORES");
                    return;
                }
                if (cb.nc && cb.desc) {
                    mostrarAlerta("SALVAR APÓS PREENCHER OS RESULTADOS DE TODOS OS NADADORES");
                    return;
                }
            }
            for (const equipe of bateria.equipes) {
                const cb = checkboxes[equipe.id] || { nc: false, desc: false };
                if (!equipe.tempo && !(cb.nc || cb.desc)) {
                    mostrarAlerta("SALVAR APÓS PREENCHER TODAS AS EQUIPES");
                    return;
                }
                if (cb.nc && cb.desc) {
                    mostrarAlerta("SALVAR APÓS PREENCHER TODAS AS EQUIPES");
                    return;
                }
            }
        }
        try {
            const dados = baterias.map((bateria) => ({
                bateriaId: bateria.id,
                nadadores: bateria.nadadores.map((nadador) => {
                    const cb = checkboxes[nadador.id] || { nc: false, desc: false };
                    const status = cb.nc ? "NC" : (cb.desc ? "DQL" : "OK");
                    return { id: nadador.id, tempo: nadador.tempo || null, status, equipeId: nadador.equipeId || null };
                }),
                equipes: bateria.equipes.map((equipe) => {
                    const cb = checkboxes[equipe.id] || { nc: false, desc: false };
                    const status = cb.nc ? "NC" : (cb.desc ? "DQL" : "OK");
                    return { id: equipe.id, tempo: equipe.tempo || null, status };
                }),
            }));
            const selectedProva = provas.find(prova => String(prova.prova_id) === String(provaId));
            if (!selectedProva) {
                throw new Error('Prova selecionada não encontrada.');
            }
            const eventosProvasId = selectedProva.eventos_provas_id;
            await api.post('/resultadosEntrada/salvarResultados', { provaId: eventosProvasId, dados });
            // Chama a API para transmitir os resultados completos da prova
            await api.post(`/resultadosEntrada/transmitirResultadoProva/${eventosProvasId}`);
            await api.post(`/pontuacoes/pontuar-evento/${eventoId}`);

            const indexAtual = provas.findIndex(p => String(p.prova_id) === String(provaId));
            if (indexAtual !== -1 && indexAtual + 1 < provas.length) {
                mostrarAlerta('Resultados salvos com sucesso! Próxima prova...');
                const proximaProva = provas[indexAtual + 1];
                setProvaId(String(proximaProva.prova_id));
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                // Última prova: perguntar se deseja encerrar o evento
                if (window.confirm('Resultados salvos com sucesso! Deseja encerrar o evento?')) {
                    try {
                        await api.post(`/resultados/fecharClassificacao/${eventoId}`);
                    } catch (err) {
                        console.error('Erro ao encerrar o evento:', err.message);
                        mostrarAlerta('Erro ao encerrar o evento. Tente novamente.');
                        return;
                    }
                    window.location.href = '/admin';
                } else {
                    mostrarAlerta('Resultados salvos com sucesso! Você pode revisar as provas.');
                }
            }
        } catch (err) {
            console.error('Erro ao salvar resultados:', err.message);
            mostrarAlerta('Erro ao salvar resultados. Tente novamente.');
        }
    };

    // Função para focar no próximo input
    const focarProximoInput = (bateriaId, id, isEquipe = false) => {
        const inputs = document.querySelectorAll('input[type="text"]');
        const indexAtual = Array.from(inputs).findIndex(
            (input) => input.dataset.bateriaId === String(bateriaId) && input.dataset.id === String(id) && input.dataset.isEquipe === String(isEquipe)
        );
        if (indexAtual !== -1 && indexAtual + 1 < inputs.length) {
            inputs[indexAtual + 1].focus();
        }
    };

    return (
        <div className={style.resultadosEntrada}>
            <CabecalhoAdmin />
            {componenteAlerta}
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
                        key={eventoId} // <-- Força o reset do componente ao trocar de evento
                        fonteDados={urlProvasEvento}
                        textoPlaceholder="Escolha a prova disputada"
                        onChange={setProvaId}
                        selectId="prova_id"
                        selectExibicao="nome_prova" // <-- CORRETO!
                        value={provaId}
                    />
                )}
            </div>
            <div className={style.listagemContainer}>
                {baterias.length > 0 && (
                    <section>
                        <h1>{nomeProvaSelecionada}</h1>
                        {baterias.map((bateria) => {
                            // Calcula se todos os nadadores e equipes já possuem resultado salvo
                            const provaSalva = bateria.nadadores.every(nadador =>
                                valoresBanco[provaId] &&
                                valoresBanco[provaId][nadador.id] &&
                                nadador.tempo === valoresBanco[provaId][nadador.id]
                            ) && bateria.equipes.every(equipe =>
                                valoresBanco[provaId] &&
                                valoresBanco[provaId][equipe.id] &&
                                equipe.tempo === valoresBanco[provaId][equipe.id]
                            );
                            return (
                                <div key={bateria.id} className={style.bateriaContainer}>
                                    <h2>{bateria.numeroBateria}</h2>
                                    {provaSalva && <span className={style.provaSalva}>PROVA SALVA</span>}
                                    {bateria.nadadores.map((nadador) => {
                                        // Define a classe do input de acordo com o valor: azul se igual ao do banco, senão verde se temporário
                                        const isSalvoBanco = valoresBanco[provaId] && valoresBanco[provaId][nadador.id] && nadador.tempo === valoresBanco[provaId][nadador.id];
                                        const isTemporario = inputSalvo?.bateriaId === bateria.id && inputSalvo?.id === nadador.id || resultados[provaId]?.[nadador.id];
                                        return (
                                            <div key={nadador.id} className={style.nadadorContainer}>
                                                <span className={style.nadadorNome}>{nadador.nome}</span>
                                                <input
                                                    type="text"
                                                    placeholder="Digite o tempo realizado"
                                                    value={nadador.tempo || ''}
                                                    onChange={(e) => handleTempoChange(bateria.id, nadador.id, e.target.value)}
                                                    onBlur={() => handleBlur(bateria.id, nadador.id, nadador.tempo)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            focarProximoInput(bateria.id, nadador.id);
                                                        }
                                                    }}
                                                    data-bateria-id={bateria.id}
                                                    data-id={nadador.id}
                                                    data-is-equipe={false}
                                                    disabled={checkboxes[nadador.id]?.nc || checkboxes[nadador.id]?.desc}
                                                    className={`${style.nadadorInput} ${isSalvoBanco ? style.inputBanco : isTemporario ? style.inputSalvo : ''
                                                        }`}
                                                />
                                                <CheckboxGroup
                                                    titulo=""
                                                    opcoes={[{ id: 'nc', label: 'NC' }, { id: 'desc', label: 'DQL' }]} // Alterado label para DQL
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
                                    {bateria.equipes.map((equipe) => {
                                        // Define a classe do input de acordo com o valor: azul se igual ao do banco, senão verde se temporário
                                        const isSalvoBanco = valoresBanco[provaId] && valoresBanco[provaId][equipe.id] && equipe.tempo === valoresBanco[provaId][equipe.id];
                                        const isTemporario = inputSalvo?.bateriaId === bateria.id && inputSalvo?.id === equipe.id || resultados[provaId]?.[equipe.id];
                                        return (
                                            <div key={equipe.id} className={style.nadadorContainer}>
                                                <span className={style.nadadorNome}>{equipe.nome}</span>
                                                <input
                                                    type="text"
                                                    placeholder="Digite o tempo realizado"
                                                    value={equipe.tempo || ''}
                                                    onChange={(e) => handleTempoChange(bateria.id, equipe.id, e.target.value, true)}
                                                    onBlur={() => handleBlur(bateria.id, equipe.id, equipe.tempo, true)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            focarProximoInput(bateria.id, equipe.id, true);
                                                        }
                                                    }}
                                                    data-bateria-id={bateria.id}
                                                    data-id={equipe.id}
                                                    data-is-equipe={true}
                                                    disabled={checkboxes[equipe.id]?.nc || checkboxes[equipe.id]?.desc}
                                                    className={`${style.nadadorInput} ${isSalvoBanco ? style.inputBanco : isTemporario ? style.inputSalvo : ''
                                                        }`}
                                                />
                                                <CheckboxGroup
                                                    titulo=""
                                                    opcoes={[{ id: 'nc', label: 'NC' }, { id: 'desc', label: 'DQL' }]} // Alterado label para DQL
                                                    selecionadas={
                                                        (() => {
                                                            const selecionadas = [];
                                                            if (checkboxes[equipe.id]?.nc) selecionadas.push('nc');
                                                            if (checkboxes[equipe.id]?.desc) selecionadas.push('desc');
                                                            return selecionadas;
                                                        })()
                                                    }
                                                    aoAlterar={(value, checked) => handleCheckboxChange(equipe.id, value, checked)}
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
