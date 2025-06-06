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
import BotaoTabela from '../../componentes/BotaoTabela/BotaoTabela';
import useAlerta from '../../hooks/useAlerta'; // Importa o hook useAlerta

const Nadadores = () => {
    const { user, loading } = useUser(); // Pega o estado de carregamento também
    const { mostrar: mostrarAlerta, componente: alertaComponente } = useAlerta(); // Usa o hook useAlerta
    const [nadadores, setNadadores] = useState([]); //controle de nadadores
    const [equipes, setEquipes] = useState(''); // Controle de equipes listadas
    const [formVisivel, setFormVisivel] = useState(false); // Controla visibilidade do form de cadastro
    const [editando, setEditando] = useState(false); // Controla se está editando ou não
    const [editNadadorId, setEditNadadorId] = useState(null); // Guarda o ID do Nadador sendo editado
    const [equipeNadador, setEquipeNadador] = useState(null); // Guarda a equipe do Nadador sendo editado
    const [cpfExistente, setCpfExistente] = useState(false); // Controla se o CPF já existe
    /* INPUTS */
    const [nomeNadador, setNomeNadador] = useState(''); // Para input de nome
    const [cpf, setCpf] = useState('');
    const [dataNasc, setDataNasc] = useState('');
    const [celular, setCelular] = useState('');
    const [cidade, setCidade] = useState(''); // Para input de cidade

    /* RADIO GROUP */
    const [sexo, setSexo] = useState('');

    /* Estado para controlar a visualização de nadadores inativos */
    const [mostrarInativos, setMostrarInativos] = useState(false);

    /* URLS de API */
    const apiListaNadadores = `nadadores/listarNadadores`;
    const apiCadastraNadador = `nadadores/cadastrarNadador`;
    const apiListaEquipes = `nadadores/listarEquipes`;
    const apiInativarNadador = `nadadores/inativarNadador`;
    const apiAtualizaNadador = `nadadores/atualizarNadador`;
    const apiVerificaCpf = `nadadores/verificarCpf`; 

    const equipeSelecionada = (id) => { //para capturar a equipe escolhida, caso o usuário não tenha uma equipe (admin)
        setEquipes(id);
    };

    useEffect(() => { // Busca os nadadores ao carregar a página
        if (!loading && user?.equipeId) { // Verifica se o usuário está carregado e tem equipeId
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
                // Corrige a exibição da data para evitar erro de fuso horário e hora
                data_nasc: (() => {
                    if (!nadador.data_nasc) return '';
                    // Garante que só a parte da data (YYYY-MM-DD) será usada
                    const dataStr = nadador.data_nasc.split('T')[0];
                    const [ano, mes, dia] = dataStr.split('-');
                    return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
                })(),
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
        try {            
            const nadador = nadadores.find(nadador => nadador.id === id);

            if (!nadador) {
                throw new Error('Nadador não encontrado.');
            }
            
            setCpf(nadador.cpf);
            setNomeNadador(nadador.nome);
            setCidade(nadador.cidade);
            setDataNasc(nadador.data_nasc.split('-').reverse().join('/'));
            setCelular(nadador.celular);
            setSexo(nadador.sexo);

            // Define a equipe do nadador diretamente
            setEquipeNadador(nadador.equipes_id);
            setEquipes(nadador.equipes_id); // Garante que a equipe seja considerada ao editar

            setEditNadadorId(id);
            setEditando(true);
            setFormVisivel(true);

        } catch (error) {
            mostrarAlerta('Erro ao editar nadador: ' + error.message); // Substitui alert pelo hook
        }
    };

    //Botão inativa cadastro
    const handleInativar = async (id, ativo) => {
        try {    
            // Converter `ativo` para número, caso esteja vindo como string
            const ativoNumero = Number(ativo);
            const novoStatus = ativoNumero === 1 ? 0 : 1;
        
            const confirmacao = window.confirm(
                `Tem certeza que deseja ${ativoNumero === 1 ? "inativar" : "ativar"} este nadador?`
            );
    
            if (!confirmacao) return;
            await api.put(`${apiInativarNadador}/${id}`, { ativo: novoStatus });    
            mostrarAlerta(`Nadador ${ativoNumero === 1 ? "inativado" : "ativado"} com sucesso!`); // Substitui alert pelo hook
            setTimeout(() => fetchNadadores(user?.equipeId), 500);
        } catch (error) {
            mostrarAlerta("Erro ao alterar status do nadador."); // Substitui alert pelo hook
        }
    };
    
    

    // Função para adicionar um novo Nadador
    const adicionarNadador = async (dados) => {
        try {
            const token = localStorage.getItem('token'); // Obtém o token do localStorage
            if (!token) {
                throw new Error('Token não encontrado. Por favor, faça login novamente.');
            }
            
            // Envia o novo Nadador para o backend
            await api.post(apiCadastraNadador, dados, {
                headers: {
                    Authorization: `Bearer ${token}` // Adiciona o token ao cabeçalho
                }
            });
            
            // Recarrega a lista completa de Nadadores do backend
            await fetchNadadores(user?.equipeId);
            
            // Esconde o formulário após salvar
            setFormVisivel(false);
            
            // Exibe mensagem de sucesso
            mostrarAlerta('Nadador salvo com sucesso!');
            
            return true; // Indica que a operação foi bem-sucedida
        } catch (error) {
            if (error.response) {
                if (error.response.status === 409) {
                    mostrarAlerta('Erro: CPF já cadastrado.'); // Trata erro de CPF duplicado
                } else if (error.response.status === 401) {
                    mostrarAlerta('Sessão expirada. Por favor, faça login novamente.');
                    window.location.href = '/login'; // Redireciona para a página de login
                } else {
                    mostrarAlerta('Erro ao cadastrar Nadador: ' + error.response.data.message);
                }
            } else {
                mostrarAlerta('Erro ao cadastrar Nadador: ' + error.message);
            }
            return false; // Indica que houve um erro na operação
        }
    };

    const atualizarNadador = async (id, dados) => {
        try {
            const token = localStorage.getItem('token'); // Obtém o token do localStorage
            if (!token) {
                throw new Error('Token não encontrado. Por favor, faça login novamente.');
            }
            await api.put(`${apiAtualizaNadador}/${id}`, dados, {
                headers: {
                    Authorization: `Bearer ${token}` // Adiciona o token ao cabeçalho
                }
            }); // Envia os dados atualizados para o backend
            await fetchNadadores(); // Recarrega a lista completa de Nadadores do backend
            setFormVisivel(false); // Esconde o formulário após salvar
        } catch (error) {
            if (error.response && error.response.status === 401) {
                mostrarAlerta('Sessão expirada. Por favor, faça login novamente.'); // Substitui alert pelo hook
                window.location.href = '/login'; // Redireciona para a página de login
            } else {
                mostrarAlerta('Erro ao atualizar Nadador: ' + error.message); // Substitui alert pelo hook
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
            aoAlterar: (valor) => {
                setCpf(aplicarMascaraCPF(valor));
                setCpfExistente(false); // Limpa o estado ao alterar
            },
            onBlur: async () => {
                const cpfNumeros = cpf.replace(/\D/g, '');
                
                if (!validarCPF(cpf)) {
                    mostrarAlerta('CPF inválido.');
                    setCpfExistente(false);
                    return;
                }
            
                try {
                    // Evita verificação se estamos editando e não mudou o CPF
                    if (editando) {
                        const nadadorOriginal = nadadores.find(n => n.id === editNadadorId);
                        if (nadadorOriginal && nadadorOriginal.cpf === cpfNumeros) {
                            setCpfExistente(false);
                            return;
                        }
                    }
            
                    const response = await api.get(apiVerificaCpf, {
                        params: { cpf: cpfNumeros }
                    });
            
                    if (response?.data?.exists) {
                        mostrarAlerta('CPF já cadastrado.');
                        setCpfExistente(true);
                    } else {
                        setCpfExistente(false);
                    }
                } catch (error) {
                    console.error('Erro ao verificar CPF:', error);
                    mostrarAlerta('Erro ao verificar CPF. Tente novamente.');
                    setCpfExistente(false);
                }
            }
            
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
            tipo: "text",
            label: "Data de Nascimento",
            placeholder: "DD/MM/AAAA",
            valor: dataNasc,
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
        
                setDataNasc(valorFormatado);
            }
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

        // Validações
        if (!nomeNadador || !cpf || !dataNasc || !celular || !sexo) {
            mostrarAlerta('Por favor, preencha todos os campos obrigatórios.'); // Substitui alert pelo hook
            return; // Interrompe o processo de salvamento se houver campos vazios
        }

        if (cpfExistente) {
            mostrarAlerta('CPF já cadastrado. Não é possível salvar.');
            return;
        }

        // Validação do CPF
        if (!validarCPF(cpf)) {
            mostrarAlerta('CPF inválido. Por favor, insira um CPF válido.'); // Substitui alert pelo hook
            return;
        }

        if (!validarCelular(celular)) {
            mostrarAlerta('Celular/Telefone Inválido'); // Substitui alert pelo hook
            return;
        }

        // Verifica se `equipes` está definido
        if (!equipes) {
            mostrarAlerta('Por favor, selecione uma equipe.'); // Substitui alert pelo hook
            return;
        }

        const nadadorDados = {
            nome: nomeNadador,
            cpf: cpf,
            data_nasc: dataNasc.split('/').reverse().join('-'), // Converte para YYYY-MM-DD            
            telefone: celular,
            sexo: sexo,
            equipeId: equipes, // Garante que `equipes` tenha um valor válido
            cidade: cidade
        };

        let operacaoSucesso = false;
        
        if (editando) {
            // Se `editando` for verdadeiro, atualiza o nadador existente
            try {
                await atualizarNadador(editNadadorId, nadadorDados);
                operacaoSucesso = true;
                mostrarAlerta('Nadador atualizado com sucesso!');
            } catch (error) {
                // Erro já tratado dentro da função atualizarNadador
            }
        } else {
            // Se não, adiciona um novo nadador
            operacaoSucesso = await adicionarNadador(nadadorDados);
            // Não mostramos mensagem de sucesso aqui pois já é mostrada dentro da função adicionarNadador
        }

        // Só limpa o formulário se a operação foi bem-sucedida
        if (operacaoSucesso) {
            limparFormulario();
        }
    };

    return (
        <>
            <CabecalhoAdmin />
            <div className={style.nadadores}>
                <h2 className={style.titulo}>NADADORES</h2>
                {/* Container com classe específica para o checkbox de filtro de inativos */}
                <div className={style.filtroInativosContainer}>
                    <input 
                        type="checkbox" 
                        id="filtrarInativos" 
                        checked={mostrarInativos} 
                        onChange={(e) => setMostrarInativos(e.target.checked)} 
                    />
                    <label htmlFor="filtrarInativos">Mostrar inativos</label>
                </div>
                {!formVisivel && (
                    <>
                        <Botao classBtn={style.btnAdd} onClick={handleAdicionar}>Adicionar Novo Nadador</Botao>
                        <TabelaEdicao
                            dados={[...nadadores]
                                .filter(n => mostrarInativos ? true : n.ativo === 1)
                                .sort((a, b) => b.ativo - a.ativo)} // Alteração: filtrar ativos com base no checkbox
                            onEdit={handleEdit}
                            colunasOcultas={['id', 'equipes_id', 'ativo', 'categorias_id']}
                            colunasTitulos={{
                                nome: "Nome",
                                cpf: "CPF",
                                data_nasc: "Data de Nascimento",
                                celular: "Celular",
                                sexo: "Sexo",
                                cidade: "Cidade",
                                categoria_nome: "Categoria"
                            }}
                            funcExtra={(nadador) => (
                                <BotaoTabela
                                    tipo={nadador.ativo === 1 ? 'inativar' : 'ativar'} // Corrige o uso do tipo
                                    onClick={() => handleInativar(nadador.id, nadador.ativo)}
                                    style={{ backgroundColor: nadador.ativo === 1 ? '#4CAF50' : '#f44336' }}
                                >
                                    {nadador.ativo === 1 ? 'Inativar' : 'Ativar'}
                                </BotaoTabela>
                            )}
                            renderLinha={(nadador) => ({
                                // Modificando para usar uma classe em vez de estilo inline
                                // para permitir que o hover funcione adequadamente
                                className: nadador.ativo === 0 ? 'inativo' : '',
                                style: { 
                                    backgroundColor: nadador.ativo === 0 ? '#ffcccc' : null 
                                }
                            })}
                        />
                        <Botao classBtn={style.btnAdd} onClick={handleAdicionar}>Adicionar Novo Nadador</Botao>
                    </>
                )}
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
                            valorSelecionado={sexo} // Passa o valor selecionado
                        />
                        {(!user?.equipeId || (Array.isArray(user.equipeId) && user.equipeId.length === 0)) && (
                            <ListaSuspensa
                                textoPlaceholder="Escolha uma equipe"
                                fonteDados={apiListaEquipes}
                                onChange={equipeSelecionada}
                                valorSelecionado={equipeNadador} // Passa o valor selecionado
                            />
                        )}
                        <Botao onClick={aoSalvar}>Salvar</Botao>
                        <Botao onClick={handleVoltar}>Voltar</Botao>
                    </div>
                )}
            </div>
            {alertaComponente /* Renderiza o componente do hook */}
        </>
    )
};

export default Nadadores;