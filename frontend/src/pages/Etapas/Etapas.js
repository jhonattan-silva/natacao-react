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

const Etapas = () => {
    const [etapas, setEtapas] = useState([]);
    const [formVisivel, setFormVisivel] = useState(false); //estado para exibição ou não do formulário
    const [etapaEditando, setEtapaEditando] = useState(null); //estado para edição
    const [provasCarregadas, setProvasCarregadas] = useState(false); //estado para carregamento de provas no editar
    const [raias, setRaias] = useState(''); //estado para quantidade de raias
    const [anoSelecionado, setAnoSelecionado] = useState('2025'); // Estado para o ano selecionado

    const apiListaEtapas = `etapas/listarEtapas`;
    const apiCadastraEtapas = `etapas/cadastrarEtapas`;
    const apiListaTorneios = `etapas/listarTorneios`;
    const apiListaProvasMasculino = `etapas/listarProvas?sexo=M`;
    const apiListaProvasFeminino = `etapas/listarProvas?sexo=F`;
    const apiAtualizaEtapas = `etapas/atualizarEtapas`;
    const apiExcluiEtapa = `etapas/excluiEtapa`;
    const apiAbreInscricao = `etapas/abreInscricao`;
    const apiListaEtapasAno = `etapas/listarEtapasAno`;

    useEffect(() => {
        fetchData(anoSelecionado); // Chama a função `fetchData` ao montar o componente
    }, [anoSelecionado]); // Chama `fetchData` sempre que `anoSelecionado` mudar

    const fetchData = async (ano) => {
        try {
            const response = await api.get(`${apiListaEtapasAno}/${ano}`); // Busca no backend a lista de etapas para o ano selecionado
            const etapasFormatadas = response.data.map(etapa => ({
                ...etapa,
                data: new Date(etapa.data).toLocaleDateString('pt-BR')
            }));
            setEtapas(etapasFormatadas); // Define o estado `etapas` com a lista formatada
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        }
    };

    const handleEdit = async (id) => {
        try {
            const response = await api.get(`${apiAtualizaEtapas}/${id}`);
            const etapa = response.data;

            // Atualiza o estado com os dados da etapa
            setEtapaEditando(etapa);
            setNomeEtapa(etapa.nome);
            setDataEtapa(new Date(etapa.data).toISOString().split('T')[0]);
            setCidadeEtapa(etapa.cidade);
            setSedeEtapa(etapa.sede);
            setEnderecoEtapa(etapa.endereco);
            setTorneioEtapa(etapa.Torneios_id);

            // Filtra as provas selecionadas com base nos IDs retornados
            const selecionadasMasculino = provasMasculino
                .filter(prova => etapa.provas.includes(Number(prova.id)))
                .map(prova => prova.id);

            const selecionadasFeminino = provasFeminino
                .filter(prova => etapa.provas.includes(Number(prova.id)))
                .map(prova => prova.id);

            const selecionadasAmbos = Object.keys(idMap)
                .filter(idMasculino =>
                    selecionadasMasculino.includes(idMasculino) &&
                    selecionadasFeminino.includes(idMap[idMasculino])
                );

            // Atualiza o estado com as seleções
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
            const response = await api.post(apiCadastraEtapas, dados);// Envia os dados para salvar a nova etapa
            fetchData(); // Recarrega a lista de etapas do backend
            setFormVisivel(true); // Esconde o formulário após o salvamento
        } catch (error) {
            console.error('Erro ao cadastrar etapa:', error);
        }
    };

    const atualizarEtapa = async (dados) => {
        try {
            await api.put(`${apiAtualizaEtapas}/${etapaEditando.id}`, dados); //chama a rota de edição equivalente ao id selecionado
            fetchData(); //Recarrega as etapas após atualizar
            setFormVisivel(false);//fecha o form
            setEtapaEditando(null);//limpa o estado de edição
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
                setListaTorneios(response.data);
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
            tipo: "date",
            label: "Data",
            valor: dataEtapa,
            aoAlterar: setDataEtapa
        },
        {
            obrigatorio: true,
            label: "Cidade",
            placeholder: "Digite a Cidade",
            valor: cidadeEtapa,
            aoAlterar: setCidadeEtapa
        },
        {
            obrigatorio: true,
            label: "Sede",
            placeholder: "Digite a sede do evento",
            valor: sedeEtapa,
            aoAlterar: setSedeEtapa
        },
        {
            obrigatorio: true,
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
                const formattedMasculino = responseMasculino.data.map(prova => ({
                    id: prova.id.toString(),
                    label: `${prova.distancia}m ${prova.estilo} (${prova.tipo})`,
                    estilo: prova.estilo,
                    distancia: prova.distancia,
                    tipo: prova.tipo
                }));
                setProvasMasculino(formattedMasculino);

                const responseFeminino = await api.get(apiListaProvasFeminino);
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
            } catch (error) {
                console.error('Erro ao buscar provas:', error);
            }
        };
        fetchProvas();
    }, []);

    const aoAlterarMasculino = (id, checked) => {
        (setSelecionadasMasculino(prev =>
            checked ? [...prev, id] : prev.filter(item => item !== id)
        ));
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

        // Validaç]oes
        if (!nomeEtapa || !dataEtapa || !cidadeEtapa || !sedeEtapa || !enderecoEtapa || !torneioEtapa) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return; // Interrompe o processo de salvamento se houver campos vazios
        }

        // Converte a data para o formato esperado
        const dataFormatada = new Date(dataEtapa).toISOString().split('T')[0];//formata data para nosso padrão
        const provas = [...selecionadasMasculino, ...selecionadasFeminino];//combina as provas M e F em um só array

        const etapaDados = {
            nome: nomeEtapa,
            data: dataFormatada,
            cidade: cidadeEtapa,
            sede: sedeEtapa,
            endereco: enderecoEtapa,
            Torneios_id: torneioEtapa,
            provas: provas.map(id => ({ provas_id: id })),
            raias: raias
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
    };

    const abreInscricao = async (id, inscricaoAberta) => {
        try {
            await api.put(`${apiAbreInscricao}/${id}`, { inscricao_aberta: inscricaoAberta ? 0 : 1 }); // Chama a rota para abrir/fechar inscrição            
            fetchData(); // Recarrega a lista de etapas do backend
        } catch (error) {
            console.error('Erro ao alterar inscrição:', error);
        }
    };

    return (
        <>
            <CabecalhoAdmin />
            <div className={style.etapasContainer}>
                <h1>ETAPAS</h1>
                <ListaSuspensa
                    textoPlaceholder={"Escolha o ano"}
                    opcoes={[
                        { id: '2023', value: '2023', label: '2023' },
                        { id: '2024', value: '2024', label: '2024' },
                        { id: '2025', value: '2025', label: '2025' }
                    ]}
                    valor={anoSelecionado}
                    onChange={setAnoSelecionado}
                />
                <TabelaEdicao
                    dados={etapas}
                    colunasOcultas={['id', 'Torneios_id']}
                    onEdit={handleEdit}
                    onDelete={handleExcluir}
                    funcExtra={(etapa) => (
                        <Botao onClick={() => abreInscricao(etapa.id, etapa.inscricao_aberta)}>
                            {etapa.inscricao_aberta ? 'Fechar Inscrição' : 'Abrir Inscrição'}
                        </Botao>
                    )}
                />
                <Botao classBtn={style.btnComponente} onClick={handleAdicionar}>Adicionar Nova Etapa</Botao>
                {formVisivel && (
                    <div className={style.cadastroContainer}>
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
                        />
                        <ListaSuspensa
                            textoPlaceholder={"Escolha o torneio"}
                            fonteDados={apiListaTorneios}
                            onChange={torneioSelecionado}
                            obrigatorio={true}
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
                        <Botao classBtn={style.btnComponente} onClick={aoSalvar}>SALVAR</Botao>
                    </div>
                )}
            </div>
        </>
    );
};

export default Etapas;