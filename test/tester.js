var assert = require('assert');
var validator = require('../validator.js');

//"manual" tests
/*
describe('\"Deborah\" name tests', function() {
    this.timeout(100000);
    it('Deborah Egli & Deborah Egli',  function (done) {
        assert.equal(validator.countUniqueNames('Deborah','Egli','Deborah','Egli','Deborah Egli'),1);
        done();
    });

    it('Deborah Egli & Debbie Egli',  function (done) {
        assert.equal(validator.countUniqueNames('Deborah','Egli','Debbie','Egli','Debbie Egli'),1);
        done();
    });

    it('Deborah Egni & Debbie Egli (Typo)',  function (done) {
        assert.equal(validator.countUniqueNames('Deborah','Egni','Deborah','Egli','Deborah Egli') ,1);
        done();
    });

    it('Deborah S Egli & Debbie Egli (Shorted middle name)',  function (done) {
        assert.equal(validator.countUniqueNames('Deborah S','Egli','Deborah','Egli','Egli Deborah') ,1);
        done();
    });

    it('Michele Egli & Debbie Egli (two ids)',  function (done) {
        assert.equal(validator.countUniqueNames('Michele','Egli','Deborah','Egli','Michele Egli') ,2);
        done();
    });
});
*/

//random names tests
describe('15 Random name tests', function() {
    this.timeout(30000); //TODO improve name lookup.

    var input;

    for(var i = 0; i < 5; i++) {
        input = generateRandomTest(1);
        it('Random input with 1 identity \n ' + input.desc, function () {
            assert.equal(validator.countUniqueNames(input.bFn, input.bLn, input.sFn, input.sLn, input.bNoC), input.idNumber);
        });
    }

    for(var i = 0; i < 5; i++) {
        input = generateRandomTest(2);
        it('Random input with 2 identities \n ' + input.desc, function () {
            assert.equal(validator.countUniqueNames(input.bFn, input.bLn, input.sFn, input.sLn, input.bNoC), input.idNumber);
        });
    }

    for(var i = 0; i < 5; i++) {
        input = generateRandomTest(3);
        it('Random input with 3 identities \n ' + input.desc, function () {
            assert.equal(validator.countUniqueNames(input.bFn, input.bLn, input.sFn, input.sLn, input.bNoC), input.idNumber);
        });
    }
});

function generateRandomTest(idNumber){
    //read data
    var aliasesCSV = 'aliases.csv';
    var lastNamesCSV = 'last_names.csv';

    //read names fro the CSVs. fam stands for "first and middle" (names)
    var fs = require('fs');
    var famLines = fs.readFileSync(aliasesCSV).toString().split('\n');
    var lastNames = fs.readFileSync(lastNamesCSV).toString().split('\r');

    //remove control characters (like \r)
    for(var i = 0; i < famLines.length; i++) {
        famLines[i] = famLines[i].substr(0,famLines[i].length - 1);
    }

    //build identities.
    var fn1, fn2, fn3, ln1, ln2, ln3;

    //choose first name
    var avaliableFams = famLines[randomize(0,famLines.length,true)].split(',');
    fn1 = avaliableFams[randomize(0,avaliableFams.length - 1,true)];

    if(idNumber > 1) {
        //generate distinct first name
        do {
            avaliableFams = famLines[randomize(0, famLines.length, true)].split(',');
            fn2 = avaliableFams[randomize(0, avaliableFams.length, true)];
        } while(areAliases(fn1,fn2,famLines));
    } else {
        //generate nickname
        fn2 = avaliableFams[randomize(0,avaliableFams.length,true)];
    }

    if(idNumber === 3) {
        do {
            avaliableFams = famLines[randomize(0, famLines.length, true)].split(',');
            fn3 = avaliableFams[randomize(0, avaliableFams.length, true)];
        } while (areAliases(fn1, fn3, famLines));
    } else {
        fn3 = avaliableFams[randomize(0,avaliableFams.length,true)];
    }

    //choose last name
    ln1 = lastNames[randomize(0,lastNames.length,true)];

    //generate distinct last name
    if(idNumber > 1) {
        do {
            ln2 = lastNames[randomize(0,lastNames.length,true)];
        } while(ln1 === ln2);
    } else { //use the same last name
        ln2 = ln1;
    }

    if(idNumber === 3) {
        do {
            ln3 = lastNames[randomize(0,lastNames.length,true)];
        } while(ln1 === ln3);
    } else {
        ln3 = ln2;
    }

    return {
        bFn: fn1,
        bLn: ln1,
        sFn: fn2,
        sLn: ln2,
        bNoC: fn3 + " " + ln3,
        desc: "-> " + fn1 + " " + ln1 + "\n -> " + fn2 + " " + ln2 + "\n -> " + fn3 + " " + ln3,
        idNumber: idNumber
    }
}

//determines if name is an alias of the other
function areAliases(name1, name2, names) {
    var name1nicks = getAllAliases(name1,names);
    return name1nicks.indexOf(name2) > - 1
}

//generate all aliases of a name
function getAllAliases(name, nameLines) {
    var allNicknames = [];

    //go over the lines we got from the csv
    for(var i = 0; i < nameLines.length; i++) {
        if (nameLines[i].indexOf(name) > -1) {
            //append them to the allNicknames variable if they match
            var nicks = nameLines[i].split(',');
            for(var k = 0; k < nicks.length; k++) {
                allNicknames.push(nicks[k]);
            }
        }
    }

    return allNicknames;
}

//pseudo random number generator
function randomize(inclusiveMin, exclusiveMax, round) {
    if(!round)
        return Math.random() * (exclusiveMax - inclusiveMin) + inclusiveMin;
    //not normal distribution but close enough
    return (Math.round(Math.random() * (exclusiveMax - inclusiveMin) + inclusiveMin));
}
