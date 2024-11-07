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

    useEffect(() => {
        // Código para buscar dados do evento
        const fetchDadosEvento = async () => {
            try {
                const nadadoresResponse = await axios.get(apiListaNadadores);
                const provasResponse = await axios.get(`${apiProvasEvento}/${eventoSelecionado}`);
                const inscricoesResponse = await axios.get(`${apiListaInscricoes}/${eventoSelecionado}`);
    
                console.log("Inscrições recebidas do backend:", inscricoesResponse.data);
    
                setNadadores(nadadoresResponse.data);
                setProvas(provasResponse.data.provas);
    
                const novasSelecoes = {};
    
                inscricoesResponse.data.forEach(inscricao => {
                    console.log("Processando inscrição:", inscricao); // Verifica o conteúdo da inscrição atual
                    
                    const nadador = nadadoresResponse.data.find(n => n.id === inscricao.nadadorId); // Corrigido para usar nadadorId
                    console.log("Resultado da busca por nadador:", nadador); // Verifica se encontrou um nadador correspondente
                    
                    if (nadador) {
                        console.log("Nadador encontrado:", nadador); // Exibe o nadador encontrado com o mesmo `id`
                        
                        if (!novasSelecoes[nadador.id]) {
                            novasSelecoes[nadador.id] = {};
                            console.log("Criando novo objeto de seleções para o nadador:", nadador.id); // Log para indicar criação do objeto de seleções
                        }
                
                        novasSelecoes[nadador.id][inscricao.provaId] = true; // Corrigido para usar provaId
                        console.log(`Marcando prova ${inscricao.provaId} para o nadador ${nadador.id}`); // Confirmação de marcação da prova
                    } else {
                        console.log("Nenhum nadador encontrado para a inscrição:", inscricao.nadadorId); // Corrigido para usar nadadorId
                    }
                });
                
                // Exibe o estado final de novasSelecoes para verificar se está conforme esperado
                console.log("Seleções após o preenchimento:", novasSelecoes);
                
                setSelecoes(novasSelecoes);
    
            } catch (error) {
                console.error("Erro ao buscar dados do evento:", error);
            }
        };
    
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
            const response = await axios.post(apiSalvarInscricao, inscricoes);
            alert('Inscrição realizada com sucesso:', response.data);
        } catch (error) {
            console.error('Erro ao realizar a inscrição:', error);
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
                        <TabelaInscricao
                            nadadores={nadadores}
                            provas={provas}
                            selecoes={selecoes}
                            onCheckboxChange={handleCheckboxChange}
                        />
                        <Botao onClick={aoSalvar}>REALIZAR INSCRIÇÃO</Botao>
                    </div>
                )}
            </div>
        </>
    );
};

export default Inscricao;
