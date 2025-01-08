import axios from 'axios';
import CabecalhoAdmin from '../../componentes/CabecalhoAdmin/CabecalhoAdmin';
import TabelaEdicao from '../../componentes/TabelaEdicao/TabelaEdicao';
import style from './Usuarios.module.css';
import React, { useEffect, useState } from 'react';
import Botao from '../../componentes/Botao/Botao';
import Formulario from '../../componentes/Formulario/Formulario';
import ListaSuspensa from '../../componentes/ListaSuspensa/ListaSuspensa';
import CheckboxGroup from '../../componentes/CheckBoxGroup/CheckBoxGroup';

const Usuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [formVisivel, setFormVisivel] = useState(false); // Controla visibilidade do form de cadastro
    const [equipes, setEquipes] = useState(''); // controla as equipes
    const [perfis, setPerfis] = useState([]); // controla os perfis	
    const [perfisSelecionados, SetPerfisSelecionados] = useState([]); // controla os perfis selecionados
    const [equipeSelecionada, setEquipeSelecionada] = useState(''); // controla a equipe selecionada
    const [isEditing, setIsEditing] = useState(false); // Controla o modo de edição
    const [editUserId, setEditUserId] = useState(null); // Armazena o ID do usuário em edição
    const perfilEspecificoId = "2"; // ID 2 = treinador
    const [mostrarListaSuspensa, setMostrarListaSuspensa] = useState(false); // Controla a visibilidade da lista suspensa de equipes


    /* URLS de API */
    const baseUrl = 'http://localhost:5000/api/usuarios';
    const apiListaUsuarios = `${baseUrl}/listarUsuarios`;
    const apiCadastraUsuario = `${baseUrl}/cadastrarUsuario`;
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

    // Função para buscar todos os perfis e atualizar a lista
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

    // Função para buscar todas as equipes e atualizar a lista
    const fetchEquipes = async () => {
        try {
            const responseEquipes = await axios.get(apiListaEquipes);
            setEquipes(responseEquipes.data);
        } catch (error) {
            console.error('Erro ao buscar equipes:', error);
        }
    };

    const aoSelecionarEquipe = (id) => {
        setEquipeSelecionada(parseInt(id, 10)); // Converter para número inteiro
    };

    // Carregar a lista de usuários ao montar o componente
    useEffect(() => {
        fetchUsuarios();
        fetchEquipes();
        fetchPerfis();
    }, []); // Array vazio para executar apenas uma vez

    useEffect(() => { // Atualiza a visibilidade da lista suspensa de equipes quando os perfis selecionados mudam
        setMostrarListaSuspensa(perfisSelecionados.includes(perfilEspecificoId)); // Atualiza a visibilidade da lista suspensa de equipes
    }, [perfisSelecionados]); // Dependência para atualizar a visibilidade da lista suspensa de equipes quando os perfis selecionados mudam

    //Botão para abrir o formulario de novo usuário
    const handleAdicionar = () => {
        setFormVisivel(true);
    };

    //Botão editar cadastro
    const handleEdit = async (id) => {
        try {
            const usuario = usuarios.find((user) => user.id === id);

            if (!usuario) {
                console.error('Usuário não encontrado');
                return;
            }

            // Preenche os campos do formulário com os dados do usuário
            setNomeUsuario(usuario.nome);
            setCpf(usuario.cpf);
            setSenha(''); // Não preencha a senha por motivos de segurança
            setCelular(usuario.celular);
            setEmail(usuario.email);

            // Trata perfis
            const perfisUsuario = Array.isArray(usuario.perfis)
                ? usuario.perfis.map((perfil) => perfil.id)
                : [];
            SetPerfisSelecionados(perfisUsuario);

            // Define equipe selecionada
            setEquipeSelecionada(usuario.equipeId || '');

            // Ativa o formulário em modo de edição
            setEditUserId(id);
            setIsEditing(true);
            setFormVisivel(true);
        } catch (error) {
            console.error('Erro ao editar usuário:', error);
        }
    };


    //Botão inativar cadastro
    const handleInativar = (id) => {
        console.log(`Inativando usuário com ID: ${id}`);
        // Lógica de inativação aqui
    };

    // Função para adicionar um novo usuário
    const adicionarUsuario = async (dados) => {
        try {
            console.log('Dados enviados para cadastro:', dados); // Adicionar log para depuração
            await axios.post(apiCadastraUsuario, dados); // Envia o novo usuário para o backend
            await fetchUsuarios(); // Recarrega a lista completa de usuários do backend
            setFormVisivel(false); // Esconde o formulário após salvar
            alert('Usuário salvo com sucesso!'); // Mover alerta de sucesso para dentro do bloco try
        } catch (error) {
            console.error('Erro ao cadastrar usuário:', error);
            alert('Erro ao cadastrar usuário: ' + error.response.data.message); // Adicionar alerta de erro
        }
    };

    /* CHECKBOX */
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
            perfis: perfisSelecionados.map(id => parseInt(id, 10)), // Converter IDs para números inteiros
            equipeId: equipeSelecionada // Já convertido para número inteiro
        };

        try {
            if (isEditing) {
                // Edita o usuário
                await axios.put(`${baseUrl}/atualizarUsuario/${editUserId}`, usuarioDados);
                alert('Usuário atualizado com sucesso!');
            } else {
                // Cria um novo usuário
                await axios.post(apiCadastraUsuario, usuarioDados);
                alert('Usuário cadastrado com sucesso!');
            }

            await fetchUsuarios(); // Atualiza a lista de usuários
            limparFormulario(); // Reseta o formulário
        } catch (error) {
            console.error('Erro ao salvar o usuário:', error);
            alert('Erro ao salvar o usuário. Verifique os logs.');
        }
    };

    const perfilTreinador = 2;

    return (
        <>
            <CabecalhoAdmin />
            <div className={style.usuarios}>
                <h2>USUÁRIOS</h2>
                <TabelaEdicao dados={usuarios} onEdit={handleEdit} onInativar={handleInativar} />
                <Botao onClick={handleAdicionar}>Adicionar Novo Usuário</Botao>
                {formVisivel && (
                    <div className={style['form-container']}>
                        <Formulario inputs={inputs} aoSalvar={aoSalvar} />
                        <CheckboxGroup
                            titulo="PERFIS"
                            opcoes={perfis}
                            selecionadas={perfisSelecionados}
                            aoAlterar={aoAlterarPerfis}
                        />
                        {mostrarListaSuspensa && ( // Renderiza a lista suspensa de equipes somente se o perfil selecionado for "Treinador"
                            <ListaSuspensa
                                textoPlaceholder={"Escolha uma equipe"}
                                fonteDados={apiListaEquipes}
                                onChange={aoSelecionarEquipe}
                            />
                        )}
                        <div className={style['button-group']}>
                            <Botao onClick={aoSalvar}>
                                {isEditing ? 'Atualizar' : 'Cadastrar'} 
                            </Botao>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
};

export default Usuarios;