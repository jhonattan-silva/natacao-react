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
    const user = useUser(); // Obter o usuário do contexto do usuário

    const apiEventos = `/inscricao/listarEventos`;
    const apiListaNadadores = `/inscricao/listarNadadores/${user?.equipeId}`; // Passar equipeId
    const apiListaInscricoes = `/inscricao/listarInscricoes`;
    const apiProvasEvento = `/inscricao/listarProvasEvento`;
    const apiSalvarInscricao = `/inscricao/salvarInscricao`;

    // Buscar eventos para a ListaSuspensa
    useEffect(() => {
        const fetchEventos = async () => {
            try {
                const response = await api.get(apiEventos);
                console.log("Eventos:", response.data);
                setEventos(response.data);
            } catch (error) {
                console.error("Erro ao buscar eventos:", error);
            }
        };
        fetchEventos();
    }, []);

    const fetchDadosEvento = async () => {
        console.log("Chamou o fetchDadosEvento");
        console.log("Equipe ID dentro do fetch:", user?.equipeId);
        
        
        try {
            const nadadoresResponse = await api.get(apiListaNadadores); //lista de nadadores
            console.log("Nadadores:", nadadoresResponse.data);
            const provasResponse = await api.get(`${apiProvasEvento}/${eventoSelecionado}?equipeId=${user?.equipeId}`); //lista de provas - por evento
            console.log("Provas:", provasResponse.data);
            const inscricoesResponse = await api.get(`${apiListaInscricoes}/${eventoSelecionado}`); //inscricoes já realizadas do evento
            console.log("Inscrições:", inscricoesResponse.data);

            setNadadores(nadadoresResponse.data); // Lista completa de nadadores
            setProvas(provasResponse.data?.provas || []); // Provas vinculadas ao evento

            const novasSelecoes = {};
            inscricoesResponse.data.forEach(inscricao => { //para cada inscricao já localizada...
                if (!novasSelecoes[inscricao.nadadorId]) {
                    novasSelecoes[inscricao.nadadorId] = {};
                }
                novasSelecoes[inscricao.nadadorId][inscricao.provaId] = true; //novasSeleções recebe o id do nadador e da prova
            });

            setSelecoes(novasSelecoes || {});
        } catch (error) {
            console.error("Erro ao buscar dados do evento:", error);
        }
    };

    useEffect(() => {
        if (eventoSelecionado) {
            console.log("Evento selecionado:", eventoSelecionado);
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

        try {
            await api.post(apiSalvarInscricao, inscricoes);
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
                            {nadadores.length > 0 && provas.length > 0 ? (
                                <TabelaInscricao
                                    nadadores={nadadores}
                                    provas={provas}
                                    selecoes={selecoes}
                                    onCheckboxChange={handleCheckboxChange}
                                />
                            ) : (
                                <p>Carregando nadadores e provas...</p>
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
