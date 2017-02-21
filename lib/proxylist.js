import fs from 'fs';
import path from 'path';

const csv = fs.readFileSync(path.resolve(__dirname, '..', 'data', 'proxybonanza.csv'), { encoding: 'utf-8'});

const csvLineToUrl = (line) => {
    const [ip, port, user, pass] = line.split(';');
    return `http://${user}:${pass}@${ip}:${port}`;
};

export const getRandomProxy = () => {
    const proxies = csv.trim().split('\n').map((line) => csvLineToUrl(line));
    const randomIndex = Math.floor(Math.random()*proxies.length);
    return proxies[randomIndex];
};
