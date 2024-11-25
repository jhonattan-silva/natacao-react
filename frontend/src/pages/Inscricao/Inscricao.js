import { useEffect, useState } from "react";
import ListaSuspensa from "../../componentes/ListaSuspensa/ListaSuspensa";
import axios from "axios";
import CabecalhoAdmin from "../../componentes/CabecalhoAdmin/CabecalhoAdmin";
import Botao from "../../componentes/Botao/Botao";
import TabelaInscricao from "../../componentes/TabelaInscricao/TabelaInscricao";

const Inscricao = () => {
    const [nadadores, setNadadores] = useState([]);
    const [provas, setProvas] = useState([]);
    const [eventos, setEventos] = useState([]);
    const [eventoSelecionado, setEventoSelecionado] = useState(null);
    const [selecoes, setSelecoes] = useState({});

    const baseUrl = 'http://localhost:5000/api/inscricao';
    const apiEventos = `${baseUrl}/listarEventos`;
    const apiListaNadadores = `${baseUrl}/listarNadadores`;
    const apiListaInscricoes = `${baseUrl}/listarInscricoes`;
    const apiProvasEvento = `${baseUrl}/listarProvasEvento`;
    const apiSalvarInscricao = `${baseUrl}/salvarInscricao`;

    // Buscar eventos para a ListaSuspensa
    useEffect(() => {
        const fetchEventos = async () => {
            try {
                const response = await axios.get(apiEventos);
                setEventos(response.data);
            } catch (error) {
                console.error("Erro ao buscar eventos:", error);
            }
        };
        fetchEventos();
    }, []);

    const fetchDadosEvento = async () => {
        try {
            const nadadoresResponse = await axios.get(apiListaNadadores); //lista de nadadores
            const provasResponse = await axios.get(`${apiProvasEvento}/${eventoSelecionado}`); //lista de provas - por evento
            const inscricoesResponse = await axios.get(`${apiListaInscricoes}/${eventoSelecionado}`); //inscricoes já realizadas do evento

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
            await axios.post(apiSalvarInscricao, inscricoes);
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
            <div>
                <h1>Inscrição</h1>
                <ListaSuspensa
                    fonteDados={apiEventos}
                    onChange={(id) => setEventoSelecionado(id)}
                    textoPlaceholder="Selecione um evento"
                    obrigatorio={true}
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
                        <Botao onClick={aoSalvar}>REALIZAR INSCRIÇÃO</Botao>
                    </div>
                )}
            </div>
        </>
    );
};

export default Inscricao;
