import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import style from './TabelaEdicao.module.css';
import BotaoTabela from '../BotaoTabela/BotaoTabela';

/*******
 * Componente de tabela com opções de edição
 * dados: Array de objetos com os dados a serem exibidos
 * colunasOcultas: Array de strings com os nomes das colunas a serem ocultadas
 * colunasTitulos: Objeto com os títulos personalizados das colunas
 * onEdit: Função a ser executada ao clicar no botão de editar
 * onInativar: Função a ser executada ao clicar no botão de inativar
 * onDelete: Função a ser executada ao clicar no botão de excluir
 * funcExtra: Botão extra com função personalizada 
 * renderLinha: Função para aplicar estilos personalizados às linhas da tabela
 */
const TabelaEdicao = ({
  dados = [],
  colunasOcultas = [],
  colunasTitulos = {},
  onEdit = null,
  onInativar = null,
  onDelete = null,
  funcExtra = null,
  renderLinha = null,
}) => {
  // Detecta as colunas automaticamente e exclui as especificadas em `colunasOcultas`
  const colunas = dados.length > 0
    ? Object.keys(dados[0]).filter(coluna => !colunasOcultas.includes(coluna))
    : [];

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600); // Estado para verificar se a tela é mobile
  const [acoesDropdownId, setAcoesDropdownId] = useState(null); // Estado para controlar o dropdown de ações

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!dados || dados.length === 0) {
    return <p>Nenhum dado disponível.</p>;
  }

  // Envolvendo a tabela em uma div para melhor isolamento de estilos
  return (
    <div className={style.tabelaContainer}>
      <table className={style.tabela}>
        <thead>
          <tr>
            {colunas.map(coluna => (
              <th key={coluna}>
                {colunasTitulos[coluna] || (coluna.charAt(0).toUpperCase() + coluna.slice(1))}
              </th>
            ))}
            {(onEdit || onInativar || onDelete || funcExtra) && <th>Ações</th>} {/* Condicional para exibir Ações */}
          </tr>
        </thead>
        <tbody>
          {dados.map((linha, index) => {
            // Obtém os atributos da linha, como className e style
            const linhaProps = renderLinha ? renderLinha(linha) : {};
            
            return (
              <tr key={index} {...linhaProps}>
                {colunas.map((coluna, idx) => (
                  <td key={idx}>{linha[coluna]}</td>
                ))}
                {(onEdit || onInativar || onDelete || funcExtra) && (
                  <td>
                    {isMobile ? (
                      <div className={style.escondeAcoes}>
                        <button
                          className={style.btnAcaoMobile}
                          onClick={() => setAcoesDropdownId(acoesDropdownId === linha.id ? null : linha.id)}
                        >
                          Ações
                        </button>
                        {acoesDropdownId === linha.id && (
                          <div className={style.acoesDropdown}>
                            {onEdit && (
                              <div onClick={() => { onEdit(linha.id); setAcoesDropdownId(null); }}>
                                <BotaoTabela tipo="editar" onClick={() => {}} />
                              </div>
                            )}
                            {onInativar && (
                              <div onClick={() => { onInativar(linha.id); setAcoesDropdownId(null); }}>
                                <BotaoTabela tipo="inativar" onClick={() => {}} />
                              </div>
                            )}
                            {onDelete && (
                              <div onClick={() => { onDelete(linha.id); setAcoesDropdownId(null); }}>
                                <BotaoTabela tipo="excluir" onClick={() => {}} />
                              </div>
                            )}
                            {funcExtra && funcExtra(linha)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {onEdit && <BotaoTabela tipo="editar" onClick={() => onEdit(linha.id)} />}
                        {onInativar && <BotaoTabela tipo="inativar" onClick={() => onInativar(linha.id)} />}
                        {onDelete && <BotaoTabela tipo="excluir" onClick={() => onDelete(linha.id)} />}
                        {funcExtra && funcExtra(linha)}
                      </>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

TabelaEdicao.propTypes = {
  dados: PropTypes.arrayOf(PropTypes.object).isRequired,
  colunasOcultas: PropTypes.arrayOf(PropTypes.string), // Validação de `colunasOcultas`
  colunasTitulos: PropTypes.object, // Validação de `colunasTitulos`
  onEdit: PropTypes.func,
  onInativar: PropTypes.func,
  onDelete: PropTypes.func,
  funcExtra: PropTypes.func,
  renderLinha: PropTypes.func,
};

export default TabelaEdicao;
