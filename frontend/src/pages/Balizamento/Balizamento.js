import { useState, useEffect } from 'react';
import style from './Balizamento.module.css';
import Botao from '../../componentes/Botao/Botao';
import ListaSuspensa from '../../componentes/ListaSuspensa/ListaSuspensa';
import Tabela from '../../componentes/Tabela/Tabela';
import api from '../../servicos/api';
import { ordenarNadadoresPorIdade, dividirEmBaterias, distribuirNadadoresNasRaias } from '../../servicos/functions'; // Modificado
import { balizamentoPDF, gerarFilipetas } from '../../servicos/pdf';
import CabecalhoAdmin from '../../componentes/CabecalhoAdmin/CabecalhoAdmin';
import { relatorioInscritosPDF } from '../../servicos/relatoriosPDF';

const Balizamento = () => {
    const [eventoId, setEventoId] = useState(''); //captura o id do evento
    const [inscritos, setInscritos] = useState([]); //listagem dos inscritos
    const [balizamentoGerado, setBalizamentoGerado] = useState(false); //controla se já foi gerado balizamento (separa listar e salvar)

    // NEW STATE VARIABLES:
    const [inscritosOriginais, setInscritosOriginais] = useState([]);
    const [inscritosEquipe, setInscritosEquipe] = useState([]);
    const [inscritosEquipeSexo, setInscritosEquipeSexo] = useState([]);
    const [etapa, setEtapa] = useState({}); // Estado para as infos do evento

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
        fetchEventos(); // Executa a função
    }, [apiEventos]); // Executa quando o componente é montado

    /* Capturar id do evento*/
    const eventoSelecionado = async (selected) => {
        if (typeof selected === 'object' && selected.id) {
            setEventoId(selected.id);
            // Armazena os dados completos do evento em "etapa"
            setEtapa({ nome: selected.nome, data: selected.data /*, outros dados se necessário */ });
        } else {
            setEventoId(selected);
            try {
                const response = await api.get(apiEventos);
                // Procura o evento que possui o id igual a `selected`
                const eventoEncontrado = response.data.find(e => e.id === selected) || response.data[0];
                setEtapa(eventoEncontrado);
            } catch (error) {
                console.error("Erro ao buscar dados completos do evento:", error);
            }
        }
    };
    

    const fetchInscritosPorEquipe = async () => {
        try {
            const response = await api.get(apiInscritosEquipe);
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
            const originais = response.data; // Captura os inscritos originais
            setInscritosOriginais(originais); // Store data in state

            // Agrupar inscrições pela prova, armazenando também a ordem
            const nadadoresPorProva = {};
            originais.forEach(inscrito => {
                if (!nadadoresPorProva[inscrito.nome_prova]) {
                    nadadoresPorProva[inscrito.nome_prova] = { ordem: inscrito.ordem, inscritos: [] };
                }
                nadadoresPorProva[inscrito.nome_prova].inscritos.push(inscrito);
            });

            // Transformar em array ordenado pela ordem da prova
            const provasOrdenadas = Object.keys(nadadoresPorProva)
                .map(prova => ({
                    nome_prova: prova,
                    ordem: nadadoresPorProva[prova].ordem,
                    inscritos: nadadoresPorProva[prova].inscritos
                }))
                .sort((a, b) => a.ordem - b.ordem);

            // Processar cada prova conforme a ordem
            const resultado = {};
            provasOrdenadas.forEach(item => {
                const provaId = item.inscritos[0]?.prova_id;
                // Alterado: ordena nadadores por idade em vez de por tempo
                const todosNadadores = ordenarNadadoresPorIdade(item.inscritos);
                const baterias = dividirEmBaterias(todosNadadores);
                resultado[item.nome_prova] = baterias.map(bateria => distribuirNadadoresNasRaias(bateria, provaId));
            });

            setInscritos(resultado);
            balizamentoPDF(resultado, etapa);
            gerarFilipetas(resultado);

            // Agora busca os inscritos por equipe e gera o relatório com ambos os conjuntos
            const respEquipe = await api.get(`${apiInscritosUnicosEquipe}`, { params: { eventoId } });
            setInscritosEquipe(respEquipe.data);

            const respEquipeSexo = await api.get(apiInscritosEquipeSexo, { params: { eventoId } });
            setInscritosEquipeSexo(respEquipeSexo.data);

            // Passe os três conjuntos para a função (orginais, dados brutos e equipe/sexo)
            relatorioInscritosPDF(originais, respEquipe.data, respEquipeSexo.data);

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
            // Mostra a mensagem de erro retornada pelo backend ao usuário, se existir.
            alert(error.response?.data?.error || 'Erro ao salvar o balizamento. Tente novamente.');
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
                        <Botao onClick={() => balizamentoPDF(inscritos, etapa)} className={style.baixarBotao}>
                            Baixar Balizamento
                        </Botao>
                        <Botao onClick={() => relatorioInscritosPDF(inscritosOriginais, inscritosEquipe, inscritosEquipeSexo)} className={style.baixarBotao}>
                            Baixar Relatório de Inscritos
                        </Botao>
                    </div>
                )}
                {Object.keys(inscritos).map(prova => (
                    <div key={prova}>
                        <h2>{`Balizamento - ${prova}`}</h2>
                        {inscritos[prova].map((bateria, index) => (
                            <div key={index}>
                                <h3>{`Série ${index + 1}`}</h3>
                                <Tabela
                                    dados={bateria.flat()}
                                    colunasOcultas={['prova_id', 'nadador_id', 'inscricao_id', 'data_nasc']}
                                    textoExibicao={{
                                        nome_prova: 'PROVA',
                                        nome: 'NADADOR',
                                        melhor_tempo: 'RECORD',
                                        equipe: 'EQUIPE',
                                        categoria: 'CATEGORIA',
                                        raia: 'RAIA'
                                    }}
                                />
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
                        <Botao onClick={() => balizamentoPDF(inscritos, etapa)} className={style.baixarBotao}>
                            Baixar Balizamento
                        </Botao>
                        <Botao onClick={() => relatorioInscritosPDF(inscritosOriginais, inscritosEquipe, inscritosEquipeSexo)} className={style.baixarBotao}>
                            Baixar Relatório de Inscritos
                        </Botao>
                    </div>
                )}
            </div>
        </>
    );
};

export default Balizamento;