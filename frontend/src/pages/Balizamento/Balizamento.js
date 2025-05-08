import { useState, useEffect } from 'react';
import style from './Balizamento.module.css';
import Botao from '../../componentes/Botao/Botao';
import ListaSuspensa from '../../componentes/ListaSuspensa/ListaSuspensa';
import Tabela from '../../componentes/Tabela/Tabela';
import api from '../../servicos/api';
import { timeToMilliseconds } from '../../servicos/functions'; // Updated import
import { balizamentoPDF, gerarFilipetas } from '../../servicos/pdf';
import CabecalhoAdmin from '../../componentes/CabecalhoAdmin/CabecalhoAdmin';
import { relatorioInscritosPDF } from '../../servicos/relatoriosPDF';



const Balizamento = () => {
    const [eventoId, setEventoId] = useState(''); //captura o id do evento
    const [inscritos, setInscritos] = useState([]); //listagem dos inscritos
    const [balizamentoGerado, setBalizamentoGerado] = useState(false); //controla se já foi gerado balizamento (separa listar e salvar)

    const [inscritosOriginais, setInscritosOriginais] = useState([]);
    const [inscritosEquipe, setInscritosEquipe] = useState([]);
    const [inscritosEquipeSexo, setInscritosEquipeSexo] = useState([]);
    const [etapa, setEtapa] = useState({}); // Estado para as infos do evento
    const [eventos, setEventos] = useState([]); // Estado para armazenar a lista de eventos

    const apiEventos = `/balizamento/listarEventos`;
    const apiInscritos = `/balizamento/listarInscritos`;
    const apiInscritosEquipe = `/balizamento/listarInscritosEquipe`;
    const apiInscritosEquipeSexo = `/balizamento/listarInscritosEquipeSexo`;
    const apiSalvarBalizamento = '/balizamento/salvarBalizamento';

    //buscar eventos para a listasuspensa = SELECT
    useEffect(() => {
        const fetchEventos = async () => {
            try {
                const response = await api.get(apiEventos);
                setEventos(response.data);
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            }
        };
        fetchEventos();
    }, [apiEventos]);

    /* Capturar id do evento*/
    const eventoSelecionado = async (selected) => {
        const id = typeof selected === 'object' ? selected.id : selected;
        const idNumber = Number(id); // Converta o id para número, se necessário
        setEventoId(idNumber);

        const eventoEncontrado = eventos.find(e => e.id === idNumber);
        if (eventoEncontrado) {
            setEtapa(eventoEncontrado);
        } else {
            console.warn("Evento não encontrado para o id:", idNumber);
        }

        // Resetar estados relacionados ao balizamento anterior
        setInscritos([]);
        setInscritosOriginais([]);
        setInscritosEquipe([]);
        setInscritosEquipeSexo([]);
        setBalizamentoGerado(false);
    };

    // Função para ordenar nadadores com e sem tempo registrado
    const ordenarNadadoresPorTempo = (nadadores) => {
        const ordenados = [...nadadores].sort((a, b) => {
            const aInvalid = !a.melhor_tempo || a.melhor_tempo === "00:00" || a.melhor_tempo === "00:00:00";
            const bInvalid = !b.melhor_tempo || b.melhor_tempo === "00:00" || b.melhor_tempo === "00:00:00";

            // Agora invalidos no início
            if (aInvalid && bInvalid) return 0;
            if (aInvalid) return -1; // Move invalid para o início
            if (bInvalid) return 1;  // Move invalid para o início

            return timeToMilliseconds(b.melhor_tempo) - timeToMilliseconds(a.melhor_tempo);
        });
        return ordenados;
    };

    // Função para criar as baterias
    const dividirEmBaterias = (nadadores, quantidadeRaias) => {
        if (nadadores < 3) {
            return "Número insuficiente de nadadores para formar um grupo.";
        }
    
        let baterias = [];
        let qtdGruposMax = Math.floor(nadadores / quantidadeRaias);
        let resto = nadadores % quantidadeRaias;
    
        if (resto === 0) {
            // Se o resto for 0, todos os grupos têm "quantidadeRaias" nadadores
            for (let i = 0; i < qtdGruposMax; i++) {
                baterias.push(quantidadeRaias);
            }
        } else if (resto >= 3) {
            // Se o resto for 3 ou maior, basta formar um último grupo com esse resto
            for (let i = 0; i < qtdGruposMax; i++) {
                baterias.push(quantidadeRaias);
            }
            baterias.push(resto);
        } else {
            // Se o resto for 1 ou 2, ajustamos para garantir que a última série tenha pelo menos 3 nadadores
            for (let i = 0; i < qtdGruposMax - 1; i++) {
                baterias.push(quantidadeRaias);
            }
            baterias.push(3); // Última série com o mínimo de nadadores
            baterias.push(quantidadeRaias - 3 + resto); // Ajusta a penúltima série
        }
    
        // Ordenar os grupos em ordem crescente
        baterias.sort((a, b) => a - b);
    
        return baterias;
    };

    const gerarBalizamento = async () => {
        if (etapa.inscricao_aberta !== 0) {
            alert("As inscrições deste evento ainda estão abertas.");
            return;
        }
        if (!eventoId) {
            alert("Por favor, selecione um evento.");
            return;
        }
        try {
            // Buscar nadadores individuais
            const response = await api.get(`${apiInscritos}/${eventoId}`);
            const originais = response.data;
            setInscritosOriginais(originais);

            // Buscar inscritos por equipe (Dados Brutos)
            const responseEquipe = await api.get(`${apiInscritosEquipe}?eventoId=${eventoId}`);
            const equipeData = responseEquipe.data;
            setInscritosEquipe(equipeData);

            // Buscar inscritos por equipe detalhados (por Sexo e Revezamentos)
            const responseEquipeSexo = await api.get(`${apiInscritosEquipeSexo}?eventoId=${eventoId}`);
            const equipeSexoData = responseEquipeSexo.data;
            setInscritosEquipeSexo(equipeSexoData);

            // 🔹 Buscar equipes inscritas em revezamentos
            const responseRevezamentos = await api.get(`/balizamento/listarRevezamentos/${eventoId}`);
            const inscritosRevezamento = responseRevezamentos.data;

            // 🔹 Agrupar nadadores e equipes por prova
            const provasMap = {};
            const agruparPorProva = (lista, tipo) => {
                lista.forEach(inscrito => {
                    const key = inscrito.nome_prova;
                    if (!provasMap[key]) {
                        provasMap[key] = { ordem: inscrito.ordem, nadadores: [], equipes: [] };
                    }
                    provasMap[key][tipo].push(inscrito);
                });
            };

            agruparPorProva(originais, "nadadores");
            agruparPorProva(inscritosRevezamento, "equipes");

            // 🔹 Transformar e ordenar provas
            const provasOrdenadas = Object.keys(provasMap)
                .map(prova => ({
                    nome_prova: prova,
                    ordem: provasMap[prova].ordem,
                    nadadores: provasMap[prova].nadadores,
                    equipes: provasMap[prova].equipes
                }))
                .sort((a, b) => a.ordem - b.ordem);

            // 🔹 Processar cada prova
            const resultado = {};
            provasOrdenadas.forEach(prova => {
                const eventosProvasId = prova.nadadores[0]?.eventos_provas_id || prova.equipes[0]?.eventos_provas_id;

                // 🔹 Ordenar nadadores e equipes por tempo
                const nadadoresOrdenados = ordenarNadadoresPorTempo(prova.nadadores);
                const equipesOrdenadas = ordenarNadadoresPorTempo(prova.equipes);

                // 🔹 Criar baterias
                const totalParticipantes = nadadoresOrdenados.length + equipesOrdenadas.length;
                const baterias = dividirEmBaterias(totalParticipantes, etapa.quantidade_raias);

                if (!Array.isArray(baterias)) {
                    console.error('Erro: baterias não é um array válido!', baterias);
                    return;
                }

                resultado[prova.nome_prova] = baterias.map(qtdParticipantes => {
                    const nadadoresGrupo = nadadoresOrdenados.splice(0, qtdParticipantes);
                    const equipesGrupo = equipesOrdenadas.splice(0, qtdParticipantes - nadadoresGrupo.length);
                    return distribuirNasRaias([...nadadoresGrupo, ...equipesGrupo], eventosProvasId, etapa.quantidade_raias);
                });
            });

            setInscritos(resultado);

            // 🔹 Gera os PDFs após garantir que os estados foram atualizados
            setTimeout(() => {
                balizamentoPDF(resultado, etapa);
                gerarFilipetas(resultado, etapa);
                relatorioInscritosPDF(originais, equipeData, equipeSexoData, etapa);
            }, 0);

            setBalizamentoGerado(true);
        } catch (error) {
            console.error('Erro ao buscar inscritos:', error);
        }
    };
    
    // 🔹 Função para distribuir nadadores e equipes nas raias
    const distribuirNasRaias = (participantes, eventosProvasId, quantidadeRaias) => {
        const getTimeValue = (p) => {
            const t = timeToMilliseconds(p.melhor_tempo);
            return t === 0 ? Number.MAX_SAFE_INTEGER : t;
        };
    
        const ordenados = [...participantes].sort((a, b) => getTimeValue(a) - getTimeValue(b));
    
        const totalLanes = quantidadeRaias;
        let laneOrder = [];
        const center = Math.ceil(totalLanes / 2);
        laneOrder.push(center);
        let offset = 1;
        while (laneOrder.length < totalLanes) {
            if (center + offset <= totalLanes) laneOrder.push(center + offset);
            if (laneOrder.length < totalLanes && center - offset >= 1) laneOrder.push(center - offset);
            offset++;
        }
    
        const usedLanes = laneOrder.slice(0, ordenados.length);
    
        return ordenados.map((p, index) => ({
            ...p,
            raia: usedLanes[index],
            eventos_provas_id: eventosProvasId
        })).sort((a, b) => a.raia - b.raia);
    };
    

    // Salvar balizamento no banco
    const salvarBalizamento = async () => {
        if (etapa.inscricao_aberta !== 0) {
            alert("As inscrições deste evento ainda estão abertas, não é possível salvar.");
            return;
        }
        if (!balizamentoGerado) {
            alert('Nenhum balizamento foi gerado ainda.');
            return;
        }
        try {
            const response = await api.post(apiSalvarBalizamento, { eventoId, balizamento: inscritos });
            if (response.data.ignoredProvas && response.data.ignoredProvas.length) {
                alert("Balizamento salvo, porém as seguintes provas foram ignoradas:\n" + response.data.ignoredProvas.join("\n"));
            } else {
                alert('Balizamento salvo com sucesso!');
            }
            setBalizamentoGerado(false);
        } catch (error) {
            console.error('Erro ao salvar balizamento:', error);
            alert(
                error.response?.data?.message ||
                error.response?.data?.error ||
                'Erro ao salvar o balizamento. Tente novamente.'
            );
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
                        <Botao onClick={() => relatorioInscritosPDF(inscritosOriginais, inscritosEquipe, inscritosEquipeSexo, etapa)} className={style.baixarBotao}>
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
                                    colunasOcultas={['prova_id', 'nadador_id', 'inscricao_id', 'data_nasc', 'eventos_provas_id']}
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
                        <Botao onClick={() => relatorioInscritosPDF(inscritosOriginais, inscritosEquipe, inscritosEquipeSexo, etapa)} className={style.baixarBotao}>
                            Baixar Relatório de Inscritos
                        </Botao>
                    </div>
                )}
            </div>
        </>
    );
};

export default Balizamento;