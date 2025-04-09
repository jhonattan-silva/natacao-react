import React, { useState, useEffect } from 'react';
import debounce from 'lodash.debounce';
import Botao from '../../componentes/Botao/Botao';
import api from '../../servicos/api';
import ListaSuspensa from '../../componentes/ListaSuspensa/ListaSuspensa';
import CabecalhoAdmin from '../../componentes/CabecalhoAdmin/CabecalhoAdmin';
import Rodape from '../../componentes/Rodape/Rodape';
import Tabela from '../../componentes/Tabela/Tabela';
import TabelaDinamica from '../../componentes/TabelaDinamica/TabelaDinamica';

function BalizamentosAjuste() {
    const [etapa, setEtapa] = useState({});
    const [eventos, setEventos] = useState([]);
    const [eventoId, setEventoId] = useState('');
    const [ajustes, setAjustes] = useState({});
    const [mensagem, setMensagem] = useState('');
    const [serieEmEdicaoIndex, setSerieEmEdicaoIndex] = useState(null);
    const [novaSerie, setNovaSerie] = useState([]);
    const [inscritos, setInscritos] = useState([]);

    const apiEventos = `/balizamentosAjuste/listarEventos`;

    useEffect(() => {
        const fetchEventos = async () => {
            try {
                const response = await api.get(apiEventos);
                setEventos(response.data);
            } catch (error) {
                console.error('Erro ao buscar eventos:', error);
            }
        };
        fetchEventos();
    }, []);

    const eventoSelecionado = async (selected) => {
        const id = typeof selected === 'object' ? selected.id : selected;
        const idNumber = Number(id);
        setEventoId(idNumber);

        const eventoEncontrado = eventos.find(e => e.id === idNumber);
        if (eventoEncontrado) {
            setEtapa(eventoEncontrado);
        } else {
            console.warn("Evento não encontrado para o id:", idNumber);
        }
    };

    const buscarBalizamento = async () => {
        try {
            const response = await api.get(`/balizamentosAjuste/listarBalizamento/${eventoId}`);
            setAjustes(response.data);
        } catch (error) {
            console.error('Erro ao buscar balizamento:', error);
            setMensagem('Erro ao buscar balizamento.');
        }
    };

    const salvarAjustes = async () => {
        try {
            const response = await api.post('/balizamentosAjuste/salvar', { eventoId, ajustes });
            setMensagem(response.data.message);
        } catch (error) {
            console.error('Erro ao salvar ajustes:', error);
            setMensagem('Erro ao salvar ajustes.');
        }
    };

    const adicionarNovaSerie = async (indexProva, provaId) => {
        setSerieEmEdicaoIndex(indexProva);
        setNovaSerie([]);
        setProvaIdAtual(provaId); // Armazena o provaId atual
        await listarInscritos(eventoId, provaId);
    };

    const cancelarNovaSerie = () => {
        setSerieEmEdicaoIndex(null);
        setNovaSerie([]);
    };

    const listarInscritos = async (eventoId, provaId) => {
        try {
            const response = await api.get(`/balizamentosAjuste/listarInscritos/${eventoId}/${provaId}`);
            setInscritos(response.data);
        } catch (error) {
            console.error('Erro ao buscar inscritos:', error);
        }
    };
    const filtrarNadadores = debounce((termo) => {
        if (!termo) {
            setOpcoesNadadores([]);
            return;
        }
        const filtrados = inscritos.filter(i =>
            i.nome.toLowerCase().includes(termo.toLowerCase())
        );
        setOpcoesNadadores(filtrados);
    }, 300);

    const [opcoesNadadores, setOpcoesNadadores] = useState([]);
    // Novo estado para armazenar o provaId atual
    const [provaIdAtual, setProvaIdAtual] = useState(null);

    const buscarNadadores = async (eventoId, provaId, termo) => {
        console.log("Buscando nadadores para evento:", eventoId, "prova:", provaId, "termo:", termo);
        const response = await api.get(`/balizamentosAjuste/buscarNadadoresDisponiveis/${eventoId}/${provaId}?termo=${encodeURIComponent(termo)}`);
        return response.data;
    };

    const debouncedBuscarNadadores = debounce(async (termo) => {
        console.log("debouncedBuscarNadadores chamado com termo:", termo);
        console.log("Usando eventoId e provaIdAtual:", eventoId, provaIdAtual);
        const data = await buscarNadadores(eventoId, provaIdAtual, termo);
        console.log("Resultado da busca:", data);
        setOpcoesNadadores(data);
    }, 500);

    const handleNovaSerieChange = (novosDados) => {
        setNovaSerie(novosDados);
    };

    const salvarNovaSerie = () => {
        const ajustesAtualizados = { ...ajustes };
        const prova = ajustesAtualizados.provas[serieEmEdicaoIndex];

        if (!prova.series) {
            prova.series = [];
        }

        prova.series.push({
            bateria_descricao: `Série ${prova.series.length + 1}`,
            dados: novaSerie,
        });

        setAjustes(ajustesAtualizados);
        cancelarNovaSerie();
    };

    return (
        <>
            <CabecalhoAdmin />
            <h1>Ajuste Manual do Balizamento</h1>

            <ListaSuspensa
                id="selectEvento"
                textoPlaceholder="Selecione o Evento"
                fonteDados={apiEventos}
                onChange={eventoSelecionado}
            />

            <Botao onClick={buscarBalizamento}>Buscar Balizamento</Botao>

            {ajustes?.provas && ajustes.provas.length > 0 && ajustes.provas.map((bloco, idx) => (
                <div key={idx}>
                    <h2>{bloco.label}</h2>

                    {bloco.series && bloco.series.length > 0 ? (
                        bloco.series.map((serie, idx2) => (
                            <div key={idx2}>
                                <h3>{serie.bateria_descricao}</h3>
                                <Tabela dados={serie.dados} />
                            </div>
                        ))
                    ) : (
                        <p>Nenhuma inscrição disponível.</p>
                    )}

                    {serieEmEdicaoIndex === idx && (
                        <div>
                            <h3>Nova Série</h3>
                            <TabelaDinamica
                                dadosIniciais={novaSerie}
                                colunas={['nome', 'tempo', 'raia']}
                                textoExibicao={{ nome: 'Nome do Nadador', tempo: 'Tempo', raia: 'Raia' }} // atualizado
                                opcoesAutoComplete={opcoesNadadores}
                                debouncedBuscarNadadores={debouncedBuscarNadadores}
                                onInputChange={debouncedBuscarNadadores}
                                // Retorna os dados completos do inscrito para preencher todos os campos
                                onSelecionarAutoComplete={(nadador) => ({
                                    nome: nadador.nome,
                                    tempo: nadador.tempo || '',
                                    raia: nadador.raia || ''
                                })}
                                onChange={handleNovaSerieChange}
                                nadadoresJaUsados={[]}
                            />
                            <div style={{ marginTop: '8px' }}>
                                <Botao onClick={cancelarNovaSerie}>❌ Cancelar</Botao>
                                <Botao onClick={salvarNovaSerie}>💾 Salvar Nova Série</Botao>
                            </div>
                        </div>
                    )}

                    <Botao onClick={() => adicionarNovaSerie(idx, bloco.provaId)}>
                        ➕ Adicionar Série
                    </Botao>
                </div>
            ))}

            <Botao onClick={salvarAjustes}>Salvar Ajustes</Botao>

            {mensagem && <p>{mensagem}</p>}

            <Rodape />
        </>
    );
}

export default BalizamentosAjuste;
