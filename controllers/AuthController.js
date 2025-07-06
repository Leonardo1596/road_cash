const User = require('../models/UserSchema');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const CostPerKm = require('../models/CostPerKmSchema');
const CostPerkmController = require('../controllers/CostPerKmController');

const register = async (req, res, next) => {
    try {
        // Hash da senha
        const hashedPass = await bcrypt.hash(req.body.password, 10);

        // Criação do novo usuário
        let user = new User({
            email: req.body.email,
            password: hashedPass,
            confirmPassword: req.body.confirmPassword,
        });

        // Verificar se o e-mail já existe
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            console.log('Email already exists');
            return res.json({ message: 'Email already exists' });
        }

        // Save user
        const savedUser = await user.save();

        // Create token
        const accessToken = jwt.sign({ _id: savedUser._id, email: savedUser.email }, process.env.JWT_KEY, {
            expiresIn: '3600s'
        });

        // Create cost per km
        const costPerKmData = {
            userId: user._id,
            oleo: {
                km: 0,
                value: 0
            },
            relacao: {
                km: 0,
                value: 0
            },
            pneuDianteiro: {
                km: 0,
                value: 0
            },
            pneuTraseiro: {
                km: 0,
                value: 0
            },
            gasolina: {
                km: 0,
                value: 0
            }
        };
        const costPerKm = await CostPerkmController.createCostPerKm(costPerKmData);

        console.log('Successfully registered');
        console.log(savedUser);

        res.status(201).json({ token: accessToken, user: savedUser, message: 'Successfully registered' });
    } catch (error) {
        console.log(error);
        res.json({ message: 'An error occurred' });
    }
};

const login = (req, res, next) => {
    User.findOne({ email: req.body.email })
        .then(async user => {
            if (user) {
                bcrypt.compare(req.body.password, user.password, async (err, result) => {
                    1
                    if (err) {
                        res.json({ error: err });
                    }
                    if (result) {
                        // Create token
                        const accessToken = jwt.sign({ _id: user._id, email: user.email }, process.env.JWT_KEY, {
                            expiresIn: '3600s'
                        });

                        // Save user info




                        let userInfo = {
                            _id: user._id,
                            email: user.email,
                        };
                        console.log(user);

                        // Successfully
                        console.log(`User: ${user.email} is signed`)

                        res.json({ token: accessToken, user: userInfo, message: 'Logado com sucesso' });
                        next();
                    } else {
                        res.json({ message: 'A senha está incorreta' });
                    }
                });
            } else {
                console.log('user not found');
                res.json({ message: 'Usuário não encontrado' });
            }
        });
};

const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const {
            email,
            username,
            totalCostPerKm,
        } = req.body;

        // Get existing user
        const existingUser = await User.findOne({ _id: userId });

        if (!existingUser) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        };

        const updatedUser = await User.findOneAndUpdate(
            { _id: userId },
            { email: email, username: username, totalCostPerKm: totalCostPerKm },
            { new: true }
        );

        res.json(updatedUser);

    } catch (error) {
        console.error('Ocorreu um erro ao atualizar o usuário: ', error);
        res.status(500).json({ error: 'Ocorreu um erro ao atualizar o usuário' });
    }
};

const getUser = async (req, res) => {

    User.findOne({ _id: req.params.userId })
        .then(async user => {
            const goals = await Goal.find({ userId: user._id });
            const costPerKm = await CostPerKm.find({ userId: user._id });
            const entries = await Entrie.find({ userId: user._id });
            const personalExpense = await PersonalExpense.find({ userId: user._id });
            const firstLoginOfWeek = isFirstLoginOfWeek(user.lastLogin);

            function totalCalculateCostPerKm() {
                const oleo = costPerKm[0].oleo.km !== 0 ? Number((costPerKm[0].oleo.value / costPerKm[0].oleo.km).toFixed(4)) : 0;
                const relacao = costPerKm[0].relacao.km !== 0 ? Number((costPerKm[0].relacao.value / costPerKm[0].relacao.km).toFixed(4)) : 0;
                const pneuDianteiro = costPerKm[0].pneuDianteiro.km !== 0 ? Number((costPerKm[0].pneuDianteiro.value / costPerKm[0].pneuDianteiro.km).toFixed(4)) : 0;
                const pneuTraseiro = costPerKm[0].pneuTraseiro.km !== 0 ? Number((costPerKm[0].pneuTraseiro.value / costPerKm[0].pneuTraseiro.km).toFixed(4)) : 0;
                const gasolina = costPerKm[0].gasolina.km !== 0 ? Number((costPerKm[0].gasolina.value / costPerKm[0].gasolina.km).toFixed(4)) : 0;

                const costPerKmData = {
                    oleo,
                    relacao,
                    pneuDianteiro,
                    pneuTraseiro,
                    gasolina
                };

                // Calculate costPerKm total
                function calculateCostPerKmTotal(obj) {
                    const fields = ['oleo', 'relacao', 'pneuDianteiro', 'pneuTraseiro', 'gasolina'];
                    let total = 0;

                    fields.forEach(field => {
                        if (obj[field] !== undefined) {
                            total += obj[field];
                        }
                    });

                    return total;
                };

                totalCostPerKm = calculateCostPerKmTotal(costPerKmData);
            };
            totalCalculateCostPerKm();

            let userInfo = {
                _id: user._id,
                email: user.email,
                username: user.username,
                goals: goals,
                costPerKm: costPerKm,
                totalCostPerKm: totalCostPerKm,
                entries: entries,
                personalExpense: personalExpense,
                lastLogin: user.lastLogin,
                firstLoginOfWeek
            }

            res.json(userInfo);
        })
};


module.exports = {
    register, login, updateUser, getUser
}