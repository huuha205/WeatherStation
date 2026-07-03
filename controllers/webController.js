exports.renderDashboard = (req, res) => {
    res.render('dashboard', { title: 'Dashboard', user: req.session.user });
};

exports.renderHistory = (req, res) => {
    res.render('history', { title: 'History', user: req.session.user });
};

exports.renderAiInsight = (req, res) => {
    res.render('ai-insight', { title: 'AI Insight', user: req.session.user });
};
