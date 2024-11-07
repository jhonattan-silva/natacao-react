import React from 'react';
import LinhaInscricao from '../LinhaInscricao/LinhaInscricao';

const TabelaInscricao = ({ nadadores, provas, selecoes, onCheckboxChange }) => {
    if (!Array.isArray(provas) || !Array.isArray(nadadores)) {
        console.error("Provas ou nadadores não são arrays válidos.");
        return null;
    }

    // Agrupa as provas por sexo
    const provasMasculino = provas.filter(prova => prova.sexo === 'M' || prova.sexo === 'O');
    const provasFeminino = provas.filter(prova => prova.sexo === 'F' || prova.sexo === 'O');

    // Filtra nadadores por sexo
    const nadadoresMasculino = nadadores.filter(nadador => nadador.sexo === 'M');
    const nadadoresFeminino = nadadores.filter(nadador => nadador.sexo === 'F');

    return (
        <div>
            {/* Seção Masculina */}
            {nadadoresMasculino.length > 0 && (
                <table>
                    <thead>
                        <tr>
                            <th>Nadadores (Masculino)</th>
                            {provasMasculino.map(prova => (
                                <th key={prova.id}>
                                    {`${prova.distancia}m ${prova.estilo} (${prova.tipo})`}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {nadadoresMasculino.map(nadador => {
                            const numProvasSelecionadas = Object.values(selecoes[nadador.id] || {}).filter(Boolean).length;

                            return (
                                <LinhaInscricao
                                    key={nadador.id}
                                    nadador={nadador}
                                    provas={provasMasculino}
                                    selecoes={selecoes[nadador.id] || {}}
                                    onCheckboxChange={onCheckboxChange}
                                    maxReached={numProvasSelecionadas >= 2}
                                />
                            );
                        })}
                    </tbody>
                </table>
            )}

            {/* Seção Feminina */}
            {nadadoresFeminino.length > 0 && (
                <table>
                    <thead>
                        <tr>
                            <th>Nadadores (Feminino)</th>
                            {provasFeminino.map(prova => (
                                <th key={prova.id}>
                                    {`${prova.distancia}m ${prova.estilo} (${prova.tipo})`}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {nadadoresFeminino.map(nadador => {
                            const numProvasSelecionadas = Object.values(selecoes[nadador.id] || {}).filter(Boolean).length;

                            return (
                                <LinhaInscricao
                                    key={nadador.id}
                                    nadador={nadador}
                                    provas={provasFeminino}
                                    selecoes={selecoes[nadador.id] || {}}
                                    onCheckboxChange={onCheckboxChange}
                                    maxReached={numProvasSelecionadas >= 2}
                                />
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default TabelaInscricao;
