import { useEffect, useState } from 'react';
import Botao from '../../componentes/Botao/Botao';
import Formulario from '../../componentes/Formulario/Formulario';
import TabelaEdicao from '../../componentes/TabelaEdicao/TabelaEdicao';
import style from './Etapas.module.css';
import axios from 'axios';
import ListaSuspensa from '../../componentes/ListaSuspensa/ListaSuspensa';
import CheckboxGroup from '../../componentes/CheckBoxGroup/CheckBoxGroup';
import CabecalhoAdmin from '../../componentes/CabecalhoAdmin/CabecalhoAdmin';

const Etapas = () => {
    const [etapas, setEtapas] = useState([]);
    const [formVisivel, setFormVisivel] = useState(false); //estado para exibição ou não do formulário
    const [etapaEditando, setEtapaEditando] = useState(null); //estado para edição
    const [provasCarregadas, setProvasCarregadas] = useState(false); //estado para carregamento de provas no editar


    const baseUrl = 'http://localhost:5000/api/etapas';
    const apiListaEtapas = `${baseUrl}/listarEtapas`;
    const apiCadastraEtapas = `${baseUrl}/cadastrarEtapas`;
    const apiListaTorneios = `${baseUrl}/listarTorneios`;
    const apiListaProvasMasculino = `${baseUrl}/listarProvas?sexo=M`;
    const apiListaProvasFeminino = `${baseUrl}/listarProvas?sexo=F`;
    const apiAtualizaEtapas = `${baseUrl}/atualizarEtapas`;
    const apiExcluiEtapa = `${baseUrl}/excluiEtapa`;

    useEffect(() => {
        fetchData(); // Chama a função `fetchData` ao montar o componente
    }, []); // O array vazio significa que `fetchData` será chamado apenas uma vez, ao carregar o componente

    const fetchData = async () => {
        try {
            const response = await axios.get(apiListaEtapas);// Busca no backend a lista de etapas
            const etapasFormatadas = response.data.map(etapa => ({
                ...etapa,
                data: new Date(etapa.data).toLocaleDateString('pt-BR')
            }));
            setEtapas(etapasFormatadas);// Define o estado `etapas` com a lista formatada
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        }
    };

    const handleEdit = async (id) => {
        if (!provasCarregadas) return; // Aguarda até que as provas estejam carregadas

        try {
            const response = await axios.get(`${apiAtualizaEtapas}/${id}`);
            const etapa = response.data;

            console.log('Etapa carregada:', etapa); // Log dos dados da etapa
            console.log('Provas Masculinas:', provasMasculino); // Log das provas masculinas
            console.log('Provas Femininas:', provasFeminino); // Log das provas femininas

            setEtapaEditando(etapa);
            setNomeEtapa(etapa.nome);
            setDataEtapa(new Date(etapa.data).toISOString().split('T')[0]);
            setCidadeEtapa(etapa.cidade);
            setSedeEtapa(etapa.sede);
            setEnderecoEtapa(etapa.endereco);
            setTorneioEtapa(etapa.Torneios_id);

            // Marque os checkboxes com base nos IDs das provas retornadas
            const selecionadasMasculino = etapa.provas.filter(provaId =>
                provasMasculino.some(prova => Number(prova.id) === Number(provaId)) // Converte provaId para number
            );
            const selecionadasFeminino = etapa.provas.filter(provaId =>
                provasFeminino.some(prova => prova.id === Number(provaId)) // Converte provaId para number
            );

            console.log('Selecionadas Masculino:', selecionadasMasculino); // Log do resultado
            console.log('Selecionadas Feminino:', selecionadasFeminino); // Log do resultado

            // Atualiza o estado com os checkboxes selecionados
            setSelecionadasMasculino(selecionadasMasculino);
            setSelecionadasFeminino(selecionadasFeminino);
            setSelecionadasAmbos([]);

            setFormVisivel(true);
        } catch (error) {
            console.error('Erro ao carregar etapa para edição:', error);
        }
    };

    const handleExcluir = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir esta etapa?")) {
            try {
                await axios.delete(`${apiExcluiEtapa}/${id}`);
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
            const response = await axios.post(apiCadastraEtapas, dados);// Envia os dados para salvar a nova etapa
            fetchData(); // Recarrega a lista de etapas do backend
            setFormVisivel(true); // Esconde o formulário após o salvamento
        } catch (error) {
            console.error('Erro ao cadastrar etapa:', error);
        }
    };

    const atualizarEtapa = async (dados) => {
        try {
            await axios.put(`${apiAtualizaEtapas}/${etapaEditando.id}`, dados); //chama a rota de edição equivalente ao id selecionado
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
                const response = await axios.get(apiListaTorneios);
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
                const responseMasculino = await axios.get(apiListaProvasMasculino);
                const formattedMasculino = responseMasculino.data.map(prova => ({
                    id: prova.id.toString(),
                    label: `${prova.distancia}m ${prova.estilo} (${prova.tipo})`,
                    estilo: prova.estilo,
                    distancia: prova.distancia,
                    tipo: prova.tipo
                }));
                setProvasMasculino(formattedMasculino);

                const responseFeminino = await axios.get(apiListaProvasFeminino);
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
            provas: provas.map(id => ({ provas_id: id }))
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

    return (
        <>
            <CabecalhoAdmin />
            <div className={style.etapas}>
                <h1>ETAPAS</h1>
                <TabelaEdicao
                    dados={etapas}
                    colunasOcultas={['id', 'Torneios_id']}
                    onEdit={handleEdit}
                    onDelete={handleExcluir} />
                <Botao onClick={handleAdicionar}>Adicionar Nova Etapa</Botao>
                {formVisivel && (
                    <div>
                        <Formulario inputs={inputs} aoSalvar={aoSalvar} />
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
                        <p>Selecionadas: {JSON.stringify(selecionadasFeminino)}</p>
                        <Botao onClick={aoSalvar}>SALVAR</Botao>
                    </div>
                )}
            </div>
        </>
    );
};

export default Etapas;