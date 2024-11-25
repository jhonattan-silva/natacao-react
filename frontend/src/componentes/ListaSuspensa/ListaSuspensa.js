import style from './ListaSuspensa.module.css';
import { useState, useEffect } from 'react';
import api from '../../servicos/api';

const ListaSuspensa = ({ fonteDados, onChange, textoPlaceholder, obrigatorio = false }) => {
    const [opcoes, setOpcoes] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get(fonteDados);
                
                if (Array.isArray(response.data)) {
                    setOpcoes(response.data);
                } else {
                    console.error("Erro: A resposta não é um array", response.data);
                    setOpcoes([]); // Garante que não quebre a interface
                }
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
                setOpcoes([]); // Garante que `opcoes` esteja vazio em caso de erro
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
            <select
                onChange={aoEscolher}
                required={obrigatorio}
            >
                <option value=''>{textoPlaceholder}</option>
                {opcoes.map((opcao) => (
                    <option key={opcao.id} value={opcao.id}>
                        {opcao.nome}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default ListaSuspensa