import api from '../../servicos/api';
import { useEffect, useRef, useState } from 'react';
import Botao from '../../componentes/Botao/Botao';
import BotaoTabela from '../../componentes/BotaoTabela/BotaoTabela';
import Formulario from '../../componentes/Formulario/Formulario';
import TabelaEdicao from '../../componentes/TabelaEdicao/TabelaEdicao';
import style from './Etapas.module.css';
import ListaSuspensa from '../../componentes/ListaSuspensa/ListaSuspensa';
import CheckboxGroup from '../../componentes/CheckBoxGroup/CheckBoxGroup';
import CabecalhoAdmin from '../../componentes/CabecalhoAdmin/CabecalhoAdmin';
import RadioButtons from '../../componentes/RadioButtons/RadioButtons';
import useAlerta from '../../hooks/useAlerta'; // Importa o hook useAlerta

const Etapas = () => {
    const [etapas, setEtapas] = useState([]);
    const [formVisivel, setFormVisivel] = useState(false); //estado para exibição ou não do formulário
    const [etapaEditando, setEtapaEditando] = useState(null); //estado para edição
    const [provasCarregadas, setProvasCarregadas] = useState(false); //estado para carregamento de provas no editar
    const [raias, setRaias] = useState(''); //estado para quantidade de raias
    const [anoSelecionado, setAnoSelecionado] = useState('2025'); // Estado para o ano selecionado
    const [horaEtapa, setHoraEtapa] = useState(''); // Novo estado para o horário do evento
    const [etapaAtual, setEtapaAtual] = useState(1); // Novo estado para controlar a etapa atual
    const [provasSelecionadas, setProvasSelecionadas] = useState([]); // Novo estado para armazenar as provas selecionadas
    const ordemInputRefs = useRef({}); //ref para não perder o foco do input de ordem depois de alterar qualquer caracter
    const { mostrar: mostrarAlerta, componente: alertaComponente } = useAlerta(); // Usa o hook useAlerta

    const apiListaEtapas = `/etapas/listarEtapas`;
    const apiCadastraEtapas = `/etapas/cadastrarEtapas`;
    const apiListaTorneios = `/etapas/listarTorneios`;
    const apiListaProvasMasculino = `/etapas/listarProvas?sexo=M`;
    const apiListaProvasFeminino = `/etapas/listarProvas?sexo=F`;
    const apiAtualizaEtapas = `/etapas/atualizarEtapas`;
    const apiExcluiEtapa = `/etapas/excluiEtapa`;
    const apiAbreInscricao = `/etapas/abreInscricao`;
    const apiListaEtapasAno = `/etapas/listarEtapasAno`;

    const buttonLabels = {
        editar: 'Editar',
        excluir: 'Excluir',
        abrirInscricao: 'Abrir Inscrição',
        fecharInscricao: 'Fechar Inscrição',
        gerarPontuacao: 'Gerar Pontuação'
    };

    useEffect(() => {
        fetchData(anoSelecionado); // Chama a função `fetchData` ao montar o componente
    }, [anoSelecionado, apiListaEtapasAno]); // Incluído `apiListaEtapasAno` como dependência

    const fetchData = async (ano) => {
        try {
            const response = await api.get(`${apiListaEtapasAno}/${ano}`); // Busca no backend a lista de etapas para o ano selecionado
            if (response.data) {
                const etapasFormatadas = response.data.map(etapa => ({
                    ...etapa,
                    data: new Date(etapa.data).toLocaleDateString('pt-BR')
                }));
                setEtapas(etapasFormatadas); // Define o estado `etapas` com a lista formatada
            } else {
                console.error('Nenhum dado retornado da API');
            }
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        }
    };

    const handleEdit = async (id) => {
        try {
            const response = await api.get(`${apiAtualizaEtapas}/${id}`);
            const etapa = response.data;

            setEtapaEditando(etapa);
            setNomeEtapa(etapa.nome);
            const [date, time] = etapa.data.split('T');
            setDataEtapa(date.split('-').reverse().join('/'));
            setHoraEtapa(time.substring(0, 5));
            setCidadeEtapa(etapa.cidade);
            setSedeEtapa(etapa.sede || '');     
            setEnderecoEtapa(etapa.endereco || '');
            setTorneioEtapa(etapa.torneios_id);
            setRaias(etapa.quantidade_raias ? String(etapa.quantidade_raias) : '6');

            const provasOrdenadas = etapa.provas
                .map(prova => ({
                    id: prova.provas_id.toString(),
                    label: `${prova.distancia}m ${prova.estilo}`,
                    estilo: prova.estilo,
                    distancia: prova.distancia,
                    sexo: prova.sexo,
                    ordem: prova.ordem
                }))
                .sort((a, b) => a.ordem - b.ordem);

            setProvasSelecionadas(provasOrdenadas);

            const selecionadasMasculino = provasOrdenadas
                .filter(prova => prova.sexo === 'M')
                .map(prova => prova.id);

            const selecionadasFeminino = provasOrdenadas
                .filter(prova => prova.sexo === 'F')
                .map(prova => prova.id);

            const selecionadasAmbos = provasOrdenadas
                .filter(prova => selecionadasMasculino.includes(prova.id) && selecionadasFeminino.includes(prova.id))
                .map(prova => prova.id);

            setSelecionadasMasculino(selecionadasMasculino);
            setSelecionadasFeminino(selecionadasFeminino);
            setSelecionadasAmbos(selecionadasAmbos);

            setFormVisivel(true);
        } catch (error) {
            console.error('Erro ao carregar etapa para edição:', error);
        }
    };

    const handleExcluir = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir esta etapa?")) {
            try {
                await api.delete(`${apiExcluiEtapa}/${id}`);
                mostrarAlerta("Etapa excluída com sucesso!"); // Usa o hook para exibir o alerta
                fetchData(); // Atualiza a lista após exclusão
            } catch (error) {
                console.error("Erro ao excluir etapa:", error);
                mostrarAlerta("Não foi possível excluir a etapa."); // Usa o hook para exibir o alerta
            }
        }
    };

    const handleAdicionar = () => {
        setEtapaEditando(null); //como é nova editando é null
        limparFormulario();//garante o form limpo
        setFormVisivel(true);
    };

    const torneioSelecionado = (id) => setTorneioEtapa(id); //guarda o id escolhido do torneio

    const adicionarEtapa = async (dados) => {
        try {
            await api.post(apiCadastraEtapas, dados); // Envia os dados para salvar a nova etapa
            await fetchData(anoSelecionado); // Recarrega a lista de etapas do backend
            setFormVisivel(false); // Esconde o formulário após o salvamento
        } catch (error) {
            console.error('Erro ao cadastrar etapa:', error);
        }
    };

    const atualizarEtapa = async (dados) => {
        try {
            await api.put(`${apiAtualizaEtapas}/${etapaEditando.id}`, dados); // Chama a rota de edição equivalente ao id selecionado
            await fetchData(anoSelecionado); // Recarrega as etapas após atualizar
            setFormVisivel(false); // Fecha o form
            setEtapaEditando(null); // Limpa o estado de edição
        } catch (error) {
            console.error('Erro ao editar etapa:', error);
            if (error.response && error.response.data && error.response.data.error) {
                mostrarAlerta(error.response.data.error); // Exibe a mensagem de erro retornada pelo backend
            } else {
                mostrarAlerta('Esse evento já possui nadadores inscritos, por favor contate o desenvolvedor');
            }
        }
    };

    const [nomeEtapa, setNomeEtapa] = useState('');
    const [dataEtapa, setDataEtapa] = useState('');
    const [cidadeEtapa, setCidadeEtapa] = useState('');
    const [sedeEtapa, setSedeEtapa] = useState('');
    const [enderecoEtapa, setEnderecoEtapa] = useState('');
    const [torneioEtapa, setTorneioEtapa] = useState('');
    const [listaTorneios, setListaTorneios] = useState([]);

    useEffect(() => {
        const fetchTorneios = async () => {
            try {
                const response = await api.get(apiListaTorneios);
                if (response.data) {
                    setListaTorneios(response.data);
                } else {
                    console.error('Nenhum dado retornado da API');
                }
            } catch (error) {
                console.error('Erro ao buscar torneios:', error);
            }
        };
        fetchTorneios();
    }, [apiListaTorneios]); // Incluído `apiListaTorneios` como dependência

    const inputs = [
        {
            obrigatorio: true,
            label: "Nome do Evento",
            placeholder: "Digite o nome do evento",
            valor: nomeEtapa,
            aoAlterar: setNomeEtapa
        },
        {
            obrigatorio: true,
            tipo: "text", // date dava problema no mobile
            label: "Data do Evento",
            placeholder: "DD/MM/AAAA",
            valor: dataEtapa,
            aoAlterar: (valor) => {
                let valorFormatado = valor.replace(/\D/g, ""); // Remove tudo que não for número

                let dia = valorFormatado.substring(0, 2);
                let mes = valorFormatado.substring(2, 4);
                let ano = valorFormatado.substring(4, 8);

                // Apenas aplica limite de dia/mês se já estiverem completos
                if (dia.length === 2) {
                    dia = Math.min(31, parseInt(dia)).toString().padStart(2, "0");
                }
                if (mes.length === 2) {
                    mes = Math.min(12, parseInt(mes)).toString().padStart(2, "0");
                }

                valorFormatado = dia;
                if (valorFormatado.length >= 2) valorFormatado += "/";
                valorFormatado += mes;
                if (valorFormatado.length >= 5) valorFormatado += "/";
                valorFormatado += ano;

                // Permite apagar corretamente (se terminar com '/', remove)
                if (valor.endsWith("/")) {
                    valorFormatado = valorFormatado.slice(0, -1);
                }

                setDataEtapa(valorFormatado);
            }
        },
        {
            obrigatorio: true,
            tipo: "time", // Novo campo para horário
            label: "Horário do Evento",
            valor: horaEtapa,
            aoAlterar: setHoraEtapa
        },
        {
            obrigatorio: true,
            label: "Cidade",
            placeholder: "Digite a Cidade",
            valor: cidadeEtapa,
            aoAlterar: setCidadeEtapa
        },
        {
            obrigatorio: false,
            label: "Sede",
            placeholder: "Digite a sede do evento",
            valor: sedeEtapa,
            aoAlterar: setSedeEtapa
        },
        {
            obrigatorio: false,
            label: "Endereço",
            placeholder: "Digite o endereço",
            valor: enderecoEtapa,
            aoAlterar: setEnderecoEtapa
        }
    ];

    const [provasMasculino, setProvasMasculino] = useState([]);
    const [provasFeminino, setProvasFeminino] = useState([]);
    const [selecionadasMasculino, setSelecionadasMasculino] = useState([]);
    const [selecionadasFeminino, setSelecionadasFeminino] = useState([]);
    const [selecionadasAmbos, setSelecionadasAmbos] = useState([]);
    const [idMap, setIdMap] = useState({});

    useEffect(() => {
        const fetchProvas = async () => {
            try {
                const responseMasculino = await api.get(apiListaProvasMasculino);
                const responseFeminino = await api.get(apiListaProvasFeminino);

                if (responseMasculino.data && responseFeminino.data) {
                    const formattedMasculino = responseMasculino.data.map(prova => ({
                        id: prova.id.toString(),
                        label: `${prova.distancia}m ${prova.estilo}`,
                        estilo: prova.estilo,
                        distancia: prova.distancia,
                    }));
                    setProvasMasculino(formattedMasculino);

                    const formattedFeminino = responseFeminino.data.map(prova => ({
                        id: prova.id.toString(),
                        label: `${prova.distancia}m ${prova.estilo}`,
                        estilo: prova.estilo,
                        distancia: prova.distancia,
                    }));
                    setProvasFeminino(formattedFeminino);

                    const generatedIdMap = {};
                    formattedMasculino.forEach(masculino => {
                        const feminino = formattedFeminino.find(
                            fem => fem.estilo === masculino.estilo &&
                                fem.distancia === masculino.distancia &&
                                fem.tipo === masculino.tipo
                        );
                        if (feminino) {
                            generatedIdMap[masculino.id] = feminino.id;
                        }
                    });
                    setIdMap(generatedIdMap);

                    setProvasCarregadas(true); // Define como carregado após buscar todas as provas
                } else {
                    console.error('Nenhum dado retornado da API');
                }
            } catch (error) {
                console.error('Erro ao buscar provas:', error);
            }
        };
        fetchProvas();
    }, []);

    const aoAlterarMasculino = (id, checked) => {
        setSelecionadasMasculino(prev =>
            checked ? [...prev, id] : prev.filter(item => item !== id)
        );
    };

    const aoAlterarFeminino = (id, checked) => {
        setSelecionadasFeminino(prev =>
            checked ? [...prev, id] : prev.filter(item => item !== id)
        );
    };

    const aoAlterarAmbos = (id, checked) => {
        const idMasculino = id; // ID da prova masculina é o mesmo da prova unificada
        const idFeminino = idMap[idMasculino]; // ID da prova feminina é obtido do mapa

        if (checked) {
            setSelecionadasMasculino(prev =>
                !prev.includes(idMasculino) ? [...prev, idMasculino] : prev
            );
            setSelecionadasFeminino(prev =>
                !prev.includes(idFeminino) ? [...prev, idFeminino] : prev
            );
            setSelecionadasAmbos(prev => !prev.includes(id) ? [...prev, id] : prev);
        } else {
            setSelecionadasMasculino(prev => prev.filter(item => item !== idMasculino));
            setSelecionadasFeminino(prev => prev.filter(item => item !== idFeminino));
            setSelecionadasAmbos(prev => prev.filter(item => item !== id));
        }
    };

    // Função auxiliar para limpar os campos do formulário
    const limparFormulario = () => {
        setNomeEtapa('');
        setDataEtapa('');
        setHoraEtapa('');
        setCidadeEtapa('');
        setSedeEtapa('');
        setEnderecoEtapa('');
        setTorneioEtapa('');
        setSelecionadasMasculino([]);
        setSelecionadasFeminino([]);
        setSelecionadasAmbos([]);
        setFormVisivel(false);
    };

    const aoAlterarRaias = (valor) => {
        setRaias(valor);
    };

    const abreInscricao = async (id, inscricaoAberta) => {
        try {
            await api.put(`${apiAbreInscricao}/${id}`, { inscricao_aberta: inscricaoAberta ? 0 : 1 }); // Chama a rota para abrir/fechar inscrição
            mostrarAlerta(`Inscrição ${inscricaoAberta ? 'fechada' : 'aberta'} com sucesso!`); // Usa o hook
            fetchData(anoSelecionado); // Recarrega a lista de etapas do backend
        } catch (error) {
            console.error('Erro ao alterar inscrição:', error);
            mostrarAlerta('Erro ao alterar inscrição.'); // Usa o hook
        }
    };

    const fecharFormulario = () => {
        limparFormulario();
        setFormVisivel(false);
    };

    const handleAvancar = () => {
        if (etapaAtual === 1) {
            // Gera uma lista única de provas selecionadas (Masculino + Feminino)
            const provasUnificadas = [...selecionadasMasculino, ...selecionadasFeminino].map((id, index) => {
                const provaMasculina = provasMasculino.find(p => p.id === id);
                const provaFeminina = provasFeminino.find(p => p.id === id);
                return {
                    id,
                    label: provaMasculina ? provaMasculina.label : provaFeminina?.label,
                    ordem: index + 1,
                    sexo: provaMasculina ? 'M' : 'F'
                }
            });
            setProvasSelecionadas(provasUnificadas);
            setEtapaAtual(2);
        }
    };

    const handleVoltar = () => {
        setEtapaAtual(1);
    };

    const handleAlterarOrdemBlur = (id, novaOrdem) => {
        setProvasSelecionadas((prevProvas) => {
            const newProvas = [...prevProvas];
            const index = newProvas.findIndex(prova => prova.id === id);
            if (index === -1) return newProvas;

            if (novaOrdem === "") {
                newProvas[index].ordem = "";
                newProvas[index].duplicado = true;
            } else {
                const ordemCorrigida = parseInt(novaOrdem, 10);
                if (!isNaN(ordemCorrigida) && ordemCorrigida >= 1 && ordemCorrigida <= newProvas.length) {
                    newProvas[index].ordem = ordemCorrigida;
                } else {
                    mostrarAlerta(`A ordem deve ser um número entre 1 e ${newProvas.length}.`);
                    return newProvas; // Ignora valores inválidos
                }
            }

            const ordensDuplicadas = newProvas
                .map(p => p.ordem)
                .filter((ordem, _, arr) => ordem !== "" && arr.indexOf(ordem) !== arr.lastIndexOf(ordem));

            newProvas.forEach(prova => {
                prova.duplicado = prova.ordem === "" || ordensDuplicadas.includes(prova.ordem);
            });

            return newProvas;
        });
    };

    const handleSalvar = async () => {
        const ordensValidas = provasSelecionadas.every(prova => prova.ordem > 0 && !prova.duplicado);

        if (!ordensValidas) {
            mostrarAlerta('Por favor, corrija as ordens duplicadas ou inválidas.');
            return;
        }

        try {
            // Criando o objeto de envio com TODOS os dados
            const etapaCompleta = {
                nome: nomeEtapa,
                data: `${dataEtapa.split('/').reverse().join('-')} ${horaEtapa}:00`, // Convertendo formato DD/MM/AAAA para AAAA-MM-DD
                cidade: cidadeEtapa,
                sede: sedeEtapa,
                endereco: enderecoEtapa,
                torneios_id: torneioEtapa,
                quantidade_raias: parseInt(raias, 10),
                provas: provasSelecionadas.map(prova => ({
                    provas_id: prova.id,
                    ordem: parseInt(prova.ordem, 10)
                }))
            };

            if (etapaEditando) {
                await api.put(`${apiAtualizaEtapas}/${etapaEditando.id}`, etapaCompleta);
                mostrarAlerta('Evento atualizado com sucesso!');
            } else {
                await api.post(apiCadastraEtapas, etapaCompleta);
                mostrarAlerta('Evento salvo com sucesso!');
            }

            setEtapaAtual(1);  // Volta para primeira etapa
            setFormVisivel(false);
            fetchData(anoSelecionado); // Atualiza a lista
        } catch (error) {
            console.error('Erro ao salvar a etapa:', error);
            if (error.response && error.response.data && error.response.data.error) {
                mostrarAlerta(error.response.data.error); // Exibe a mensagem de erro retornada pelo backend
            } else {
                mostrarAlerta('Erro ao salvar a etapa. Por favor, tente novamente.');
            }
        }
    };

    const gerarPontuacao = async (id) => {
        try {
            mostrarAlerta(`Pontuação gerada para a etapa ${id}!`); // Usa o hook
        } catch (error) {
            mostrarAlerta('Erro ao gerar pontuação.'); // Usa o hook
        }
    };

    const formatBoolean = (value) => (value === 1 ? 'Sim' : 'Não');

    return (
        <>
            <CabecalhoAdmin />
            <div className={style.etapasContainer}>
                <h1>ETAPAS</h1>
                {!formVisivel && (
                    <>
                        <ListaSuspensa
                            textoPlaceholder={"Escolha o torneio"}
                            opcoes={listaTorneios} // Passa a lista de torneios diretamente
                            onChange={torneioSelecionado}
                            obrigatorio={true}
                            selectId="id" // Campo que será usado como valor do `option`
                            selectExibicao="nome" // Campo que será usado como texto visível no `option`
                        />
                        <TabelaEdicao
                            dados={etapas.map(etapa => ({
                                ...etapa,
                                inscricao_aberta_txt: formatBoolean(etapa.inscricao_aberta),
                                teve_balizamento: formatBoolean(etapa.teve_balizamento),
                                teve_resultados: formatBoolean(etapa.teve_resultados),
                                classificacao_finalizada: formatBoolean(etapa.classificacao_finalizada),
                            }))}
                            colunasOcultas={['id', 'torneios_id', 'observacoes', 'cidade', 'sede', 'endereco', 'quantidade_raias', 'inscricao_aberta']}
                            colunasTitulos={{
                                nome: 'Nome',
                                data: 'Data',
                                inscricao_aberta_txt: 'Inscrição Aberta',
                                teve_balizamento: 'Teve Balizamento',
                                teve_resultados: 'Teve Resultados',
                                classificacao_finalizada: 'Classificação Finalizada'
                            }}
                            onEdit={handleEdit}
                            onDelete={handleExcluir}
                            funcExtra={(etapa) => (
                                <>
                                    <BotaoTabela
                                        tipo={etapa.inscricao_aberta ? 'fecharInscricao' : 'abrirInscricao'}
                                        onClick={() => abreInscricao(etapa.id, etapa.inscricao_aberta)}
                                        labels={buttonLabels}
                                    />
                                    <BotaoTabela
                                        tipo="gerarPontuacao"
                                        onClick={() => gerarPontuacao(etapa.id)}
                                        labels={buttonLabels}
                                    />
                                </>
                            )}
                        />
                        <Botao classBtn={style.btnComponente} onClick={handleAdicionar}>Adicionar Nova Etapa</Botao>
                    </>
                )}
                {formVisivel && (
                    <div className={style.cadastroContainer}>
                        {etapaAtual === 1 && (
                            <>
                                <Formulario inputs={inputs} aoSalvar={handleSalvar} />
                                <RadioButtons
                                    titulo="Quantidade de Raias da Piscina"
                                    opcoes={[
                                        { id: '5', value: '5', label: '5' },
                                        { id: '6', value: '6', label: '6' },
                                        { id: '7', value: '7', label: '7' },
                                        { id: '8', value: '8', label: '8' },
                                    ]}
                                    aoSelecionar={setRaias}
                                    aoAlterar={aoAlterarRaias}
                                    classNameRadioOpcoes={style.radioRaias}
                                    valorSelecionado={raias}
                                />
                                <h2>Selecione as provas de acordo com sexo</h2>
                                <div className={style.provasContainer}>
                                    <CheckboxGroup
                                        titulo="Masculino"
                                        opcoes={provasMasculino}
                                        selecionadas={selecionadasMasculino}
                                        aoAlterar={aoAlterarMasculino}
                                    />
                                    <CheckboxGroup
                                        titulo="Ambos"
                                        opcoes={provasMasculino}
                                        selecionadas={selecionadasAmbos}
                                        aoAlterar={aoAlterarAmbos}
                                    />
                                    <CheckboxGroup
                                        titulo="Feminino"
                                        opcoes={provasFeminino}
                                        selecionadas={selecionadasFeminino}
                                        aoAlterar={aoAlterarFeminino}
                                    />
                                </div>
                                <Botao onClick={fecharFormulario}>Voltar</Botao>
                                <Botao onClick={handleAvancar}>Avançar</Botao>
                            </>
                        )}
                        {etapaAtual === 2 && (
                            <>
                                <h2>Defina a Ordem das Provas</h2>
                                <div className={style.listaProvas}>
                                    {provasSelecionadas.map((prova) => (
                                        <div key={`${prova.id}-${prova.ordem}`} className={style.itemProva}>
                                            <span>{`${prova.label} (${prova.sexo === 'M' ? 'Masculino' : 'Feminino'})`}</span>
                                            <input
                                                type="number"
                                                min="1"
                                                max={provasSelecionadas.length}
                                                defaultValue={prova.ordem || ""}
                                                onBlur={(e) => handleAlterarOrdemBlur(prova.id, e.target.value)}
                                                className={
                                                    prova.duplicado ? style.inputErro : style.inputOrdem
                                                }
                                            />
                                        </div>
                                    ))}
                                </div>
                                <Botao onClick={handleVoltar}>Voltar</Botao>
                                <Botao onClick={handleSalvar}>Salvar Ordem</Botao>
                            </>
                        )}
                    </div>
                )}
            </div>
            {alertaComponente /* Renderiza o componente do hook */}
        </>
    );
};

export default Etapas;