require('dotenv').config();

const { anonimizarBaseDev } = require('../servicos/anonymizacaoDev');
const db = require('../config/db');

async function main() {
    const apply = process.argv.includes('--apply');

    if (process.env.NODE_ENV === 'production') {
        console.error('Este script nao pode rodar em producao.');
        process.exit(1);
    }

    try {
        const resultado = await anonimizarBaseDev({ apply });
        console.log(`Modo: ${resultado.modo}`);
        console.log(`Nadadores: ${resultado.nadadores}`);
        console.log(`Usuarios: ${resultado.usuarios}`);
        console.table(resultado.preview);
        console.log(resultado.aviso);
    } catch (error) {
        console.error('Falha na anonimização:', error);
        process.exitCode = 1;
    } finally {
        await db.end();
    }
}

main();