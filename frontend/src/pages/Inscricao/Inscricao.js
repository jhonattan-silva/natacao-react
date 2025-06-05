import { useEffect, useState } from "react";
import ListaSuspensa from "../../componentes/ListaSuspensa/ListaSuspensa";
import CabecalhoAdmin from "../../componentes/CabecalhoAdmin/CabecalhoAdmin";
import Botao from "../../componentes/Botao/Botao";
import TabelaInscricao from "../../componentes/TabelaInscricao/TabelaInscricao";
import api from "../../servicos/api";
import { useUser } from "../../servicos/UserContext"; // Importar o contexto do usuário logado no sistema
import useAlerta from "../../hooks/useAlerta"; // Importar o hook useAlerta
import { gerarPDFInscricoes } from "../../servicos/relatoriosPDF"; // Adicione esta linha
import styles from "./Inscricao.module.css"; // Importar o arquivo CSS como módulo

const Inscricao = () => {
    const [nadadores, setNadadores] = useState([]);
    const [provas, setProvas] = useState([]);
    const [eventos, setEventos] = useState([]);
    const [eventoSelecionado, setEventoSelecionado] = useState(null);
    const [selecoes, setSelecoes] = useState({});
    const [revezamentos, setRevezamentos] = useState([]); // Lista de revezamentos
    const [selecoesRevezamento, setSelecoesRevezamento] = useState({}); // Estado para participação em revezamento
    const [inscricoesIndividuais, setInscricoesIndividuais] = useState([]); // Inscrições individuais
    const [inscricoesRevezamento, setInscricoesRevezamento] = useState([]); // Inscrições de revezamento
    const [nomeEquipe, setNomeEquipe] = useState(''); // Novo estado para nome da equipe
    const [provas400, setProvas400] = useState([]);
    const [limite400, setLimite400] = useState({});
    const user = useUser(); // Obter o usuário do contexto do usuário
    const { mostrar: mostrarAlerta, componente: alertaComponente } = useAlerta(); // Usar o hook useAlerta

    const apiEventos = `/inscricao/listarEventos`;
    const apiListaNadadores = `/inscricao/listarNadadores`;
    const apiListaInscricoes = `/inscricao/listarInscricoes`;
    const apiProvasEvento = `/inscricao/listarProvasEvento`;
    const apiSalvarInscricao = `/inscricao/salvarInscricao`;
    const apiVerificarRevezamento = `/inscricao/verificarRevezamento`;

    // Nova função para formatar o sexo
    const formatSexo = (sexo) => {
        return sexo === "F" ? "FEMININO" : sexo === "M" ? "MASCULINO" : sexo;
    };

    // Buscar eventos para a ListaSuspensa
    useEffect(() => {
        const fetchEventos = async () => {
            try {
                const response = await api.get(apiEventos);
                setEventos(response.data);
            } catch (error) {
                console.error("Erro ao buscar eventos:", error);
            }
        };
        fetchEventos();
    }, []);

    const fetchDadosEvento = async () => {
        try {
            const equipeId = user?.user?.equipeId[0];
            if (!equipeId) return;

            const nadadoresResponse = await api.get(`${apiListaNadadores}/${equipeId}`);
            const provasResponse = await api.get(`${apiProvasEvento}/${eventoSelecionado}?equipeId=${equipeId}`);
            const inscricoesResponse = await api.get(`${apiListaInscricoes}/${eventoSelecionado}?equipeId=${equipeId}`); // Adicionado equipeId
            const revezamentoResponse = await api.get(`${apiVerificarRevezamento}/${eventoSelecionado}?equipeId=${equipeId}`);
            setNadadores(nadadoresResponse.data);

            const todasProvas = provasResponse.data.provas || [];
            const provasFiltradas = todasProvas.filter(prova => prova.eh_revezamento === 0).sort((a, b) => a.ordem - b.ordem);
            setProvas(provasFiltradas);
            const revezamentosFiltrados = todasProvas.filter(prova => prova.eh_revezamento === 1).sort((a, b) => a.ordem - b.ordem);
            setRevezamentos(revezamentosFiltrados);

            const novasSelecoes = {};
            const novasSelecoesRevezamento = {};
            // Atribuir "Sim" se existir inscrição de revezamento para a prova
            revezamentoResponse.data.forEach(inscricao => {
                novasSelecoesRevezamento[inscricao.provaId] = "Sim";
            });
            // Se não houver inscrição para alguma prova de revezamento, atribuir "Não"
            revezamentosFiltrados.forEach(prova => {
                if (!novasSelecoesRevezamento[prova.id]) {
                    novasSelecoesRevezamento[prova.id] = "Não";
                }
            });

            inscricoesResponse.data.inscricoesIndividuais.forEach(inscricao => {
                if (!novasSelecoes[inscricao.nadadorId]) {
                    novasSelecoes[inscricao.nadadorId] = {};
                }
                novasSelecoes[inscricao.nadadorId][inscricao.provaId] = true;
            });

            setSelecoes(novasSelecoes);
            setSelecoesRevezamento(novasSelecoesRevezamento);
            setInscricoesIndividuais(inscricoesResponse.data.inscricoesIndividuais); // Atualiza com inscrições individuais
            setInscricoesRevezamento(inscricoesResponse.data.inscricoesRevezamento); // Atualiza com inscrições de revezamento

            // Regra: máximo 4 atletas por sexo em provas de 400m
            const provas400Local = provasFiltradas.filter(prova => String(prova.distancia) === "400");
            setProvas400(provas400Local);

            const sexoPorProva400 = {};
            provas400Local.forEach(prova => {
                sexoPorProva400[prova.id] = { M: 0, F: 0 };
            });

            // Conta quantos já estão inscritos por sexo em cada prova 400
            inscricoesResponse.data.inscricoesIndividuais.forEach(inscricao => {
                const prova = provas400Local.find(p => p.id === inscricao.provaId);
                if (prova) {
                    const nadador = nadadoresResponse.data.find(n => n.id === inscricao.nadadorId);
                    if (nadador && nadador.sexo) {
                        sexoPorProva400[prova.id][nadador.sexo] = (sexoPorProva400[prova.id][nadador.sexo] || 0) + 1;
                    }
                }
            });
            setLimite400(sexoPorProva400);
        } catch (error) {
            console.error("Erro ao buscar dados do evento:", error);
        }
    };

    useEffect(() => {
        if (eventoSelecionado) {
            fetchDadosEvento();
        }
    }, [eventoSelecionado]);

    // Buscar nome da equipe via nadadores ao carregar usuário
    useEffect(() => {
        const fetchNomeEquipe = async () => {
            const equipeId = user?.user?.equipeId?.[0];
            if (!equipeId) return;
            try {
                // Busca nadadores da equipe
                const response = await api.get(`${apiListaNadadores}/${equipeId}`);
                // Tenta pegar o nome da equipe do primeiro nadador retornado
                const nomeEquipeExtraido = response.data?.[0]?.equipe_nome || response.data?.[0]?.equipe || '';
                setNomeEquipe(nomeEquipeExtraido || '');
            } catch (error) {
                console.error('Erro ao carregar nome da equipe:', error);
            }
        };
        fetchNomeEquipe();
    }, [user]);

    // Função para atualizar a seleção de checkboxes
    const handleCheckboxChange = (nadadorId, provaId, isChecked) => {
        setSelecoes(prevSelecoes => {
            const selecoesNadador = prevSelecoes[nadadorId] || {};
            const provasSelecionadas = Object.entries(selecoesNadador).filter(([, val]) => val).map(([id]) => parseInt(id));
            const totalSelecionadas = provasSelecionadas.length;

            if (totalSelecionadas >= 2 && isChecked) {
                mostrarAlerta("O nadador já tem o máximo de 2 provas.");
                return prevSelecoes;
            }

            const provaSelecionada = provas.find(p => p.id === provaId);
            const distancia = provaSelecionada?.distancia;
            const estilo = provaSelecionada?.estilo;

            const jaSelecionou25 = provasSelecionadas.some(id => {
                const prova = provas.find(p => p.id === id);
                return prova?.distancia === "25";
            });

            const jaSelecionouLivre = provasSelecionadas.some(id => {
                const prova = provas.find(p => p.id === id);
                return prova?.estilo === "LIVRE";
            });

            const jaSelecionouNao50 = provasSelecionadas.some(id => {
                const prova = provas.find(p => p.id === id);
                return prova?.distancia !== "50";
            });

            // REGRA: 25 + LIVRE não pode, em nenhuma ordem
            if (isChecked && (
                (distancia === "25" && jaSelecionouLivre) ||
                (estilo === "LIVRE" && jaSelecionou25)
            )) {
                mostrarAlerta("Não é permitido combinar uma prova de 25m com uma prova de estilo LIVRE.");
                return prevSelecoes;
            }

            // REGRA: Nenhuma prova diferente de distância "50" pode ser combinada com uma prova de "25"
            if (isChecked && distancia === "25" && jaSelecionouNao50) {
                mostrarAlerta("Não é permitido combinar uma prova de 25m com uma prova de distância diferente de 50m.");
                return prevSelecoes;
            }

            if (isChecked && distancia !== "50" && jaSelecionou25) {
                mostrarAlerta("Não é permitido combinar uma prova de distância diferente de 50m com uma prova de 25m.");
                return prevSelecoes;
            }

            // REGRA: Máximo 4 atletas por sexo em provas de 400m
            const provaSelecionada400 = provas400.find(p => p.id === provaId);
            if (provaSelecionada400) {
                const sexoNadador = nadadores.find(n => n.id === nadadorId)?.sexo;

                // Novo estado de seleções após após checkar/desmarcar
                const novasSelecoesNadador = {
                    ...(prevSelecoes[nadadorId] || {}),
                    [provaId]: isChecked
                };

                // Nova array de IDs que estarão marcados após a checkagem/desmarcação
                const idsMarcados = new Set();

                // 1. Considera todos os nadadores já salvos no banco,
                //    exceto os que estão sendo desmarcados na tela (checkbox ficará false)
                inscricoesIndividuais.forEach(insc => {
                    if (insc.provaId === provaId) {
                        // Se o nadador está sendo desmarcado na tela, não conta
                        if (String(insc.nadadorId) === String(nadadorId) && !isChecked) return;
                        // Se o nadador está sendo desmarcado em prevSelecoes, não conta
                        if (
                            prevSelecoes[insc.nadadorId] &&
                            prevSelecoes[insc.nadadorId][provaId] === false
                        ) return;
                        const nad = nadadores.find(n => n.id === insc.nadadorId);
                        if (nad && nad.sexo === sexoNadador) idsMarcados.add(String(insc.nadadorId));
                    }
                });

                // 2. Considera todos marcados na tela (após o clique atual)
                Object.entries(prevSelecoes).forEach(([nid, provas]) => {
                    // Se for o nadador atual, usa o valor do clique atual
                    const marcado = String(nid) === String(nadadorId)
                        ? isChecked
                        : provas[provaId];
                    if (marcado) {
                        const n = nadadores.find(nad => String(nad.id) === String(nid));
                        if (n && n.sexo === sexoNadador) idsMarcados.add(String(nid));
                    }
                });

                // 3. Se o nadador atual ainda não está em prevSelecoes, mas está sendo marcado agora...
                if (isChecked && !prevSelecoes[nadadorId]) {
                    const n = nadadores.find(nad => String(nad.id) === String(nadadorId));
                    if (n && n.sexo === sexoNadador) idsMarcados.add(String(nadadorId));
                }

                if (idsMarcados.size > 4) {
                    mostrarAlerta("Só é permitido inscrever até 4 atletas do mesmo sexo por equipe na prova de 400m.");
                    return prevSelecoes;
                }
            }

            const novasSelecoes = {
                ...prevSelecoes,
                [nadadorId]: {
                    ...selecoesNadador,
                    [provaId]: isChecked
                }
            };
            return novasSelecoes;
        });
    };


    const handleRevezamentoChange = (provaId, value) => {
        setSelecoesRevezamento(prevSelecoes => {
            const novoEstado = {
                ...prevSelecoes,
                [provaId]: value
            };
            return novoEstado;
        });
    };


    const aoSalvar = async () => {
        if (!eventoSelecionado) {
            mostrarAlerta("Selecione um evento para continuar.");
            return;
        }

        const equipeId = user?.user?.equipeId?.[0];
        if (!equipeId) {
            mostrarAlerta("Você precisa fazer parte de uma equipe para realizar a inscrição.");
            return;
        }

        const inscricoesIndividuais = Object.entries(selecoes).flatMap(([nadadorId, provas]) =>
            Object.entries(provas)
                .filter(([, isChecked]) => isChecked)
                .map(([provaId]) => ({
                    nadadorId,
                    provaId,
                    eventoId: eventoSelecionado,
                    equipeId
                }))
        );

        const inscricoesRevezamento = Object.entries(selecoesRevezamento)
            .filter(([, valor]) => valor === "Sim")
            .map(([provaId]) => {
                // Buscar a prova correspondente, incluindo revezamentos
                const prova = [...provas, ...revezamentos].find(p => String(p.id) === String(provaId));
                if (!prova) {
                    console.error(`Prova não encontrada para o ID: ${provaId}`);
                }
                return {
                    eventoId: eventoSelecionado,
                    provaId,
                    equipeId,
                    distancia: prova?.distancia || 'N/D',
                    estilo: prova?.estilo || 'N/D',
                    sexo: prova?.sexo || 'N/D'
                };
            });

        const payload = [...inscricoesIndividuais, ...inscricoesRevezamento];

        if (payload.length === 0) {
            mostrarAlerta("Nenhuma inscrição foi selecionada.");
            return;
        }

        try {
            await api.post(apiSalvarInscricao, payload);
            mostrarAlerta(`Inscrição realizada com sucesso! Total de inscritos da equipe: ${payload.length}`); // Ajustada mensagem

            // Montar dados detalhados para cada inscrição individual
            const inscricoesDetalhadas = inscricoesIndividuais.map(insc => {
                const nadador = nadadores.find(n => String(n.id) === String(insc.nadadorId));
                const prova = [...provas, ...revezamentos].find(p => String(p.id) === String(insc.provaId));
                return {
                    nadadorNome: nadador?.nome || 'N/D',
                    equipeNome: nomeEquipe || nadador?.equipe || user?.user?.equipeNome || 'N/D',
                    distancia: prova?.distancia || '',
                    estilo: prova?.estilo || '',
                    sexo: prova?.sexo || ''
                };
            });

            // Montar dados detalhados para inscrições de revezamento
            const inscricoesRevezamentoDetalhadas = inscricoesRevezamento.map(insc => ({
                equipeNome: nomeEquipe || user?.user?.equipeNome || 'N/D',
                distancia: insc.distancia,
                estilo: insc.estilo,
                sexo: insc.sexo
            }));

            // Buscar o evento selecionado para passar ao PDF
            const eventoObj = eventos.find(e => String(e.id) === String(eventoSelecionado)) || {};
            const equipeNomeParaPDF = nomeEquipe || user?.user?.equipeNome || 'N/D';
            const gerador = user?.user?.nome || user?.user?.email || 'N/D';

            gerarPDFInscricoes(
                inscricoesDetalhadas,
                eventoObj,
                equipeNomeParaPDF,
                gerador,
                inscricoesRevezamentoDetalhadas,
                provas
            );

            setTimeout(() => {
                window.location.reload(); // Recarrega a página após 3 segundos
            }, 3000);
            await fetchDadosEvento(); // Atualiza a lista de inscrições
        } catch (error) {
            console.error("Erro ao realizar a inscrição:", error);
            mostrarAlerta('Erro ao salvar a inscrição.');
        }
    };


    return (
        <>
            <CabecalhoAdmin />
            {alertaComponente}
            <h1>INSCRIÇÃO</h1>
            <ListaSuspensa
                fonteDados={apiEventos}
                onChange={(id) => setEventoSelecionado(id)}
                textoPlaceholder="Selecione um evento"
                obrigatorio={true}
                className={styles.listaSuspensa}
            />
            <div>
                {eventoSelecionado && (
                    <div className={styles.centralizado}>
                        <div className={styles.provasLegenda}>
                            <h3>Provas do Evento</h3>
                            <ul>
                                {provas.map(prova => (
                                    <li key={prova.id}>
                                        {prova.ordem} - {prova.distancia}m {prova.estilo} {formatSexo(prova.sexo)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {(inscricoesIndividuais.length > 0 || inscricoesRevezamento.length > 0) && (
                            <div className={`${styles.provasLegenda} ${styles.inscricoesRealizadas}`}>
                                <h3>Inscrições Realizadas até o momento</h3>
                                <ul>
                                    {inscricoesIndividuais.map((inscricao, index) => (
                                        <li key={`individual-${inscricao.nadadorId}-${inscricao.provaId}-${index}`}>
                                            #{index + 1} - {inscricao.nadadorNome}, Prova: {inscricao.distancia}m {inscricao.estilo}
                                        </li>
                                    ))}
                                    {inscricoesRevezamento.map((inscricao, index) => (
                                        <li key={`revezamento-${inscricao.equipeId}-${inscricao.provaId}-${index}`}>
                                            #R{index + 1} - Revezamento, Prova: {inscricao.distancia}m {inscricao.estilo}
                                        </li>
                                    ))}
                                </ul>
                                {/* Botão para baixar a lista de inscritos */}
                                <div className={styles.centralizado}>
                                    <Botao
                                        onClick={() =>
                                            gerarPDFInscricoes(
                                                inscricoesIndividuais.map(insc => ({
                                                    ...insc,
                                                    nadadorNome: nadadores.find(n => String(n.id) === String(insc.nadadorId))?.nome || 'N/D',
                                                    equipeNome: nomeEquipe || user?.user?.equipeNome || 'N/D',
                                                    distancia: provas.find(p => String(p.id) === String(insc.provaId))?.distancia || '',
                                                    estilo: provas.find(p => String(p.id) === String(insc.provaId))?.estilo || '',
                                                    sexo: provas.find(p => String(p.id) === String(insc.provaId))?.sexo || ''
                                                })),
                                                eventos.find(e => String(e.id) === String(eventoSelecionado)) || {},
                                                nomeEquipe || user?.user?.equipeNome || 'N/D',
                                                user?.user?.nome || user?.user?.email || 'N/D',
                                                inscricoesRevezamento,
                                                provas
                                            )
                                        }
                                    >
                                        BAIXAR LISTA DE INSCRITOS (Já salvos)
                                    </Botao>
                                </div>
                            </div>
                        )}

                        {nadadores.length > 0 && provas.length > 0 ? (
                            <>
                                <TabelaInscricao
                                    nadadores={nadadores}
                                    provas={provas}
                                    selecoes={selecoes}
                                    onCheckboxChange={handleCheckboxChange}
                                />
                                <div className={styles.containerTabelaRevezamentos}>
                                    <h3>Revezamentos</h3>
                                    {revezamentos.map(prova => (
                                        <div key={prova.id} className={styles.revezamentoEntry}>
                                            <span>
                                                {prova.ordem} - {prova.distancia}m {prova.estilo} {formatSexo(prova.sexo)}
                                            </span>
                                            <ListaSuspensa
                                                opcoes={[{ id: "Sim", nome: "Sim" }, { id: "Não", nome: "Não" }]}
                                                onChange={(value) => handleRevezamentoChange(prova.id, value)}
                                                valorSelecionado={selecoesRevezamento[prova.id] || "Não"}
                                                selectId="id"
                                                selectExibicao="nome"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p>VOCÊ PRECISA FAZER PARTE DE UMA EQUIPE...</p>
                        )}
                        <div className={styles.centralizado}>
                            <Botao onClick={aoSalvar}>REALIZAR INSCRIÇÃO</Botao>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Inscricao;
