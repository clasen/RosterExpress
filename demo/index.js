const Roster = require('../index.js');

const roster = new Roster({
    maintainerEmail: 'admin@example.com',
});

roster.start();