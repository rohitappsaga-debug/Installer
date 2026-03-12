export const COMMON_PASSWORDS = [
    '', 'postgres', 'admin', 'root', 'password', '123456', '12345678', '1234', '12345', 'qwerty',
    'admin123', 'root123', 'postgres123', 'mysql', 'sql', 'dbadmin', 'database', 'system', 'sysadmin',
    // ... appending 1000+ generated combinations
    ...['postgres', 'admin', 'root', 'password', 'database', 'dbadmin', 'manager', 'system', 'server', 'developer',
        'dev', 'test', 'demo', 'office', 'company', 'service', 'support', 'backup', 'restore', 'monitor',
        'superadmin', 'superuser', 'login', 'access', 'connect', 'user', 'member', 'staff', 'webadmin', 'webmaster',
        'qwe', 'asd', 'zxc', 'db', 'data', 'store', 'app', 'web', 'site', 'portal', 'master'
    ].flatMap(base => [
        base,
        `${base}1`, `${base}12`, `${base}123`, `${base}1234`, `${base}12345`, `${base}123456`,
        `${base}2020`, `${base}2021`, `${base}2022`, `${base}2023`, `${base}2024`, `${base}2025`, `${base}2026`,
        `${base}@123`, `${base}@1234`, `${base}!123`, `${base}!1234`, `${base}#123`, `${base}_db`, `${base}admin`,
        `${base}root`, `${base}pass`, `${base}01`, `${base}11`, `${base}99`, `123${base}`, `admin${base}`,
        base.toUpperCase(), base.charAt(0).toUpperCase() + base.slice(1),
        base.charAt(0).toUpperCase() + base.slice(1) + '123',
        base.charAt(0).toUpperCase() + base.slice(1) + '@123',
        base.charAt(0).toUpperCase() + base.slice(1) + '!123',
        base + base,
        base + '!', base + '@',
        base + '1!', base + '123!'
    ]),
    // Specific well-known DB default passwords
    'toor', 'manager', 'changeit', 'changeme', 'oracle', 'sys', 'sa', 'informix', 'db2admin', 'sybase', 'enterprisedb'
];