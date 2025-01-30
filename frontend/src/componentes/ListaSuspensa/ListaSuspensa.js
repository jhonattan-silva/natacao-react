import style from './ListaSuspensa.module.css';
import { useState, useEffect } from 'react';
import api from '../../servicos/api';

/*******
 * Componente de lista suspensa
 * fonteDados: URL da API que fornece os dados
 * onChange: Função a ser chamada quando o valor da lista for alterado
 * textoPlaceholder: Texto a ser exibido quando nenhum item for selecionado
 * obrigatorio: Indica se o campo é obrigatório
 * selectId: Campo que será usado como valor do `option`
 * selectExibicao: Campo que será usado como texto visível no `option`
 * valorSelecionado: Valor inicial selecionado
 */
const ListaSuspensa = ({ fonteDados,
    opcoes: opcoesExternas = [], // Opções passadas diretamente (opcional)
    onChange,
    textoPlaceholder,
    obrigatorio = false,
    selectId = 'id', // Campo que será usado como valor do `option`
    selectExibicao = 'nome', // Campo que será usado como texto visível no `option`
    valorSelecionado = '' // Valor inicial selecionado
}) => {

    const [opcoes, setOpcoes] = useState(opcoesExternas); // Usa as opções externas como valor inicial
    const [error, setError] = useState(null); // Estado para armazenar o erro
    const [apiEndpoint, setApiEndpoint] = useState(''); // Estado para mostrar a API acessada
    const [valor, setValor] = useState(valorSelecionado); // Estado para o valor selecionado

    useEffect(() => {
        // Se `fonteDados` for fornecida, busca os dados da API
        if (fonteDados) {
            const fetchData = async () => {
                setApiEndpoint(fonteDados);
                try {
                    const response = await api.get(fonteDados);
                    if (!Array.isArray(response.data)) {
                        throw new Error(`LS->Resposta não é um array. Dados: ${JSON.stringify(response.data)}`);
                    }
                    setOpcoes(response.data);
                    setError(null);
                } catch (err) {
                    console.error(`Erro ao acessar ${fonteDados}:`, err);
                    setError(`Erro ao acessar ${fonteDados}: ${err.message}`);
                }
            };
            fetchData();
        }
    }, [fonteDados]);


    // Se `opcoesExternas` mudar, atualiza o estado `opcoes`
    useEffect(() => {
        setOpcoes(opcoesExternas);
    }, [opcoesExternas]);


    //MUDANÇA DE OPÇÃO
    const aoEscolher = (event) => {
        setValor(event.target.value);
        onChange(event.target.value);
    }

    return (
        <div className={style.listaSuspensa}>
            <select onChange={aoEscolher} required={obrigatorio} value={valor}>
                <option value=''>{textoPlaceholder}</option>
                {opcoes.map((opcao) => (
                    <option key={opcao[selectId]} value={opcao[selectId]}>
                        {opcao[selectExibicao]}
                    </option>
                ))}
            </select>
            {error && (
                <div style={{ color: 'red', marginTop: '10px' }}>
                    <strong>Erro:</strong> {error}
                    <br />
                    <strong>Endpoint:</strong> {apiEndpoint}
                </div>
            )}
        </div>
    );
};

export default ListaSuspensa;