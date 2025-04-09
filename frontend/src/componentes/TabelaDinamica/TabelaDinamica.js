import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import style from './TabelaDinamica.module.css';

function TabelaDinamica({
    dadosIniciais = [],
    colunas = [],
    colunasOcultas = [],
    textoExibicao = {},
    onChange,
    opcoesAutoComplete = [],
    onSelecionarAutoComplete = () => { },
    nadadoresJaUsados = [],
    debouncedBuscarNadadores = () => { }
}) {
    const [dados, setDados] = useState(dadosIniciais);
    const [rowFocado, setRowFocado] = useState(null); // novo estado para linha em foco

    useEffect(() => {
        onChange(dados);
    }, [dados, onChange]);

    const handleChange = (index, campo, valor) => {
        const novosDados = [...dados];
        novosDados[index][campo] = valor;
        setDados(novosDados);
    };

    const handleSelecionarNadador = (index, nadador) => {
        if (nadadoresJaUsados.includes(nadador.nome)) {
            alert('Este nadador já está em outra série!');
            return;
        }
        
        const novosDados = [...dados];
        // Mescla dados existentes com os dados retornados pela função onSelecionarAutoComplete
        novosDados[index] = { ...novosDados[index], ...onSelecionarAutoComplete(nadador) };
        setDados(novosDados);

        // Cria nova linha se última linha preenchida
        if (index === dados.length - 1) adicionarLinha();
    };

    const adicionarLinha = () => {
        const novaLinha = {};
        colunas.forEach((col) => {
            const campo = typeof col === 'string' ? col : col.campo;
            novaLinha[campo] = '';
        });
        setDados([...dados, novaLinha]);
    };

    const excluirLinha = (index) => {
        const novosDados = dados.filter((_, i) => i !== index);
        setDados(novosDados);
    };

    return (
        <div className={style.container}>
            <table className={style.tabela}>
                <thead>
                    <tr>
                        {colunas.map((col) => {
                            const campo = typeof col === 'string' ? col : col.campo;
                            const titulo = typeof col === 'string' ? col : col.titulo;
                            return colunasOcultas.includes(campo) ? null : (
                                <th key={campo}>{titulo}</th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {dados.map((linha, index) => (
                        <tr key={index}>
                            {colunas.map((col) => {
                                const campo = typeof col === 'string' ? col : col.campo;
                                return colunasOcultas.includes(campo) ? null : (
                                    <td key={campo} style={{ position: 'relative' }}>
                                        {campo === 'nome' ? (
                                            <>
                                                <div>
                                                    <input
                                                        type="text"
                                                        value={linha[campo]}
                                                        onFocus={() => setRowFocado(index)}
                                                        onBlur={() => setTimeout(() => setRowFocado(null), 200)}
                                                        onChange={(e) => {
                                                            handleChange(index, campo, e.target.value);
                                                            if (campo === 'nome') {
                                                                debouncedBuscarNadadores(e.target.value);
                                                            }
                                                        }}
                                                    />
                                                    {rowFocado === index && opcoesAutoComplete.length > 0 && (
                                                        <ul className={style.suggestions}>
                                                            {opcoesAutoComplete.map((sugestao) => (
                                                                <li
                                                                    key={sugestao.nome}
                                                                    onMouseDown={() => handleSelecionarNadador(index, sugestao)}
                                                                >
                                                                    {sugestao.nome}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <input
                                                type="text"
                                                value={linha[campo]}
                                                onChange={(e) => handleChange(index, campo, e.target.value)}
                                            />
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>

            <button onClick={adicionarLinha}>Adicionar Linha</button>
        </div>
    );
}

TabelaDinamica.propTypes = {
    dadosIniciais: PropTypes.array,
    colunas: PropTypes.array.isRequired, // [{ campo, editavel, autocomplete }]
    colunasOcultas: PropTypes.array,
    textoExibicao: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    opcoesAutoComplete: PropTypes.array,
    onSelecionarAutoComplete: PropTypes.func,
    nadadoresJaUsados: PropTypes.array,
    debouncedBuscarNadadores: PropTypes.func,
};

export default TabelaDinamica;
