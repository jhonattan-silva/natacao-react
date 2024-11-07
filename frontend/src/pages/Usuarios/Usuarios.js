import axios from 'axios';
import CabecalhoAdmin from '../../componentes/CabecalhoAdmin/CabecalhoAdmin';
import TabelaEdicao from '../../componentes/TabelaEdicao/TabelaEdicao';
import style from './Usuarios.module.css';
import React, { useEffect, useState } from 'react';
import Botao from '../../componentes/Botao/Botao';
import Formulario from '../../componentes/Formulario/Formulario';
import ListaSuspensa from '../../componentes/ListaSuspensa/ListaSuspensa';
import CheckboxGroup from '../../componentes/CheckBoxGroup/CheckBoxGroup';
import RadioButtons from '../../componentes/RadioButtons/RadioButtons';

const Usuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [formVisivel, setFormVisivel] = useState(false); // Controla visibilidade do form de cadastro

    /* URLS de API */
    const baseUrl = 'http://localhost:5000/api/usuarios';
    const apiListaUsuarios = `${baseUrl}/listarUsuarios`;
    const apiCadastraUsuario = `${baseUrl}/cadastrarUsuario`;
    const apiAtualizaUsuario = `${baseUrl}/atualizarUsuario`;
    const apiBuscaUsuarios = `${baseUrl}/buscaUsuarios`;
    const apiListaPerfis = `${baseUrl}/listarPerfis`;
    const apiListaEquipes = `${baseUrl}/listarEquipes`;

    // Função para buscar todos os usuários e atualizar a lista
    const fetchUsuarios = async () => {
        try {
            const response = await axios.get(apiListaUsuarios);
            setUsuarios(response.data);
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        }
    };

    // Carregar a lista de usuários ao montar o componente
    useEffect(() => {
        fetchUsuarios();
    }, []);


    //Botão para abrir o formulario de novo usuário
    const handleAdicionar = () => {
        setFormVisivel(true);
    };

    //Botão editar cadastro
    const handleEdit = (id) => {
        console.log(`Editando usuário com ID: ${id}`);
        // Lógica de edição aqui
    };

    //Botão inativar cadastro
    const handleInativar = (id) => {
        console.log(`Inativando usuário com ID: ${id}`);
        // Lógica de inativação aqui
    };

    // Função para adicionar um novo usuário
    const adicionarUsuario = async (dados) => {
        try {
            await axios.post(apiCadastraUsuario, dados); // Envia o novo usuário para o backend
            await fetchUsuarios(); // Recarrega a lista completa de usuários do backend
            setFormVisivel(false); // Esconde o formulário após salvar
        } catch (error) {
            console.error('Erro ao cadastrar usuário:', error);
        }
    };

    /* LISTA SUSPENSA */
    const [equipes, setEquipes] = useState(''); // Para o treinador escolhido

    const equipeSelecionada = (id) => {
        setEquipes(id);
    };

    /* CHECKBOX DE PERFIS */

    const [perfis, setPerfis] = useState([]);
    const [perfisSelecionados, SetPerfisSelecionados] = useState([]);

    useEffect(() => {
        const fetchPerfis = async () => {
            try {
                const responsePerfis = await axios.get(apiListaPerfis);
                const perfilFormatado = responsePerfis.data.map(perfil => ({
                    id: perfil.id.toString(),
                    label: perfil.nome,
                }));
                setPerfis(perfilFormatado);
            } catch (error) {
                console.error('Erro ao buscar perfis:', error);
            }
        };
        fetchPerfis();
    }, []);

    const aoAlterarPerfis = (id, checked) => {
        SetPerfisSelecionados(prev =>
            checked ? [...prev, id] : prev.filter(item => item !== id)
        );
    };


    /* INPUTS */
    const [nomeUsuario, setNomeUsuario] = useState(''); // Para input de nome
    const [cpf, setCpf] = useState('');
    const [senha, setSenha] = useState('');
    const [celular, setCelular] = useState('');
    const [email, setEmail] = useState('');

    const inputs = [
        {
            obrigatorio: true,
            label: "Nome",
            placeholder: "Digite o nome",
            valor: nomeUsuario,
            aoAlterar: setNomeUsuario
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
            label: "Senha",
            placeholder: "Digite uma senha",
            valor: senha,
            aoAlterar: setSenha
        },
        {
            obrigatorio: true,
            label: "Celular",
            placeholder: "Celular (com ddd, somente números)",
            valor: celular,
            aoAlterar: setCelular
        },
        {
            obrigatorio: true,
            label: "E-mail",
            placeholder: "Digite um e-mail",
            valor: email,
            aoAlterar: setEmail
        }
    ];

    // Função auxiliar para limpar os campos do formulário
    const limparFormulario = () => {
        setNomeUsuario('');
        setCpf('');
        setCelular('');
        setEmail('');
        setSenha('');
        SetPerfisSelecionados([]);
        setFormVisivel(false);
    };

    const aoSalvar = async (evento) => {
        evento.preventDefault();

        // Validaç]oes
        if (!nomeUsuario || !cpf || !senha || !celular || !email) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return; // Interrompe o processo de salvamento se houver campos vazios
        }

        const usuarioDados = {
            nome: nomeUsuario,
            cpf: cpf,
            senha: senha,
            celular: celular,
            email: email,
            perfis: perfisSelecionados.map(id => (id)),
            equipeId: equipes
        };

        await adicionarUsuario(usuarioDados);
        alert('Usuário salvo com sucesso!');
        limparFormulario(); // Limpa o formulário após salvar ou atualizar
    };

    return (
        <>
            <CabecalhoAdmin />
            <div className={style.usuarios}>
                <h2>USUÁRIOS</h2>
                <TabelaEdicao dados={usuarios} onEdit={handleEdit} onInativar={handleInativar} />
                <Botao onClick={handleAdicionar}>Adicionar Novo Usuário</Botao>
                {formVisivel && (
                    <div>
                        <Formulario inputs={inputs} aoSalvar={aoSalvar} />
                        <CheckboxGroup
                            titulo="PEFIS"
                            opcoes={perfis}
                            selecionadas={perfisSelecionados}
                            aoAlterar={aoAlterarPerfis}
                        />
                        <RadioButtons />
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

export default Usuarios;