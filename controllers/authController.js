const UserModel = require('../models/userModel');
const bcrypt = require('bcrypt');

exports.renderLogin = (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('login', { title: 'Admin Login', error: null });
};

exports.login = (req, res) => {
    const { username, password } = req.body;

    UserModel.findByUsername(username, (err, user) => {
        if (err || !user) {
            return res.render('login', { title: 'Admin Login', error: 'Sai tài khoản hoặc mật khẩu' });
        }

        bcrypt.compare(password, user.password_hash, (err, match) => {
            if (match) {
                req.session.user = { id: user.id, username: user.username };
                res.redirect('/');
            } else {
                res.render('login', { title: 'Admin Login', error: 'Sai tài khoản hoặc mật khẩu' });
            }
        });
    });
};

exports.logout = (req, res) => {
    req.session.destroy();
    res.redirect('/login');
};
