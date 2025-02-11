import { useEffect, useState } from "react";
import ListaSuspensa from "../../componentes/ListaSuspensa/ListaSuspensa";
import CabecalhoAdmin from "../../componentes/CabecalhoAdmin/CabecalhoAdmin";
import Botao from "../../componentes/Botao/Botao";
import TabelaInscricao from "../../componentes/TabelaInscricao/TabelaInscricao";
import api from "../../servicos/api";
import { useUser } from "../../servicos/UserContext"; // Importar o contexto do usuário logado no sistema
import styles from "./Inscricao.module.css"; // Importar o arquivo CSS como módulo

const Inscricao = () => {
    const [nadadores, setNadadores] = useState([]);
    const [provas, setProvas] = useState([]);
    const [eventos, setEventos] = useState([]);
    const [eventoSelecionado, setEventoSelecionado] = useState(null);
    const [selecoes, setSelecoes] = useState({});
    const [revezamentos, setRevezamentos] = useState([]); // Lista de revezamentos
    const [selecoesRevezamento, setSelecoesRevezamento] = useState({}); // Estado para participação em revezamento
    const user = useUser(); // Obter o usuário do contexto do usuário

    const apiEventos = `/inscricao/listarEventos`;
    const apiListaNadadores = `/inscricao/listarNadadores`;
    const apiListaInscricoes = `/inscricao/listarInscricoes`;
    const apiProvasEvento = `/inscricao/listarProvasEvento`;
    const apiSalvarInscricao = `/inscricao/salvarInscricao`;

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
            const inscricoesResponse = await api.get(`${apiListaInscricoes}/${eventoSelecionado}`);

            setNadadores(nadadoresResponse.data);

            const todasProvas = provasResponse.data.provas || [];
            setProvas(todasProvas.filter(prova => prova.tipo !== "revezamento"));
            setRevezamentos(todasProvas.filter(prova => prova.tipo === "revezamento"));

            const novasSelecoes = {};
            const novasSelecoesRevezamento = {};

            inscricoesResponse.data.inscricoesIndividuais.forEach(inscricao => {
                if (!novasSelecoes[inscricao.nadadorId]) {
                    novasSelecoes[inscricao.nadadorId] = {};
                }
                novasSelecoes[inscricao.nadadorId][inscricao.provaId] = true;
            });

            inscricoesResponse.data.inscricoesRevezamento.forEach(inscricao => {
                novasSelecoesRevezamento[inscricao.provaId] = "Sim";
            });

            setSelecoes(novasSelecoes);
            setSelecoesRevezamento(novasSelecoesRevezamento);
        } catch (error) {
            console.error("Erro ao buscar dados do evento:", error);
        }
    };

    useEffect(() => {
        if (eventoSelecionado) {
            fetchDadosEvento();
        }
    }, [eventoSelecionado]);

    // Função para atualizar a seleção de checkboxes
    const handleCheckboxChange = (nadadorId, provaId, isChecked) => {
        setSelecoes(prevSelecoes => {
            const selecoesNadador = prevSelecoes[nadadorId] || {};

            // Verificando se o nadador já tem 2 inscrições
            const numeroDeInscricoes = Object.values(selecoesNadador).filter(Boolean).length;
            if (numeroDeInscricoes >= 2 && isChecked) {
                // Não permite inscrever mais de 2 provas
                alert("O nadador já tem o máximo de 2 provas.");
                return prevSelecoes;
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
        console.log(`handleRevezamentoChange - provaId: ${provaId}, value: ${value}`);
        
        setSelecoesRevezamento(prevSelecoes => {
            console.log('Estado anterior de selecoesRevezamento:', prevSelecoes);
    
            const novoEstado = {
                ...prevSelecoes,
                [provaId]: value
            };
    
            console.log('Novo estado de selecoesRevezamento:', novoEstado);
    
            return novoEstado;
        });
    };
    

    const aoSalvar = async () => {
        const inscricoes = Object.entries(selecoes).flatMap(([nadadorId, provas]) =>
            Object.entries(provas)
                .filter(([, isChecked]) => isChecked)
                .map(([provaId]) => ({
                    nadadorId,
                    provaId,
                    eventoId: eventoSelecionado
                }))
        );

        // Adiciona revezamentos na lista de inscrições
        const inscricoesRevezamento = Object.entries(selecoesRevezamento)
            .filter(([, valor]) => valor === "Sim")
            .map(([provaId]) => ({
                eventoId: eventoSelecionado,
                provaId,
                equipeId: user?.user?.equipeId[0] // A equipe do usuário logado
            }));
            
        // 🛑 LOG PARA DEBUGAR OS DADOS ANTES DO ENVIO
        console.log("Inscrições individuais enviadas:", inscricoes);
        console.log("Inscrições de revezamento enviadas:", inscricoesRevezamento);

        try {
            await api.post(apiSalvarInscricao, [...inscricoes, ...inscricoesRevezamento]); // Envia ambos
            alert('Inscrição realizada com sucesso!');
            await fetchDadosEvento(); // Recarrega os dados do evento após salvar
        } catch (error) {
            console.error('Erro ao realizar a inscrição:', error);
            alert('Erro ao salvar a inscrição.');
        }
    };

    return (
        <>
            <CabecalhoAdmin />
            <div className={styles.inscricaoContainer}>
                <h1>Inscrição - {user?.equipeNome}</h1>
                <div className={styles.centralizado}>
                    <ListaSuspensa
                        fonteDados={apiEventos}
                        onChange={(id) => setEventoSelecionado(id)}
                        textoPlaceholder="Selecione um evento"
                        obrigatorio={true}
                        className={styles.listaSuspensa}
                    />
                    {eventoSelecionado && (
                        <div>
                            <div className={styles.provasLegenda}>
                                <h3>Provas do Evento</h3>
                                <ul>
                                    {provas.map(prova => (
                                        <li key={prova.id}>{prova.ordem} - {prova.distancia}m {prova.estilo} {prova.sexo} {prova.tipo}</li>
                                    ))}
                                </ul>
                            </div>
                            {nadadores.length > 0 && provas.length > 0 ? (
                                <>
                                    <TabelaInscricao
                                        nadadores={nadadores}
                                        provas={provas}
                                        selecoes={selecoes}
                                        onCheckboxChange={handleCheckboxChange}
                                    />
                                    <div className={styles.revezamentoContainer}>
                                        <h3>Revezamentos</h3>
                                        {revezamentos.map(prova => {
                                            console.log(`Renderizando revezamento - prova.id: ${prova.id}`);
                                            return (
                                                <div key={prova.id} className={styles.inscricaoRevezamento}>
                                                    <span>{prova.ordem} - {prova.distancia}m {prova.estilo}</span>
                                                    <ListaSuspensa
                                                        opcoes={[{ id: "Sim", nome: "Sim" }, { id: "Não", nome: "Não" }]} // ✅ Passando opções diretamente
                                                        onChange={(value) => {
                                                            console.log(`ListaSuspensa onChange - prova.id: ${prova.id}, value: ${value}`);
                                                            handleRevezamentoChange(prova.id, value);
                                                        }}
                                                        valorSelecionado={selecoesRevezamento[prova.id] || "Não"}
                                                        selectId="id"
                                                        selectExibicao="nome"
                                                    />
                                                </div>
                                            );
                                        })}
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
            </div>
        </>
    );
};

export default Inscricao;
