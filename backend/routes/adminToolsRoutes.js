const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const { anonimizarBaseDev } = require('../servicos/anonymizacaoDev');

router.use(authMiddleware);
router.use(roleMiddleware(['master']));

router.post('/anonimizar-base-dev', async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: 'Operacao indisponivel em producao.' });
    }

    try {
        const apply = req.body?.apply === true;
        const resultado = await anonimizarBaseDev({ apply });
        res.json(resultado);
    } catch (error) {
        console.error('Erro ao anonimizar base de desenvolvimento:', error);
        res.status(500).json({ message: 'Erro ao anonimizar base de desenvolvimento.' });
    }
});

module.exports = router;