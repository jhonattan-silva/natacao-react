import style from './ListaSuspensa.module.css';
import { useState, useEffect } from 'react';
import axios from 'axios';

const ListaSuspensa = ({ fonteDados, onChange, textoPlaceholder, obrigatorio = false }) => {
    const [opcoes, setOpcoes] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(fonteDados);
                setOpcoes(response.data);
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
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