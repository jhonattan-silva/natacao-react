import api from '../../servicos/api';
import CabecalhoAdmin from '../../componentes/CabecalhoAdmin/CabecalhoAdmin';
import TabelaEdicao from '../../componentes/TabelaEdicao/TabelaEdicao';
import React, { useEffect, useState } from 'react';
import Botao from '../../componentes/Botao/Botao';
import Formulario from '../../componentes/Formulario/Formulario';
import ListaSuspensa from '../../componentes/ListaSuspensa/ListaSuspensa';
import style from './Nadadores.module.css';
import RadioButtons from '../../componentes/RadioButtons/RadioButtons';
import { useUser } from '../../servicos/UserContext';
import { validarCPF, aplicarMascaraCPF, aplicarMascaraCelular, validarCelular } from '../../servicos/functions';

const Nadadores = () => {
    const { user, loading } = useUser(); // Pega o estado de carregamento também
    const [nadadores, setNadadores] = useState([]); //controle de nadadores
    const [equipes, setEquipes] = useState(''); // Controle de equipes listadas
    const [formVisivel, setFormVisivel] = useState(false); // Controla visibilidade do form de cadastro
    const [equipesUsuario, setEquipeUsuario] = useState(''); // Controle de equipe do usuário logado

    /* INPUTS */
    const [nomeNadador, setNomeNadador] = useState(''); // Para input de nome
    const [cpf, setCpf] = useState('');
    const [dataNasc, setDataNasc] = useState('');
    const [celular, setCelular] = useState('');
    const [cidade, setCidade] = useState(''); // Para input de cidade

    /* RADIO GROUP */
    const [sexo, setSexo] = useState('');

    /* URLS de API */
    const apiListaNadadores = `nadadores/listarNadadores`;
    const apiCadastraNadador = `nadadores/cadastrarNadador`;
    const apiListaEquipes = `nadadores/listarEquipes`;
    const apiInativarNadador = `nadadores/inativarNadador`;

    const equipeSelecionada = (id) => { //para capturar a equipe escolhida, caso o usuário não tenha uma equipe (admin)
        setEquipes(id);
    };

    useEffect(() => {
        if (!loading && user?.equipeId) { 
            console.log("User equipeId atualizado:", user.equipeId);
            setEquipes(user.equipeId);
            fetchNadadores(user.equipeId);
        }
    }, [user?.equipeId, loading]); // Aguarda `loading` ser `false` antes de buscar nadadores
    
    
    const fetchNadadores = async (equipeIdParam) => {
        try {
            let equipeId = equipeIdParam ?? user?.equipeId; // Prioriza parâmetro para evitar problemas assíncronos
    
            if (!equipeId) return; // Evita chamadas desnecessárias
       
            const response = await api.get(apiListaNadadores, { params: { equipeId } });
    
            setNadadores(response.data.map(nadador => ({
                ...nadador,
                data_nasc: new Date(nadador.data_nasc).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                }),
            })));
        } catch (error) {
            console.error('Erro ao buscar nadadores:', error);
        }
    };
    
    


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
    const handleInativar = async (id, ativo) => {
        try {
            console.log(`🟢 Chamada de handleInativar - ID: ${id}, Ativo recebido: ${ativo}, Tipo: ${typeof ativo}`);
    
            // Converter `ativo` para número, caso esteja vindo como string
            const ativoNumero = Number(ativo);
            const novoStatus = ativoNumero === 1 ? 0 : 1;
    
            console.log(`🔄 Novo Status Calculado: ${novoStatus}, Tipo: ${typeof novoStatus}`);
    
            const confirmacao = window.confirm(
                `Tem certeza que deseja ${ativoNumero === 1 ? "inativar" : "ativar"} este nadador?`
            );
    
            if (!confirmacao) return;
    
            console.log(`🚀 Enviando para API: ID: ${id}, Status Atualizado: ${novoStatus}`);
            await api.put(`${apiInativarNadador}/${id}`, { ativo: novoStatus });
    
            alert(`Nadador ${ativoNumero === 1 ? "inativado" : "ativado"} com sucesso!`);
    
            setTimeout(() => fetchNadadores(user?.equipeId), 500);
        } catch (error) {
            console.error(`❌ Erro ao ${ativo ? "inativar" : "ativar"} nadador:`, error);
            alert("Erro ao alterar status do nadador.");
        }
    };
    
    

    // Função para adicionar um novo Nadador
    const adicionarNadador = async (dados) => {
        try {
            const token = localStorage.getItem('token'); // Obtém o token do localStorage
            if (!token) {
                throw new Error('Token não encontrado. Por favor, faça login novamente.');
            }
            await api.post(apiCadastraNadador, dados, {
                headers: {
                    Authorization: `Bearer ${token}` // Adiciona o token ao cabeçalho
                }
            }); // Envia o novo Nadador para o backend
            await fetchNadadores(); // Recarrega a lista completa de Nadadoress do backend
            setFormVisivel(false); // Esconde o formulário após salvar
        } catch (error) {
            if (error.response && error.response.status === 401) {
                alert('Sessão expirada. Por favor, faça login novamente.');
                window.location.href = '/login'; // Redireciona para a página de login
            } else {
                console.error('Erro ao cadastrar Nadador:', error.message);
                alert('Erro ao cadastrar Nadador: ' + error.message);
            }
        }
    };

    const inputs = [
        {
            id: "cpfInput",
            obrigatorio: true,
            label: "CPF",
            placeholder: "Somente números",
            valor: cpf,
            aoAlterar: (valor) => setCpf(aplicarMascaraCPF(valor)) // Aplicando a máscara ao alterar
        },
        {
            obrigatorio: true,
            label: "Nome",
            placeholder: "Digite o nome",
            valor: nomeNadador,
            aoAlterar: setNomeNadador
        },
        {
            label: "Cidade",
            placeholder: "Digite a cidade",
            valor: cidade,
            aoAlterar: setCidade
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
            aoAlterar: (valor) => setCelular(aplicarMascaraCelular(valor))
        }
    ];

    // Função para limpar o formulário
    const limparFormulario = () => {
        setNomeNadador('');
        setCpf('');
        setDataNasc('');
        setCelular('');
        setSexo('');
        setCidade('');
        setFormVisivel(false);
    };

    // Função para limpar o formulário e esconder
    const handleVoltar = () => {
        limparFormulario();
        setFormVisivel(false);
    };

    const aoSalvar = async (evento) => {
        evento.preventDefault();

        // Validaç]oes
        if (!nomeNadador || !cpf || !dataNasc || !celular || !sexo) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return; // Interrompe o processo de salvamento se houver campos vazios
        }

        // Validação do CPF
        if (!validarCPF(cpf)) {
            alert('CPF inválido. Por favor, insira um CPF válido.');
            return;
        }

        if (!validarCelular(celular)) {
            alert('Celular/Telefone Inválido');
            return;
        }

        const nadadorDados = {
            nome: nomeNadador,
            cpf: cpf,
            data_nasc: dataNasc,
            telefone: celular,
            sexo: sexo,
            equipeId: equipes,
            cidade: cidade
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
                {!formVisivel && (
                    <TabelaEdicao
                        dados={nadadores}
                        onEdit={handleEdit}
                        colunasOcultas={['id']}
                        funcExtra={(nadador) => (
                            <Botao
                                onClick={() => handleInativar(nadador.id, nadador.ativo)}
                                style={{ backgroundColor: nadador.ativo === 1 ? '#4CAF50' : '#f44336' }}
                            >
                                {nadador.ativo ? 'Inativar' : 'Ativar'}
                            </Botao>
                        )}
                    />
                )}
                <Botao classBtn={style.btnAdd} onClick={handleAdicionar}>Adicionar Novo Nadador</Botao>
                {formVisivel && (
                    <div className={style.cadastroContainer}>
                        <Formulario inputs={inputs} aoSalvar={aoSalvar} />
                        <RadioButtons
                            classNameRadioDiv={style.radioSexoDiv}
                            classNameRadioItem={style.radioSexoItem}
                            classNameRadioOpcoes={style.radioSexoOpcoes}
                            titulo="Escolha uma opção"
                            name="sexo"
                            opcoes={[
                                { id: 'M', value: 'M', label: 'Masculino' },
                                { id: 'F', value: 'F', label: 'Feminino' },
                            ]}
                            aoSelecionar={setSexo}
                        />
                        {(!user?.equipeId || (Array.isArray(user.equipeId) && user.equipeId.length === 0)) && (
                            <ListaSuspensa
                                textoPlaceholder="Escolha uma equipe"
                                fonteDados={apiListaEquipes}
                                onChange={equipeSelecionada}
                            />
                        )}
                        <Botao onClick={aoSalvar}>Cadastrar</Botao>
                        <Botao onClick={handleVoltar}>Voltar</Botao>
                    </div>
                )}
            </div>
        </>
    )
};

export default Nadadores;