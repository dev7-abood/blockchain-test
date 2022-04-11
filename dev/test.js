const Blockchain = require('./blockchain');

const bitcoin = new Blockchain();
bitcoin.CreateNewBlock(22552, 'SDASDASDAASDASDQWFDFADDDDDD', 'SDASDASDAASDASDQWFDFAFDFDFF')
bitcoin.CreateNewBlock(81515, 'SDASDASDFDFSDFAASDASDQWFDFA', 'SDASDASDAASDASDQWFDFADDDDDD')
bitcoin.CreateNewBlock(56020, 'dasd1ASDA5SDFSD4DA4SD5A4SD6A5SDAS', 'SDASDASDFDFSDFAASDASDQWFDFA')

console.log(bitcoin)