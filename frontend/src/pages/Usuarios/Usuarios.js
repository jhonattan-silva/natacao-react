import api from '../../servicos/api';
import CabecalhoAdmin from '../../componentes/CabecalhoAdmin/CabecalhoAdmin';
import TabelaEdicao from '../../componentes/TabelaEdicao/TabelaEdicao';
import style from './Usuarios.module.css';
import React, { useEffect, useState } from 'react';
import Botao from '../../componentes/Botao/Botao';
import Formulario from '../../componentes/Formulario/Formulario';
import ListaSuspensa from '../../componentes/ListaSuspensa/ListaSuspensa';
import CheckboxGroup from '../../componentes/CheckBoxGroup/CheckBoxGroup';
import { validarCPF, validarCelular, aplicarMascaraCPF, aplicarMascaraCelular } from '../../servicos/functions';

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
    const apiListaUsuarios = `usuarios/listarUsuarios`;
    const apiCadastraUsuario = `usuarios/cadastrarUsuario`;
    const apiListaPerfis = `usuarios/listarPerfis`;
    const apiListaEquipes = `usuarios/listarEquipes`;
    const apiInativarUsuario = `usuarios/inativarUsuario`;

    // Função para buscar todos os usuários e atualizar a lista
    const fetchUsuarios = async () => {
        try {
            const response = await api.get(apiListaUsuarios);
            const usuariosComMascara = response.data.map(usuario => ({
                ...usuario,
                cpf: aplicarMascaraCPF(usuario.cpf),
                celular: aplicarMascaraCelular(usuario.celular),
                ativo: usuario.ativo // Inclui o campo ativo
            }));
            setUsuarios(usuariosComMascara);
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        }
    };

    // Função para buscar todos os perfis e atualizar a lista
    const fetchPerfis = async () => {
        try {
            const responsePerfis = await api.get(apiListaPerfis);
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
            const responseEquipes = await api.get(apiListaEquipes);
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

            // Trata perfis: converte nomes para IDs
            const perfisUsuario = usuario.perfis
                ? usuario.perfis.split(',').map((perfilNome) => {
                    const perfil = perfis.find((p) => p.label.toLowerCase() === perfilNome.trim().toLowerCase());
                    return perfil ? perfil.id : null; // Retorna o ID do perfil ou null se não encontrado
                }).filter((id) => id !== null) // Remove valores nulos
                : [];
            SetPerfisSelecionados(perfisUsuario);

            // Localiza o ID da equipe correspondente ao nome
            const equipe = equipes.find((e) => e.nome.toLowerCase() === usuario.equipes.toLowerCase().trim());
            setEquipeSelecionada(equipe ? equipe.id : null); // Define o ID da equipe ou vazio

            // Ativa o formulário em modo de edição
            setEditUserId(id);
            setIsEditing(true);
            setFormVisivel(true);

            // Verifica se o usuário tem o perfil de treinador e define a equipe selecionada
            if (perfisUsuario.includes(perfilEspecificoId)) {
                setMostrarListaSuspensa(true);
                setEquipeSelecionada(equipe ? equipe.id : '');
            } else {
                setMostrarListaSuspensa(false);
            }
        } catch (error) {
            console.error('Erro ao editar usuário:', error);
        }
    };



    //Botão inativar cadastro
    const handleInativar = async (id, ativo) => {
        try {
            const novoStatus = ativo ? 0 : 1;
            await api.put(`${apiInativarUsuario}/${id}`, { ativo: novoStatus });
            setUsuarios(prevUsuarios => 
                prevUsuarios.map(usuario => 
                    usuario.id === id ? { ...usuario, ativo: novoStatus } : usuario
                )
            );
            alert(`Usuário ${ativo ? 'inativado' : 'ativado'} com sucesso!`);
        } catch (error) {
            console.error('Erro ao inativar/ativar usuário:', error);
            alert('Erro ao inativar/ativar usuário. Verifique os logs.');
        }
    };

    /* CHECKBOX */
    const aoAlterarPerfis = (id, checked) => {
        SetPerfisSelecionados(prev => {
            const updatedPerfis = checked ? [...prev, id] : prev.filter(item => item !== id);
            
            // Verifica se o perfil de treinador foi removido
            if (!updatedPerfis.includes(perfilEspecificoId)) {
                setEquipeSelecionada(null); // Remove a equipe selecionada
                setMostrarListaSuspensa(false); // Esconde a lista suspensa
            } else {
                setMostrarListaSuspensa(true); // Mostra a lista suspensa
            }

            return updatedPerfis;
        });
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
            aoAlterar: (valor) => setCpf(aplicarMascaraCPF(valor)) // Aplicando a máscara ao alterar
        },
        {
            obrigatorio: true,
            label: "Senha",
            placeholder: "Digite uma senha",
            valor: senha,
            aoAlterar: setSenha,
            tipo: "password" // Add this line to hide password characters
        },
        {
            obrigatorio: true,
            label: "Celular",
            placeholder: "Celular (com ddd, somente números)",
            valor: celular,
            aoAlterar: (valor) => setCelular(aplicarMascaraCelular(valor))
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

    // Função auxiliar para limpar os campos do formulário e fechar o formulário
    const fecharFormulario = () => {
        limparFormulario();
        setFormVisivel(false);
    };

    const aoSalvar = async (evento) => {
        evento.preventDefault();

        // Validações
        if (!nomeUsuario || !cpf || (!isEditing && !senha) || !celular || !email) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return; // Interrompe o processo de salvamento se houver campos vazios
        }

        if (!validarCPF(cpf)) {
            alert('CPF inválido.');
            return;
        }

        if (!validarCelular(celular)) {
            alert('Celular inválido.');
            return;
        }

        const usuarioDados = {
            nome: nomeUsuario,
            cpf: cpf,
            senha: isEditing && !senha ? undefined : senha, // Define a senha como undefined se estiver editando e a senha estiver vazia
            celular: celular,
            email: email,
            perfis: perfisSelecionados.map(id => parseInt(id, 10)), // Converter IDs para números inteiros
            equipeId: perfisSelecionados.includes(perfilEspecificoId) ? equipeSelecionada : null // Define como null se não houver equipe selecionada ou se o perfil de treinador foi removido
        };

        try {
            if (isEditing) {
                // Edita o usuário
                await api.put(`usuarios/atualizarUsuario/${editUserId}`, usuarioDados);
                alert('Usuário atualizado com sucesso!');
            } else {
                // Cria um novo usuário
                await api.post(apiCadastraUsuario, usuarioDados);
                alert('Usuário cadastrado com sucesso!');
            }

            await fetchUsuarios(); // Atualiza a lista de usuários
            limparFormulario(); // Reseta o formulário
        } catch (error) {
            console.error('Erro ao salvar o usuário:', error);
            alert('Erro ao salvar o usuário. Verifique os logs.');
        }
    };

    return (
        <>
            <CabecalhoAdmin />
            <div className={style.usuarios}>
                <h2>USUÁRIOS</h2>
                {!formVisivel && (
                    <>
                        <TabelaEdicao 
                            dados={usuarios} 
                            onEdit={handleEdit} 
                            funcExtra={(usuario) => (
                                <Botao onClick={() => handleInativar(usuario.id, usuario.ativo)}
                                    style={{ backgroundColor: usuario.ativo === 1 ? '#4CAF50' : '#f44336' }}>
                                    {usuario.ativo ? 'Inativar' : 'Ativar'}
                                </Botao>
                            )}
                        />
                        <Botao onClick={handleAdicionar}>Adicionar Novo Usuário</Botao>
                    </>
                )}
                {formVisivel && (
                    <div className={style['form-container']}>
                        <Formulario inputs={inputs} aoSalvar={aoSalvar} />
                        <CheckboxGroup
                            titulo="PERFIS"
                            opcoes={perfis}
                            selecionadas={perfisSelecionados}
                            aoAlterar={aoAlterarPerfis}
                        />
                        {mostrarListaSuspensa && (
                            <ListaSuspensa
                                textoPlaceholder="Escolha uma equipe"
                                fonteDados={apiListaEquipes}
                                valorSelecionado={equipeSelecionada} // ID da equipe
                                onChange={aoSelecionarEquipe}
                            />
                        )}
                        <div className={style['button-group']}>
                            <Botao onClick={aoSalvar}>
                                {isEditing ? 'Atualizar' : 'Cadastrar'}
                            </Botao>
                            <Botao onClick={fecharFormulario}>
                                Voltar
                            </Botao>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
};

export default Usuarios;