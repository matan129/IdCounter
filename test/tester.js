var assert = require('assert');
var validator = require('../validator.js');

describe('Random name test', function() {
    var input = generateRandomTest();
    it('Name ' + input.desc, function () {
        assert.equal(validator.countUniqueNames(input.bFn,input.bLn,input.sFn, input.sLn, input.bNoC),input.Ids);
    });
});

function generateRandomTest(){
    var firstAndMiddleCSV = "names.csv";
    var lastNamesCSV = "test\\lastNames.csv";

    //determine test configuration (one id, use middle name, ...)
    var randomMiddle = Math.random();
    var useMiddleName;
    if(randomMiddle > 0.5)
        useMiddleName = true;
    else
        useMiddleName = false;
    //
    var randShortMiddle = Math.random();
    var shortenMiddle;
    if(randShortMiddle > 0.5)
        shortenMiddle = true;
    else
        shortenMiddle = false;
    //
    var randIdNumber = Math.random();
    var IDs;
    if(randShortMiddle > 0.5)
        IDs = 2;
    else
        IDs = 1;
    //

    var fs = require('fs');
    //read names lines. fam stands for "first and middle" (names)
    var famLines = fs.readFileSync(firstAndMiddleCSV).toString().split('\n');
    var lastNames = fs.readFileSync(lastNamesCSV).toString().split('\n');

    //build identities.
    var ID1 = getRandomID(famLines,lastNames,useMiddleName,shortenMiddle);
    var ID2;

    if(IDs == 2) {
        ID2 = getRandomID(famLines,lastNames,useMiddleName,shortenMiddle);
    }
    else { //create ID that is the same like the first one (but with variations like nicknames and such)
        ID2 = getSimilarID(famLines,useMiddleName,shortenMiddle,ID1);
    }

    var test = {
        bFn: ID1.First + " " + ID1.MID,
        bLn: ID1.Last,
        sFn: ID2.First + " " + ID2.MID,
        sLn: ID2.Last,
        bNoC: ID1.First + " " + ID1.MID + " " + ID1.Last,
        desc: ID1.First + " " + ID1.MID + " " + ID1.Last + "|" + ID2.First + " " + ID2.MID + " " + ID2.Last,
        Ids: IDs
    };

    return test;
}

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

function getSimilarID(famLines, useMiddleName, shortenMiddle, ID1) {
    var nicknames = getAllAliases(ID1.FN,famLines);
    var famIndex = randomize(0,nicknames.length,true);
    var firstName = nicknames[famIndex];

    var middleName;
    if(useMiddleName) {
        if(shortenMiddle) { //first ID got it shorten, so this ID will "un-short" it
            middleName = ID1.MID + randomLetters(5); //we don't really need meaningful name here, so just randomize
        }
        else { //short it
            middleName = ID1.MID[0];
        }
    }

    var ID = {
        FN: firstName,
        MID: middleName,
        Last: ID1.Last
    };

    return ID;
}

function getRandomID(famLines,lastNames,useMiddleName,shortenMiddle){
    //choose first name
    var famIndex = randomize(0,famLines.length,true);
    var famLine = famLines[famIndex];

    var avaliableFams = famLine.split(',');
    var famNameIndex = randomize(0,avaliableFams.length,true);
    var Fn = avaliableFams[famNameIndex];

    var mid = "";
    if(useMiddleName) {
        famNameIndex = randomize(0,avaliableFams.length,true);
        mid = avaliableFams[famNameIndex];

        //shorten the middle name if required
        if(shortenMiddle) {
            mid = mid[0];
        }
    }

    //choose last name
    var lastIndex = randomize(0,lastNames.length,true);
    var lastName = lastNames[lastIndex];

    var ID = {
        FN: Fn,
        MID: mid,
        Last: lastName
    };

    return ID;
}


function randomize(inclusiveMin, exclusiveMax, round) {
    if(!round)
        return Math.random() * (exclusiveMax - inclusiveMin) + inclusiveMin;
    //not normal distribution but close enough
    return (Math.round(Math.random() * (exclusiveMax - inclusiveMin) + inclusiveMin));
}

function randomLetters(count)
{
    var text = "";
    var allowed = "abcdefghijklmnopqrstuvwxyz";

    for( var i=0; i < count; i++ )
        text += allowed.charAt(Math.floor(allowed.length * Math.random()));

    return text;
}