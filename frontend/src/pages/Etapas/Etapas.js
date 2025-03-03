import api from '../../servicos/api';
import { useEffect, useState } from 'react';
import Botao from '../../componentes/Botao/Botao';
import BotaoTabela from '../../componentes/BotaoTabela/BotaoTabela';
import Formulario from '../../componentes/Formulario/Formulario';
import TabelaEdicao from '../../componentes/TabelaEdicao/TabelaEdicao';
import style from './Etapas.module.css';
import ListaSuspensa from '../../componentes/ListaSuspensa/ListaSuspensa';
import CheckboxGroup from '../../componentes/CheckBoxGroup/CheckBoxGroup';
import CabecalhoAdmin from '../../componentes/CabecalhoAdmin/CabecalhoAdmin';
import RadioButtons from '../../componentes/RadioButtons/RadioButtons';
import ArrastaSolta from '../../componentes/ArrastaSolta/ArrastaSolta';

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
    }, [anoSelecionado]); // Chama `fetchData` sempre que `anoSelecionado` mudar

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
            setSedeEtapa(etapa.sede);
            setEnderecoEtapa(etapa.endereco);
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
                alert("Etapa excluída com sucesso!");
                fetchData(); // Atualiza a lista após exclusão
            } catch (error) {
                console.error("Erro ao excluir etapa:", error);
                alert("Não foi possível excluir a etapa.");
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
    }, []);

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
        const idMasculino = id;
        const idFeminino = idMap[idMasculino];

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

    const aoSalvar = async (evento) => {
        evento.preventDefault();

        // Validações
        if (!nomeEtapa || !dataEtapa || !horaEtapa || !cidadeEtapa || !torneioEtapa) {
            let mensagemErro = 'Por favor, preencha os seguintes campos obrigatórios:\n';
            if (!nomeEtapa) mensagemErro += '- Nome do Evento\n';
            if (!dataEtapa) mensagemErro += '- Data do Evento\n';
            if (!horaEtapa) mensagemErro += '- Horário do Evento\n';
            if (!cidadeEtapa) mensagemErro += '- Cidade\n';
            if (!torneioEtapa) mensagemErro += '- Torneio\n';
            alert(mensagemErro);
            return; // Interrompe o processo de salvamento se houver campos vazios
        }

        // Converte a data e o horário para o formato esperado
        const [dia, mes, ano] = dataEtapa.split('/');
        const dataHoraFormatada = `${ano}-${mes}-${dia} ${horaEtapa}:00`; // Junta data e hora no formato esperado pelo MySQL

        const provas = [...selecionadasMasculino, ...selecionadasFeminino]; // Combina as provas M e F em um só array

        const etapaDados = {
            nome: nomeEtapa,
            data: dataHoraFormatada,
            cidade: cidadeEtapa,
            sede: sedeEtapa,
            endereco: enderecoEtapa,
            torneios_id: torneioEtapa,
            provas: provas.map(id => ({ provas_id: id })),
            quantidade_raias: raias
        };

        if (etapaEditando) {
            // Se `etapaEditando` existir, atualiza a etapa
            await atualizarEtapa(etapaDados);
            alert('Evento atualizado com sucesso!');
        } else {
            // Se não, adiciona uma nova etapa
            await adicionarEtapa(etapaDados);
            alert('Evento salvo com sucesso!');
        }

        limparFormulario(); // Limpa o formulário após salvar ou atualizar
        window.scrollTo(0, 0); // Volta ao topo da página
    };

    const abreInscricao = async (id, inscricaoAberta) => {
        try {
            await api.put(`${apiAbreInscricao}/${id}`, { inscricao_aberta: inscricaoAberta ? 0 : 1 }); // Chama a rota para abrir/fechar inscrição
            alert(`Inscrição ${inscricaoAberta ? 'fechada' : 'aberta'} com sucesso!`);
            fetchData(anoSelecionado); // Recarrega a lista de etapas do backend
        } catch (error) {
            console.error('Erro ao alterar inscrição:', error);
            alert('Erro ao alterar inscrição.');
        }
    };

    const fecharFormulario = () => {
        limparFormulario();
        setFormVisivel(false);
    };

    const handleAvancar = () => {
        if (etapaAtual === 1) {
            // Gera uma lista única de provas selecionadas (Masculino + Feminino)
            const provasUnificadas = [...selecionadasMasculino, ...selecionadasFeminino].map((id, index) => ({
                id,
                label: `${provasMasculino.find(p => p.id === id)?.label || provasFeminino.find(p => p.id === id)?.label}`,
                ordem: index + 1 // Inicialmente preenche a ordem sequencialmente
            }));

            setProvasSelecionadas(provasUnificadas);
            setEtapaAtual(2);
        }
    };

    const handleVoltar = () => {
        setEtapaAtual(1);
    };

    const handleAlterarOrdem = (id, novaOrdem) => {
        let ordemCorrigida = parseInt(novaOrdem, 10);
        console.log(`🔹 Prova ID: ${id}, Nova Ordem Digitada: ${novaOrdem}`);

        if (isNaN(ordemCorrigida) || ordemCorrigida < 1) {
            console.warn(`⚠️ Ordem inválida (${ordemCorrigida}) - Resetando campo!`);
            return;
        }

        setProvasSelecionadas((prevProvas) => {
            const newProvas = [...prevProvas];
            const index = newProvas.findIndex(prova => prova.id === id);
            if(index === -1) return newProvas;

            const currentOrder = newProvas[index].ordem;
            if(currentOrder === ordemCorrigida) return newProvas;

            // Find if any other prova has the target order
            const swapIndex = newProvas.findIndex(prova => prova.ordem === ordemCorrigida);
            if(swapIndex !== -1) {
                // Swap the order values
                newProvas[swapIndex].ordem = currentOrder;
                newProvas[index].ordem = ordemCorrigida;
            } else {
                newProvas[index].ordem = ordemCorrigida;
            }
            console.log("✅ Provas Após Swapping:", newProvas);
            return [...newProvas];
        });
    };

    const handleSalvar = async () => {
        // Verifica se todas as provas possuem uma ordem válida
        const ordensValidas = provasSelecionadas.every(prova => prova.ordem > 0);

        if (!ordensValidas) {
            alert('Por favor, preencha a ordem de todas as provas.');
            return;
        }

        try {
            // Enviar as provas ordenadas para o backend
            const provasOrdenadas = provasSelecionadas.map((prova) => ({
                provas_id: prova.id,
                ordem: parseInt(prova.ordem, 10)
            }));

            await api.put(`${apiAtualizaEtapas}/${etapaEditando.id}`, {
                ...etapaEditando,
                provas: provasOrdenadas,
            });

            alert('Ordem das provas salva com sucesso!');
            setEtapaAtual(1);
            setFormVisivel(false);
        } catch (error) {
            console.error('Erro ao salvar a ordem das provas:', error);
            alert('Erro ao salvar a ordem das provas.');
        }
    };

    const gerarPontuacao = async (id) => {
        try {
            alert(`Pontuação gerada para a etapa ${id}!`);
        } catch (error) {
            console.error('Erro ao gerar pontuação:', error);
            alert('Erro ao gerar pontuação.');
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
                                inscricao_aberta: formatBoolean(etapa.inscricao_aberta),
                                teve_balizamento: formatBoolean(etapa.teve_balizamento),
                                teve_resultados: formatBoolean(etapa.teve_resultados),
                                classificacao_finalizada: formatBoolean(etapa.classificacao_finalizada),
                            }))}
                            colunasOcultas={['id', 'torneios_id', 'observacoes', 'cidade', 'sede', 'endereco', 'quantidade_raias']}
                            colunasTitulos={{
                                nome: 'Nome',
                                data: 'Data',
                                cidade: 'Cidade',
                                sede: 'Sede',
                                endereco: 'Endereço',
                                quantidade_raias: 'Quantidade de Raias',
                                inscricao_aberta: 'Inscrição Aberta',
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
                                <Formulario inputs={inputs} aoSalvar={aoSalvar} />
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
                                <ListaSuspensa
                                    textoPlaceholder={"Escolha o torneio"}
                                    fonteDados={apiListaTorneios}
                                    onChange={torneioSelecionado}
                                    obrigatorio={true}
                                    valorSelecionado={torneioEtapa}
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
                                                value={prova.ordem || ""}
                                                onChange={(e) => handleAlterarOrdem(prova.id, e.target.value)}
                                                className={
                                                    prova.ordem === "" || prova.ordem > provasSelecionadas.length
                                                        ? style.inputErro
                                                        : style.inputOrdem
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
        </>
    );
};

export default Etapas;