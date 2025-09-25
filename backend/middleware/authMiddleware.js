const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET; // Chave secreta para o JWT 

// Middleware para autenticação (se o usuário está logado)
const authMiddleware = (req, res, next) => { // Recebe a requisição, a resposta e a próxima função a ser chamada
    const authHeader = req.headers['authorization']; // Obtém o cabeçalho Authorization

    if (!authHeader) {
        return res.status(401).json({ message: 'Token não fornecido. Por favor, faça login novamente.' });
    }

    // Verifica se o token possui o prefixo "Bearer"
    const [prefix, token] = authHeader.split(' ');
    if (prefix !== 'Bearer' || !token) {
        return res.status(401).json({ message: 'Token malformado. Por favor, forneça um token válido.' });
    }

    try {
        // Verifica e decodifica o token
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Adiciona o payload decodificado ao objeto de requisição
        next(); // Permite que o fluxo continue
    } catch (err) {
        // Fornece mensagens mais específicas dependendo do erro
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado. Por favor, faça login novamente.' });
        } else if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido. Por favor, forneça um token válido.' });
        }
        return res.status(401).json({ message: 'Erro ao processar o token.' });
    }
};

// Middleware para verificar o nível de acesso (se o usuário tem permissão)
const roleMiddleware = (requiredRoles) => {
    return (req, res, next) => { // Recebe a requisição, a resposta e a próxima função a ser chamada
        const { perfis } = req.user; // Perfis vêm do token JWT 

        if (!perfis || !requiredRoles.some(role => perfis.includes(role))) { // Verifica se o usuário possui algum dos perfis exigidos
            return res.status(403).json({ message: 'Acesso negado' }); // Retorna 403 se o acesso não for permitido
        }
        next(); //senão, segue para a pagina desejada
    };
};

module.exports = { authMiddleware, roleMiddleware };
