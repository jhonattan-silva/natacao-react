import api from '../../servicos/api';
import { useEffect, useState } from 'react';
import Botao from '../../componentes/Botao/Botao';
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

    const baseURL = 'https://www.ligapaulistadenatacao.com.br:5000/api/';
    const apiListaEtapas = `${baseURL}etapas/listarEtapas`;
    const apiCadastraEtapas = `${baseURL}etapas/cadastrarEtapas`;
    const apiListaTorneios = `${baseURL}etapas/listarTorneios`;
    const apiListaProvasMasculino = `${baseURL}etapas/listarProvas?sexo=M`;
    const apiListaProvasFeminino = `${baseURL}etapas/listarProvas?sexo=F`;
    const apiAtualizaEtapas = `${baseURL}etapas/atualizarEtapas`;
    const apiExcluiEtapa = `${baseURL}etapas/excluiEtapa`;
    const apiAbreInscricao = `${baseURL}etapas/abreInscricao`;
    const apiListaEtapasAno = `${baseURL}etapas/listarEtapasAno`;

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

            console.log('📌 Etapa recebida do backend:', etapa);

            // Atualiza os estados com os dados da etapa
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

            // Atualiza o estado com as provas selecionadas na ordem correta
            const provasOrdenadas = etapa.provas
                .map(prova => ({
                    id: prova.provas_id.toString(),
                    label: `${prova.distancia}m ${prova.estilo} (${prova.tipo})`,
                    estilo: prova.estilo,
                    distancia: prova.distancia,
                    tipo: prova.tipo,
                    sexo: prova.sexo,
                    ordem: prova.ordem
                }))
                .sort((a, b) => a.ordem - b.ordem); // Ordena corretamente pela ordem vinda do backend

            console.log("📌 Provas ordenadas recebidas do backend:", provasOrdenadas);

            setProvasSelecionadas(provasOrdenadas);

            // Atualiza os estados de seleção
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
                if (valorFormatado.length >= 2) valorFormatado += "/"; // Adiciona '/' depois do dia se houver mais dígitos
                valorFormatado += mes;
                if (valorFormatado.length >= 5) valorFormatado += "/"; // Adiciona '/' depois do mês se houver mais dígitos
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
                        label: `${prova.distancia}m ${prova.estilo} (${prova.tipo})`,
                        estilo: prova.estilo,
                        distancia: prova.distancia,
                        tipo: prova.tipo
                    }));
                    setProvasMasculino(formattedMasculino);

                    const formattedFeminino = responseFeminino.data.map(prova => ({
                        id: prova.id.toString(),
                        label: `${prova.distancia}m ${prova.estilo} (${prova.tipo})`,
                        estilo: prova.estilo,
                        distancia: prova.distancia,
                        tipo: prova.tipo
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

        console.log('Dados da etapa VER ISSO AQUI:', etapaDados);

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
            const provas = [...selecionadasMasculino, ...selecionadasFeminino].map(id => {
                const provaMasculino = provasMasculino.find(prova => prova.id === id);
                const provaFeminino = provasFeminino.find(prova => prova.id === id);
                const prova = provaMasculino || provaFeminino;
                return {
                    ...prova,
                    sexo: provaMasculino ? 'Masculino' : 'Feminino'
                };
            }).sort((a, b) => a.ordem - b.ordem); // Ordena corretamente pela ordem

            setProvasSelecionadas(provas);
            setEtapaAtual(2);
        }
    };

    const handleVoltar = () => {
        setEtapaAtual(1);
    };

    const handleReordenar = (novasProvas) => {
        setProvasSelecionadas(novasProvas);
    };

    const handleSalvar = async () => {
        // Implementação do salvamento da ordem das provas
        try {
            const provasOrdenadas = provasSelecionadas.map((prova, index) => ({
                ...prova,
                ordem: index + 1,
            }));

            // Converte a data para o formato esperado pelo MySQL
            const [ano, mes, dia] = etapaEditando.data.split('T')[0].split('-');
            const [hora, minuto, segundo] = etapaEditando.data.split('T')[1].split(':');
            const dataFormatada = `${ano}-${mes}-${dia} ${hora}:${minuto}:${segundo.split('.')[0]}`;

            // Garantir que quantidade_raias e torneios_id não sejam nulos
            const quantidadeRaias = raias || etapaEditando.quantidade_raias;
            const torneiosId = torneioEtapa || etapaEditando.torneios_id;

            // Enviar as provas ordenadas para o backend
            await api.put(`${apiAtualizaEtapas}/${etapaEditando.id}`, {
                ...etapaEditando,
                data: dataFormatada,
                quantidade_raias: quantidadeRaias,
                torneios_id: torneiosId,
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
                            dados={etapas}
                            colunasOcultas={['id', 'torneios_id']}
                            onEdit={handleEdit}
                            onDelete={handleExcluir}
                            funcExtra={(etapa) => (
                                <Botao onClick={() => abreInscricao(etapa.id, etapa.inscricao_aberta)}>
                                    {etapa.inscricao_aberta ? 'Fechar Inscrição' : 'Abrir Inscrição'}
                                </Botao>
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
                                <Botao onClick={handleVoltar}>Voltar</Botao>
                                <Botao onClick={handleAvancar}>Avançar</Botao>
                            </>
                        )}
                        {etapaAtual === 2 && (
                            <>
                                <h2>Ordenar Provas</h2>
                                <ArrastaSolta itens={provasSelecionadas} aoReordenar={handleReordenar} renderItem={(item) => `${item.label || item.nome} (${item.sexo})`} />
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