import api from '../../servicos/api';
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
    const apiListaNadadores = `/nadadores/listarNadadores`;
    const apiCadastraNadador = `/nadadores/cadastrarNadador`;
    const apiListaEquipes = `/nadadores/listarEquipes`;

    // Busca todos os Nadadores e atualizar a lista
    const fetchNadadores = async () => {
        try {
            const response = await api.get(apiListaNadadores);
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
            await api.post(apiCadastraNadador, dados); // Envia o novo Nadador para o backend
            await fetchNadadores(); // Recarrega a lista completa de Nadadoress do backend
            setFormVisivel(false); // Esconde o formulário após salvar
        } catch (error) {
            console.error('Erro ao cadastrar Nadador:', error);
        }
    };

    // Função para aplicar máscara de CPF em tempo real
    function aplicarMascaraCPF(cpf) {
        // Remove todos os caracteres não numéricos
        cpf = cpf.replace(/\D/g, '');

        // Aplica a máscara, adicionando pontos e traço conforme necessário
        cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
        cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
        cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2');

        return cpf;
    }

    // Função para validar CPF
    function validarCPF(cpf) {
        cpf = cpf.replace(/\D/g, ''); // Remove caracteres não numéricos
        if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false; // Verifica se tem 11 dígitos ou se todos são iguais

        let soma = 0;
        for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
        let digitoVerificador1 = 11 - (soma % 11);
        if (digitoVerificador1 > 9) digitoVerificador1 = 0;
        if (digitoVerificador1 !== parseInt(cpf.charAt(9))) return false;

        soma = 0;
        for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
        let digitoVerificador2 = 11 - (soma % 11);
        if (digitoVerificador2 > 9) digitoVerificador2 = 0;
        return digitoVerificador2 === parseInt(cpf.charAt(10));
    }

    // Função para validar celular
    function validarCelular(celular) {
        celular = celular.replace(/\D/g, ''); // Remove caracteres não numéricos

        // Verifica se o comprimento do número é 10 ou 11
        if (celular.length !== 10 && celular.length !== 11) return false;

        // Verifica se todos os dígitos são iguais (por exemplo, 11111111111)
        if (/^(\d)\1+$/.test(celular)) return false;

        // Se passar pelas validações acima, o número é considerado válido
        return true;
    }


    // Função para aplicar máscara de CPF
    function aplicarMascaraCPF(cpf) {
        cpf = cpf.replace(/\D/g, ''); // Remove caracteres não numéricos
        cpf = cpf.substring(0, 11); // Limita a 11 caracteres
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'); // Aplica a máscara
    }
    // Função para aplicar máscara de celular
    function aplicarMascaraCelular(celular) {
        celular = celular.replace(/\D/g, ''); // Remove caracteres não numéricos
        celular = celular.substring(0, 11); // Limita a 11 caracteres
        return celular.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3'); // Aplica a máscara
    }




    const inputs = [
        {
            obrigatorio: true,
            label: "Nome",
            placeholder: "Digite o nome",
            valor: nomeNadador,
            aoAlterar: setNomeNadador
        },
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

        // Validação do CPF
        if (!validarCPF(cpf)) {
            alert('CPF inválido. Por favor, insira um CPF válido.');
            return;
        }

        if (!validarCelular(celular)) {
            alert ('Celular/Telefone Inválido');
            return;
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
                <TabelaEdicao
                    dados={nadadores}
                    onEdit={handleEdit}
                    onInativar={handleInativar}
                    colunasOcultas={['id', 'ativo']}
                />
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