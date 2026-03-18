const db = require('../config/db');
const { validarCPF } = require('./functions');

const nomesMasculinos = [
        'Jack Nicholson', 'Robert De Niro', 'Al Pacino', 'Marlon Brando', 'Tom Hanks',
        'Denzel Washington', 'Leonardo DiCaprio', 'Brad Pitt', 'Johnny Depp', 'Morgan Freeman',
        'Anthony Hopkins', 'Samuel L. Jackson', 'Harrison Ford', 'Clint Eastwood', 'Paul Newman',
        'James Dean', 'Heath Ledger', 'Christian Bale', 'Matthew McConaughey', 'Russell Crowe',
        'Sean Penn', 'Kevin Spacey', 'Edward Norton', 'Joaquin Phoenix', 'Daniel Day-Lewis',
        'Michael Caine', 'Gary Oldman', 'Robin Williams', 'Tom Cruise', 'Will Smith',
        'Ryan Gosling', 'Jake Gyllenhaal', 'Mark Ruffalo', 'Ben Affleck', 'Matt Damon',
        'George Clooney', 'Steve McQueen', 'Gregory Peck', 'Charlton Heston', 'Gene Hackman',
        'Robert Redford', 'Kirk Douglas',
        'Mel Gibson', 'Liam Neeson', 'Ewan McGregor', 'Colin Firth', 'Hugh Jackman',
        'Chris Hemsworth', 'Chris Evans', 'Mark Wahlberg', 'Don Cheadle', 'Forest Whitaker',
        'Jeff Bridges', 'John Travolta', 'Nicolas Cage', 'Keanu Reeves', 'Patrick Swayze',
        'Vin Diesel', 'Jason Statham', 'Sylvester Stallone', 'Arnold Schwarzenegger', 'Jean-Claude Van Damme',
        'Bruce Willis', 'Michael Douglas', 'Kevin Costner', 'Sean Connery', 'Pierce Brosnan',
        'Daniel Craig', 'Jude Law', 'Orlando Bloom', 'Ian McKellen', 'Patrick Stewart',
        'Tom Hardy', 'Cillian Murphy', 'Benedict Cumberbatch', 'Martin Freeman', 'Andrew Garfield',
        'Tobey Maguire', 'Robert Pattinson', 'Zac Efron', 'Channing Tatum', 'Chris Pratt',
        'Paul Rudd', 'Jeremy Renner', 'Josh Brolin', 'Oscar Isaac', 'Pedro Pascal',
        'Gael García Bernal', 'Diego Luna', 'Wagner Moura', 'Rodrigo Santoro', 'Selton Mello',
        'Lázaro Ramos', 'Tony Ramos', 'Antônio Fagundes', 'Marco Nanini', 'Matheus Nachtergaele',
        'Caio Blat', 'Murilo Benício', 'Reynaldo Gianecchini', 'Thiago Lacerda', 'Chico Diaz', 'Pelé', 'Diego Maradona', 'Lionel Messi', 'Cristiano Ronaldo', 'Neymar',
        'Ronaldinho Gaúcho', 'Ronaldo Fenômeno', 'Romário', 'Zico', 'Garrincha',
        'Kaká', 'Rivaldo', 'Cafu', 'Roberto Carlos', 'Dunga',
        'Sócrates', 'Falcão', 'Tostão', 'Jairzinho', 'Carlos Alberto Torres',
        'Paolo Maldini', 'Franco Baresi', 'Andrea Pirlo', 'Francesco Totti', 'Roberto Baggio',
        'Alessandro Del Piero', 'Gianluigi Buffon', 'Fabio Cannavaro', 'Marco van Basten', 'Ruud Gullit',
        'Frank Rijkaard', 'Dennis Bergkamp', 'Johan Cruyff', 'Arjen Robben', 'Wesley Sneijder',
        'Clarence Seedorf', 'Patrick Kluivert', 'George Best', 'Ryan Giggs', 'Paul Scholes',
        'David Beckham', 'Wayne Rooney', 'Steven Gerrard', 'Frank Lampard', 'John Terry',
        'Alan Shearer', 'Michael Owen', 'Harry Kane', 'Raheem Sterling', 'Marcus Rashford',
        'Kenny Dalglish', 'Luis Suárez', 'Edinson Cavani', 'Diego Forlán', 'Álvaro Recoba',
        'Enzo Francescoli', 'Daniel Passarella', 'Gabriel Batistuta', 'Juan Román Riquelme', 'Javier Zanetti',
        'Carlos Tévez', 'Sergio Agüero', 'Ángel Di María', 'Lautaro Martínez', 'Paulo Dybala',
        'Kylian Mbappé', 'Antoine Griezmann', 'Karim Benzema', 'Zinedine Zidane', 'Thierry Henry',
        'Patrick Vieira', 'Claude Makélélé', 'Didier Deschamps', 'Michel Platini', 'David Trezeguet',
        'Oliver Kahn', 'Manuel Neuer', 'Philipp Lahm', 'Bastian Schweinsteiger', 'Miroslav Klose',
        'Lothar Matthäus', 'Franz Beckenbauer', 'Thomas Müller', 'Toni Kroos', 'Mesut Özil',
        'Robert Lewandowski', 'Andriy Shevchenko', 'Hristo Stoichkov', 'Dimitar Berbatov', 'Luka Modrić',
        'Ivan Rakitić', 'Davor Šuker', 'Goran Ivanišević', 'Peter Schmeichel', 'Michael Laudrup',
        'Brian Laudrup', 'Henrik Larsson', 'Zlatan Ibrahimović', 'Erling Haaland', 'Martin Ødegaard',
        'George Weah', 'Samuel Eto’o', 'Didier Drogba', 'Yaya Touré', 'Jay-Jay Okocha', 'Erling Haaland', 'Phil Foden', 'Bukayo Saka', 'Declan Rice', 'Martin Ødegaard',
        'Mohamed Salah', 'Virgil van Dijk', 'Darwin Núñez', 'Luis Díaz', 'Trent Alexander-Arnold',
        'Kevin De Bruyne', 'Rodri', 'Bernardo Silva', 'Jack Grealish', 'Rúben Dias',
        'Marcus Rashford', 'Bruno Fernandes', 'Casemiro', 'Lisandro Martínez', 'André Onana',
        'Cole Palmer', 'Raheem Sterling', 'Enzo Fernández', 'Reece James', 'Christopher Nkunku',
        'Alexander Isak', 'Sandro Tonali', 'Kieran Trippier', 'Bruno Guimarães', 'Nick Pope',
        'James Maddison', 'Son Heung-min', 'Richarlison', 'Cristian Romero', 'Pedro Porro',
        'Dominic Solanke', 'Antoine Semenyo', 'Joško Gvardiol', 'Jeremy Doku', 'Victor Osimhen', 'Khvicha Kvaratskhelia', 'Giovanni Di Lorenzo', 'Stanislav Lobotka', 'Piotr Zieliński',
        'Lautaro Martínez', 'Nicolò Barella', 'Hakan Çalhanoğlu', 'Marcus Thuram', 'Federico Dimarco',
        'Paulo Dybala', 'Romelu Lukaku', 'Tammy Abraham', 'Lorenzo Pellegrini', 'Bryan Cristante',
        'Federico Chiesa', 'Dušan Vlahović', 'Adrien Rabiot', 'Manuel Locatelli', 'Danilo',
        'Olivier Giroud', 'Rafael Leão', 'Theo Hernández', 'Christian Pulisic', 'Mike Maignan',
        'Ciro Immobile', 'Mattia Zaccagni', 'Luis Alberto', 'Sergej Milinković-Savić', 'Kylian Mbappé', 'Vitinha', 'Achraf Hakimi', 'Marquinhos', 'Gianluigi Donnarumma',
        'Ousmane Dembélé', 'Randal Kolo Muani', 'Warren Zaïre-Emery', 'Bradley Barcola', 'Nuno Mendes', 'Harry Kane', 'Jamal Musiala', 'Thomas Müller', 'Joshua Kimmich', 'Leon Goretzka',
        'Michael Olise', 'Serge Gnabry', 'Kingsley Coman', 'Manuel Neuer', 'Dayot Upamecano',
        'Florian Wirtz', 'Victor Boniface', 'Jeremie Frimpong', 'Granit Xhaka', 'Jonathan Tah',
        'Julian Brandt', 'Niclas Füllkrug', 'Karim Adeyemi', 'Emre Can', 'Gregor Kobel', 'Lamine Yamal', 'Pedri', 'Gavi', 'Ferran Torres', 'Robert Lewandowski',
        'Vinícius Júnior', 'Rodrygo', 'Jude Bellingham', 'Federico Valverde', 'Aurélien Tchouaméni',
        'Eduardo Camavinga', 'Antonio Rüdiger', 'Thibaut Courtois', 'David Alaba', 'Éder Militão',
        'Antoine Griezmann', 'Álvaro Morata', 'João Félix', 'Koke', 'Jan Oblak',
        'Mikel Oyarzabal', 'Takefusa Kubo', 'Brais Méndez', 'Alejandro Balde', 'Ansu Fati'
];

const nomesFemininos = [
    'Meryl Streep', 'Julia Roberts', 'Nicole Kidman', 'Cate Blanchett', 'Charlize Theron',
    'Angelina Jolie', 'Scarlett Johansson', 'Natalie Portman', 'Anne Hathaway', 'Sandra Bullock',
    'Halle Berry', 'Jennifer Lawrence', 'Emma Stone', 'Amy Adams', 'Jessica Chastain',
    'Viola Davis', 'Octavia Spencer', 'Glenn Close', 'Helen Mirren', 'Judi Dench',
    'Maggie Smith', 'Kate Winslet', 'Rachel Weisz', 'Keira Knightley', 'Emily Blunt',
    'Salma Hayek', 'Penélope Cruz', 'Sofía Vergara', 'Eva Mendes', 'Cameron Diaz',
    'Drew Barrymore', 'Reese Witherspoon', 'Renée Zellweger', 'Kirsten Dunst', 'Dakota Fanning',
    'Elle Fanning', 'Florence Pugh', 'Zendaya', 'Millie Bobby Brown', 'Anya Taylor-Joy',
    'Margot Robbie', 'Gal Gadot', 'Kristen Stewart', 'Lupita Nyong’o', 'Tilda Swinton',
    'Michelle Pfeiffer', 'Sharon Stone', 'Winona Ryder', 'Uma Thurman', 'Sigourney Weaver',
    'Jodie Foster', 'Susan Sarandon', 'Diane Keaton', 'Jane Fonda', 'Sally Field',
    'Marion Cotillard', 'Audrey Tautou', 'Monica Bellucci', 'Sophia Loren', 'Brigitte Bardot',
    'Greta Garbo', 'Ingrid Bergman', 'Elizabeth Taylor', 'Marilyn Monroe', 'Grace Kelly',
    'Natalie Wood', 'Debbie Reynolds', 'Shirley MacLaine', 'Barbara Streisand', 'Goldie Hawn',
    'Jessica Lange', 'Laura Dern', 'Frances McDormand', 'Melissa McCarthy', 'Toni Collette',
    'Rachel McAdams', 'Amanda Seyfried', 'Mila Kunis', 'Olivia Wilde', 'Jennifer Aniston',
    'Courteney Cox', 'Lisa Kudrow', 'Kaley Cuoco', 'Sophie Turner', 'Maisie Williams',
    'Emilia Clarke', 'Lena Headey', 'Michelle Yeoh', 'Lucy Liu', 'Zhang Ziyi',
    'Gong Li', 'Fan Bingbing', 'Aishwarya Rai', 'Priyanka Chopra', 'Deepika Padukone',
    'Taís Araújo', 'Camila Pitanga', 'Débora Falabella', 'Marjorie Estiano', 'Fernanda Montenegro',
    'Glória Pires', 'Adriana Esteves', 'Cláudia Abreu', 'Paolla Oliveira', 'Giovanna Antonelli',
    'Isis Valverde', 'Grazi Massafera', 'Carolina Dieckmann', 'Letícia Sabatella', 'Sônia Braga', 'Simone Biles', 'Rebeca Andrade', 'Daiane dos Santos', 'Nadia Comăneci', 'Ivete Sangalo', 'Claudia Leitte', 'Anitta', 'Ludmilla', 'Iza',
    'Marisa Monte', 'Gal Costa', 'Maria Bethânia', 'Elis Regina', 'Simone',
    'Vanessa da Mata', 'Sandy', 'Paula Fernandes', 'Roberta Miranda', 'Oprah Winfrey', 'Ellen DeGeneres', 'Ana Maria Braga', 'Fátima Bernardes', 'Xuxa Meneghel',
    'Hebe Camargo', 'Luciana Gimenez', 'Sabrina Sato', 'Fernanda Lima', 'Angélica',
    'Marília Gabriela', 'Regina Casé', 'Glenda Kozlowski', 'Chris Flores', 'Patrícia Poeta', 'Gisele Bündchen', 'Adriana Lima', 'Alessandra Ambrosio', 'Izabel Goulart', 'Laís Ribeiro',
    'Kendall Jenner', 'Gigi Hadid', 'Bella Hadid', 'Cara Delevingne', 'Karlie Kloss',
    'Cindy Crawford', 'Naomi Campbell', 'Claudia Schiffer', 'Tyra Banks', 'Heidi Klum'
];

const nomesFallbackMasculinos = [
    'Alex', 'Bruno', 'Caio', 'Davi', 'Enzo', 'Felipe', 'Gustavo', 'Heitor', 'Igor', 'Joao',
    'Kaique', 'Leandro', 'Murilo', 'Nathan', 'Otavio', 'Pietro', 'Ruan', 'Tiago', 'Vitor', 'Yuri'
];

const nomesFallbackFemininos = [
    'Aline', 'Bianca', 'Camila', 'Debora', 'Elisa', 'Fernanda', 'Giovana', 'Helena', 'Isabela', 'Julia',
    'Karen', 'Larissa', 'Marina', 'Natalia', 'Olivia', 'Patricia', 'Renata', 'Sabrina', 'Tatiane', 'Viviane'
];

const sobrenomesFallback = [
    'Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Ferreira', 'Almeida', 'Costa', 'Gomes',
    'Ribeiro', 'Carvalho', 'Rocha', 'Martins', 'Barbosa', 'Melo', 'Araujo', 'Campos', 'Rezende', 'Nogueira'
];

function gerarNomeFallback(sexo, indice) {
    const primeiroNomeLista = sexo === 'F' ? nomesFallbackFemininos : nomesFallbackMasculinos;
    const primeiroNome = primeiroNomeLista[indice % primeiroNomeLista.length];
    const sobrenome = sobrenomesFallback[Math.floor(indice / primeiroNomeLista.length) % sobrenomesFallback.length];
    const serie = Math.floor(indice / (primeiroNomeLista.length * sobrenomesFallback.length)) + 1;

    return serie === 1
        ? `${primeiroNome} ${sobrenome}`
        : `${primeiroNome} ${sobrenome} ${serie}`;
}

function calcularDigitoCpf(base, pesoInicial) {
    let soma = 0;

    for (let indice = 0; indice < base.length; indice += 1) {
        soma += Number(base[indice]) * (pesoInicial - indice);
    }

    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
}

function gerarCpfValido(baseNumerica) {
    const base = String(baseNumerica).padStart(9, '0');
    const primeiroDigito = calcularDigitoCpf(base, 10);
    const segundoDigito = calcularDigitoCpf(`${base}${primeiroDigito}`, 11);
    return `${base}${primeiroDigito}${segundoDigito}`;
}

function criarGeradorCpf() {
    const usados = new Set();
    let base = 100000000;

    return () => {
        while (base <= 999999999) {
            const cpf = gerarCpfValido(base);
            base += 1;

            if (usados.has(cpf) || !validarCPF(cpf)) {
                continue;
            }

            usados.add(cpf);
            return cpf;
        }

        throw new Error('Nao foi possivel gerar CPFs validos suficientes.');
    };
}

function gerarNomePessoa(sexo, indice) {
    const lista = sexo === 'F' ? nomesFemininos : nomesMasculinos;

    if (indice < lista.length) {
        return lista[indice];
    }

    return gerarNomeFallback(sexo, indice - lista.length);
}

function gerarCelularFake(indice) {
    return `119${String(10000000 + indice).slice(-8)}`;
}

function gerarEmailFake(id) {
    return `usuario${id}@demo.lpn`;
}

function mascararCpf(cpf) {
    const numeros = String(cpf || '').replace(/\D/g, '');
    if (!numeros) {
        return '-';
    }

    return `${numeros.slice(0, 3)}***${numeros.slice(-2)}`;
}

function montarPreview(originais, anonimizados, tipo) {
    return originais.slice(0, 5).map((original, indice) => ({
        tipo,
        id: original.id,
        antes: original.nome,
        depois: anonimizados[indice].nome,
        cpfAntes: mascararCpf(original.cpf),
        cpfDepois: mascararCpf(anonimizados[indice].cpf)
    }));
}

function prepararAnonimizacao(nadadores, usuarios) {
    const proximoCpf = criarGeradorCpf();
    let indiceAtivosNadadores = 0;
    let indiceAtivosUsuarios = 0;
    let indiceInativos = 0;

    const nadadoresAnonimizados = nadadores.map((nadador, indice) => {
        const estaAtivo = Number(nadador.ativo) === 1;

        return {
            id: nadador.id,
            nome: estaAtivo
                ? gerarNomePessoa(nadador.sexo, indiceAtivosNadadores++)
                : `Inativo ${++indiceInativos}`,
            cpf: proximoCpf(),
            celular: gerarCelularFake(indice + 1)
        };
    });

    const usuariosAnonimizados = usuarios.map((usuario, indice) => {
        if (Number(usuario.protegido) === 1) {
            return {
                id: usuario.id,
                nome: usuario.nome,
                cpf: usuario.cpf,
                celular: usuario.celular,
                email: usuario.email
            };
        }

        const estaAtivo = Number(usuario.ativo) === 1;

        return {
            id: usuario.id,
            nome: estaAtivo
                ? gerarNomePessoa(indiceAtivosUsuarios % 2 === 0 ? 'M' : 'F', indiceAtivosUsuarios++)
                : `Inativo ${++indiceInativos}`,
            cpf: proximoCpf(),
            celular: gerarCelularFake(indice + nadadores.length + 1),
            email: gerarEmailFake(usuario.id)
        };
    });

    return { nadadoresAnonimizados, usuariosAnonimizados };
}

async function carregarDados(connection) {
    const [nadadores] = await connection.query(
        'SELECT id, nome, cpf, celular, sexo, ativo FROM nadadores ORDER BY id ASC'
    );
    const [usuarios] = await connection.query(
        `SELECT
            u.id,
            u.nome,
            u.cpf,
            u.celular,
            u.email,
            u.ativo,
            EXISTS (
                SELECT 1
                FROM usuarios_perfis up
                INNER JOIN perfis p ON p.id = up.perfis_id
                WHERE up.usuarios_id = u.id
                  AND p.nome IN ('master', 'admin')
            ) AS protegido
         FROM usuarios u
         ORDER BY u.id ASC`
    );

    return { nadadores, usuarios };
}

async function aplicarAtualizacoes(connection, nadadoresAnonimizados, usuariosAnonimizados) {
    for (const nadador of nadadoresAnonimizados) {
        await connection.query(
            'UPDATE nadadores SET nome = ?, cpf = ?, celular = ? WHERE id = ?',
            [nadador.nome, nadador.cpf, nadador.celular, nadador.id]
        );
    }

    for (const usuario of usuariosAnonimizados) {
        await connection.query(
            'UPDATE usuarios SET nome = ?, cpf = ?, celular = ?, email = ? WHERE id = ?',
            [usuario.nome, usuario.cpf, usuario.celular, usuario.email, usuario.id]
        );
    }
}

async function anonimizarBaseDev({ apply = false } = {}) {
    const connection = await db.getConnection();

    try {
        const { nadadores, usuarios } = await carregarDados(connection);
        const { nadadoresAnonimizados, usuariosAnonimizados } = prepararAnonimizacao(nadadores, usuarios);

        const resumo = {
            modo: apply ? 'apply' : 'preview',
            nadadores: nadadores.length,
            usuarios: usuarios.length,
            preview: [
                ...montarPreview(nadadores, nadadoresAnonimizados, 'nadadores'),
                ...montarPreview(usuarios, usuariosAnonimizados, 'usuarios')
            ],
            aviso: 'Relatorios e arquivos ja gerados em uploads podem continuar com dados antigos.'
        };

        if (!apply) {
            return resumo;
        }

        await connection.beginTransaction();
        await aplicarAtualizacoes(connection, nadadoresAnonimizados, usuariosAnonimizados);
        await connection.commit();

        return resumo;
    } catch (error) {
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error('Erro ao desfazer anonimização:', rollbackError);
        }
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = {
    anonimizarBaseDev
};