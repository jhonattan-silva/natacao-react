import { useState, useEffect } from 'react';
import style from './Balizamento.module.css';
import Botao from '../../componentes/Botao/Botao';
import ListaSuspensa from '../../componentes/ListaSuspensa/ListaSuspensa';
import Tabela from '../../componentes/Tabela/Tabela';
import api from '../../servicos/api';
import { ordenarNadadoresPorTempo, dividirEmBaterias, distribuirNadadoresNasRaias } from '../../servicos/functions'; // Importe as funções
import { balizamentoPDF, gerarFilipetas } from '../../servicos/pdf';
import CabecalhoAdmin from '../../componentes/CabecalhoAdmin/CabecalhoAdmin';

const Balizamento = () => {
    const [eventoId, setEventoId] = useState(''); //captura o id do evento
    const [inscritos, setInscritos] = useState([]); //listagem dos inscritos
    const [balizamentoGerado, setBalizamentoGerado] = useState(false); //controla se já foi gerado balizamento (separa listar e salvar)

    const apiEventos = `/balizamento/listarEventos`;
    const apiInscritos = `/balizamento/listarInscritos`;
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

    const gerarBalizamento = async () => {
        if (!eventoId) {
            alert("Por favor, selecione um evento.");
            return;
        }
        try { //tendo selecionado um evento...
            const response = await api.get(`${apiInscritos}/${eventoId}`); //api+idEvento
            const inscritos = response.data; //inscritos recebe os todos os dados retornados
            const nadadoresPorProva = {};

            inscritos.forEach(inscrito => {
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
                console.log("Só resultado=>", todosNadadores);
                console.log("Só as baterias=>", baterias);

            });
            setInscritos(resultado);
            balizamentoPDF(resultado);
            gerarFilipetas(resultado);
            console.log('Estrutura de dadosBalizamento:', JSON.stringify(resultado, null, 2));
            setBalizamentoGerado(true); // Indica que o balizamento foi gerado
        } catch (error) {
            console.error('Erro ao buscar inscritos:', error);
        }
    };

        // Salvar balizamento no banco
        const salvarBalizamento = async () => {
            console.log("FRONT: EVNETO ID===>", eventoId);
            console.log("FRONT: BALÇIZAMENTO: INSCRITOS", inscritos);
            
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
                <ListaSuspensa
                    textoPlaceholder="Selecione o Evento"
                    fonteDados={apiEventos}
                    onChange={eventoSelecionado} />
                <Botao onClick={gerarBalizamento}>BALIZAR</Botao>
                {Object.keys(inscritos).map(prova => (
                    <div key={prova}>
                        <h2>{`Balizamento - ${prova}`}</h2>
                        {inscritos[prova].map((bateria, index) => (
                            <div key={index}>
                                <h3>{`Bateria ${index + 1}`}</h3>
                                <Tabela dados={bateria.flat()} />
                                </div>
                        ))}
                    </div>
                ))}
                {balizamentoGerado && (
                    <Botao onClick={salvarBalizamento} className={style.salvarBotao}>
                        Salvar no Banco
                    </Botao>
                )}
            </div>
        </>
    );
};

export default Balizamento;