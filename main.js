'use strict';
const { exec } = require("child_process");
const fs = require('fs');
const debug = require('debug');
const git = require('simple-git');

const bodyParser = require('body-parser');

//debug.enable('simple-git,simple-git:*');
//git().init().then(() => console.log('DONE'));

const CONFIGS_JSON = fs.readFileSync('./configs.json');
const CONFIGS = JSON.parse(CONFIGS_JSON);
//console.log(CONFIGS);

const express = require('express')
const app = express()

app.use(bodyParser.urlencoded({ extended: true }));
 
app.post('/', function (req, res) {
    if(req.query.repo && req.query.key == CONFIGS.key) {
        let repoInfo = CONFIGS.repo[req.query.repo],
            payload = JSON.parse(req.body.payload)
        if(repoInfo && payload.ref.split('/')[2] == repoInfo.branch) {
            const USER = repoInfo.user;
            const PASS = repoInfo.token;
            const REPO = repoInfo.url;
        
            const remote = `https://${USER}:${PASS}@${REPO}`;
            console.log(`Start pulling [${repoInfo.branch}] with `, remote)
            console.log("To path: ", repoInfo.path)
            git(repoInfo.path).pull(remote, repoInfo.branch) //, {'--no-rebase': null}
            .then(() => {
                console.log("Pull Finish.")
                if(repoInfo.script) {
                    console.log("Running script: ", repoInfo.script)

                    exec(repoInfo.script, {
                        cwd: repoInfo.path
                    }, (error, stdout, stderr) => {
                        if (error) {
                            console.log(`error: ${error.message}`);
                            return;
                        }
                        if (stderr) {
                            console.log(`stderr: ${stderr}`);
                            return;
                        }
                        console.log(`stdout: ${stdout}`);
                    });
                }
                res.json({status: true, message: 'success'})
            })
            .catch((err) => ()=>{
                console.log("Fail.")
                res.json({status: false, message: 'Fail: ' + err})
            })
            return 0
        }

        if(payload.ref.split('/')[2] != repoInfo.branch) {
            console.log("Not target branch.")
            return 0
        }
    }
    console.log("Wrong request.")
    res.json({status: false, message: 'Wrong request.'})
})

app.get('/', (req, res)=>res.redirect('https://mit.bu.ac.th'))
 
app.listen(CONFIGS.port)
console.log("Running at " + CONFIGS.port)


/* git().silent(true)
    .clone(remote)
    .then(() => console.log('finished'))
    .catch((err) => console.error('failed: ', err)); */