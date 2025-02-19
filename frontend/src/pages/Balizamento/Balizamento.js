import { useState, useEffect } from 'react';
import style from './Balizamento.module.css';
import Botao from '../../componentes/Botao/Botao';
import ListaSuspensa from '../../componentes/ListaSuspensa/ListaSuspensa';
import Tabela from '../../componentes/Tabela/Tabela';
import api from '../../servicos/api';
import { ordenarNadadoresPorTempo, dividirEmBaterias, distribuirNadadoresNasRaias } from '../../servicos/functions'; // Importe as funções
import { balizamentoPDF, gerarFilipetas } from '../../servicos/pdf';
import CabecalhoAdmin from '../../componentes/CabecalhoAdmin/CabecalhoAdmin';
import { relatorioInscritosPDF } from '../../servicos/relatoriosPDF';

const Balizamento = () => {
    const [eventoId, setEventoId] = useState(''); //captura o id do evento
    const [inscritos, setInscritos] = useState([]); //listagem dos inscritos
    const [balizamentoGerado, setBalizamentoGerado] = useState(false); //controla se já foi gerado balizamento (separa listar e salvar)

    const apiEventos = `/balizamento/listarEventos`;
    const apiInscritos = `/balizamento/listarInscritos`;
    const apiInscritosEquipe = `/balizamento/listarInscritosEquipe`;
    const apiInscritosUnicosEquipe = `/balizamento/listarInscritosUnicosEquipe`;
    const apiInscritosEquipeSexo = `/balizamento/listarInscritosEquipeSexo`;
    const apiSalvarBalizamento = '/balizamento/salvarBalizamento';

    //buscar eventos para a listasuspensa = SELECT
    useEffect(() => {
        const fetchEventos = async () => {
            try {
                const response = await api.get(apiEventos);
                setEventoId(response.data); // Preenche os eventos para a lista suspensa
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            }
        };
        fetchEventos();
    }, [apiEventos]);

    /* Capturar id do evento*/
    const eventoSelecionado = (id) => {
        setEventoId(id);
    };

    const fetchInscritosPorEquipe = async () => {
        try {
            const response = await api.get(apiInscritosEquipe);
            console.log("Dados dos inscritos por equipe:", response.data);
        } catch (error) {
            console.error("Erro ao buscar inscritos por equipe:", error);
        }
    };

    const gerarBalizamento = async () => {
        if (!eventoId) {
            alert("Por favor, selecione um evento.");
            return;
        }
        try { //tendo selecionado um evento...
            const response = await api.get(`${apiInscritos}/${eventoId}`); //api+idEvento
            const inscritosOriginais = response.data; // Captura os inscritos originais
            const nadadoresPorProva = {};

            inscritosOriginais.forEach(inscrito => {
                if (!nadadoresPorProva[inscrito.nome_prova]) { //se a prova atual ainda não tem um array
                    nadadoresPorProva[inscrito.nome_prova] = []; //cria o array do balizamento da prova especifica
                }
                nadadoresPorProva[inscrito.nome_prova].push(inscrito); //joga o nadador dentro do array da prova em que ele ta inscrito
            });

            const resultado = {};
            Object.keys(nadadoresPorProva).forEach(prova => {
                const nadadores = nadadoresPorProva[prova];
                const provaId = nadadoresPorProva[prova][0]?.prova_id; // Obtém o prova_id da primeira inscrição

                const todosNadadores = ordenarNadadoresPorTempo(nadadores); // Rankear nadadores
                const baterias = dividirEmBaterias(todosNadadores); // Dividir em baterias

                resultado[prova] = baterias.map(bateria => distribuirNadadoresNasRaias(bateria, provaId)); // Distribuir nas raias com o id da prova junto
            });
            setInscritos(resultado);
            balizamentoPDF(resultado);
            gerarFilipetas(resultado);

            // Agora busca os inscritos por equipe e gera o relatório com ambos os conjuntos
            const respEquipe = await api.get(`${apiInscritosUnicosEquipe}`, { params: { eventoId } });
            const inscritosEquipe = respEquipe.data;
            
            const respEquipeSexo = await api.get(apiInscritosEquipeSexo, { params: { eventoId } });
            const inscritosEquipeSexo = respEquipeSexo.data;
            
            // Passe os três conjuntos para a função (orginais, dados brutos e equipe/sexo)
            relatorioInscritosPDF(inscritosOriginais, inscritosEquipe, inscritosEquipeSexo);

            setBalizamentoGerado(true); // Indica que o balizamento foi gerado
        } catch (error) {
            console.error('Erro ao buscar inscritos:', error);
        }
    };

    // Salvar balizamento no banco
    const salvarBalizamento = async () => {
        if (!balizamentoGerado) {
            alert('Nenhum balizamento foi gerado ainda.');
            return;
        }
        try {
            await api.post(apiSalvarBalizamento, { eventoId, balizamento: inscritos });
            alert('Balizamento salvo com sucesso!');
            setBalizamentoGerado(false); // Reseta o estado de balizamento gerado
        } catch (error) {
            console.error('Erro ao salvar balizamento:', error);
            alert('Erro ao salvar o balizamento. Tente novamente.');
        }
    };

    return (
        <>
            <CabecalhoAdmin />
            <div className={style.balizamento}>
                <div className={style.centralizar}>
                    <h1>BALIZAMENTO</h1>
                    <ListaSuspensa
                        textoPlaceholder="Selecione o Evento"
                        fonteDados={apiEventos}
                        onChange={eventoSelecionado} />
                    <Botao onClick={gerarBalizamento}>BALIZAR</Botao>
                    <hr />
                </div>
                {balizamentoGerado && (
                    <div className={style.botaoContainer}>
                        <Botao onClick={salvarBalizamento} className={style.salvarBotao}>
                            SALVAR E FECHAR INSCRIÇÕES
                        </Botao>
                        <Botao onClick={() => gerarFilipetas(inscritos)} className={style.baixarBotao}>
                            Baixar Filipetas
                        </Botao>
                        <Botao onClick={() => balizamentoPDF(inscritos)} className={style.baixarBotao}>
                            Baixar Balizamento
                        </Botao>
                    </div>
                )}
                {Object.keys(inscritos).map(prova => (
                    <div key={prova}>
                        <h2>{`Balizamento - ${prova}`}</h2>
                        {inscritos[prova].map((bateria, index) => (
                            <div key={index}>
                                <h3>{`Série ${index + 1}`}</h3>
                                <Tabela dados={bateria.flat()} />
                            </div>
                        ))}
                    </div>
                ))}
                {balizamentoGerado && (
                    <div className={style.botaoContainer}>
                        <Botao onClick={salvarBalizamento} className={style.salvarBotao}>
                            SALVAR E FECHAR INSCRIÇÕES
                        </Botao>
                        <Botao onClick={() => gerarFilipetas(inscritos)} className={style.baixarBotao}>
                            Baixar Filipetas
                        </Botao>
                        <Botao onClick={() => balizamentoPDF(inscritos)} className={style.baixarBotao}>
                            Baixar Balizamento
                        </Botao>
                    </div>
                )}
            </div>
        </>
    );
};

export default Balizamento;