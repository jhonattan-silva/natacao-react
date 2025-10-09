/**
 * Valida se uma data é válida e não está no futuro.
 * @param {string} data - Data no formato YYYY-MM-DD.
 * @returns {boolean} - Retorna `true` se a data for válida e não estiver no futuro.
 */
function validarDataNaoFutura(data) {
    const hoje = new Date();
    const dataVerificada = new Date(data);
    return dataVerificada instanceof Date && !isNaN(dataVerificada) && dataVerificada <= hoje;
}

/**
 * Valida se um CPF é válido.
 * @param {string} cpf - CPF no formato numérico.
 * @returns {boolean} - Retorna `true` se o CPF for válido.
 */
function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, ''); // Remove caracteres não numéricos
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

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

/**
 * Remove caracteres não numéricos de uma string.
 * @param {string} str - String a ser processada.
 * @returns {string} - String contendo apenas números.
 */
function somenteNumeros(str) {
    return str.replace(/\D/g, '');
}

/**
 * Valida se uma data é válida (considera meses e dias).
 * @param {string} data - Data no formato YYYY-MM-DD.
 * @returns {boolean} - Retorna `true` se a data for válida.
 */
function validarData(data) {
    const [ano, mes, dia] = data.split('-').map(Number);
    const dataVerificada = new Date(ano, mes - 1, dia); // Meses começam em 0 no JavaScript
    return (
        dataVerificada.getFullYear() === ano &&
        dataVerificada.getMonth() === mes - 1 &&
        dataVerificada.getDate() === dia
    );
}

/**
 * Valida se um número de celular é válido.
 * @param {string} celular - Número de celular no formato numérico.
 * @returns {boolean} - Retorna `true` se o número for válido.
 */
function validarCelular(celular) {
    return celular.length === 10 || celular.length === 11; // Aceita números com 10 ou 11 dígitos
}

module.exports = {
    validarDataNaoFutura,
    validarCPF,
    somenteNumeros,
    validarData,
    validarCelular,
};
