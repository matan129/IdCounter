var assert = require('assert');
var validator = require('../validator.js');

//"manual" tests
describe('\"Deborah\" name tests', function() {
    it('Deborah Egli & Deborah Egli',  function () {
        assert.equal(validator.countUniqueNames("Deborah","Egli","Deborah","Egli","Deborah Egli"),1);
    });

    it('Deborah Egli & Debbie Egli',  function () {
        assert.equal(validator.countUniqueNames("Deborah","Egli","Debbie","Egli","Debbie Egli"),1);
    });

    it('Deborah Egni & Debbie Egli (Typo)',  function () {
        assert.equal(validator.countUniqueNames("Deborah","Egni","Deborah","Egli","Deborah Egli") ,1);
    });

    it('Deborah S Egli & Debbie Egli (Shorted middle name)',  function () {
        assert.equal(validator.countUniqueNames("Deborah S","Egli","Deborah","Egli","Egli Deborah") ,1);
    });

    it('Michele Egli & Debbie Egli (two ids)',  function () {
        assert.equal(validator.countUniqueNames("Michele","Egli","Deborah","Egli","Michele Egli") ,2);
    });
});


//random names tests
describe('100 Random name tests', function() {
    var input;

    for(var i = 0; i < 50; i++) {
        input = generateRandomTest(1);
        it('Random input with 1 identity \n ' + input.desc, function () {
            assert.equal(validator.countUniqueNames(input.bFn, input.bLn, input.sFn, input.sLn, input.bNoC), input.idNumber);
        });
    }

    for(var i = 0; i < 50; i++) {
        input = generateRandomTest(2);
        it('Random input with 2 two identities \n ' + input.desc, function () {
            assert.equal(validator.countUniqueNames(input.bFn, input.bLn, input.sFn, input.sLn, input.bNoC), input.idNumber);
        });
    }
});

function generateRandomTest(idNumber){
    //read data
    var firstAndMiddleCSV = "names.csv";
    var lastNamesCSV = "test\\lastNames.csv";

    //read names fro the CSVs. fam stands for "first and middle" (names)
    var fs = require('fs');
    var famLines = fs.readFileSync(firstAndMiddleCSV).toString().split('\n');
    var lastNames = fs.readFileSync(lastNamesCSV).toString().split('\r');

    //remove control characters (like \r)
    for(var i = 0; i < famLines.length; i++) {
        famLines[i] = famLines[i].substr(0,famLines[i].length - 1);
    }

    //build identities.
    var fn1, fn2, ln1, ln2;

    //choose first name
    var avaliableFams = famLines[randomize(0,famLines.length,true)].split(',');
    fn1 = avaliableFams[randomize(0,avaliableFams.length - 1,true)];

    //generate distinct first name
    if(idNumber === 2) {
        do {
            avaliableFams = famLines[randomize(0, famLines.length, true)].split(',');
            fn2 = avaliableFams[randomize(0, avaliableFams.length, true)];
        } while(/*typeof fn2 === 'undefined' ||*/ areAliases(fn1,fn2,famLines))
    } else { //generate nickname
        fn2 = avaliableFams[randomize(0,avaliableFams.length,true)];
    }

    //choose last name
    ln1 = lastNames[randomize(0,lastNames.length,true)];

    //generate distinct last name
    if(idNumber === 2) {
        do {
            ln2 = lastNames[randomize(0,lastNames.length,true)];
        } while(/*typeof ln2 === 'undefined' ||*/ ln1 === ln2)
    } else { //use the same last name
        ln2 = ln1;
    }

    return {
        bFn: fn1,
        bLn: ln1,
        sFn: fn2,
        sLn: ln2,
        bNoC: fn1 + " " + ln1,
        desc: "-> " + fn1 + " " + ln1 + "\n -> " + fn2 + " " + ln2,
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
                allNicknames[allNicknames.length] = nicks[k];
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