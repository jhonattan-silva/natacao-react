import style from './ListaSuspensa.module.css';
import { useState, useEffect } from 'react';
import api from '../../servicos/api';

const ListaSuspensa = ({ fonteDados,
    onChange,
    textoPlaceholder,
    obrigatorio = false,
    selectId = 'id', // Campo que será usado como valor do `option`
    selectExibicao = 'nome' // Campo que será usado como texto visível no `option` 
}) => {

    const [opcoes, setOpcoes] = useState([]);
    const [error, setError] = useState(null); // Estado para armazenar o erro
    const [apiEndpoint, setApiEndpoint] = useState(''); // Estado para mostrar a API acessada

    useEffect(() => {
        const fetchData = async () => {
            setApiEndpoint(fonteDados); // Salva o endpoint atual
            try {
                const response = await api.get(fonteDados);
                if (!Array.isArray(response.data)) {
                    throw new Error(`LS->Resposta não é um array. Dados: ${JSON.stringify(response.data)}`);
                }
                setOpcoes(response.data);
                setError(null); // Limpa o erro caso a chamada seja bem-sucedida
            } catch (err) {
                console.error(`Erro ao acessar ${fonteDados}:`, err);
                setError(`Erro ao acessar ${fonteDados}: ${err.message}`);
            }
        };
        fetchData();
    }, [fonteDados]);

    //MUDANÇA DE OPÇÃO
    const aoEscolher = (event) => {
        onChange(event.target.value);
    }

    return (
        <div className={style.listaSuspensa}>
            <select onChange={aoEscolher} required={obrigatorio}>
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

export default ListaSuspensa