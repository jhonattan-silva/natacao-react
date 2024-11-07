import axios from 'axios';
import CabecalhoAdmin from '../../componentes/CabecalhoAdmin/CabecalhoAdmin';
import TabelaEdicao from '../../componentes/TabelaEdicao/TabelaEdicao';
import React, { useEffect, useState } from 'react';
import Botao from '../../componentes/Botao/Botao';
import Formulario from '../../componentes/Formulario/Formulario';
import ListaSuspensa from '../../componentes/ListaSuspensa/ListaSuspensa';
import style from './Nadadores.module.css';
import RadioButtons from '../../componentes/RadioButtons/RadioButtons';

const Nadadores = () => {
    const [nadadores, setNadadores] = useState([]); //controle de nadadores
    const [equipes, setEquipes] = useState(''); // Controle de equipes listadas
    const [formVisivel, setFormVisivel] = useState(false); // Controla visibilidade do form de cadastro

    /* INPUTS */
    const [nomeNadador, setNomeNadador] = useState(''); // Para input de nome
    const [cpf, setCpf] = useState('');
    const [dataNasc, setDataNasc] = useState('');
    const [celular, setCelular] = useState('');

    /* RADIO GROUP */
    const [sexo, setSexo] = useState('');

    const equipeSelecionada = (id) => { //para capturar a equipe escolhida
        setEquipes(id);
    };

    /* URLS de API */
    const baseUrl = 'http://localhost:5000/api/nadadores';
    const apiListaNadadores = `${baseUrl}/listarNadadores`;
    const apiCadastraNadador = `${baseUrl}/cadastrarNadador`;
    const apiListaEquipes = `${baseUrl}/listarEquipes`;

    // Busca todos os Nadadores e atualizar a lista
    const fetchNadadores = async () => {
        try {
            const response = await axios.get(apiListaNadadores);
            const nadadoresFormatados = response.data.map(nadador => ({
                ...nadador,
                data_nasc: new Date(nadador.data_nasc).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric'
                })
            }));
            setNadadores(nadadoresFormatados);
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        }
    };

    // Carregar a lista de Nadadoress ao montar o componente
    useEffect(() => {
        fetchNadadores();
    }, []);


    //Botão para abrir o formulario de novo Nadador
    const handleAdicionar = () => {
        setFormVisivel(true);
    };

    //Botão editar cadastro
    const handleEdit = (id) => {
        console.log(`Editando Nadador com ID: ${id}`);
        // Lógica de edição aqui
    };

    //Botão inativar cadastro
    const handleInativar = (id) => {
        console.log(`Inativando Nadador com ID: ${id}`);
        // Lógica de inativação aqui
    };

    // Função para adicionar um novo Nadador
    const adicionarNadador = async (dados) => {
        try {
            await axios.post(apiCadastraNadador, dados); // Envia o novo Nadador para o backend
            await fetchNadadores(); // Recarrega a lista completa de Nadadoress do backend
            setFormVisivel(false); // Esconde o formulário após salvar
        } catch (error) {
            console.error('Erro ao cadastrar Nadador:', error);
        }
    };



    const inputs = [
        {
            obrigatorio: true,
            label: "Nome",
            placeholder: "Digite o nome",
            valor: nomeNadador,
            aoAlterar: setNomeNadador
        },
        {
            obrigatorio: true,
            label: "CPF",
            placeholder: "Somente números",
            valor: cpf,
            aoAlterar: setCpf
        },
        {
            obrigatorio: true,
            tipo: "date",
            label: "Data de Nascimento",
            valor: dataNasc,
            aoAlterar: setDataNasc
        },
        {
            obrigatorio: true,
            label: "Celular",
            placeholder: "Celular (com ddd, somente números)",
            valor: celular,
            aoAlterar: setCelular
        }
    ];

    // Função para limpar o formulário
    const limparFormulario = () => {
        setNomeNadador('');
        setCpf('');
        setDataNasc('');
        setCelular('');
        setSexo('');
        setEquipes('');
        setFormVisivel(false);
    };

    const aoSalvar = async (evento) => {
        evento.preventDefault();

        // Validaç]oes
        if (!nomeNadador || !cpf || !dataNasc || !celular || !equipes) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return; // Interrompe o processo de salvamento se houver campos vazios
        }

        const nadadorDados = {
            nome: nomeNadador,
            cpf: cpf,
            data_nasc: dataNasc,
            telefone: celular,
            sexo: sexo,
            equipeId: equipes
        };
        
        await adicionarNadador(nadadorDados);
        alert('Nadador salvo com sucesso!');
        limparFormulario(); // Limpa o formulário após salvar ou atualizar
    };

    return (
        <>
            <CabecalhoAdmin />
            <div className={style.nadadores}>
                <h2>NADADORES</h2>
                <TabelaEdicao dados={nadadores} onEdit={handleEdit} onInativar={handleInativar} />
                <Botao onClick={handleAdicionar}>Adicionar Novo Nadador</Botao>
                {formVisivel && (
                    <div>
                        <Formulario inputs={inputs} aoSalvar={aoSalvar} />
                        <RadioButtons
                            titulo="Escolha uma opção"
                            name="sexo"
                            opcoes={[
                                { id: 'M', value: 'M', label: 'Masculino' },
                                { id: 'F', value: 'F', label: 'Feminino' },
                            ]}
                            aoSelecionar={(valor) => setSexo(valor)}
                        />
                        <ListaSuspensa
                            textoPlaceholder={"Escolha uma equipe"}
                            fonteDados={apiListaEquipes}
                            onChange={equipeSelecionada}
                        />
                        <Botao onClick={aoSalvar}>Cadastrar</Botao>
                    </div>
                )}
            </div>
        </>
    )
};

export default Nadadores;